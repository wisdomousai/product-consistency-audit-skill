# Hunting

### Phase 2: Run coverage-led hunting waves

The parent assigns `planned` ledger units to `general` agents. Use enough focused hunters to cover the units without combining unrelated capabilities. One hunter may own closely related units of a single capability; no unit may be silently unassigned because of an agent-count limit. A unit the budget cannot reach is explicitly `deferred` with reason `budget_cannot_reserve_critics_and_validation`.

When a budget or profile caps hunter count, assign units in priority order and record the ordering rationale in the ledger. Rank by: (1) capabilities on the main tasks in scope (sign-up, sign-in, first run, agent task completion, required operational procedures) before secondary ones; (2) gates that can stop an actor entirely before ones that slow them down; (3) data-model units and written rules that the most code depends on; (4) prior-run gaps, revalidation targets and changed source before same-source re-passes. Ties break lexicographically by `coverage_id`.

Before launch, the parent changes assigned units to `in_progress`, sets a lowercase `agent_id`, and creates that agent's `scratch/` and `artifacts/`. Hunters read source, history and parent-provided context, may run walkthroughs only when the run's walkthrough capability is enabled, write only to their own `scratch/`, and return one structured result. They never edit the target or any shared run file.

## Required hunter prompt

Every hunter prompt contains these parts in this order:

1. A two-sentence role preamble: the hunter's goal is to find source-grounded gaps between product intent and implementation in its assigned units, and it must write exactly one JSON object matching the structured-result contract at the end of the prompt.
2. [PRINCIPLES.md](PRINCIPLES.md), verbatim or by absolute path with an instruction to read it in full.
3. `architecture.md`, verbatim or by absolute path with the same instruction.
4. The intent register entries for the assigned capabilities, verbatim, and the `state-machines.json` entries for any machine the assigned units name.
5. The `term-register.json` entries, verbatim, for every term the assigned capabilities list in `terms` and every term the assigned units name. When none apply, say that the register has no entry for these units.
6. Assigned coverage IDs, capability, gate, starting paths, and each unit's block map from `coverage-ledger.json`.
7. The selected blocks copied verbatim: each ordinary fit-class block from [FIT-CLASSES.md](FIT-CLASSES.md), and from each selected companion its `Core discipline`, each chosen class subsection, `Universal moves` and `Validation rules`. Never send block names alone.
8. Excluded blocks, each with its reason.
9. The core hunting method below.
10. The candidate gate below.
11. Same-source prior confirmations brought into this run, limited to fingerprint, title and root cause, plus peer-owned coverage IDs this hunter must not duplicate.
12. The agent's scratch path, agent ID, candidate cap (FULL-AUDIT.md, Budget reservations), whether walkthroughs are enabled and with which fixture actor, and the structured-result contract including the `confirmed` and `needs_owner_intent` branches of `report-schema.json` copied verbatim. Include the [severity guide](VALIDATION-AND-OWNER-REVIEW.md#separate-priority-from-certainty), or its absolute path and section with an instruction to read it before assigning severity.

The parent may write the parts every hunter shares (2, 3, 9, 10 and the contract from 12) once, to `<output-dir>/briefs/hunter-brief.md`, with the method, the gate and the contract copied verbatim and PRINCIPLES.md and `architecture.md` given by absolute path. The per-agent parts (4, 5, 6, 7, 8, 11, and the ID, scratch path and cap) go to `agents/<agent-id>/scratch/assigned-units.json`. The prompt then gives both absolute paths and tells the hunter to read them in full before starting. For agents that can read files, part 7 may list each block by file and heading with the skill directory's absolute path and an instruction to read every listed block in full. A block name without that instruction does not count as sending the block.

Scope sets what the hunter must cover. Units owned by peers or excluded stay with their owners. If a different capability, gate or rule appears, return it under `uncovered` so the parent creates a unit for the next wave.

#### Core hunting method: include in every hunter prompt

```text
## Intent-fit method

Your goal is to find where the implementation does not fit the product's intent for a
named actor, and the smallest change that restores the fit. Read source and git
history. Run the product only if walkthroughs are enabled for you, only on the
localhost servers the parent started or confirmed offline fixture harnesses,
only as your assigned fixture actor, and never in a way that sends email, takes payment, spends paid quota or touches a
deployed environment. Never edit the target. Write only in your scratch directory.

START FROM THE ACTOR AND THE TASK.
1. Name the actor, their role and their goal (P1). When the unit names an actor,
   walk only as that actor. Include the inferred actors in the register, and
   for an inferred actor with no derived_from, propose needs_owner_intent for
   any gap.
2. State the purpose and success condition from the intent register, with sources.
   For an agent or service, record its authority, available context and interface.
   For a technical requirement, state the invariant or limit and who depends on it.
   If the register entry rests only on the code under review, stop and report the
   unit as blocked with that reason (P4).
3. For each written rule that shapes the capability, read its origin and the scope
   the origin supports (P2, P3).

READ DOMAIN WORDS FROM THE TERM REGISTER.
A word for a record, event or action means what the term register says, not what
it usually means and not what the code's names suggest (P15). For a settled term,
use its definition and quote the case that covers your situation. For an open or
unconfirmed term, trace each sense; where the verdict differs between senses,
propose needs_owner_intent with a case as the question. When a word your verdict
depends on is not in the register and its use sites differ, do not choose a
meaning: return it under uncovered with a DOMAIN-TERMS.md class. A table, enum,
route, tool or file name shows what was built, not what it means (P4).

TRACE THE ACTOR THROUGH THE CODE.
Follow the actor from each entry surface through every gate, redirect, state write
and state read to the outcome. At every state the product can put them in, list the
actions they have, and check that one leads toward the goal or back to a working
state (P8). Check the prerequisites each gate demands and whether the actor can
obtain them from there (P9). Stop the flow midway at each step and check what the
leftover state does to the next attempt (P10). Read every failure branch for the
message and action the actor gets (P11).

VARY THE SITUATION.
Repeat the walk for situations the interface accepts: first visit and return,
expired or revoked access, role changed by someone else, plan lapsed or downgraded,
parent record archived or removed, empty and error responses, second tab or second
device, back and refresh, an actor who belongs to several organisations or none.
For technical and agent tasks, use the supported environment and vary interrupted
commands, retries after an unknown outcome, cancellation, resource limits and
missing permissions or context. Do not require a browser-only exit from an actor
whose task contract promises completion through a tool or command.

CHECK THE MODEL AGAINST THE PURPOSE.
For each state, status, mode, flag and branch on the path, name the task situation
or technical invariant it represents (P6). Use git log -S and git blame to find where it came from. When an
element exists to satisfy the wording of a rule, a memory, a fixture or the example
in an original request rather than the purpose, describe the excess and the smaller
shape that serves the purpose (P2, P3, P6, P7). Then check whether that element
creates states with no exit or forces other code to handle combinations with no
product meaning; link those effects to the same root cause.

COMPARE SURFACES.
For each piece of state on the path, compare every writer and reader. For each rule,
compare every path where its action can happen. Compare user-facing text with the
behaviour it describes (P12, P13).

DEPTH BOUND. Trace only paths that reach your assigned gate or that it depends on.
Stop a line of investigation once the fit is clear either way, and record it as a
covered, candidate or blocked disposition, or as an uncovered entry.

When a candidate reveals a reusable root cause, such as a rule applied by a shared
helper or a state used by many features, search your assigned units for other places
the same cause produces a gap. Consolidate the cause; establish each effect's actor
and situation separately. Return variants outside your units as uncovered.

USE THE NARROWEST EVIDENCE. A source trace decides most claims. Use history to show
where a rule or state came from. Use a walkthrough only when what the actor sees
decides the claim, stop at the first observed stuck state or contradiction, and save
notes or screenshots in scratch. Record the exact steps and fixture actor.
```

#### Candidate gate: include in every hunter prompt

```text
## Candidate gate

1. A candidate names the actor and goal, cites at least one intent source outside
   the code under review, and gives a complete repository-relative trace from
   entrypoint through transitions to the outcome.
2. A proposed confirmed record shows a reachable situation and its unmet task,
   violated requirement or demonstrated cost. For a lockout or dead end, check
   every exit the intent names; for other gaps, a working exit does not by itself
   refute incorrect results, excess machinery or a broken technical guarantee.
3. An overfit candidate names what the code was built from (the rule, memory,
   commit, example or misreading, or "not traceable" with what was searched), the
   excess, and the proportionate shape. If a stated need justifies the excess, it is
   not a candidate. The need counts only under the provenance test in P4; a
   bulk-accepted or unattributed decision that restates the rule does not.
4. If the deciding intent is ambiguous or the sources conflict, propose
   needs_owner_intent with the question and what each answer would require. Do not
   give it severity.
5. A style preference, a missing best practice, or a pattern that affects no actor
   and makes no change harder is not a candidate. A candidate disproved by source is
   not needs_owner_intent.
6. Use the same source-derived fingerprint for the same root cause in every state.
   It matches ^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$ and contains no line, wave, agent,
   severity or verdict.
7. Return an empty candidate array when nothing survives these gates.
8. served: false records the absence of a supported path; check whether sources
   require that path now before reporting underfit. A planned or unmerged fix does
   not remove a gap on the reviewed ref; cite it to avoid duplicate remediation.
9. Return at most your candidate cap, strongest first by severity and by how many
   actors each reaches. Put the rest under uncovered, with its fingerprint in
   fingerprint and a one-sentence claim in reason.
10. Name each domain term the verdict depends on and the register case or
   definition you used for it. A meaning taken from an identifier or from
   everyday usage is not intent. A verdict that depends on an open or
   unconfirmed term is needs_owner_intent.
```

## Structured hunter result

Write exactly one JSON object to `agents/<agent-id>/scratch/result.json` and nothing else in that file. Then reply with only the file path, the number of units by disposition, and one line per candidate (fingerprint, proposed verdict, fit, title). The parent reads and validates the file; a missing or malformed file is a failed result. The object has this shape:

```json
{
  "units": [
    {
      "coverage_id": "one assigned ID",
      "disposition": "covered|candidate|blocked",
      "reviewed_paths": ["repo/relative/path"],
      "checks": [
        {
          "agent_id": "owner of this check",
          "reviewed_paths": ["repo/relative/path owned by this check"],
          "invariant": "the principle and expectation checked, e.g. P8: an expired invitation offers a way to request a new one",
          "method": "source|history|local",
          "result": "what the source, history or walkthrough established",
          "artifact": "scratch-relative file for local, null otherwise"
        }
      ],
      "candidate_fingerprints": [],
      "unresolved": []
    }
  ],
  "candidates": [],
  "notes": ["concrete non-finding observation for the summary"],
  "uncovered": [
    {
      "surface": "...",
      "gate": "...",
      "capability": "...",
      "fit_class": "...",
      "starting_paths": ["repo/relative/path"],
      "fingerprint": "optional; set for a candidate held back by the cap",
      "reason": "why this needs its own coverage unit"
    }
  ]
}
```

Each `candidates` entry matches its `report-schema.json` branch except that it uses `proposed_verdict` in place of `verdict`:

- `proposed_verdict: "confirmed"`: every field the `confirmed` branch requires, plus `literal_source`, `excess` and `proportionate_shape` when `fit` is `overfit`. `reproduction` describes only what was already done.
- `proposed_verdict: "needs_owner_intent"`: every field that branch requires, with at least two `intent_candidates` and a `consequence_if_each` entry per answer. No severity, reproduction or remediation.

Every assigned coverage ID appears exactly once in `units`. A `covered` unit has an owner, nonempty paths and checks, no unresolved fact and no candidate. A `candidate` unit has the same evidence and is the only state that has fingerprints. A `blocked` unit has nonempty paths, checks and unresolved facts but no fingerprint. Paths are repository-relative. A trace with several entries starts at `entrypoint`, ends at `outcome`, and labels the steps between as `transition`.

## Parent consolidation and ledger update

The parent validates each unit result, maps it to exactly one assigned `coverage_id`, and updates only that unit. Reject duplicate or absent IDs, unsafe agent IDs, `source` or `history` checks with artifacts, and `local` checks whose file the parent has not copied into `agents/<agent_id>/artifacts/`. For `local` checks, the parent copies the cited scratch file as a regular file, rejecting links and directories, and rewrites the artifact path. Copy reviewed paths, checks, fingerprints and unresolved facts into the ledger. Keep each hunter's `notes` in a parent bookkeeping field; they inform recommendations during the owner session. A failed or malformed result leaves the unit `planned` for reassignment. Run `validate-coverage-ledger.cjs` after the update; an invalid ledger cannot drive another assignment.

Consolidate candidates by fingerprint and then by root cause. One root cause with several effects is one candidate with the strongest complete trace. An overfit element and the stuck state it causes share a fingerprint when removing the element would remove the stuck state. Independent causes get separate fingerprints. When hunters report the same root cause under different fingerprints, keep the fingerprint from the unit whose gate holds the fix; when both do, or neither does, keep the fingerprint that sorts first lexicographically. Record the dropped fingerprint in parent bookkeeping so later runs can match it.

## Outside reviews

The owner may ask other models or tools to review the target during a run, or bring their reports to it. An outside review is input to hunting, not a finding. Plan an outside review launched during the run as an adversarial review ([VALIDATION-AND-OWNER-REVIEW.md](VALIDATION-AND-OWNER-REVIEW.md), Plan the adversarial reviews).

- Save each report verbatim as `<output-dir>/recon/outside-<reviewer>.md`.
- The parent splits the report into claims. Each claim that names a path or behaviour becomes a candidate with the reviewer as its source, in the structured hunter result shape, with `method: source` until a verifier checks it. A claim without a path or a reachable situation goes to an existing or new ledger unit as a starting path for a hunter, not a candidate.
- Consolidate these candidates with the hunters' by fingerprint and root cause. When a reviewer and a hunter report the same root cause, keep the hunter's trace and note the reviewer in parent bookkeeping.
- Each candidate goes through Phase 3 like any other. The verifier receives the claim's trace and evidence without the reviewer's reading of the intent.
- A reviewer that only reads code never walks the target. A claim about what an actor sees stays at `method: source` until a walker checks it.

## Coverage-critic waves

Immediately after each hunter wave, spend the reserved invocation on a fresh `research` post-wave coverage critic, with its own agent directory. It receives [PRINCIPLES.md](PRINCIPLES.md), `architecture.md`, `intent-register.json`, `term-register.json`, the full ledger with block maps, current candidate fingerprints and states, and the prior-run gap summary. It reads source and history but does not run the target. It writes exactly this JSON to its `scratch/result.json`:

```json
{
  "missing_units": [
    {
      "surface": "...",
      "gate": "...",
      "capability": "...",
      "fit_class": "...",
      "starting_paths": ["repo/relative/path"],
      "selected_companion_blocks": ["FILE.md#section"],
      "excluded_blocks": [{"block": "FILE.md#section", "reason": "..."}],
      "reason": "source-backed coverage gap"
    }
  ],
  "reassign_ids": ["existing-id-that-did-not-close"],
  "resolved_prior_leads": ["fingerprint"],
  "stop": false
}
```

The critic checks for: capabilities in the register with no unit, including unsupported actors whose tasks are required now; actors and technical tasks the sources or implementation imply that the register neither names nor infers; in an audience-scoped run, surfaces an audience actor reaches with no unit for that actor, and actions by other actors that change an audience actor's state with no unit; written rules in the register with no Instructions-and-memory unit; status enums and core entities with no Data-model unit; lifecycles the source shows that `state-machines.json` lacks, and machines with no State-machines unit; words for records, events or actions that carry different qualifiers, translations or actors across surfaces and have no entry in `term-register.json`, and terms with no Domain-terms unit; units closed as `covered` whose verdict depends on an open or unconfirmed term; gates and multi-step flows with no unit for the lifecycle cases that apply; selected companion classes without a unit; unjustified exclusions; units closed without paths or checks; units closed with an intent that rests only on the code under review; and prior `needs_owner_intent` or changed-source gaps no unit addresses. It proposes coverage units only and leaves candidate gaps to hunters. `stop` is `true` only when it proposes nothing.

The parent rejects proposed units outside scope or the execution boundary, derives canonical IDs, deduplicates against current units, and fails rather than merging an ID collision. For each legitimate `reassign_id` with live evidence, append the unit's terminal record to `attempts` with the critic's reason, increment `wave`, and give the next attempt a fresh owner and empty live evidence. In `standard` and `deep`, when the post-wave critic proposes nothing and no `planned` units remain, spend the reserved invocation on a distinct final-clean critic. Coverage is complete only when that critic also proposes nothing. If it finds work, queue it and repeat.

A `quick` run has exactly one hunter wave and one critic pass; accepted `missing_units` and reassignments are recorded as `deferred` with reason `quick_profile_final_critic`. In a scoped run, critic-noticed gaps outside scope are recorded as `out_of_scope`. If time or budget forces an early stop, mark untouched units `deferred`, preserve the reason, and disclose the gap.
