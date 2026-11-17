#!/usr/bin/env node

/**
 * Validates term-register.json against the shape in RECONNAISSANCE.md.
 * Usage: node validate-term-register.cjs <path-to-term-register.json> [<path-to-decisions.json>]
 *
 * Checks entry and field shapes, unique term, sense and case IDs, selection
 * signals, use sites, glossary status against definitions, the status and
 * outcome rules, and that each resulting term says what it is and what it is
 * not. With decisions.json, also checks that every decision ID the register
 * cites exists there. Whether the senses are complete and the owner's answers
 * are recorded faithfully is left to the parent and the coverage critic.
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
const { checkSource } = require("./validate-intent-register.cjs");

const TERM_ID = /^[a-z0-9][a-z0-9-]{0,127}$/;
const DECISION_ID = /^T[1-9][0-9]*$/;
const GLOSSARY_STATUS = new Set(["defined", "implied_by_examples", "missing"]);
const SIGNALS = new Set([
  "names_record",
  "gates_behaviour",
  "actors_narrower_than_sources",
  "sense_from_other_field",
  "in_prompt_or_tool",
  "locales_differ",
  "undefined_in_glossary",
  "glossary_inventory",
]);
const SURFACES = new Set(["schema", "code", "api", "copy", "prompt", "tool_description", "doc", "instruction", "test"]);
const FORM_KINDS = new Set(["word", "identifier"]);
const CASE_KINDS = new Set(["use_site", "boundary"]);
const VERDICTS = new Set(["is", "is_not"]);
const STATUSES = new Set(["open", "unconfirmed", "settled"]);
const OUTCOMES = new Set(["keep", "define", "redefine", "rename", "split", "merge"]);
const ENTRY_KEYS = ["id", "term", "forms", "glossary_status", "selected_for", "definitions", "senses", "cases", "status", "outcome"];

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

function checkLocation(value, base, errors, textFields = []) {
  if (!checkKeys(value, ["ref", "line", ...textFields], ["ref", ...textFields], base, errors)) return;
  if (!isSafeRelativeSourcePath(value.ref)) errors.push(`${base}.ref: must be a repository-relative path`);
  if (value.line !== undefined && value.line !== null && (!Number.isInteger(value.line) || value.line < 1)) {
    errors.push(`${base}.line: must be a positive integer or null`);
  }
  for (const field of textFields) if (!isText(value[field])) errors.push(`${base}.${field}: invalid text`);
}

function checkDecisionId(value, base, errors, cited) {
  if (typeof value !== "string" || !DECISION_ID.test(value)) errors.push(`${base}: must match ${DECISION_ID}`);
  else cited.push({ id: value, at: base });
}

function checkForms(value, base, errors) {
  checkArray(value, base, errors).forEach((form, i) => {
    const at = `${base}[${i}]`;
    if (!checkKeys(form, ["form", "kind", "locale"], ["form", "kind", "locale"], at, errors)) return;
    if (!isText(form.form)) errors.push(`${at}.form: invalid text`);
    if (!FORM_KINDS.has(form.kind)) errors.push(`${at}.kind: must be word or identifier`);
    if (form.locale !== null && !isText(form.locale)) errors.push(`${at}.locale: must be text or null`);
  });
}

function checkVerdict(value, base, errors, extra = [], extraRequired = []) {
  if (!checkKeys(value, ["verdict", "term", ...extra], ["verdict", "term", ...extraRequired], base, errors)) return false;
  if (!VERDICTS.has(value.verdict)) errors.push(`${base}.verdict: must be is or is_not`);
  if (value.term !== null && !isText(value.term)) errors.push(`${base}.term: must be text or null`);
  return true;
}

function checkResultingTerm(value, base, errors) {
  const keys = ["term", "definition", "is", "is_not", "forms", "identifiers"];
  if (!checkKeys(value, [...keys, "avoid"], keys, base, errors)) return;
  if ("avoid" in value) {
    checkArray(value.avoid, `${base}.avoid`, errors).forEach((word, i) => {
      if (!isText(word)) errors.push(`${base}.avoid[${i}]: invalid text`);
    });
  }
  for (const field of ["term", "definition"]) if (!isText(value[field])) errors.push(`${base}.${field}: invalid text`);
  for (const field of ["is", "is_not"]) {
    checkArray(value[field], `${base}.${field}`, errors, { nonempty: true }).forEach((example, i) => {
      if (!isText(example)) errors.push(`${base}.${field}[${i}]: invalid text`);
    });
  }
  checkForms(value.forms, `${base}.forms`, errors);
  if (value.identifiers === "unchanged") return;
  checkArray(value.identifiers, `${base}.identifiers`, errors, { nonempty: true }).forEach((mapping, i) => {
    const at = `${base}.identifiers[${i}]`;
    if (!checkKeys(mapping, ["from", "to"], ["from", "to"], at, errors)) return;
    for (const field of ["from", "to"]) if (!isText(mapping[field])) errors.push(`${at}.${field}: invalid text`);
  });
}

function checkOutcome(entry, base, errors, cited) {
  const outcome = entry.outcome;
  if (!checkKeys(outcome, ["kind", "decision_ids", "resulting_terms", "merged_with"], ["kind", "decision_ids", "resulting_terms"], base, errors)) return;
  if (!OUTCOMES.has(outcome.kind)) errors.push(`${base}.kind: must be one of ${[...OUTCOMES].join(", ")}`);
  checkArray(outcome.decision_ids, `${base}.decision_ids`, errors, { nonempty: true })
    .forEach((id, i) => checkDecisionId(id, `${base}.decision_ids[${i}]`, errors, cited));
  const terms = checkArray(outcome.resulting_terms, `${base}.resulting_terms`, errors, { nonempty: true });
  terms.forEach((term, i) => checkResultingTerm(term, `${base}.resulting_terms[${i}]`, errors));
  const names = terms.filter(isObject).map((term) => term.term);
  if (new Set(names).size !== names.length) errors.push(`${base}.resulting_terms: duplicate term`);

  const kind = outcome.kind;
  if (kind === "split") {
    if (terms.length < 2) errors.push(`${base}.resulting_terms: a split gives two or more terms`);
  } else if (OUTCOMES.has(kind) && terms.length !== 1) {
    errors.push(`${base}.resulting_terms: a ${kind} gives exactly one term`);
  }
  if (["keep", "define", "redefine"].includes(kind) && terms.length === 1 && names[0] !== entry.term) {
    errors.push(`${base}.resulting_terms[0].term: a ${kind} keeps the word ${JSON.stringify(entry.term)}`);
  }
  if (kind === "rename" && terms.length === 1 && names[0] === entry.term) {
    errors.push(`${base}.resulting_terms[0].term: a rename gives a different word`);
  }
  if (kind === "define" && entry.glossary_status === "defined") {
    errors.push(`${base}.kind: define applies only to a term the glossary does not define`);
  }
  if (kind === "merge" && !("merged_with" in outcome)) {
    errors.push(`${base}.merged_with: required`);
  } else if (kind === "merge") {
    checkArray(outcome.merged_with, `${base}.merged_with`, errors, { nonempty: true }).forEach((word, i) => {
      if (!isText(word)) errors.push(`${base}.merged_with[${i}]: invalid text`);
    });
  } else if ("merged_with" in outcome) {
    errors.push(`${base}.merged_with: only a merge names the words it merges`);
  }
}

function validateTermRegister(register, decisionIds = null) {
  const errors = [];
  if (!Array.isArray(register)) return ["$: the register is a top-level array"];
  const ids = new Set();
  const cited = [];
  register.forEach((entry, index) => {
    const base = `$[${index}]`;
    if (!checkKeys(entry, ENTRY_KEYS, ENTRY_KEYS, base, errors)) return;
    if (typeof entry.id !== "string" || !TERM_ID.test(entry.id)) errors.push(`${base}.id: must match ${TERM_ID}`);
    else if (ids.has(entry.id)) errors.push(`${base}.id: duplicate term id`);
    else ids.add(entry.id);
    if (!isText(entry.term)) errors.push(`${base}.term: invalid text`);
    checkForms(entry.forms, `${base}.forms`, errors);

    if (!GLOSSARY_STATUS.has(entry.glossary_status)) {
      errors.push(`${base}.glossary_status: must be one of ${[...GLOSSARY_STATUS].join(", ")}`);
    }
    const signals = checkArray(entry.selected_for, `${base}.selected_for`, errors, { nonempty: true });
    signals.forEach((signal, i) => {
      if (!SIGNALS.has(signal)) errors.push(`${base}.selected_for[${i}]: must be one of ${[...SIGNALS].join(", ")}`);
    });
    if (new Set(signals).size !== signals.length) errors.push(`${base}.selected_for: duplicate signal`);

    const definitions = checkArray(entry.definitions, `${base}.definitions`, errors);
    definitions.forEach((source, i) => checkSource(source, `${base}.definitions[${i}]`, errors));
    if (entry.glossary_status === "defined" && definitions.length === 0) {
      errors.push(`${base}.definitions: a defined term cites its definition`);
    }
    if (entry.glossary_status === "missing" && definitions.length > 0) {
      errors.push(`${base}.definitions: must be empty when no source defines the term; use implied_by_examples for example sentences`);
    }

    const senseIds = new Set();
    checkArray(entry.senses, `${base}.senses`, errors, { nonempty: true }).forEach((sense, i) => {
      const at = `${base}.senses[${i}]`;
      if (!checkKeys(sense, ["id", "meaning", "uses"], ["id", "meaning", "uses"], at, errors)) return;
      if (typeof sense.id !== "string" || !TERM_ID.test(sense.id)) errors.push(`${at}.id: must match ${TERM_ID}`);
      else if (senseIds.has(sense.id)) errors.push(`${at}.id: duplicate sense id`);
      else senseIds.add(sense.id);
      if (!isText(sense.meaning)) errors.push(`${at}.meaning: invalid text`);
      checkArray(sense.uses, `${at}.uses`, errors, { nonempty: true }).forEach((use, j) => {
        const useAt = `${at}.uses[${j}]`;
        checkLocation(use, useAt, errors, ["surface", "quote"]);
        if (isObject(use) && typeof use.surface === "string" && !SURFACES.has(use.surface)) {
          errors.push(`${useAt}.surface: must be one of ${[...SURFACES].join(", ")}`);
        }
      });
    });

    const caseIds = new Set();
    const cases = checkArray(entry.cases, `${base}.cases`, errors);
    let unanswered = 0;
    cases.forEach((item, i) => {
      const at = `${base}.cases[${i}]`;
      const keys = ["id", "kind", "text", "basis", "product_now", "recommended", "answer"];
      if (!checkKeys(item, keys, keys, at, errors)) return;
      if (typeof item.id !== "string" || !TERM_ID.test(item.id)) errors.push(`${at}.id: must match ${TERM_ID}`);
      else if (caseIds.has(item.id)) errors.push(`${at}.id: duplicate case id`);
      else caseIds.add(item.id);
      if (!CASE_KINDS.has(item.kind)) errors.push(`${at}.kind: must be use_site or boundary`);
      for (const field of ["text", "product_now"]) if (!isText(item[field])) errors.push(`${at}.${field}: invalid text`);
      const basis = checkArray(item.basis, `${at}.basis`, errors, { nonempty: item.kind === "use_site" });
      basis.forEach((location, j) => checkLocation(location, `${at}.basis[${j}]`, errors));
      if (item.recommended !== null) checkVerdict(item.recommended, `${at}.recommended`, errors);
      if (item.answer === null) {
        unanswered += 1;
      } else if (checkVerdict(item.answer, `${at}.answer`, errors, ["decision_id", "words"], ["decision_id"])) {
        checkDecisionId(item.answer.decision_id, `${at}.answer.decision_id`, errors, cited);
        if ("words" in item.answer && !isText(item.answer.words)) errors.push(`${at}.answer.words: invalid text`);
      }
    });

    if (!STATUSES.has(entry.status)) {
      errors.push(`${base}.status: must be one of ${[...STATUSES].join(", ")}`);
    } else if (entry.status === "settled") {
      if (cases.length === 0) errors.push(`${base}.cases: a settled term records the cases put to the owner`);
      if (unanswered > 0) errors.push(`${base}.cases: a settled term has every case answered`);
      if (entry.outcome === null) errors.push(`${base}.outcome: a settled term records its outcome`);
      else checkOutcome(entry, `${base}.outcome`, errors, cited);
    } else if (entry.outcome !== null) {
      errors.push(`${base}.outcome: must be null until the term is settled`);
    }
  });

  if (decisionIds) {
    for (const { id, at } of cited) if (!decisionIds.has(id)) errors.push(`${at}: decision ${id} is not in decisions.json`);
  }
  return errors.slice(0, LIMITS.validationErrors);
}

function readJson(file, label) {
  const contents = readFileWithinLimit(file);
  enforceJsonTextLimits(contents);
  try {
    return JSON.parse(contents);
  } catch {
    throw new JsonStructureError(`${label}: invalid JSON syntax`);
  }
}

function decisionIdsFrom(decisions) {
  if (!Array.isArray(decisions)) throw new JsonStructureError("decisions.json: must be a top-level array");
  return new Set(decisions.filter(isObject).map((decision) => decision.id).filter((id) => typeof id === "string"));
}

function run(file, decisionsFile) {
  if (!file) {
    console.error("Usage: node validate-term-register.cjs <path-to-term-register.json> [<path-to-decisions.json>]");
    return 1;
  }
  let register;
  let decisionIds = null;
  try {
    register = readJson(file, "term register");
    if (decisionsFile) decisionIds = decisionIdsFrom(readJson(decisionsFile, "decisions.json"));
  } catch (error) {
    const reason = error instanceof SafeInputError || error instanceof JsonStructureError ? error.message : "input could not be opened or read safely";
    console.error(`Failed to read input: ${reason}`);
    return 1;
  }
  const errors = validateTermRegister(register, decisionIds);
  for (const message of errors) console.error("ERROR:", escapeUnsafeDiagnosticCharacters(message));
  if (errors.length > 0) {
    console.error(`FAIL: ${errors.length} validation error(s)`);
    return 1;
  }
  console.log(`PASS: ${register.length} terms valid`);
  return 0;
}

module.exports = { validateTermRegister };

if (require.main === module) process.exit(run(process.argv[2], process.argv[3]));
