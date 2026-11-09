const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { validateRegister } = require("./validate-intent-register.cjs");

const validatorPath = path.join(__dirname, "validate-intent-register.cjs");

function entry() {
  return {
    capability: "Invite a teammate to a workspace",
    people: [{ role: "workspace admin", goal: "add a colleague", served: true }],
    purpose: "Admins bring colleagues into the workspace with the role they chose.",
    sources: [
      { kind: "file", ref: "docs/workspaces.md", line: 12, quote: "Admins invite colleagues.", provenance: "unattributed" },
      { kind: "commit", ref: "3f2a9c1", line: null, quote: "feat: invitations", provenance: "owner_statement", cites_rule: { kind: "file", ref: "AGENTS.md", line: 88 } },
    ],
    rules: [{
      text: "Never let an invitation be reused.",
      location: { kind: "file", ref: "AGENTS.md", line: 88 },
      origin: { kind: "not_traceable", ref: null, line: null, quote: "git log -S 'reused' -- AGENTS.md" },
      provenance: "unattributed",
      purpose: "Stop a double click from creating a duplicate membership.",
      supported_scope: "The accept step of a single invitation.",
    }],
    conflicts: [],
    open_questions: [],
    decided_not_on_ref: [{ ref: "branch invite-expiry", change: "Invitations expire after 14 days." }],
  };
}

function errorsFor(mutate) {
  const value = entry();
  mutate(value);
  return validateRegister([value]);
}

test("accepts a register in the documented shape", () => {
  assert.deepEqual(validateRegister([entry()]), []);
});

test("rejects line 0 and accepts null lines", () => {
  assert.match(errorsFor((e) => { e.sources[0].line = 0; }).join("\n"), /sources\[0\]\.line: must be a positive integer or null/);
});

test("rejects provenance outside the P4 values", () => {
  assert.match(errorsFor((e) => { e.rules[0].provenance = "instruction_file"; }).join("\n"), /rules\[0\]\.provenance/);
});

test("requires a null ref for a not_traceable origin", () => {
  assert.match(errorsFor((e) => { e.rules[0].origin.ref = "AGENTS.md"; }).join("\n"), /origin\.ref: must be null for not_traceable/);
});

test("rejects absolute file refs and unknown fields", () => {
  const errors = errorsFor((e) => { e.sources[0].ref = "/home/me/notes.md"; e.extra = true; }).join("\n");
  assert.match(errors, /sources\[0\]\.ref: file refs are repository-relative paths/);
  assert.match(errors, /\$\[0\]\.extra: unknown field/);
});

test("requires served on every person and two sources per conflict", () => {
  const errors = errorsFor((e) => {
    delete e.people[0].served;
    e.conflicts.push({ description: "Docs and AGENTS.md disagree.", sources: [e.sources[0]] });
  }).join("\n");
  assert.match(errors, /people\[0\]\.served: required/);
  assert.match(errors, /conflicts\[0\]\.sources: a conflict quotes at least two sources/);
});

test("accepts inferred people and rejects an inferred person without code evidence", () => {
  const inferred = { role: "member of two workspaces", goal: "switch between them", served: true, inferred: { basis: [{ kind: "file", ref: "src/db/schema.ts", line: 40 }], derived_from: "workspace admin" } };
  assert.deepEqual(errorsFor((e) => { e.people.push(inferred); }), []);
  assert.match(errorsFor((e) => { e.people.push({ ...inferred, inferred: { basis: [], derived_from: null } }); }).join("\n"), /inferred\.basis: must not be empty/);
});

test("rejects duplicate capabilities", () => {
  assert.match(validateRegister([entry(), entry()]).join("\n"), /\$\[1\]\.capability: duplicate capability/);
});

test("CLI exits 0 for a valid register and 1 for an invalid one", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "register-"));
  const good = path.join(dir, "good.json");
  const bad = path.join(dir, "bad.json");
  fs.writeFileSync(good, JSON.stringify([entry()]));
  fs.writeFileSync(bad, JSON.stringify([{ capability: "x" }]));
  assert.equal(spawnSync(process.execPath, [validatorPath, good]).status, 0);
  assert.equal(spawnSync(process.execPath, [validatorPath, bad]).status, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});
