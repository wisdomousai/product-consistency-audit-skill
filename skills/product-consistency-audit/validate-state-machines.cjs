#!/usr/bin/env node

/**
 * Validates state-machines.json against the shape in RECONNAISSANCE.md.
 * Usage: node validate-state-machines.cjs <path-to-state-machines.json>
 *
 * Checks entry and field shapes, unique machine IDs and state names, that every
 * transition and coverage entry names states the machine declares, that explicit
 * machines cite their definition and implicit ones do not, and that every
 * location is repository-relative. Whether the inventory is complete is left to
 * reconnaissance and the coverage critic.
 */

const {
  JsonStructureError,
  LIMITS,
  SafeInputError,
  enforceJsonTextLimits,
  escapeUnsafeDiagnosticCharacters,
  hasVisibleProse,
  isSafeRelativeSourcePath,
  readFileWithinLimit,
} = require("./validate-findings.cjs");

const MACHINE_ID = /^[a-z0-9][a-z0-9-]{0,127}$/;
const KINDS = new Set(["explicit", "implicit"]);
const STORAGE_KINDS = new Set(["column", "boolean", "timestamp", "nullable_field", "row", "derived", "runtime", "client", "external"]);
const ENTRY_KEYS = ["id", "name", "subject", "kind", "people", "definition", "storage", "states", "transitions", "readers", "contracts", "instruction_refs", "coverage"];

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isText = (value) => typeof value === "string" && hasVisibleProse(value) && value.trim() === value;

function checkKeys(value, allowed, required, base, errors) {
  if (!isObject(value)) {
    errors.push(`${base}: must be an object`);
    return false;
  }
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${base}.${key}: unknown field`);
  for (const key of required) if (!(key in value)) errors.push(`${base}.${key}: required`);
  return true;
}

function checkArray(value, base, errors, { nonempty = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${base}: must be an array`);
    return [];
  }
  if (nonempty && value.length === 0) errors.push(`${base}: must not be empty`);
  return value;
}

// A location is {ref, line} plus the text fields its list names.
function checkLocation(value, base, errors, textFields = [], optionalText = []) {
  if (!checkKeys(value, ["ref", "line", ...textFields, ...optionalText], ["ref", ...textFields], base, errors)) return;
  if (!isSafeRelativeSourcePath(value.ref)) errors.push(`${base}.ref: must be a repository-relative path`);
  if (value.line !== undefined && value.line !== null && (!Number.isInteger(value.line) || value.line < 1)) {
    errors.push(`${base}.line: must be a positive integer or null`);
  }
  for (const field of textFields) if (!isText(value[field])) errors.push(`${base}.${field}: invalid text`);
  for (const field of optionalText) {
    if (field in value && value[field] !== null && !isText(value[field])) errors.push(`${base}.${field}: must be text or null`);
  }
}

function checkMove(value, states, base, errors) {
  if (value.from !== null && !states.has(value.from)) errors.push(`${base}.from: must be null (creation) or a state of this machine`);
  if (!states.has(value.to)) errors.push(`${base}.to: must be a state of this machine`);
}

function validateInventory(inventory) {
  const errors = [];
  if (!Array.isArray(inventory)) return ["$: the inventory is a top-level array"];
  const ids = new Set();
  inventory.forEach((machine, index) => {
    const base = `$[${index}]`;
    if (!checkKeys(machine, ENTRY_KEYS, ENTRY_KEYS, base, errors)) return;
    if (typeof machine.id !== "string" || !MACHINE_ID.test(machine.id)) errors.push(`${base}.id: must match ${MACHINE_ID}`);
    else if (ids.has(machine.id)) errors.push(`${base}.id: duplicate machine id`);
    else ids.add(machine.id);
    for (const field of ["name", "subject"]) if (!isText(machine[field])) errors.push(`${base}.${field}: invalid text`);
    if (!KINDS.has(machine.kind)) errors.push(`${base}.kind: must be explicit or implicit`);
    checkArray(machine.people, `${base}.people`, errors, { nonempty: true }).forEach((role, i) => {
      if (!isText(role)) errors.push(`${base}.people[${i}]: invalid text`);
    });

    if (machine.kind === "explicit") {
      if (machine.definition === null) errors.push(`${base}.definition: an explicit machine cites the place that defines it`);
      else checkLocation(machine.definition, `${base}.definition`, errors);
    } else if (machine.kind === "implicit" && machine.definition !== null) {
      errors.push(`${base}.definition: must be null for an implicit machine`);
    }

    checkArray(machine.storage, `${base}.storage`, errors, { nonempty: true }).forEach((entry, i) => {
      const at = `${base}.storage[${i}]`;
      checkLocation(entry, at, errors, ["kind", "description"]);
      if (isObject(entry) && typeof entry.kind === "string" && !STORAGE_KINDS.has(entry.kind)) {
        errors.push(`${at}.kind: must be one of ${[...STORAGE_KINDS].join(", ")}`);
      }
    });

    const states = new Set();
    checkArray(machine.states, `${base}.states`, errors, { nonempty: true }).forEach((state, i) => {
      const at = `${base}.states[${i}]`;
      if (!checkKeys(state, ["name", "situation", "identified_by"], ["name", "situation", "identified_by"], at, errors)) return;
      if (!isText(state.name)) errors.push(`${at}.name: invalid text`);
      else if (states.has(state.name)) errors.push(`${at}.name: duplicate state`);
      else states.add(state.name);
      if (!isText(state.situation)) errors.push(`${at}.situation: invalid text`);
      checkArray(state.identified_by, `${at}.identified_by`, errors, { nonempty: true })
        .forEach((location, j) => checkLocation(location, `${at}.identified_by[${j}]`, errors, ["expression"]));
    });

    const moves = new Set();
    checkArray(machine.transitions, `${base}.transitions`, errors).forEach((transition, i) => {
      const at = `${base}.transitions[${i}]`;
      if (!checkKeys(transition, ["from", "to", "trigger", "writers"], ["from", "to", "trigger", "writers"], at, errors)) return;
      checkMove(transition, states, at, errors);
      moves.add(`${transition.from}\u0000${transition.to}`);
      if (!isText(transition.trigger)) errors.push(`${at}.trigger: invalid text`);
      checkArray(transition.writers, `${at}.writers`, errors, { nonempty: true })
        .forEach((writer, j) => checkLocation(writer, `${at}.writers[${j}]`, errors, [], ["guard"]));
    });

    checkArray(machine.readers, `${base}.readers`, errors)
      .forEach((reader, i) => checkLocation(reader, `${base}.readers[${i}]`, errors, ["reads"]));
    checkArray(machine.contracts, `${base}.contracts`, errors)
      .forEach((contract, i) => checkLocation(contract, `${base}.contracts[${i}]`, errors, ["surface"]));
    checkArray(machine.instruction_refs, `${base}.instruction_refs`, errors)
      .forEach((ref, i) => checkLocation(ref, `${base}.instruction_refs[${i}]`, errors, ["text"]));

    checkArray(machine.coverage, `${base}.coverage`, errors).forEach((entry, i) => {
      const at = `${base}.coverage[${i}]`;
      if (!checkKeys(entry, ["from", "to", "checks"], ["from", "to", "checks"], at, errors)) return;
      checkMove(entry, states, at, errors);
      if (!moves.has(`${entry.from}\u0000${entry.to}`)) errors.push(`${at}: names a move the machine's transitions do not list`);
      checkArray(entry.checks, `${at}.checks`, errors).forEach((check, j) => checkLocation(check, `${at}.checks[${j}]`, errors));
    });
  });
  return errors.slice(0, LIMITS.validationErrors);
}

function run(file) {
  if (!file) {
    console.error("Usage: node validate-state-machines.cjs <path-to-state-machines.json>");
    return 1;
  }
  let contents;
  try {
    contents = readFileWithinLimit(file);
    enforceJsonTextLimits(contents);
  } catch (error) {
    const reason = error instanceof SafeInputError || error instanceof JsonStructureError ? error.message : "input could not be opened or read safely";
    console.error(`Failed to read state machine inventory: ${reason}`);
    return 1;
  }
  let inventory;
  try {
    inventory = JSON.parse(contents);
  } catch {
    console.error("Failed to parse state machine inventory: invalid JSON syntax");
    return 1;
  }
  const errors = validateInventory(inventory);
  for (const message of errors) console.error("ERROR:", escapeUnsafeDiagnosticCharacters(message));
  if (errors.length > 0) {
    console.error(`FAIL: ${errors.length} validation error(s)`);
    return 1;
  }
  console.log(`PASS: ${inventory.length} state machines valid`);
  return 0;
}

module.exports = { validateInventory };

if (require.main === module) process.exit(run(process.argv[2]));
