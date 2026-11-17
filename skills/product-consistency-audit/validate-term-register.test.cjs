const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { validateTermRegister } = require("./validate-term-register.cjs");

const validatorPath = path.join(__dirname, "validate-term-register.cjs");

function visit() {
  return {
    id: "visit",
    term: "visit",
    forms: [
      { form: "Besuch", kind: "word", locale: "de-CH" },
      { form: "visite", kind: "word", locale: "fr-CH" },
      { form: "coordination_visit_series", kind: "identifier", locale: null },
    ],
    glossary_status: "implied_by_examples",
    selected_for: ["names_record", "gates_behaviour", "actors_narrower_than_sources", "sense_from_other_field", "in_prompt_or_tool", "undefined_in_glossary"],
    definitions: [
      { kind: "file", ref: "docs/VOICE-AND-SLOP-GUIDE.md", line: 10, quote: "They work within their job and the visit they have.", provenance: "unattributed" },
    ],
    senses: [
      { id: "anyone", meaning: "Anyone from the support network spends time with the person.", uses: [{ surface: "doc", ref: "PRODUCT.md", line: 22, quote: "recording a visit" }] },
      { id: "paid-booking", meaning: "A companion's booked time, with claiming and cover.", uses: [
        { surface: "api", ref: "apps/web/lib/repositories/coordination-visits.ts", line: 258, quote: "This visit already has a companion" },
        { surface: "prompt", ref: "apps/web/lib/visit-report-assist.server.ts", line: 18, quote: "what a home support worker said or wrote about one visit" },
      ] },
      { id: "page-view", meaning: "The reader last opened the brief.", uses: [{ surface: "copy", ref: "apps/web/i18n/messages/communication/en-CH.json", line: 539, quote: "Since your last visit on" }] },
    ],
    cases: [
      {
        id: "c1",
        kind: "use_site",
        text: "A neighbour with no account drops in on Tuesday.",
        basis: [{ ref: "apps/web/lib/visit-status.ts", line: 15 }],
        product_now: "She cannot be chosen as the visitor; the day shows Needs cover.",
        recommended: { verdict: "is", term: null },
        answer: { verdict: "is", term: null, decision_id: "T1" },
      },
      {
        id: "c2",
        kind: "boundary",
        text: "An agency companion comes every Thursday for two booked hours.",
        basis: [],
        product_now: "Shown as a visit with claiming and cover.",
        recommended: { verdict: "is_not", term: "session" },
        answer: { verdict: "is_not", term: "session", decision_id: "T2", words: "That's a session, booked paid time." },
      },
    ],
    status: "settled",
    outcome: {
      kind: "split",
      decision_ids: ["T3"],
      resulting_terms: [
        {
          term: "visit",
          definition: "Anyone from the support network spending time with the person, at home unless a place is given.",
          is: ["A neighbour with no account drops in on Tuesday."],
          is_not: ["An agency companion's two booked hours on Thursday."],
          forms: [{ form: "Besuch", kind: "word", locale: "de-CH" }],
          identifiers: "unchanged",
        },
        {
          term: "session",
          definition: "A companion's booked, paid visit.",
          is: ["An agency companion's two booked hours on Thursday."],
          is_not: ["A daughter dropping in after work."],
          forms: [{ form: "Einsatz", kind: "word", locale: "de-CH" }],
          identifiers: "unchanged",
        },
      ],
    },
  };
}

function undefinedTerm() {
  return {
    id: "going-along",
    term: "going along",
    forms: [],
    glossary_status: "missing",
    selected_for: ["undefined_in_glossary"],
    definitions: [],
    senses: [{ id: "accompany", meaning: "Someone accompanies the person to their own appointment.", uses: [{ surface: "copy", ref: "apps/web/i18n/en-CH.json", line: 12, quote: "needs someone" }] }],
    cases: [{
      id: "c1",
      kind: "use_site",
      text: "The daughter drives her mother to the GP.",
      basis: [{ ref: "apps/web/i18n/en-CH.json", line: 12 }],
      product_now: "Flagged as needing cover until someone is assigned.",
      recommended: null,
      answer: { verdict: "is", term: null, decision_id: "T4", words: "Going along is an open call, not cover." },
    }],
    status: "settled",
    outcome: {
      kind: "define",
      decision_ids: ["T5"],
      resulting_terms: [{
        term: "going along",
        definition: "Someone from the support network accompanies the person to their own appointment, answering an open call.",
        is: ["The daughter drives her mother to the GP after saying she'll go along."],
        is_not: ["The mother goes to the hairdresser alone."],
        forms: [],
        identifiers: [{ from: "needs_cover", to: "company_wanted" }],
      }],
    },
  };
}

function errorsFor(mutate, make = visit, decisions = null) {
  const value = make();
  mutate(value);
  return validateTermRegister([value], decisions).join("\n");
}

test("accepts a split term, a defined missing term and an empty register", () => {
  assert.deepEqual(validateTermRegister([visit(), undefinedTerm()]), []);
  assert.deepEqual(validateTermRegister([]), []);
});

test("accepts open and unconfirmed terms with unanswered cases and no outcome", () => {
  for (const status of ["open", "unconfirmed"]) {
    assert.equal(errorsFor((t) => { t.status = status; t.outcome = null; t.cases[1].answer = null; }), "");
    assert.match(errorsFor((t) => { t.status = status; }), /outcome: must be null until the term is settled/);
  }
});

test("a settled term needs every case answered and an outcome", () => {
  assert.match(errorsFor((t) => { t.cases[0].answer = null; }), /cases: a settled term has every case answered/);
  assert.match(errorsFor((t) => { t.outcome = null; }), /outcome: a settled term records its outcome/);
  assert.match(errorsFor((t) => { t.cases = []; }), /cases: a settled term records the cases put to the owner/);
});

test("each resulting term says what it is and what it is not", () => {
  assert.match(errorsFor((t) => { t.outcome.resulting_terms[0].is_not = []; }), /resulting_terms\[0\]\.is_not: must not be empty/);
  assert.match(errorsFor((t) => { delete t.outcome.resulting_terms[1].is; }), /resulting_terms\[1\]\.is: required/);
});

test("checks the number and words of resulting terms for each outcome", () => {
  assert.match(errorsFor((t) => { t.outcome.resulting_terms.pop(); }), /a split gives two or more terms/);
  assert.match(errorsFor((t) => { t.outcome.kind = "redefine"; }), /a redefine gives exactly one term/);
  assert.match(errorsFor((t) => { t.outcome.kind = "rename"; t.outcome.resulting_terms.pop(); }), /a rename gives a different word/);
  assert.match(errorsFor((t) => { t.outcome.kind = "keep"; t.outcome.resulting_terms.shift(); }), /a keep keeps the word "visit"/);
  assert.match(errorsFor((t) => { t.outcome.kind = "merge"; t.outcome.resulting_terms.pop(); }), /merged_with: required/);
  assert.match(errorsFor((t) => { t.outcome.merged_with = ["call"]; }), /merged_with: only a merge names the words it merges/);
  assert.equal(errorsFor((t) => { t.outcome.kind = "merge"; t.outcome.resulting_terms.pop(); t.outcome.merged_with = ["call-out"]; }), "");
});

test("define applies only to a term the glossary does not define", () => {
  assert.match(errorsFor((t) => {
    t.glossary_status = "defined";
    t.definitions = [{ kind: "file", ref: "docs/glossary.md", line: 3, quote: "Going along: ...", provenance: "unattributed" }];
  }, undefinedTerm), /define applies only to a term the glossary does not define/);
});

test("glossary status agrees with the definitions", () => {
  assert.match(errorsFor((t) => { t.glossary_status = "defined"; t.definitions = []; }), /a defined term cites its definition/);
  assert.match(errorsFor((t) => { t.glossary_status = "missing"; }), /must be empty when no source defines the term/);
});

test("requires use sites, signals, a basis for use-site cases and decision ids on answers", () => {
  const errors = errorsFor((t) => {
    t.senses[0].uses = [];
    t.senses[1].uses[0].surface = "screen";
    t.selected_for.push("popular");
    t.cases[0].basis = [];
    delete t.cases[0].answer.decision_id;
    t.cases[1].answer.decision_id = "Q2";
  });
  assert.match(errors, /senses\[0\]\.uses: must not be empty/);
  assert.match(errors, /senses\[1\]\.uses\[0\]\.surface: must be one of/);
  assert.match(errors, /selected_for\[6\]: must be one of/);
  assert.match(errors, /cases\[0\]\.basis: must not be empty/);
  assert.match(errors, /cases\[0\]\.answer\.decision_id: required/);
  assert.match(errors, /cases\[1\]\.answer\.decision_id: must match/);
});

test("rejects duplicate ids, absolute refs and line 0", () => {
  assert.match(validateTermRegister([visit(), visit()]).join("\n"), /\$\[1\]\.id: duplicate term id/);
  const errors = errorsFor((t) => {
    t.senses.push({ ...t.senses[0] });
    t.cases[1].id = "c1";
    t.senses[0].uses[0].ref = "/abs/PRODUCT.md";
    t.cases[0].basis[0].line = 0;
  });
  assert.match(errors, /senses\[3\]\.id: duplicate sense id/);
  assert.match(errors, /cases\[1\]\.id: duplicate case id/);
  assert.match(errors, /uses\[0\]\.ref: must be a repository-relative path/);
  assert.match(errors, /basis\[0\]\.line: must be a positive integer or null/);
});

test("accepts the glossary inventory signal and words to avoid", () => {
  assert.equal(errorsFor((t) => { t.selected_for = ["glossary_inventory"]; t.outcome.resulting_terms[1].avoid = ["paid visit", "Helfer"]; }), "");
  assert.match(errorsFor((t) => { t.outcome.resulting_terms[1].avoid = [""]; }), /resulting_terms\[1\]\.avoid\[0\]: invalid text/);
});

test("with decisions, every cited decision id must exist", () => {
  assert.equal(errorsFor(() => {}, visit, new Set(["T1", "T2", "T3"])), "");
  assert.match(errorsFor(() => {}, visit, new Set(["T1", "T3"])), /cases\[1\]\.answer\.decision_id: decision T2 is not in decisions\.json/);
});

test("CLI exits 0 for a valid register, 1 for an invalid one, and checks decisions when given", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "term-register-"));
  const good = path.join(dir, "good.json");
  const bad = path.join(dir, "bad.json");
  const decisions = path.join(dir, "decisions.json");
  fs.writeFileSync(good, JSON.stringify([visit()]));
  fs.writeFileSync(bad, JSON.stringify([{ id: "x" }]));
  fs.writeFileSync(decisions, JSON.stringify([{ id: "T1" }, { id: "T3" }]));
  assert.equal(spawnSync(process.execPath, [validatorPath, good]).status, 0);
  assert.equal(spawnSync(process.execPath, [validatorPath, bad]).status, 1);
  const withDecisions = spawnSync(process.execPath, [validatorPath, good, decisions], { encoding: "utf8" });
  assert.equal(withDecisions.status, 1);
  assert.match(withDecisions.stderr, /decision T2 is not in decisions\.json/);
  fs.rmSync(dir, { recursive: true, force: true });
});
