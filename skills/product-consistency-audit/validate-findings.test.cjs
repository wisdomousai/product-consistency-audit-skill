const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const schema = require("./report-schema.json");
const {
  LIMITS,
  collect,
  collectSchemaErrors,
  loadPrincipleIds,
  validateDocument,
} = require("./validate-findings.cjs");

const validatorPath = path.join(__dirname, "validate-findings.cjs");
const CLI_TIMEOUT_MS = 5000;
const HOSTILE_CLI_TIMEOUT_MS = 15000;
const HAS_SAFE_INPUT_OPEN = Number.isInteger(fs.constants.O_NOFOLLOW) &&
  fs.constants.O_NOFOLLOW !== 0 &&
  Number.isInteger(fs.constants.O_NONBLOCK) &&
  fs.constants.O_NONBLOCK !== 0;
const TERMINAL_CONTROL_PAYLOAD = "\u001b\u0007\u0085\u202e\u034f\ufe0f";
const TERMINAL_CONTROL_BYTES = [
  Buffer.from([0x1b]),
  Buffer.from([0x07]),
  Buffer.from("\u0085"),
  Buffer.from("\u202e"),
  Buffer.from("\u034f"),
  Buffer.from("\ufe0f"),
];

function step(kind = "entrypoint", file = "src/routes/invitations.ts", line = 10) {
  return { kind, file, line, scope: "acceptInvitation", description: "The invitation token reaches the expiry branch." };
}

function evidence(file = "src/invitations/accept.ts", line = 20) {
  return { file, line, description: "The expiry branch returns a page with no next action." };
}

function person() {
  return { role: "Invited user", goal: "Join the workspace they were invited to." };
}

function confirmed() {
  return {
    verdict: "confirmed",
    fingerprint: "src-invitations-expired-dead-end",
    title: "Expired invitation offers no next step",
    description: "An invited user who opens an expired link sees an error with no way to ask for a new invitation.",
    capability: "Accept an invitation",
    person: person(),
    fit: "underfit",
    fit_class: "FIT-CLASSES.md#Dead-end state",
    principles: ["P1", "P8"],
    intent: {
      purpose: "An invited user can join or ask for a new invitation.",
      sources: [{ kind: "file", ref: "docs/invitations.md", line: 12, quote: "Expired links offer a resend request." }],
    },
    root_cause: "acceptInvitation renders a bare expiry page when the token is too old.",
    trace: [
      step("entrypoint"),
      step("transition", "src/invitations/accept.ts", 20),
      step("outcome", "src/pages/invitation-expired.tsx", 30),
    ],
    evidence: [evidence()],
    conditions: [],
    reproduction: {
      method: "source",
      setup: "An invitation whose token has expired.",
      steps: ["Open the invitation link after the token expires."],
      observed_result: "The page says the link expired and offers no action.",
    },
    remediation: { strategy: "Show a resend request on the expiry page." },
    severity: {
      likelihood: { score: "medium", reason: "Invitations expire routinely." },
      impact: { score: "medium", reason: "The invited user cannot join without contacting an admin." },
      overall_severity: "medium",
    },
    confidence: { score: "high", reason: "The source path and the rendered page agree." },
  };
}

function overfit() {
  const finding = confirmed();
  finding.fingerprint = "src-signup-captcha-on-invitations";
  finding.title = "Sign-up captcha runs on invitation acceptance";
  finding.fit = "overfit";
  finding.fit_class = "FIT-CLASSES.md#Rule applied past its origin";
  finding.principles = ["P2", "P3"];
  finding.literal_source = {
    kind: "instruction",
    location: "AGENTS.md",
    description: "A rule added after automated sign-ups asks for a captcha on every account form.",
  };
  finding.excess = [{ file: "src/invitations/accept.ts", line: 14, description: "The captcha also guards accepting an invitation." }];
  finding.proportionate_shape = "Run the captcha on public sign-up only.";
  return finding;
}

function needsOwnerIntent() {
  return {
    verdict: "needs_owner_intent",
    fingerprint: "src-sessions-signout-drops-draft",
    title: "Sign-out drops an unsaved draft",
    description: "Signing out ends the session without saving or mentioning an unsaved draft.",
    capability: "Edit a draft",
    person: { role: "Author", goal: "Finish a draft over several sessions." },
    fit: "underfit",
    fit_class: "FIT-CLASSES.md#Interrupted work",
    principles: ["P10"],
    claimed_gap: "Sign-out neither saves nor warns about unsaved draft edits.",
    trace: [step("entrypoint", "src/routes/session.ts", 5)],
    evidence: [evidence("src/drafts/editor.ts", 40)],
    intent_candidates: [
      {
        reading: "Draft edits are saved before the session ends.",
        sources: [{ kind: "file", ref: "docs/drafts.md", line: 8, quote: "Drafts are kept until the author deletes them." }],
      },
      {
        reading: "Sign-out ends the session and unsaved edits go with it.",
        sources: [{ kind: "commit", ref: "a1b2c3d", quote: "Clear editor state on sign-out." }],
      },
    ],
    question: "When an author signs out with unsaved edits, should the draft be saved, flagged, or dropped?",
    consequence_if_each: [
      { answer: "Save it.", required_change: "Flush the editor state before ending the session." },
      { answer: "Drop it.", required_change: "Say on the sign-out control that unsaved edits are dropped." },
    ],
  };
}

function rejected() {
  return {
    verdict: "rejected",
    fingerprint: "src-settings-roles-last-admin",
    title: "Last admin can remove their own role",
    description: "The candidate claimed a workspace could lose its last admin.",
    capability: "Change admin roles",
    person: { role: "Workspace admin", goal: "Hand administration to a colleague." },
    fit: "inconsistency",
    fit_class: "FIT-CLASSES.md#Surfaces disagree",
    principles: ["P12"],
    claimed_gap: "The role editor allows removing the last admin role.",
    trace: [step("outcome", "src/settings/roles.ts", 30)],
    evidence: [evidence("src/settings/roles.ts", 31)],
    reason: "changeRole refuses a change that leaves no admin, and the editor shows that error.",
  };
}

function errorsFor(value) {
  return validateDocument(value, schema);
}

function runCli(contents, options = {}) {
  const { nodeArgs = [], timeout = CLI_TIMEOUT_MS } = options;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-findings-"));
  const findingsPath = path.join(directory, "findings.json");
  try {
    fs.writeFileSync(findingsPath, contents);
    return spawnSync(process.execPath, [...nodeArgs, validatorPath, findingsPath], {
      encoding: "utf8",
      timeout,
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function cliOutput(result) {
  return `${result.stdout}${result.stderr}`;
}

function assertNoInjectedControlBytes(output) {
  const bytes = Buffer.isBuffer(output) ? output : Buffer.from(output, "utf8");
  for (const marker of TERMINAL_CONTROL_BYTES) {
    assert.equal(bytes.indexOf(marker), -1, `found raw control bytes ${marker.toString("hex")}`);
  }
}

function producerShapedFindings() {
  const demonstrated = confirmed();
  demonstrated.conditions = [{
    kind: "plan_or_entitlement",
    description: "The workspace is on a plan that allows invitations.",
  }];
  demonstrated.remediation.code_changes = [{
    file_name: "src/pages/invitation-expired.tsx",
    fixed_code: "",
  }];
  demonstrated.remediation.instruction_changes = [{
    file_name: "docs/invitations.md",
    change: "State that the expiry page offers a resend request.",
  }];

  return [demonstrated, needsOwnerIntent(), rejected()];
}

function rejectMutation(factory, mutate) {
  const value = factory();
  mutate(value);
  assert.notEqual(errorsFor([value]).length, 0);
}

function errorsAfter(factory, mutate) {
  const value = factory();
  mutate(value);
  return errorsFor([value]);
}

test("schema is an actual top-level array with exactly three branches", () => {
  assert.equal(schema.type, "array");
  assert.equal(schema.items.oneOf.length, 3);
  assert.deepEqual(schema.items.oneOf.map((branch) => branch.properties.verdict.const), [
    "confirmed", "needs_owner_intent", "rejected",
  ]);
  const confirmedSchema = schema.items.oneOf[0].properties;
  assert.equal(confirmedSchema.title.visibleContent, true);
  assert.equal(confirmedSchema.remediation.properties.code_changes.items.properties.fixed_code.minLength, undefined);
  assert.equal(confirmedSchema.remediation.properties.code_changes.items.properties.fixed_code.visibleContent, undefined);
});

test("accepts a producer-shaped findings document through the CLI", () => {
  const result = runCli(JSON.stringify(producerShapedFindings()));
  assert.equal(result.status, 0, cliOutput(result));
  assert.match(result.stdout, /PASS: 3 findings valid/);
});

test("accepts empty output and each complete branch", () => {
  assert.deepEqual(errorsFor([]), []);
  assert.deepEqual(errorsFor([confirmed(), needsOwnerIntent(), rejected()]), []);
  assert.deepEqual(errorsFor([overfit()]), []);
});

test("allows a one-line finding trace", () => {
  const finding = confirmed();
  finding.trace = [step("entrypoint")];
  assert.deepEqual(errorsFor([finding]), []);
});

test("checks trace order", () => {
  const oneOutcome = confirmed();
  oneOutcome.trace = [step("outcome", "src/pages/invitation-expired.tsx", 30)];
  assert.deepEqual(errorsFor([oneOutcome]), []);

  assert(errorsAfter(confirmed, (finding) => { finding.trace = [step("transition")]; })
    .some((error) => error.includes('a one-line trace must be "entrypoint" or "outcome"')));
  assert(errorsAfter(confirmed, (finding) => { finding.trace[0].kind = "transition"; })
    .some((error) => error.includes('trace[0].kind: must be "entrypoint"')));
  assert(errorsAfter(confirmed, (finding) => { finding.trace[2].kind = "transition"; })
    .some((error) => error.includes('trace[2].kind: must be "outcome"')));
  assert(errorsAfter(confirmed, (finding) => { finding.trace[1].kind = "outcome"; })
    .some((error) => error.includes('trace[1].kind: must be "transition"')));
});

test("rejects empty required content", () => {
  const cases = [
    [confirmed, (finding) => { finding.title = ""; }],
    [confirmed, (finding) => { finding.title = "   "; }],
    [confirmed, (finding) => { finding.evidence = []; }],
    [confirmed, (finding) => { finding.principles = []; }],
    [confirmed, (finding) => { finding.intent.sources = []; }],
    [confirmed, (finding) => { finding.reproduction.steps = []; }],
    [confirmed, (finding) => { finding.reproduction.observed_result = ""; }],
    [confirmed, (finding) => { finding.remediation.strategy = ""; }],
    [needsOwnerIntent, (finding) => { finding.intent_candidates = [finding.intent_candidates[0]]; }],
    [needsOwnerIntent, (finding) => { finding.question = " "; }],
    [needsOwnerIntent, (finding) => { finding.consequence_if_each = []; }],
    [rejected, (finding) => { finding.claimed_gap = ""; }],
  ];
  for (const [factory, mutate] of cases) rejectMutation(factory, mutate);
});

test("preserves exact replacement-code strings", () => {
  const finding = confirmed();
  const fixedCode = "\u0000 \t\r\n\u001f\u007f\u034f\ufe0f\ud800x\udc00";
  finding.remediation.code_changes = [{ file_name: "src/pages/invitation-expired.tsx", fixed_code: fixedCode }];

  assert.deepEqual(errorsFor([finding]), []);
  assert.equal(finding.remediation.code_changes[0].fixed_code, fixedCode);
});

test("rejects invalid scalars and whitespace, control, format, or default-ignorable prose", () => {
  for (const invisible of ["\u0000\t\r\n\u001f\u007f\u200b", "\u034f", "\ufe0f", "\ud800", "\udc00", "visible\ud800"]) {
    const cases = [
      [confirmed, (finding) => { finding.title = invisible; }],
      [confirmed, (finding) => { finding.trace[0].scope = invisible; }],
      [confirmed, (finding) => { finding.evidence[0].description = invisible; }],
      [confirmed, (finding) => { finding.intent.sources[0].quote = invisible; }],
      [confirmed, (finding) => { finding.reproduction.steps = [invisible]; }],
      [confirmed, (finding) => { finding.remediation.strategy = invisible; }],
      [confirmed, (finding) => { finding.severity.impact.reason = invisible; }],
      [confirmed, (finding) => { finding.confidence.reason = invisible; }],
      [overfit, (finding) => { finding.proportionate_shape = invisible; }],
      [needsOwnerIntent, (finding) => { finding.intent_candidates[0].reading = invisible; }],
      [needsOwnerIntent, (finding) => { finding.question = invisible; }],
      [rejected, (finding) => { finding.reason = invisible; }],
    ];
    for (const [factory, mutate] of cases) rejectMutation(factory, mutate);
  }
});

test("quotes input-derived controls in direct validation values and paths", () => {
  const finding = confirmed();
  finding.trace[0].kind = `invalid-${TERMINAL_CONTROL_PAYLOAD}`;
  finding.reproduction[`extra-${TERMINAL_CONTROL_PAYLOAD}`] = "value";

  const cyclic = {};
  cyclic[`path-${TERMINAL_CONTROL_PAYLOAD}`] = cyclic;
  const output = [
    ...errorsFor([finding]),
    ...collect(cyclic, { type: "object" }, "$input"),
  ].join("\n");

  for (const escaped of ["\\u001b", "\\u0007", "\\u0085", "\\u202e", "\\u034f", "\\ufe0f"]) {
    assert(output.includes(escaped), `missing escaped diagnostic ${escaped}`);
  }
  assertNoInjectedControlBytes(output);
});

test("rejects line zero", () => {
  rejectMutation(confirmed, (finding) => { finding.trace[0].line = 0; });
  rejectMutation(rejected, (finding) => { finding.evidence[0].line = 0; });
  rejectMutation(overfit, (finding) => { finding.excess[0].line = 0; });
});

test("does not treat inherited or Object-prototype properties as schema properties", () => {
  rejectMutation(confirmed, (finding) => { finding.constructor = "not allowed"; });
  const inherited = Object.create({ verdict: "confirmed" });
  assert(errorsFor([inherited]).some((error) => error.includes("exactly one")));
  assert(collect(Object.create({ constructor: "inherited" }), {
    type: "object",
    properties: { constructor: { type: "string" } },
    required: ["constructor"],
    additionalProperties: false,
  }).some((error) => error.includes("missing required")));
});

test("oneOf requires exactly one passing branch", () => {
  assert(collect("value", { oneOf: [{ type: "string" }, { minLength: 1 }] }, "$test")
    .some((error) => error.includes("matched 2")));
  assert(collect(7, { oneOf: [{ type: "string" }, { minimum: 10 }] }, "$test")
    .some((error) => error.includes("matched 0")));
});

test("rejects duplicate fingerprints and unique array entries", () => {
  const first = confirmed();
  const second = rejected();
  second.fingerprint = first.fingerprint;
  assert(errorsFor([first, second]).some((error) => error.includes("duplicate of")));
  rejectMutation(needsOwnerIntent, (finding) => {
    finding.intent_candidates = [finding.intent_candidates[0], finding.intent_candidates[0]];
  });
  rejectMutation(confirmed, (finding) => { finding.principles = ["P1", "P1"]; });
});

test("uses canonical Set uniqueness for structured entries at the array limit", () => {
  const entries = Array.from({ length: LIMITS.arrayItems }, (_, id) => ({ id, label: String(id) }));
  assert.deepEqual(collect(entries, { type: "array", uniqueItems: true }), []);

  const duplicate = entries.slice(0, -1);
  duplicate.push({ label: "0", id: 0 });
  assert(collect(duplicate, { type: "array", uniqueItems: true })
    .some((error) => error.includes(`duplicate at index ${LIMITS.arrayItems - 1}`)));
});

test("bounds canonical uniqueness keys and Set storage", () => {
  const oversizedKey = "x".repeat(LIMITS.canonicalKeyBytes + 1);
  assert(collect([oversizedKey], { type: "array", uniqueItems: true })
    .some((error) => error.includes("canonical key exceeds")));

  const itemLength = Math.floor(LIMITS.uniqueSetBytes / 6);
  const largeUniqueItems = Array.from({ length: 6 }, (_, index) => `${index}${"x".repeat(itemLength)}`);
  assert(collect(largeUniqueItems, { type: "array", uniqueItems: true })
    .some((error) => error.includes("canonical uniqueness set exceeds")));
});

test("requires findings to be sorted by fingerprint", () => {
  const first = confirmed();
  const second = rejected();
  assert(errorsFor([second, first]).some((error) => error.includes("sorted lexicographically")));
});

test("rejects severity above demonstrated impact", () => {
  rejectMutation(confirmed, (finding) => {
    finding.severity.overall_severity = "high";
    finding.severity.impact.score = "medium";
  });
});

test("checks principle IDs against PRINCIPLES.md headings", () => {
  const ids = loadPrincipleIds();
  assert(ids.has("P1"));
  assert(ids.has("P13"));

  const known = confirmed();
  known.principles = ["P13"];
  assert.deepEqual(errorsFor([known]), []);

  assert(errorsAfter(confirmed, (finding) => { finding.principles = ["P1", "P99"]; })
    .some((error) => error.includes('principles[1]: "P99" is not a principle heading in PRINCIPLES.md')));
});

test("fails clearly when PRINCIPLES.md is missing or has no principle headings", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-findings-principles-"));
  try {
    const copiedValidator = path.join(directory, "validate-findings.cjs");
    const findingsPath = path.join(directory, "findings.json");
    fs.copyFileSync(validatorPath, copiedValidator);
    fs.copyFileSync(path.join(__dirname, "report-schema.json"), path.join(directory, "report-schema.json"));
    fs.writeFileSync(findingsPath, JSON.stringify(producerShapedFindings()));

    const missing = spawnSync(process.execPath, [copiedValidator, findingsPath], { encoding: "utf8", timeout: CLI_TIMEOUT_MS });
    assert.equal(missing.status, 1, cliOutput(missing));
    assert.match(missing.stderr, /Failed to load principles: PRINCIPLES\.md: file not found/);

    fs.writeFileSync(path.join(directory, "PRINCIPLES.md"), "# Principles\n\n## Intent\n\nNo numbered headings.\n");
    const empty = spawnSync(process.execPath, [copiedValidator, findingsPath], { encoding: "utf8", timeout: CLI_TIMEOUT_MS });
    assert.equal(empty.status, 1, cliOutput(empty));
    assert.match(empty.stderr, /no "### P<n> " principle headings found/);
    assert.throws(() => loadPrincipleIds(path.join(directory, "PRINCIPLES.md")), /no "### P<n> " principle headings found/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("requires overfit fields only on confirmed overfit findings", () => {
  for (const field of ["literal_source", "excess", "proportionate_shape"]) {
    assert(errorsAfter(overfit, (finding) => { delete finding[field]; })
      .some((error) => error.includes(`confirmed overfit finding requires "${field}"`)), field);
    assert(errorsAfter(overfit, (finding) => { finding.fit = "underfit"; })
      .some((error) => error.includes(`must not contain "${field}"`)), field);
  }
});

test("requires confirmed intent to cite a source outside the trace", () => {
  const commitOnly = confirmed();
  commitOnly.intent.sources = [{ kind: "commit", ref: "0123456789abcdef0123456789abcdef01234567", quote: "Expired links offer a resend request." }];
  assert.deepEqual(errorsFor([commitOnly]), []);

  assert(errorsAfter(confirmed, (finding) => {
    finding.intent.sources = [{ kind: "file", ref: "src/invitations/accept.ts", line: 20, quote: "return expiredPage();" }];
  }).some((error) => error.includes("intent cannot rest only on the implementation under review")));
});

test("checks file and commit source objects", () => {
  assert(errorsAfter(confirmed, (finding) => { delete finding.intent.sources[0].line; })
    .some((error) => error.includes('file source requires "line"')));
  assert(errorsAfter(confirmed, (finding) => { finding.intent.sources[0].ref = "../docs/invitations.md"; })
    .some((error) => error.includes("intent.sources[0].ref: must be a safe repository-relative source path")));
  for (const ref of ["HEAD", "A1B2C3D", "a1b2c3", "a".repeat(41), "main"]) {
    assert(errorsAfter(needsOwnerIntent, (finding) => { finding.intent_candidates[1].sources[0].ref = ref; })
      .some((error) => error.includes("intent_candidates[1].sources[0].ref: commit source requires")), ref);
  }
  assert(errorsAfter(needsOwnerIntent, (finding) => { delete finding.intent_candidates[0].sources[0].line; })
    .some((error) => error.includes('file source requires "line"')));
});

test("keeps verdict-specific fields out of other verdicts", () => {
  const ownerIntentForbidden = {
    severity: confirmed().severity,
    reproduction: confirmed().reproduction,
    remediation: confirmed().remediation,
    root_cause: "A cause.",
    intent: confirmed().intent,
    reason: "A reason.",
    literal_source: overfit().literal_source,
    excess: overfit().excess,
    proportionate_shape: "A shape.",
  };
  for (const [field, value] of Object.entries(ownerIntentForbidden)) {
    assert(errorsAfter(needsOwnerIntent, (finding) => { finding[field] = value; })
      .some((error) => error.includes(`needs_owner_intent finding must not contain "${field}"`)), field);
  }

  const rejectedForbidden = {
    severity: confirmed().severity,
    reproduction: confirmed().reproduction,
    remediation: confirmed().remediation,
    root_cause: "A cause.",
    intent: confirmed().intent,
    intent_candidates: needsOwnerIntent().intent_candidates,
    question: "A question?",
    consequence_if_each: needsOwnerIntent().consequence_if_each,
    literal_source: overfit().literal_source,
    excess: overfit().excess,
    proportionate_shape: "A shape.",
  };
  for (const [field, value] of Object.entries(rejectedForbidden)) {
    assert(errorsAfter(rejected, (finding) => { finding[field] = value; })
      .some((error) => error.includes(`rejected finding must not contain "${field}"`)), field);
  }
});

test("rejects unsafe source paths", () => {
  const badPaths = [
    "/etc/passwd",
    "../src/file.c",
    "src/../file.c",
    "src//file.c",
    "C:\\src\\file.c",
    "src/file:name.c",
    "src/file\nname.c",
    "src/file\u0001name.c",
    "src/file\u0085name.c",
    "src/file\u2028name.c",
    "src/file\u202ename.c",
    "src/file\u2066name.c",
    "src/file\u200dname.c",
    "src/file\u034fname.c",
    "src/file\ufe0fname.c",
    "src/file\ud800name.c",
    "src/file\udc00name.c",
    "CON",
    "src/con.txt",
    "src/PRN",
    "src/AUX.c",
    "src/NUL",
    "src/COM1.log",
    "src/lpt9",
    "src/CONIN$",
    "src/CONOUT$.txt",
    "src/CLOCK$.txt",
    "src/COM\u00b9.log",
    "src/LPT\u00b2.log",
    "src /file.c",
    "src./file.c",
    "src/file.c ",
    "src/file.c.",
  ];
  for (const badPath of badPaths) {
    rejectMutation(confirmed, (finding) => { finding.trace[0].file = badPath; });
  }
  rejectMutation(rejected, (finding) => { finding.evidence[0].file = "NUL.txt"; });
  rejectMutation(overfit, (finding) => { finding.excess[0].file = "../src/accept.ts"; });
  rejectMutation(confirmed, (finding) => {
    finding.remediation.code_changes = [{ file_name: "src/file:name.c", fixed_code: "replacement" }];
  });
  rejectMutation(confirmed, (finding) => {
    finding.remediation.instruction_changes = [{ file_name: "/etc/AGENTS.md", change: "Narrow the rule." }];
  });
  rejectMutation(needsOwnerIntent, (finding) => { finding.intent_candidates[0].sources[0].ref = "docs\\drafts.md"; });
});

test("accepts legitimate Unicode source paths and prose", () => {
  const finding = confirmed();
  finding.title = "Finding \ud83d\ude00 cafe\u0301";
  finding.trace[0].file = "src/日本語/cafe\u0301-\ud83d\ude00.ts";
  finding.evidence[0].file = "src/mañana/файл.ts";
  finding.intent.sources[0].ref = "docs/einladungen/übersicht.md";
  finding.remediation.code_changes = [{
    file_name: "src/修正/éxito.ts",
    fixed_code: "replacement",
  }];
  assert.deepEqual(errorsFor([finding]), []);
});

test("CLI rejects input above the byte limit without an exception trace", () => {
  const result = runCli(Buffer.alloc(LIMITS.inputBytes + 1, 0x20));
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, new RegExp(`input exceeds ${LIMITS.inputBytes} byte limit`));
  assert.doesNotMatch(output, /RangeError|Maximum call stack|heap out of memory/i);
});

test("CLI rejects invalid UTF-8 without replacement or an exception trace", () => {
  const findings = producerShapedFindings();
  findings[0].reproduction.setup = "INVALID_UTF8";
  const encoded = Buffer.from(JSON.stringify(findings));
  const marker = Buffer.from("INVALID_UTF8");
  const markerOffset = encoded.indexOf(marker);
  assert.notEqual(markerOffset, -1);
  const malformed = Buffer.concat([
    encoded.subarray(0, markerOffset),
    Buffer.from([0x80]),
    encoded.subarray(markerOffset + marker.length),
  ]);

  const result = runCli(malformed);
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, /input is not valid UTF-8/);
  assert.doesNotMatch(output, /TypeError|stack|at validate-findings/i);
});

test("quotes input-derived controls in CLI validation errors", { skip: !HAS_SAFE_INPUT_OPEN }, () => {
  const finding = confirmed();
  finding.trace[0].kind = `invalid-${TERMINAL_CONTROL_PAYLOAD}`;
  finding.reproduction[`extra-${TERMINAL_CONTROL_PAYLOAD}`] = "value";
  const result = runCli(JSON.stringify([finding]));

  assert.equal(result.status, 1, cliOutput(result));
  assert.match(result.stderr, /\$\[0\]\.trace\[0\]\.kind/);
  assert.match(result.stderr, /\\u001b/);
  assert.match(result.stderr, /\\u202e/);
  assertNoInjectedControlBytes(result.stderr);
});

test("returns a generic syntax error without parser-supplied controls", { skip: !HAS_SAFE_INPUT_OPEN }, () => {
  const malformed = Buffer.concat([
    Buffer.from("["),
    Buffer.from(TERMINAL_CONTROL_PAYLOAD),
    Buffer.from("]"),
  ]);
  const result = runCli(malformed);

  assert.equal(result.status, 1, cliOutput(result));
  assert.equal(result.stderr, "Failed to parse findings JSON: invalid JSON syntax\n");
  assertNoInjectedControlBytes(result.stderr);
});

test("does not reflect controls from a failed CLI input path", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-findings-path-"));
  const missingPath = path.join(directory, `missing-${TERMINAL_CONTROL_PAYLOAD}.json`);
  try {
    const result = spawnSync(process.execPath, [validatorPath, missingPath], {
      encoding: "utf8",
      timeout: CLI_TIMEOUT_MS,
    });
    assert.equal(result.status, 1, cliOutput(result));
    assert.match(result.stderr, /Failed to read findings JSON:/);
    assertNoInjectedControlBytes(result.stderr);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI rejects lone-surrogate prose without changing replacement-code semantics", () => {
  const findings = producerShapedFindings();
  findings[0].title = "\ud800";
  const result = runCli(JSON.stringify(findings));
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, /must contain only valid Unicode scalar values/);
  assert.doesNotMatch(output, /stack|at validate-findings/i);
});

test("CLI rejects Unicode format controls in source paths", () => {
  const findings = producerShapedFindings();
  findings[0].trace[0].file = "src/file\u202ename.c";
  const result = runCli(JSON.stringify(findings));
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, /must be a safe repository-relative source path/);
  assert.doesNotMatch(output, /stack|at validate-findings/i);
});

test("CLI rejects a FIFO without blocking", { skip: process.platform === "win32" || !HAS_SAFE_INPUT_OPEN }, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-findings-fifo-"));
  const fifoPath = path.join(directory, "findings.json");
  try {
    const created = spawnSync("mkfifo", [fifoPath], { encoding: "utf8", timeout: CLI_TIMEOUT_MS });
    assert.equal(created.status, 0, cliOutput(created));

    const result = spawnSync(process.execPath, [validatorPath, fifoPath], {
      encoding: "utf8",
      timeout: CLI_TIMEOUT_MS,
    });
    const output = cliOutput(result);
    assert.notEqual(result.error && result.error.code, "ETIMEDOUT", output);
    assert.equal(result.status, 1, output);
    assert.match(output, /input must be a regular file/);
    assert.doesNotMatch(output, /stack|at validate-findings/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI rejects a symlink without following it", { skip: process.platform === "win32" || !HAS_SAFE_INPUT_OPEN }, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "validate-findings-symlink-"));
  const targetPath = path.join(directory, "target.json");
  const symlinkPath = path.join(directory, "findings.json");
  try {
    fs.writeFileSync(targetPath, JSON.stringify(producerShapedFindings()));
    fs.symlinkSync(targetPath, symlinkPath);
    const result = spawnSync(process.execPath, [validatorPath, symlinkPath], {
      encoding: "utf8",
      timeout: CLI_TIMEOUT_MS,
    });
    const output = cliOutput(result);
    assert.notEqual(result.error && result.error.code, "ETIMEDOUT", output);
    assert.equal(result.status, 1, output);
    assert.match(output, /input must not be a symlink/);
    assert.doesNotMatch(output, /stack|at validate-findings/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI rejects input above the nesting-depth limit without an exception trace", () => {
  const levels = LIMITS.nestingDepth + 1;
  const result = runCli(`${"[".repeat(levels)}0${"]".repeat(levels)}`);
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, new RegExp(`${LIMITS.nestingDepth} level nesting depth limit`));
  assert.doesNotMatch(output, /RangeError|Maximum call stack|heap out of memory/i);
});

test("CLI rejects an oversized array without an exception trace", () => {
  const result = runCli(JSON.stringify(Array(LIMITS.arrayItems + 1).fill(null)));
  const output = cliOutput(result);
  assert.equal(result.status, 1, output);
  assert.match(output, new RegExp(`${LIMITS.arrayItems} item array limit`));
  assert.doesNotMatch(output, /RangeError|Maximum call stack|heap out of memory/i);
});

test("checks pattern and branch invariants", () => {
  rejectMutation(rejected, (finding) => { finding.fingerprint = "not stable"; });
  rejectMutation(confirmed, (finding) => { finding.fit_class = "fit-classes.md#Dead-end state"; });
  rejectMutation(confirmed, (finding) => { finding.principles = ["P0"]; });
  rejectMutation(needsOwnerIntent, (finding) => {
    finding.severity = { impact: { score: "low" }, overall_severity: "low" };
  });
});

test("rejects unsupported and malformed schema keywords", () => {
  assert(collectSchemaErrors({ type: "string", format: "uuid" }).some((error) => error.includes("format")));
  assert(collectSchemaErrors({ type: "string", pattern: "[" }).some((error) => error.includes("regular expression")));
  assert(collectSchemaErrors({ type: "string", visibleContent: "yes" }).some((error) => error.includes("expected boolean")));
  assert(collectSchemaErrors({ type: "array", visibleContent: true }).some((error) => error.includes("requires type")));
  assert.notEqual(validateDocument([], { type: "array", maxItems: 1 }).length, 0);
});

test("caps malformed 1000-finding validation output", () => {
  assert.equal(errorsFor(Array.from({ length: LIMITS.arrayItems }, () => null)).length, LIMITS.validationErrors);
  if (!HAS_SAFE_INPUT_OPEN) return;

  const result = runCli(JSON.stringify(Array.from({ length: LIMITS.arrayItems }, () => null)));
  const output = cliOutput(result);
  assert.notEqual(result.error && result.error.code, "ETIMEDOUT", output);
  assert.equal(result.status, 1, output);
  assert.match(output, /output capped at 100/);
  assert(output.length < 20000, `unexpected output length ${output.length}`);
  assert.doesNotMatch(output, /RangeError|Maximum call stack|stack|at validate-findings/i);
});

test("caps amplified in-limit findings output under a constrained Node heap", { skip: !HAS_SAFE_INPUT_OPEN }, () => {
  const findings = Array.from({ length: 750 }, () => ({
    verdict: "confirmed",
    trace: Array.from({ length: LIMITS.arrayItems }, () => 0),
    evidence: Array.from({ length: LIMITS.arrayItems }, () => 0),
  }));
  const contents = JSON.stringify(findings);
  assert(contents.length > 3 * 1000 * 1000, `hostile input too small: ${contents.length}`);
  assert(contents.length <= LIMITS.inputBytes, `hostile input over limit: ${contents.length}`);

  const result = runCli(contents, {
    nodeArgs: ["--max-old-space-size=64"],
    timeout: HOSTILE_CLI_TIMEOUT_MS,
  });
  const output = cliOutput(result);
  assert.notEqual(result.error && result.error.code, "ETIMEDOUT", output);
  assert.equal(result.status, 1, output);
  assert.match(output, /output capped at 100/);
  assert(output.length < 20000, `unexpected output length ${output.length}`);
  assert.doesNotMatch(output, /heap out of memory|allocation failed|RangeError|Maximum call stack/i);
});

test("keeps shared helpers aligned with the coverage-ledger validator", () => {
  const findingsModule = require("./validate-findings.cjs");
  const ledgerModule = require("./validate-coverage-ledger.cjs");

  for (const name of [
    "VISIBLE_CONTENT",
    "PATH_FORBIDDEN_CHARACTER",
    "WINDOWS_RESERVED_COMPONENT",
    "UNSAFE_DIAGNOSTIC_CHARACTER",
  ]) {
    assert.equal(findingsModule[name].source, ledgerModule[name].source, `${name} source`);
    assert.equal(findingsModule[name].flags, ledgerModule[name].flags, `${name} flags`);
  }

  const sharedLimitKeys = Object.keys(findingsModule.LIMITS)
    .filter((key) => Object.prototype.hasOwnProperty.call(ledgerModule.LIMITS, key))
    .sort();
  assert.deepEqual(sharedLimitKeys, ["inputBytes", "nestingDepth", "validationErrors"]);
  for (const key of sharedLimitKeys) {
    assert.equal(findingsModule.LIMITS[key], ledgerModule.LIMITS[key], `LIMITS.${key}`);
  }

  const pathCorpus = [
    "src/handler.js",
    "src/caf\u00e9/handler.js",
    "src/\u65e5\u672c\u8a9e/\u0444\u0430\u0439\u043b.ts",
    "src/cloc\u212a$.txt",
    "src/CLOCK$.txt",
    "src/con.txt",
    "CON",
    "src/COM\u00b9.log",
    "src/lpt\u00b3",
    "/etc/passwd",
    "../src/file.c",
    "src/../file.c",
    "src//file.c",
    "src\\file.c",
    "src/file:name.c",
    "~home/file.c",
    "C:/file.c",
    "src/file.c ",
    "src/file.c.",
    "src/file\u202ename.c",
    "src/file\u200b.js",
    "src/file\u034f.js",
    "src/file\ufe0f.js",
    "src/file\ud800name.c",
    "src/file\udc00name.c",
  ];
  for (const value of pathCorpus) {
    assert.equal(
      findingsModule.isSafeRelativeSourcePath(value),
      ledgerModule.isSafeRelativePath(value),
      `path verdict diverges for ${JSON.stringify(value)}`,
    );
  }
  assert.equal(findingsModule.isSafeRelativeSourcePath("src/cloc\u212a$.txt"), false);
  assert.equal(ledgerModule.isSafeRelativePath("src/cloc\u212a$.txt"), false);

  const proseCorpus = [
    "Valid prose.",
    "caf\u00e9",
    "",
    " \t\r\n",
    "\u200b",
    "\u034f",
    "\ufe0f",
    "\ud800",
    "\udc00",
    "visible\ud800",
  ];
  for (const value of proseCorpus) {
    assert.equal(
      findingsModule.hasVisibleProse(value),
      ledgerModule.hasVisibleProse(value),
      `prose verdict diverges for ${JSON.stringify(value)}`,
    );
  }
});
