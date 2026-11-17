#!/usr/bin/env node

// Explicit, one-time conversion. Audit validators accept only the current format.
const fs = require("node:fs");
const findings = require("./validate-findings.cjs");
const ledger = require("./validate-coverage-ledger.cjs");
const { validateRegister } = require("./validate-intent-register.cjs");
const { validateInventory } = require("./validate-state-machines.cjs");
const schema = require("./report-schema.json");

const KINDS = new Set(["findings", "intent-register", "state-machines", "coverage-ledger"]);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function rename(value, previous, current) {
  if (!object(value) || !own(value, previous)) return;
  if (own(value, current)) throw new Error(`Both ${previous} and ${current} are present; resolve the record before migration.`);
  value[current] = value[previous];
  delete value[previous];
}

function migrateRecords(kind, input) {
  if (!KINDS.has(kind)) throw new Error("Unknown artifact kind.");
  const text = JSON.stringify(input);
  const reader = kind === "coverage-ledger" ? ledger : findings;
  if (typeof text !== "string" || Buffer.byteLength(text) > reader.LIMITS.inputBytes) {
    throw new Error("Input exceeds the artifact size limit or is not JSON.");
  }
  if (kind === "coverage-ledger") ledger.preflightJsonText(text);
  else findings.enforceJsonTextLimits(text);
  const records = JSON.parse(text);
  if (!Array.isArray(records)) throw new Error("Expected an artifact array.");

  for (const record of records) {
    if (!object(record)) continue; // The artifact validator reports malformed entries.
    if (kind === "findings") {
      rename(record, "person", "actor");
      rename(record.remediation?.experience, "people", "human_users");
    } else if (kind === "intent-register" || kind === "state-machines") {
      rename(record, "people", "actors");
    } else {
      const oldActor = own(record, "person") || (object(record.canonical_refs) && own(record.canonical_refs, "person"));
      rename(record, "person", "actor");
      rename(record.canonical_refs, "person", "actor");
      const id = ledger.canonicalCoverageId(record.canonical_refs);
      const expectedInputId = oldActor
        ? id.split("::").map((part) => part.startsWith("a=") ? `p=${part.slice(2)}` : part).join("::")
        : id;
      if (record.coverage_id !== expectedInputId) throw new Error("Input coverage ID does not match its canonical references.");
      record.coverage_id = id;
    }
  }
  if (kind === "coverage-ledger") {
    records.sort((a, b) => a.coverage_id < b.coverage_id ? -1 : a.coverage_id > b.coverage_id ? 1 : 0);
  }

  const errors = kind === "findings" ? findings.validateDocument(records, schema, findings.loadPrincipleIds())
    : kind === "intent-register" ? validateRegister(records)
    : kind === "state-machines" ? validateInventory(records)
    : ledger.validateDocument(records);
  if (errors.length) throw new Error(`Converted artifact is invalid:\n${errors.join("\n")}`);
  return records;
}

function run(args) {
  const [kind, inputFile, outputFile] = args;
  if (args.length !== 3 || !KINDS.has(kind)) {
    console.error("Usage: node migrate-actor-records.cjs <findings|intent-register|state-machines|coverage-ledger> <input.json> <new-output.json>");
    return 1;
  }
  let contents;
  try {
    const reader = kind === "coverage-ledger" ? ledger : findings;
    contents = reader.readFileWithinLimit(inputFile);
    if (kind === "coverage-ledger") ledger.preflightJsonText(contents);
    else findings.enforceJsonTextLimits(contents);
  } catch {
    console.error("Input could not be read safely or exceeds the JSON limits.");
    return 1;
  }
  let input;
  try { input = JSON.parse(contents); } catch {
    console.error("Input is not valid JSON.");
    return 1;
  }
  let output;
  try {
    output = `${JSON.stringify(migrateRecords(kind, input), null, 2)}\n`;
    if (Buffer.byteLength(output) > findings.LIMITS.inputBytes) throw new Error("Formatted output exceeds the artifact size limit.");
  } catch (error) {
    for (const line of String(error.message).split("\n")) console.error(findings.escapeUnsafeDiagnosticCharacters(line));
    return 1;
  }
  try {
    fs.writeFileSync(outputFile, output, { flag: "wx", mode: 0o600 });
  } catch {
    console.error("Output must be a new writable file; existing files are never overwritten.");
    return 1;
  }
  console.log("PASS: converted artifact validated and written; input unchanged.");
  return 0;
}

module.exports = { migrateRecords };
if (require.main === module) process.exitCode = run(process.argv.slice(2));
