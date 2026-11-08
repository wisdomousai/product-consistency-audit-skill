# Validation, Structured Output, Verification and Owner Review

### Phase 3: Independently validate every candidate

After the clean coverage-critic pass or a recorded early stop, consolidate Phase 2 candidates and carried prior records by fingerprint and root cause. Give every unique candidate to a fresh `general` verifier that did not hunt it. A carried prior confirmation follows the same path even though hunters excluded its unchanged root cause.

Assign each verifier a unique lowercase ID with its own `scratch/` and `artifacts/`. It receives, in this order:

1. [PRINCIPLES.md](PRINCIPLES.md) verbatim.
2. The intent register entry for the capability, its cited sources, and `architecture.md`.
3. The candidate's trace, evidence and person, **without** the hunter's intent statement, `literal_source`, `excess` or `proportionate_shape`.
4. The exact selected companion `Validation rules` blocks.
5. Whether walkthroughs are enabled, with a fixture person distinct from the hunter's.
6. The `confirmed`, `needs_owner_intent` and `rejected` branches of `report-schema.json`, verbatim.
7. Prior records with the same fingerprint.

After the verifier returns its own reading of the intent and of any rule origin (step 1 of the prompt below), the parent sends the hunter's full candidate. Companion validation rules that check the hunter's cited origin, commit or searches apply from that point. The verifier never receives another verifier's conclusion.

#### Candidate-verifier prompt

```text
You did not write this candidate. Try to refute it from source, git history and, if
enabled for you, a bounded local walkthrough as your assigned fixture person. Never
contact a deployed environment, send email, take payment or spend paid quota. Never
edit the target. Write only in your scratch directory.

1. Before reading the hunter's wording, state the capability's purpose and the
   person's goal from the intent sources you were given. Cite them. Read every
   written rule for its purpose and the scope its origin supports. If the sources
   do not settle the purpose for the situation in the trace, say so.
   Return this reading as {"intent_reading": {...}} and wait for the candidate.
2. Compare your reading with the hunter's. If they differ on the deciding point and
   the sources cannot settle it, the verdict is needs_owner_intent.
3. Verify every trace and evidence entry: file, positive line number, scope and
   description. Confirm the entrypoint is a place the named person arrives
   and the outcome is the claimed situation.
4. Look for the strongest exit, case or rule the candidate may have missed: other
   routes, support paths the intent names, admin actions, background clean-up,
   expiry that frees the state, shared helpers that handle the case.
5. For an overfit candidate, look for a stated need that justifies the excess:
   audit, compliance, recovery, a documented future capability, or a source that
   deliberately widens the rule. If one exists, reject the candidate. Check the
   literal_source against git history.
6. Reproduce the minimum result with the narrowest method: source trace, history,
   or a walkthrough that stops at the first observed stuck state or contradiction.
7. Check that severity, confidence and the proposed change match only what the
   evidence establishes, and that the change restores the fit without creating a
   new stuck state.
8. Preserve the fingerprint for the same root cause.

Return exactly one JSON object and no surrounding prose:
{"decision": "confirmed|needs_owner_intent|rejected", "record": { ... }}
where record exactly matches the decision's branch of the schema included in this
prompt. A corrected record replaces the hunter's wording.
```

A verifier promotes `needs_owner_intent` to `confirmed` only after citing a source that settles the question. It demotes a proposed confirmation to `needs_owner_intent` when the deciding intent is open. It uses `rejected` when source, history or a walkthrough refutes the claim, when an exit exists, or when a stated need justifies an overfit element. `needs_owner_intent` is never a parking place for a speculative idea.

The parent checks that each verifier kept the fingerprint unless it identified a different root cause, merges corrections, records the decision in every linked ledger unit, and keeps one record per fingerprint. Discard a malformed or prose-wrapped result without repairing it and re-run with a fresh verifier when the budget permits; otherwise the candidate stays an unvalidated ledger candidate under the incomplete-run rule.

When verifier evidence updates a ledger check, set the check's `agent_id` to the verifier and list its `reviewed_paths`. The unit keeps its original owner.

### Phase 4: Write and validate `findings.json`

The parent writes all decided records to `<output-dir>/findings.json`, sorted by fingerprint:

- `confirmed`: a gap with a cited intent, a named person, a complete trace, a reproduction, a remediation, severity and confidence. Overfit records also carry `literal_source`, `excess` and `proportionate_shape`.
- `needs_owner_intent`: a source-grounded gap whose verdict depends on an intent the sources leave open, with the competing readings, the question and the consequence of each answer. No severity.
- `rejected`: a candidate disproved during validation, kept so later runs do not repeat it without changed evidence.

Read `report-schema.json` immediately before writing. It uses `additionalProperties: false`; do not carry hunter wrapper fields such as `proposed_verdict` into a record.

Run:

```sh
node <skill-dir>/validate-findings.cjs <output-dir>/findings.json
node <skill-dir>/validate-coverage-ledger.cjs <output-dir>/coverage-ledger.json
```

Fix every error before continuing. Validator success proves format and ledger consistency only.

### Phase 5: Verify the final records with fresh eyes

Launch a fresh `research` verifier per final `confirmed` and `needs_owner_intent` record, in parallel. It checks the structured record, not the hunter's write-up, and reads source and history only.

In a `quick` run, Phase 3 and Phase 5 merge: the Phase 3 verifier also performs these checks and returns the final record. Never skip independent review of a `confirmed` record.

For `confirmed`, check:

1. Every trace and evidence path, line, scope and description.
2. That the intent sources say what `intent.purpose` claims, and at least one of them lies outside the code under review.
3. That the person can reach the entrypoint and that the outcome is as stated.
4. That no exit, case or rule the intent names was missed.
5. For overfit: that `literal_source` is accurate, the `excess` items exist and have no stated need behind them, and `proportionate_shape` serves the purpose.
6. Severity: likelihood, demonstrated impact, overall no greater than impact.
7. That the remediation restores the fit, names any instruction change, and creates no new stuck state.

For `needs_owner_intent`, check:

1. The trace is real and supports only the `claimed_gap`.
2. The competing readings are each supported by their cited sources, and no other source settles the question.
3. The question is one the owner can answer in a sentence, and `consequence_if_each` is exact.

Each verifier returns `{"decision":"verified","fingerprint":"..."}` or `{"decision":"replace","reason":"...","record":{...}}`, with no surrounding prose. Discard malformed results and re-run with a fresh verifier when the budget permits.

A replacement that promotes a record to a stronger verdict, or materially changes the intent, root cause, trace, observed result, impact or severity, goes to a new independent verifier before it applies. If budget or independence is unavailable, remove the disputed record from `findings.json`, keep its ledger unit as an unresolved candidate, and set `run_status: "incomplete"` with the exact reason. Wording or line corrections that do not change meaning may be applied directly.

After every applied replacement, rerun both validators and update linked ledger decisions. Set `run_status: "complete"` only when every ledger candidate has an independent final disposition and every retained record passes Phase 5.

### Phase 6: Owner review

The audit ends in a conversation with the owner, not a long report. The verified records hold the detail; the owner's time goes to the decisions only they can make. This phase follows the grilling method from [mattpocock/skills](https://github.com/mattpocock/skills) (`grilling`, MIT): the parent turns the findings into a tree of decisions and asks them in rounds until nothing is left assumed.

#### Write the short summary

Write `<output-dir>/SUMMARY.md`, short enough to read in a couple of minutes:

1. Profile, scope, source ref, whether walkthroughs ran, and prior-run use. A `quick`, scoped, budget-limited or incomplete run says plainly that it is partial and lists unvalidated fingerprints.
2. Counts by family (underfit, overfit, inconsistency) and by severity, plus the number of open intent questions.
3. Coverage from the ledger: covered, candidate, blocked and deferred counts, the main exclusions, and the final critic result.

The summary does not restate findings. Their detail stays in `findings.json` and is read out during the session when a question needs it.

#### Build the decision tree

Write `<output-dir>/decision-tree.json` from the final `confirmed` and `needs_owner_intent` records. Each node is a decision for the owner, with the fingerprints it covers, the decisions it depends on, and a recommended answer drawn from the verified records. Build it in this order of dependency:

1. **Intent questions.** Each `needs_owner_intent` record becomes a decision. Findings whose verdict or fix depends on that intent hang below it.
2. **Rules behind overfit.** Group overfit records by their `literal_source`. Each rule, memory or example becomes one decision: keep it as written, narrow it to the scope its origin supports, or remove it. The findings it produced hang below it, so a single answer settles many of them.
3. **Fixes.** Each remaining confirmed record, or cluster sharing a root cause, becomes a decision about its remediation: the proposed change, a different change the owner prefers, or accepting the current behaviour as intended.
4. **Order.** Once fixes are decided, what to do first. Recommend by severity and by how many people each fix reaches.

#### Run the session

Work the tree in rounds. The frontier is every decision whose prerequisites are settled. Ask the whole frontier in one round, numbered, each with a recommended answer, and wait for the owner's answers before the next round. A question that depends on another question in the same round belongs to a later round.

```
❓ **Q1** - **<decision title>**: <what the product does now, for which person, and why it does not fit the intent; the options>

➡️ <recommended answer, with the fingerprint(s) it settles>
```

Word each question so that "yes" accepts the recommendation. Keep the body to what the owner needs to decide: the person, the situation, the intent source, and the options. Offer the full trace when asked.

Facts are the parent's job. When a question needs a fact (a file, a commit, what a screen shows), look it up or dispatch a `research` agent; do not ask the owner. Only the questions that depend on that fact wait. Decisions are the owner's; never answer one on their behalf.

Each answer reshapes the tree. An answer to an intent question may turn findings below it into accepted behaviour or confirm them. A decision to narrow a rule may change the fix for every finding below it. Recompute the frontier after every round.

The session ends when the frontier is empty and the owner confirms the understanding is shared. If the owner is not available, stop after writing the summary and the tree, and say that the session is pending. A tree nobody answered holds the audit's opinion, not the owner's decisions.

#### Record the decisions

Write `<output-dir>/decisions.json` and a short `<output-dir>/DECISIONS.md`. For every decision: the question, the owner's answer in their words, the fingerprints it settles, and the resulting action (fix now, fix later, accepted as intended, rule kept, rule narrowed, rule removed). For accepted-as-intended and rule decisions, record the owner's statement of intent with the date; later runs treat it as an intent source ranked above every written source.

The audit does not modify the target. After the session, offer to make the agreed code and instruction changes, and start only when the owner says so.
