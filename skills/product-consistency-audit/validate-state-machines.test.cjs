const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { validateInventory } = require("./validate-state-machines.cjs");

const validatorPath = path.join(__dirname, "validate-state-machines.cjs");

function machine() {
  return {
    id: "invitation-lifecycle",
    name: "Invitation lifecycle",
    subject: "invitations row",
    kind: "implicit",
    people: ["workspace admin", "invited colleague", "agent using the API"],
    definition: null,
    storage: [
      { kind: "timestamp", ref: "src/db/schema.ts", line: 40, description: "accepted_at" },
      { kind: "timestamp", ref: "src/db/schema.ts", line: 41, description: "revoked_at" },
      { kind: "derived", ref: "src/invitations/status.ts", line: null, description: "expires_at < now() means expired" },
    ],
    states: [
      { name: "pending", situation: "The colleague has not answered yet.", identified_by: [{ ref: "src/invitations/list.ts", line: 12, expression: "!accepted_at && !revoked_at" }] },
      { name: "accepted", situation: "The colleague joined.", identified_by: [{ ref: "src/invitations/list.ts", line: 13, expression: "accepted_at && !revoked_at" }] },
    ],
    transitions: [
      { from: null, to: "pending", trigger: "Admin sends an invitation.", writers: [{ ref: "src/invitations/create.ts", line: 8, guard: null }] },
      { from: "pending", to: "accepted", trigger: "Colleague accepts.", writers: [{ ref: "src/invitations/accept.ts", line: 20, guard: "token not expired" }] },
    ],
    readers: [{ ref: "src/invitations/list.ts", line: 12, reads: "accepted_at and revoked_at" }],
    contracts: [{ ref: "src/api/invitations.ts", line: 30, surface: "GET /api/invitations returns accepted_at" }],
    instruction_refs: [{ ref: "AGENTS.md", line: 88, text: "Never let an invitation be reused." }],
    coverage: [{ from: "pending", to: "accepted", checks: [{ ref: "tests/invitations.workflow.ts", line: 15 }] }],
  };
}

function errorsFor(mutate) {
  const value = machine();
  mutate(value);
  return validateInventory([value]).join("\n");
}

test("accepts an inventory in the documented shape, including an empty one", () => {
  assert.deepEqual(validateInventory([machine()]), []);
  assert.deepEqual(validateInventory([]), []);
});

test("requires a definition for explicit machines and none for implicit ones", () => {
  assert.match(errorsFor((m) => { m.kind = "explicit"; }), /definition: an explicit machine cites the place that defines it/);
  assert.match(errorsFor((m) => { m.definition = { ref: "src/invitations/machine.ts", line: 1 }; }), /definition: must be null for an implicit machine/);
  assert.equal(errorsFor((m) => { m.kind = "explicit"; m.definition = { ref: "src/invitations/machine.ts", line: 1 }; }), "");
});

test("rejects transitions and coverage that name undeclared states or moves", () => {
  assert.match(errorsFor((m) => { m.transitions[1].to = "joined"; }), /transitions\[1\]\.to: must be a state of this machine/);
  assert.match(errorsFor((m) => { m.coverage[0].from = null; }), /coverage\[0\]: names a move the machine's transitions do not list/);
});

test("rejects duplicate ids and states, and unknown storage kinds", () => {
  assert.match(validateInventory([machine(), machine()]).join("\n"), /\$\[1\]\.id: duplicate machine id/);
  const errors = errorsFor((m) => { m.states.push({ ...m.states[0] }); m.storage[0].kind = "flag"; });
  assert.match(errors, /states\[2\]\.name: duplicate state/);
  assert.match(errors, /storage\[0\]\.kind: must be one of/);
});

test("requires repository-relative refs, positive lines and a writer per transition", () => {
  const errors = errorsFor((m) => {
    m.readers[0].ref = "/abs/list.ts";
    m.states[0].identified_by[0].line = 0;
    m.transitions[0].writers = [];
  });
  assert.match(errors, /readers\[0\]\.ref: must be a repository-relative path/);
  assert.match(errors, /identified_by\[0\]\.line: must be a positive integer or null/);
  assert.match(errors, /transitions\[0\]\.writers: must not be empty/);
});

test("CLI exits 0 for a valid inventory and 1 for an invalid one", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "state-machines-"));
  const good = path.join(dir, "good.json");
  const bad = path.join(dir, "bad.json");
  fs.writeFileSync(good, JSON.stringify([machine()]));
  fs.writeFileSync(bad, JSON.stringify([{ id: "x" }]));
  assert.equal(spawnSync(process.execPath, [validatorPath, good]).status, 0);
  assert.equal(spawnSync(process.execPath, [validatorPath, bad]).status, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});
