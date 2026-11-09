#!/usr/bin/env node

/**
 * Validates intent-register.json against the shape in RECONNAISSANCE.md.
 * Usage: node validate-intent-register.cjs <path-to-intent-register.json>
 *
 * Checks entry and field shapes, source kinds, line numbers (positive integer
 * or null), provenance values, origin rules for not_traceable, and duplicate
 * capabilities. Whether a purpose is drawn from outside the code is left to
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

const COMMIT_REF = /^[0-9a-f]{7,40}$/;
const SOURCE_KINDS = new Set(["file", "commit", "branch", "transcript"]);
const ORIGIN_KINDS = new Set([...SOURCE_KINDS, "not_traceable"]);
const PROVENANCE = new Set(["owner_statement", "accepted_recommendation", "bulk_accepted_recommendation", "unattributed"]);
const ENTRY_KEYS = ["capability", "people", "purpose", "sources", "rules", "conflicts", "open_questions", "decided_not_on_ref"];

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

function checkLine(value, base, errors) {
  if (value === undefined || value === null) return;
  if (!Number.isInteger(value) || value < 1) errors.push(`${base}.line: must be a positive integer or null`);
}

function checkRef(kind, ref, base, errors) {
  if (kind === "file" && !isSafeRelativeSourcePath(ref)) errors.push(`${base}.ref: file refs are repository-relative paths`);
  else if (kind === "commit" && !(typeof ref === "string" && COMMIT_REF.test(ref))) errors.push(`${base}.ref: commit refs are 7 to 40 lowercase hex characters`);
  else if (!isText(ref)) errors.push(`${base}.ref: invalid text`);
}

function checkLocation(value, base, errors) {
  if (!checkKeys(value, ["kind", "ref", "line"], ["kind", "ref"], base, errors)) return;
  if (!SOURCE_KINDS.has(value.kind)) errors.push(`${base}.kind: must be one of ${[...SOURCE_KINDS].join(", ")}`);
  else checkRef(value.kind, value.ref, base, errors);
  checkLine(value.line, base, errors);
}

function checkProvenance(value, base, errors) {
  if (!PROVENANCE.has(value)) errors.push(`${base}.provenance: must be one of ${[...PROVENANCE].join(", ")}`);
}

function checkSource(value, base, errors) {
  if (!checkKeys(value, ["kind", "ref", "line", "quote", "provenance", "cites_rule"], ["kind", "ref", "quote", "provenance"], base, errors)) return;
  checkLocation({ kind: value.kind, ref: value.ref, line: value.line }, base, errors);
  if (!isText(value.quote)) errors.push(`${base}.quote: invalid text`);
  checkProvenance(value.provenance, base, errors);
  if ("cites_rule" in value) checkLocation(value.cites_rule, `${base}.cites_rule`, errors);
}

function checkOrigin(value, base, errors) {
  if (!checkKeys(value, ["kind", "ref", "line", "quote"], ["kind", "ref", "quote"], base, errors)) return;
  if (!ORIGIN_KINDS.has(value.kind)) {
    errors.push(`${base}.kind: must be one of ${[...ORIGIN_KINDS].join(", ")}`);
  } else if (value.kind === "not_traceable") {
    if (value.ref !== null) errors.push(`${base}.ref: must be null for not_traceable`);
  } else {
    checkRef(value.kind, value.ref, base, errors);
  }
  checkLine(value.line, base, errors);
  if (!isText(value.quote)) errors.push(`${base}.quote: invalid text`);
}

function checkArray(value, base, errors, { nonempty = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${base}: must be an array`);
    return [];
  }
  if (nonempty && value.length === 0) errors.push(`${base}: must not be empty`);
  return value;
}

function validateRegister(register) {
  const errors = [];
  if (!Array.isArray(register)) return ["$: the register is a top-level array"];
  if (register.length === 0) errors.push("$: the register has no entries");
  const capabilities = new Set();
  register.forEach((entry, index) => {
    const base = `$[${index}]`;
    if (!checkKeys(entry, ENTRY_KEYS, ENTRY_KEYS, base, errors)) return;
    if (!isText(entry.capability)) errors.push(`${base}.capability: invalid text`);
    else if (capabilities.has(entry.capability)) errors.push(`${base}.capability: duplicate capability`);
    else capabilities.add(entry.capability);
    if (!isText(entry.purpose)) errors.push(`${base}.purpose: invalid text`);
    checkArray(entry.people, `${base}.people`, errors, { nonempty: true }).forEach((person, i) => {
      const at = `${base}.people[${i}]`;
      if (!checkKeys(person, ["role", "goal", "served"], ["role", "goal", "served"], at, errors)) return;
      if (!isText(person.role)) errors.push(`${at}.role: invalid text`);
      if (!isText(person.goal)) errors.push(`${at}.goal: invalid text`);
      if (typeof person.served !== "boolean") errors.push(`${at}.served: must be true or false`);
    });
    checkArray(entry.sources, `${base}.sources`, errors, { nonempty: true }).forEach((source, i) => checkSource(source, `${base}.sources[${i}]`, errors));
    checkArray(entry.rules, `${base}.rules`, errors).forEach((rule, i) => {
      const at = `${base}.rules[${i}]`;
      const keys = ["text", "location", "origin", "provenance", "purpose", "supported_scope"];
      if (!checkKeys(rule, keys, keys, at, errors)) return;
      for (const key of ["text", "purpose", "supported_scope"]) if (!isText(rule[key])) errors.push(`${at}.${key}: invalid text`);
      checkLocation(rule.location, `${at}.location`, errors);
      checkOrigin(rule.origin, `${at}.origin`, errors);
      checkProvenance(rule.provenance, at, errors);
    });
    checkArray(entry.conflicts, `${base}.conflicts`, errors).forEach((conflict, i) => {
      const at = `${base}.conflicts[${i}]`;
      if (!checkKeys(conflict, ["description", "sources"], ["description", "sources"], at, errors)) return;
      if (!isText(conflict.description)) errors.push(`${at}.description: invalid text`);
      const sources = checkArray(conflict.sources, `${at}.sources`, errors);
      if (sources.length < 2) errors.push(`${at}.sources: a conflict quotes at least two sources`);
      sources.forEach((source, j) => checkSource(source, `${at}.sources[${j}]`, errors));
    });
    checkArray(entry.open_questions, `${base}.open_questions`, errors).forEach((question, i) => {
      if (!isText(question)) errors.push(`${base}.open_questions[${i}]: invalid text`);
    });
    checkArray(entry.decided_not_on_ref, `${base}.decided_not_on_ref`, errors).forEach((change, i) => {
      const at = `${base}.decided_not_on_ref[${i}]`;
      if (!checkKeys(change, ["ref", "change"], ["ref", "change"], at, errors)) return;
      if (!isText(change.ref)) errors.push(`${at}.ref: invalid text`);
      if (!isText(change.change)) errors.push(`${at}.change: invalid text`);
    });
  });
  return errors.slice(0, LIMITS.validationErrors);
}

function run(file) {
  if (!file) {
    console.error("Usage: node validate-intent-register.cjs <path-to-intent-register.json>");
    return 1;
  }
  let contents;
  try {
    contents = readFileWithinLimit(file);
    enforceJsonTextLimits(contents);
  } catch (error) {
    const reason = error instanceof SafeInputError || error instanceof JsonStructureError ? error.message : "input could not be opened or read safely";
    console.error(`Failed to read intent register: ${reason}`);
    return 1;
  }
  let register;
  try {
    register = JSON.parse(contents);
  } catch {
    console.error("Failed to parse intent register: invalid JSON syntax");
    return 1;
  }
  const errors = validateRegister(register);
  for (const message of errors) console.error("ERROR:", escapeUnsafeDiagnosticCharacters(message));
  if (errors.length > 0) {
    console.error(`FAIL: ${errors.length} validation error(s)`);
    return 1;
  }
  console.log(`PASS: ${register.length} register entries valid`);
  return 0;
}

module.exports = { validateRegister };

if (require.main === module) process.exit(run(process.argv[2]));
