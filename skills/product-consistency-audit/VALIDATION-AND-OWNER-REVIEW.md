# Validation, Structured Output, Verification and Owner Review

### Phase 3: Independently validate every candidate

After the clean coverage-critic pass or a recorded early stop, consolidate Phase 2 candidates and prior records brought into this run by fingerprint and root cause. Give every unique candidate to a fresh `general` verifier that did not hunt it. A prior confirmation brought into this run follows the same path even though hunters excluded its unchanged root cause. In `quick`, a verifier may take up to three candidates whose root causes are independent of each other. It reads the intent for each one separately and returns one decision per candidate.

Assign each verifier a unique lowercase ID with its own `scratch/` and `artifacts/`. It receives, in this order:

1. [PRINCIPLES.md](PRINCIPLES.md), verbatim or by absolute path with an instruction to read it in full.
2. The intent register entry for the capability, its cited sources, and `architecture.md`.
3. The candidate's trace, evidence and person, **without** the hunter's intent statement, `literal_source`, `excess` or `proportionate_shape`.
4. The exact selected companion `Validation rules` blocks.
5. Whether walkthroughs are enabled, with a fixture person distinct from the hunter's.
6. The `confirmed`, `needs_owner_intent` and `rejected` branches of `report-schema.json`, verbatim.
7. Prior records with the same fingerprint.

The verifier states its own reading of the intent and of any rule origin (step 1 of the prompt below) before it sees the hunter's. Use one of these mechanisms:

- **Continuation**: the verifier returns `{"intent_reading": {...}}`, and the parent continues the same agent (SKILL.md, Platform terminology) with the hunter's full candidate.
- **File order**: the parent writes items 1 to 7 to `agents/<verifier-id>/scratch/candidate-blind-<n>.json` and the full candidate to `agents/<verifier-id>/sealed/candidate-full-<n>.json`. The prompt tells the verifier to write `scratch/intent-reading-<n>.json` before opening the sealed file. After the verifier finishes, the parent checks that every intent reading exists. File order relies on the verifier keeping to the order, so prefer continuation where the platform supports it.

The prompt below ends step 1 with the continuation sentence. For file order, the parent replaces that sentence with: "Write this reading to scratch/intent-reading-<n>.json, then open sealed/candidate-full-<n>.json."

The parent may write the parts every verifier shares (items 1, 4 and 6 and the prompt below) once, to `<output-dir>/briefs/verifier-brief.md`, and point each verifier at it by absolute path, as for hunters.

Companion validation rules that check the hunter's cited origin, commit or searches apply once the verifier has the full candidate. The verifier never receives another verifier's conclusion.

#### Candidate-verifier prompt

```text
You did not write this candidate. Try to refute it from source, git history and, if
enabled for you, a bounded local walkthrough as your assigned fixture person. Never
contact a deployed environment, send email, take payment or spend paid quota. Never
edit the target. Write only in your scratch directory.

1. Before reading the hunter's wording, state the capability's purpose and the
   person's goal from the intent sources you were given. Cite them. Read every
   written rule for its purpose and the scope its origin supports. If the sources
   do not establish the purpose for the situation in the trace, say so.
   Return this reading as {"intent_reading": {...}} and wait for the candidate.
2. Compare your reading with the hunter's. If they differ on the deciding point and
   the sources cannot decide it, the verdict is needs_owner_intent. A decision
   record, commit or accepted recommendation that chose the current behaviour
   decides the point only when the owner stated that choice themselves (P4). When
   it gives a written rule as its reason, it inherits that rule's scope question:
   an overfit candidate tracing the behaviour to that rule is not refuted by it.
   Without the owner's own statement on the deciding point, the verdict is
   needs_owner_intent, asking whether the choice was the owner's or a reading of
   the rule.
3. Verify every trace and evidence entry: file, positive line number, scope and
   description. Confirm the entrypoint is a place the named person arrives
   and the outcome is the claimed situation.
4. Look for the strongest exit, case or rule the candidate may have missed: other
   routes, support paths the intent names, admin actions, background clean-up,
   expiry that frees the state, shared helpers that handle the case.
5. For an overfit candidate, look for a stated need that justifies the excess:
   audit, compliance, recovery, a documented future capability, or a source that
   deliberately widens the rule. If one exists, reject the candidate. A decision
   counts as a stated need only under the provenance test in step 2; this applies
   to every companion rule that says "if one exists, reject". Check the
   literal_source against git history.
6. Reproduce the minimum result with the narrowest method: source trace, history,
   or a walkthrough that stops at the first observed stuck state or contradiction.
7. Check that severity, confidence and the proposed change match only what the
   evidence establishes, and that the change restores the fit without creating a
   new stuck state.
8. Preserve the fingerprint for the same root cause.

Write exactly one JSON object to scratch/result.json and reply with only the path
and one line per candidate (fingerprint, decision):
{"results": [{"decision": "confirmed|needs_owner_intent|rejected", "record": { ... }}],
 "uncovered": []}
with one results entry per candidate you were given. Each record exactly matches
its decision's branch of the schema included in this prompt. A corrected record
replaces the hunter's wording. List any other gap you noticed outside these
candidates under uncovered, in the hunter result's uncovered shape.
```

A verifier promotes `needs_owner_intent` to `confirmed` only after citing a source that answers the question. It demotes a proposed confirmation to `needs_owner_intent` when the deciding intent is open. It uses `rejected` when source, history or a walkthrough refutes the claim, when an exit exists, or when a stated need justifies an overfit element. `needs_owner_intent` is never a parking place for a speculative idea.

The parent checks that each verifier kept the fingerprint unless it identified a different root cause, merges corrections, records the decision in every linked ledger unit, and keeps one record per fingerprint. Discard a missing or malformed result file without repairing it and re-run with a fresh verifier when the budget permits; otherwise the candidate stays an unvalidated ledger candidate under the incomplete-run rule.

The parent seeds every verifier `uncovered` entry as a ledger unit, `deferred` with reason `quick_profile_verifier_uncovered` in `quick` and `planned` otherwise.

When verifier evidence updates a ledger check, set the check's `agent_id` to the verifier and list its `reviewed_paths`. The unit keeps its original owner.

### Phase 4: Write and validate `findings.json`

The parent writes all decided records to `<output-dir>/findings.json`, sorted by fingerprint:

- `confirmed`: a gap with a cited intent, a named person, a complete trace, a reproduction, a remediation, severity and confidence. Overfit records also include `literal_source`, `excess` and `proportionate_shape`.
- `needs_owner_intent`: a source-grounded gap whose verdict depends on an intent the sources leave open, with the competing readings, the question and the consequence of each answer. No severity.
- `rejected`: a candidate disproved during validation, kept so later runs do not repeat it without changed evidence.

Read `report-schema.json` immediately before writing. It uses `additionalProperties: false`; do not copy hunter wrapper fields such as `proposed_verdict` into a record. When copying register sources into `intent.sources`, omit a null `line`.

Run:

```sh
node <skill-dir>/validate-findings.cjs <output-dir>/findings.json
node <skill-dir>/validate-coverage-ledger.cjs <output-dir>/coverage-ledger.json
```

Fix every error before continuing. Validator success proves format and ledger consistency only.

### Phase 5: Verify the final records with fresh eyes

Launch a fresh `research` verifier per final `confirmed` and `needs_owner_intent` record, and per `rejected` record whose rejection rests on a decision record, in parallel. It checks the structured record instead of the hunter's write-up and reads source and history only.

In a `quick` run, Phase 3 and Phase 5 merge: the Phase 3 verifier also performs these checks and its `results` entries are the final records. Never skip independent review of a `confirmed` record.

For `confirmed`, check:

1. Every trace and evidence path, line, scope and description.
2. That the intent sources say what `intent.purpose` claims, and at least one of them lies outside the code under review.
3. That the person can reach the entrypoint and that the outcome is as stated.
4. That no exit, case or rule the intent names was missed.
5. For overfit: that `literal_source` is accurate, the `excess` items exist and have no stated need behind them, and `proportionate_shape` serves the purpose.
6. Severity: likelihood, demonstrated impact, overall no greater than impact.
7. That the remediation restores the fit, names any instruction change, and creates no new stuck state.
8. That every decision record the verdict relies on passes the provenance test in Phase 3, step 2.

For a `rejected` record that rests on a decision record, check the provenance test. If the decision is not the owner's own statement on the deciding point, replace the record with `needs_owner_intent`.

For `needs_owner_intent`, check:

1. The trace is real and supports only the `claimed_gap`.
2. The competing readings are each supported by their cited sources, and no source that passes the provenance test in P4 answers the question.
3. The question is one the owner can answer in a sentence, and `consequence_if_each` is exact.

Each verifier writes `{"decision":"verified","fingerprint":"..."}` or `{"decision":"replace","reason":"...","record":{...}}` to its `scratch/result.json`. Discard malformed results and re-run with a fresh verifier when the budget permits.

A replacement that promotes a record to a stronger verdict, or materially changes the intent, root cause, trace, observed result, impact or severity, goes to a new independent verifier before it applies. If budget or independence is unavailable, remove the disputed record from `findings.json`, keep its ledger unit as an unresolved candidate, and set `run_status: "incomplete"` with the exact reason. Wording or line corrections that do not change meaning may be applied directly.

After every applied replacement, rerun both validators and update linked ledger decisions. Set `run_status: "complete"` only when every ledger candidate has an independent final disposition and every retained record passes Phase 5.

### Phase 6: Owner review

The audit ends in a conversation with the owner. The verified records hold the detail; the owner's time goes to the decisions only they can make. This phase follows the grilling method from [mattpocock/skills](https://github.com/mattpocock/skills) (`grilling`, MIT): the parent turns the findings into a tree of decisions and asks them in rounds until nothing is left assumed.

#### Write the short summary

Write `<output-dir>/SUMMARY.md`, short enough to read in a couple of minutes:

1. Profile, scope, source ref, whether walkthroughs ran, and prior-run use. A `quick`, scoped, budget-limited or incomplete run says plainly that it is partial and lists unvalidated fingerprints.
2. Counts by family (underfit, overfit, inconsistency) and by severity, plus the number of open intent questions. An audience-scoped run gives these counts per person.
3. Coverage from the ledger: covered, candidate, blocked and deferred counts, the main exclusions, and the final critic result.

The summary does not restate findings. Their detail stays in `findings.json` and is read out during the session when a question needs it.

#### Build the decision tree

Write `<output-dir>/decision-tree.json` from the final `confirmed` and `needs_owner_intent` records. Each node is a decision for the owner, with the fingerprints it covers, the decisions it depends on, and a recommended answer drawn from the verified records. Build it in this order of dependency:

1. **Intent questions.** Each `needs_owner_intent` record becomes a decision. Findings whose verdict or fix depends on that intent hang below it. When several findings rest on recommendations the owner accepted in bulk, ask first which of those count as the owner's decisions. When a fix depends on an entry in `decided_not_on_ref` or on edits in a dirty worktree, ask whether that change is still the plan. In an audience-scoped run, an audience the product does not serve, and each inferred person with no named person behind them, come first: whether the product means to serve them decides every finding below.
2. **Rules behind overfit.** Group overfit records by their `literal_source`. Each rule, memory or example becomes one decision: keep it as written, narrow it to the scope its origin supports, or remove it. The findings it produced hang below it, so a single answer decides many of them.
3. **Fixes.** Each remaining confirmed record, or cluster sharing a root cause, becomes a decision about its remediation: the proposed change, a different change the owner prefers, or accepting the current behaviour as intended.
4. **Order.** Once fixes are decided, what to do first. Recommend by severity and by how many people each fix reaches.

#### Run the session

Work the tree in rounds. The frontier is every decision whose prerequisites are decided. Ask the whole frontier in one round, numbered, each with a recommended answer, and wait for the owner's answers before the next round. A question that depends on another question in the same round belongs to a later round.

```
❓ **Q1** - **<decision title>**: <what the product does now, for which person, and why it does not fit the intent; the options>

➡️ <recommended answer, with the fingerprint(s) it resolves>
```

Word each question so that "yes" accepts the recommendation. Keep the body to what the owner needs to decide: the person, the situation, the intent source, and the options. Offer the full trace when asked.

Facts are the parent's job. When a question needs a fact (a file, a commit, what a screen shows), look it up or dispatch a `research` agent; do not ask the owner. Only the questions that depend on that fact wait. Decisions are the owner's; never answer one on their behalf.

Each answer reshapes the tree. An answer to an intent question may turn findings below it into accepted behaviour or confirm them. A decision to narrow a rule may change the fix for every finding below it. Recompute the frontier after every round.

The session ends when the frontier is empty and the owner confirms the understanding is shared. If the owner is not available, stop after writing the summary and the tree, and say that the session is pending. Recommendations in an unanswered tree are the audit's opinions and are never recorded as decisions.

#### Record the decisions

Write `<output-dir>/decisions.json` and a short `<output-dir>/DECISIONS.md`. For every decision: the question, the owner's answer in their words, the fingerprints it resolves, and the resulting action (fix now, fix later, accepted as intended, rule kept, rule narrowed, rule removed). Record how each answer was given in `answered_as`: `own_words`, `accepted_recommendation` ("yes" to that single question) or `bulk_accepted` (one reply accepting several questions without answering each). An `own_words` answer, or a "yes" to a single question that put the deciding point to the owner, has `owner_statement` provenance under P4. When a reply accepts a whole round at once, record it as `bulk_accepted` and ask every intent and rule question from that round again, one at a time, before recording it as decided. For accepted-as-intended and rule decisions, record the owner's statement of intent with the date; later runs use it as an intent source at the provenance its `answered_as` gives.

The audit does not modify the target. After the session, offer to make the agreed code and instruction changes, and start only when the owner says so.
