# Hunting

### Phase 2: Run coverage-led hunting waves

The parent assigns `planned` ledger units to `general` agents. Use enough focused hunters to cover the units without combining unrelated capabilities. One hunter may own closely related units of a single capability; no unit may be silently unassigned because of an agent-count limit. A unit the budget cannot reach is explicitly `deferred` with reason `budget_cannot_reserve_critics_and_validation`.

When a budget or profile caps hunter count, assign units in priority order and record the ordering rationale in the ledger. Rank by: (1) capabilities on the paths most people take first (sign-up, sign-in, invitation, first run, the product's core task) before secondary ones; (2) gates that can stop a person entirely before ones that slow them down; (3) data-model units and written rules that the most code depends on; (4) prior-run gaps, revalidation targets and changed source before same-source re-passes. Ties break lexicographically by `coverage_id`.

Before launch, the parent changes assigned units to `in_progress`, sets a lowercase `agent_id`, and creates that agent's `scratch/` and `artifacts/`. Hunters read source, history and parent-provided context, may run walkthroughs only when the run's walkthrough capability is enabled, write only to their own `scratch/`, and return one structured result. They never edit the target or any shared run file.

## Required hunter prompt

Every hunter prompt contains these parts in this order:

1. A two-sentence role preamble: the hunter's goal is to find source-grounded gaps between product intent and implementation in its assigned units, and it must write exactly one JSON object matching the structured-result contract at the end of the prompt.
2. [PRINCIPLES.md](PRINCIPLES.md), verbatim or by absolute path with an instruction to read it in full.
3. `architecture.md`, verbatim or by absolute path with the same instruction.
4. The intent register entries for the assigned capabilities, verbatim.
5. Assigned coverage IDs, capability, gate, starting paths, and each unit's block map from `coverage-ledger.json`.
6. The selected blocks copied verbatim: each ordinary fit-class block from [FIT-CLASSES.md](FIT-CLASSES.md), and from each selected companion its `Core discipline`, each chosen class subsection, `Universal moves` and `Validation rules`. Never send block names alone.
7. Excluded blocks, each with its reason.
8. The core hunting method below.
9. The candidate gate below.
10. Same-source prior confirmations brought into this run, limited to fingerprint, title and root cause, plus peer-owned coverage IDs this hunter must not duplicate.
11. The agent's scratch path, agent ID, candidate cap (SKILL.md, Cost budget), whether walkthroughs are enabled and with which fixture person, and the structured-result contract including the `confirmed` and `needs_owner_intent` branches of `report-schema.json` copied verbatim.

The parent may write the parts every hunter shares (2, 3, 8, 9 and the contract from 11) once, to `<output-dir>/briefs/hunter-brief.md`, with the method, the gate and the contract copied verbatim and PRINCIPLES.md and `architecture.md` given by absolute path. The per-agent parts (4, 5, 6, 7, 10, and the ID, scratch path and cap) go to `agents/<agent-id>/scratch/assigned-units.json`. The prompt then gives both absolute paths and tells the hunter to read them in full before starting. For agents that can read files, part 6 may list each block by file and heading with the skill directory's absolute path and an instruction to read every listed block in full. A block name without that instruction does not count as sending the block.

Scope sets what the hunter must cover. Units owned by peers or excluded stay with their owners. If a different capability, gate or rule appears, return it under `uncovered` so the parent creates a unit for the next wave.

#### Core hunting method: include in every hunter prompt

```text
## Intent-fit method

Your goal is to find where the implementation does not fit the product's intent for a
named person, and the smallest change that restores the fit. Read source and git
history. Run the product only if walkthroughs are enabled for you, only on the
localhost servers the parent started, only as your assigned fixture person, and
never in a way that sends email, takes payment, spends paid quota or touches a
deployed environment. Never edit the target. Write only in your scratch directory.

START FROM THE PERSON AND THE PURPOSE.
1. Name the person, their role and their goal (P1). When the unit names a person,
   walk only as that person. Include the inferred people in the register, and
   for an inferred person with no derived_from, propose needs_owner_intent for
   any gap.
2. State the purpose of the capability from the intent register, with its sources.
   If the register entry rests only on the code under review, stop and report the
   unit as blocked with that reason (P4).
3. For each written rule that shapes the capability, read its origin and the scope
   the origin supports (P2, P3).

WALK THE PERSON THROUGH THE CODE.
Follow the person from each entry surface through every gate, redirect, state write
and state read to the outcome. At every state the product can put them in, list the
actions they have, and check that one leads toward the goal or back to a working
state (P8). Check the prerequisites each gate demands and whether the person can
obtain them from there (P9). Stop the flow midway at each step and check what the
leftover state does to the next attempt (P10). Read every failure branch for the
message and action the person gets (P11).

VARY THE SITUATION.
Repeat the walk for situations the interface accepts: first visit and return,
expired or revoked access, role changed by someone else, plan lapsed or downgraded,
parent record archived or removed, empty and error responses, second tab or second
device, back and refresh, a person who belongs to several organisations or none.

CHECK THE MODEL AGAINST THE PURPOSE.
For each state, status, mode, flag and branch on the path, name the person situation
it represents (P6). Use git log -S and git blame to find where it came from. When an
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
the same cause produces a gap. Consolidate the cause; establish each effect's person
and situation separately. Return variants outside your units as uncovered.

USE THE NARROWEST EVIDENCE. A source trace decides most claims. Use history to show
where a rule or state came from. Use a walkthrough only when what the person sees
decides the claim, stop at the first observed stuck state or contradiction, and save
notes or screenshots in scratch. Record the exact steps and fixture person.
```

#### Candidate gate: include in every hunter prompt

```text
## Candidate gate

1. A candidate names the person and goal, cites at least one intent source outside
   the code under review, and gives a complete repository-relative trace from
   entrypoint through transitions to the outcome.
2. A proposed confirmed record shows a reachable situation, what the person can and
   cannot do there, and that no exit the intent names exists.
3. An overfit candidate names what the code was built from (the rule, memory,
   commit, example or misreading, or "not traceable" with what was searched), the
   excess, and the proportionate shape. If a stated need justifies the excess, it is
   not a candidate. The need counts only under the provenance test in P4; a
   bulk-accepted or unattributed decision that restates the rule does not.
4. If the deciding intent is ambiguous or the sources conflict, propose
   needs_owner_intent with the question and what each answer would require. Do not
   give it severity.
5. A style preference, a missing best practice, or a pattern that affects no person
   and makes no change harder is not a candidate. A candidate disproved by source is
   not needs_owner_intent.
6. Use the same source-derived fingerprint for the same root cause in every state.
   It matches ^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$ and contains no line, wave, agent,
   severity or verdict.
7. Return an empty candidate array when nothing survives these gates.
8. A person the register marks served: false has no missing-surface finding. A
   difference that a decided_not_on_ref entry already removes is not a candidate;
   cite the entry in notes.
9. Return at most your candidate cap, strongest first by severity and by how many
   people each reaches. Put the rest under uncovered, with its fingerprint in
   fingerprint and a one-sentence claim in reason.
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

## Coverage-critic waves

Immediately after each hunter wave, spend the reserved invocation on a fresh `research` post-wave coverage critic, with its own agent directory. It receives [PRINCIPLES.md](PRINCIPLES.md), `architecture.md`, `intent-register.json`, the full ledger with block maps, current candidate fingerprints and states, and the prior-run gap summary. It reads source and history but does not run the target. It writes exactly this JSON to its `scratch/result.json`:

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

The critic checks for: capabilities in the register with no unit, except those whose people are all `served: false`; people the schema, roles or account states imply that the register neither names nor infers; in an audience-scoped run, surfaces an audience person reaches with no unit for that person, and actions by other people that change an audience person's state with no unit; written rules in the register with no Instructions-and-memory unit; status enums and core entities with no Data-model unit; gates and multi-step flows with no unit for the lifecycle cases that apply; selected companion classes without a unit; unjustified exclusions; units closed without paths or checks; units closed with an intent that rests only on the code under review; and prior `needs_owner_intent` or changed-source gaps no unit addresses. It proposes coverage units only and leaves candidate gaps to hunters. `stop` is `true` only when it proposes nothing.

The parent rejects proposed units outside scope or the execution boundary, derives canonical IDs, deduplicates against current units, and fails rather than merging an ID collision. For each legitimate `reassign_id` with live evidence, append the unit's terminal record to `attempts` with the critic's reason, increment `wave`, and give the next attempt a fresh owner and empty live evidence. In `standard` and `deep`, when the post-wave critic proposes nothing and no `planned` units remain, spend the reserved invocation on a distinct final-clean critic. Coverage is complete only when that critic also proposes nothing. If it finds work, queue it and repeat.

A `quick` run has exactly one hunter wave and one critic pass; accepted `missing_units` and reassignments are recorded as `deferred` with reason `quick_profile_final_critic`. In a scoped run, critic-noticed gaps outside scope are recorded as `out_of_scope`. If time or budget forces an early stop, mark untouched units `deferred`, preserve the reason, and disclose the gap.
