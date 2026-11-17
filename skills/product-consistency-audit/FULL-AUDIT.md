# Full Audit Runbook

Load this file only for an explicitly requested full audit or report artifacts. Guidance mode uses SKILL.md, the relevant principles and domain references instead.

## Required evidence of execution

A `quick`, `standard` or `deep` run is an artifact-producing workflow. Before launching it, confirm that the parent can write the run files, maintain the ledger, execute the validators and obtain the independent reviewers required by its profile. If a capability is unavailable, explain the limit; provide bounded guidance or record an incomplete audit, never a completed profile in prose alone.

The parent reads all of [PRINCIPLES.md](PRINCIPLES.md), then uses the phase references below as work reaches them. Before running the target, read [WALKTHROUGHS.md](WALKTHROUGHS.md). Prior artifacts using `person` or `people` require the explicit migration in [RECORD-FORMAT.md](RECORD-FORMAT.md) before reuse.

## Platform terminology

This skill is agent-neutral:

- **Parent** is the agent that coordinates the run and owns shared state.
- **Task tool** is the platform's delegation or sub-agent mechanism.
- **`research` agent** is a delegated agent for focused source reading and factual verification. It does not run the target.
- **`general` agent** is a delegated agent for broad investigation and bounded local walkthroughs.
- **Continuing an agent** means sending a follow-up message to an agent that has already returned, so it keeps its context. A continuation does not count as a new invocation against the budget.

Use equivalent platform capabilities while preserving the role, write-isolation, prompt and independence boundaries.

### Role assignment

Agents differ in what they can do and what the owner allows them to do. Before delegation, the parent records `agent_roles` in `run-metadata.json`, with the model or agent type for each role:

- **source readers**: reconnaissance, hunters without walkthroughs, critics and verifiers. They read source and history and never run the target.
- **walkers**: hunters and verifiers that run walkthroughs. Only an agent with a browser or terminal automation tool fills this role.
- **outside reviewers**: other models or tools the owner asked to review the target (see Outside reviews in [HUNTING.md](HUNTING.md)).

Follow the owner's instructions and memories about which models do which work, such as a model that may read code but must not drive a browser. Never send target content to an outside model or service the owner has not named.

## Full audit setup

In full audit mode, resolve these values before reconnaissance:

- **Skill directory**: the absolute directory containing `SKILL.md`.
- **Target**: the absolute repository root under review.
- **Repo name**: a stable repository identifier from the directory or local Git remote.
- **Output directory**: a new writable directory outside the target, defaulting to `~/product-consistency-audit/<repo-name>/run-<N>`, where `<N>` is the next unused integer. Use a directory inside the target only when the user selects it and version control ignores the whole directory.
- **Source ref**: the reviewed commit and whether the worktree is dirty. For a dirty worktree, record the changed paths as `dirty_paths` in `run-metadata.json` and audit the working copy as it is. A finding whose trace includes a dirty path says so in `evidence`, and the owner session asks whether those edits are the plan before recommending a fix that builds on them.

### Write isolation

The parent creates and is the only writer of shared run files:

- `run-metadata.json`
- `architecture.md`
- `intent-register.json`
- `state-machines.json`
- `coverage-ledger.json`
- `findings.json`
- `SUMMARY.md`
- `decision-tree.json`
- `decisions.json`
- `DECISIONS.md`
- `recon/`, holding each reconnaissance report verbatim as `recon/<agent>.md`
- `briefs/`, holding shared hunter and verifier briefs ([HUNTING.md](HUNTING.md), [VALIDATION-AND-OWNER-REVIEW.md](VALIDATION-AND-OWNER-REVIEW.md))

Each hunter or verifier receives a unique root under `<output-dir>/agents/<agent-id>/` with `scratch/` and `artifacts/` directories. Agent IDs match `^[a-z0-9][a-z0-9_-]{0,63}$` and must not equal a Windows device name (`con`, `prn`, `aux`, `nul`, `com1` to `com9`, `lpt1` to `lpt9`). A verifier using the file-order mechanism also has a parent-written `sealed/` directory. An agent writes only inside its own `scratch/`, apart from input files the parent places there (such as `assigned-units.json`), which the agent reads and never changes. Every delegated agent except reconnaissance writes its result to `agents/<agent-id>/scratch/result.json` and replies with only the path and a short summary; the parent reads the file, and a missing or malformed file is a failed result. Reconnaissance agents reply with their report, which the parent saves under `recon/`. After the agent finishes, the parent copies the walkthrough notes or screenshots it will cite into that agent's `artifacts/`, as regular files only. Agents never write shared files, target files, or another agent's directory.

Before delegation, the parent writes `run-metadata.json` with at least `run_id`, `repo`, `target`, `source_ref`, `profile`, `scope_paths`, `budget` (null if unset), `artifact_format: "actors-v2"`, `execution_policy: "read-only-source-history-and-local-walkthrough"`, `walkthrough_capability` (enabled or blocked, with the reason), selected companion files, prior-run paths, shared-file owners, and `run_status: "in_progress"`.

## Full audit planning

### Coverage and prior runs

Report only the coverage established by this run. Build a deterministic coverage plan before hunting and update it after every agent result. [RECONNAISSANCE.md](RECONNAISSANCE.md) defines the coverage units and [HUNTING.md](HUNTING.md) defines coverage-critic waves. The parent alone updates the ledger.

If prior runs exist, read every compatible `coverage-ledger.json`, `findings.json` and `intent-register.json` before planning:

1. Compare the relevant current source and instruction files with each prior record and unit. A prior source ref alone is not evidence that a path is unchanged. A changed instruction file or memory counts as changed source for every unit that cites it.
2. Bring a prior `confirmed` record into the current candidate set only when its source, intent sources and conditions are unchanged. Link it to a current `planned` unit, exclude only that root cause from hunters, and send it through current verification.
3. When relevant source or intent sources for a prior `confirmed` record changed, create a planned revalidation unit and do not exclude that root cause from hunting.
4. Read prior `decisions.json`. A recorded decision is an intent source with the provenance its `answered_as` field gives under P4. At `owner_statement` rank it outranks every written source and clears a later candidate on the same point; a finding the owner accepted as intended at that rank is not reported again unless its source changed. A `bulk_accepted` answer has bulk rank and is asked again when a candidate depends on it. Prior `needs_owner_intent` records without an answer become current work with the same fingerprint.
5. Prior `deferred`, `blocked`, `out_of_scope` and changed-source units become current work. A prior `rejected` record suppresses only its unchanged claim, never coverage of its unit.
6. A prior `quick` or scoped ledger contributes only its recorded evidence and gaps, never an implied "the rest is fine."

If no prior ledger exists, say so in the final coverage statement.

### Run profiles and scope

Pick a profile from the user's request or propose one from the target's size. Record it in `run-metadata.json` and state it in `SUMMARY.md`. The default is `standard`.

- **`quick`**: coarsen units to surface × gate × fit class with the fixed capability value `profile/quick/all-in-scope-capabilities`. A single hunter wave is followed by a final coverage critic. Each verifier covers both validation passes and may take up to three candidates whose root causes are independent of each other. Critic discoveries are recorded as `deferred`.
- **`standard`**: the workflow as written.
- **`deep`**: split units per capability and lifecycle mode (first visit, returning, expired, role changed, downgraded, removed), run critic waves to a clean pass, keep candidate validation and record verification as separate fresh agents, and give prior covered same-source units a second pass.

A **scoped run** audits named paths, named capabilities, a companion domain, or the diff between two refs. Seed units only for in-scope surfaces and record discovered excluded surfaces as `out_of_scope`. A scoped or `quick` run presents itself as partial coverage.

An **audience-scoped run** audits the product as one or more kinds of actors the owner names: a role, a user type or a target audience, such as invited colleagues, buyers or actors on a free plan. Record them as `audience` in `run-metadata.json`.

- Reconnaissance maps each audience term to actors in the intent register, named or inferred. An audience that matches nobody, or only actors with `served: false`, is noted in `architecture.md`. Check whether sources require support now; ask the owner only if that intent remains unclear.
- The ledger gets a unit per actor, using the optional `actor` dimension, for every surface that actor reaches and every gate and state they pass through. It also covers actions by other actors that change their state, such as an admin removing them, a plan lapsing on the owner's account, or a shared record being deleted. Surfaces only other actors reach are `out_of_scope`.
- With several audiences, a surface they share gets a unit for each actor, because the same screen can let one actor through and lock another out.
- Hunters walk as the unit's actor, verifiers confirm that actor can reach the entrypoint, and the summary and decision tree group findings by actor.

An audience scope combines with any profile and with the other scopes.

A **state machine run** finds every lifecycle in the target, explicit or implicit, and recommends a shape for each one that has a gap. It is a scoped run over [STATE-MACHINES.md](STATE-MACHINES.md) and [DATA-MODEL-AND-STATE.md](DATA-MODEL-AND-STATE.md), started by requests such as "find the implicit state machines in this codebase".

- Reconnaissance runs as usual; agent 1d's machine inventory is the run's main input, and the parent may split it across several agents for a target with many runtimes or apps. The parent writes `state-machines.json` and validates it.
- The ledger gets a unit per machine for each STATE-MACHINES.md class that its record makes plausible, plus the DATA-MODEL-AND-STATE.md classes the record shows. Flows that touch no machine are `out_of_scope`.
- Every confirmed record recommends a shape for the whole machine with `remediation.experience` and `remediation.change_safety` (STATE-MACHINES.md). A machine with no gap still appears in the summary's machine list, with no recommendation.
- The decision tree puts each machine's recommended shape to the owner as one decision, with the findings for that machine below it.

A state machine run combines with any profile and with an audience scope.

A **fix verification run** checks fixes made after an earlier run. It starts from the prior `findings.json`, `decisions.json` and the diff between the prior source ref and the current one, and is recorded as `scope: "fix_verification"` with `prior_run` in `run-metadata.json`.

- The ledger gets one unit per prior `confirmed` record the owner decided to fix, with the record's entrypoint as the surface. Each unit also cites the changed paths that touch the record's trace.
- A fresh verifier re-runs the record's own reproduction at the record's method: source trace, history or walkthrough. It returns `fixed`, `not_fixed` or `changed`. A `changed` result means the trace now ends somewhere new, and that outcome becomes a new candidate.
- One coverage critic reads the diff for surfaces it touches that no unit covers, such as a new state, a new writer or a new gate. Each one becomes a `planned` unit for a normal hunter.
- The summary lists each prior fingerprint with its result. The owner session asks only about `not_fixed` records and new confirmed records.

A fix verification run is partial coverage and says so. It costs about one verifier per fixed record plus the critic.

Profiles change breadth and redundancy. The evidence bar is the same in every profile.

### Budget reservations

When a budget is set, record the maximum agent invocations and a list of reservations in `run-metadata.json`. Each reservation names its job and whether it is reserved, running or spent. A new agent consumes one invocation; continuing an existing agent does not. Never exceed the limit or spend a verification reservation on hunting.

Before reconnaissance, reserve its five calls, the next hunter assignment, the mandatory critics (one in `quick`, a post-wave and a final-clean critic otherwise), and review for one candidate. Review reserves one fresh verifier in `quick` or two in `standard` and `deep`. If these cannot fit, record `incomplete` with reason `budget_cannot_fund_reconnaissance_and_reserves` and offer a smaller run or guidance; do not launch an unfundable audit.

Before each hunter assignment:

1. Keep critic reservations and review reservations for prior and already pending candidates intact.
2. Reserve review for each candidate the hunter may return. Give the hunter that count as its candidate cap; the default is one. Reserve candidates individually even when a quick verifier may later batch them.
3. Launch only when both the hunter and its review reservations fit. Otherwise mark its units `deferred` with reason `budget_cannot_reserve_critics_and_validation`.

Release unused reservations after the result, and spend the reserved calls on actual candidates. Extra leads stay in the ledger as deferred work. Unexpected re-review or another wave requires fresh reservations; if they cannot fit, stop expanding coverage. Keep unverified candidates out of `findings.json`, record `incomplete` and the reason, and disclose the remaining work. No percentage allocation or speculative batching is needed.

## Full audit workflow

In full audit mode, follow all six phases in order:

1. **Reconnaissance**: map actors, goals, intent sources and their origins, gates, cross-surface state, the data model and local walkthrough capability; write `architecture.md`, `intent-register.json`, `state-machines.json` and the initial ledger with [RECONNAISSANCE.md](RECONNAISSANCE.md), and validate the register with `validate-intent-register.cjs` and the machine inventory with `validate-state-machines.cjs`. Before hunting, resolve material uncertainty in the actor, authority and organisation map (RECONNAISSANCE.md, Actors and organisation check).
2. **Coverage-led hunting waves**: assign isolated hunters from the ledger and collect structured results with [HUNTING.md](HUNTING.md), [FIT-CLASSES.md](FIT-CLASSES.md) and the selected companions.
3. **Candidate validation**: give every candidate to a fresh verifier that re-derives the intent before reading the hunter's wording, as defined in [VALIDATION-AND-OWNER-REVIEW.md](VALIDATION-AND-OWNER-REVIEW.md).
4. **Structured output**: write final `confirmed`, `needs_owner_intent` and `rejected` records to `findings.json`; validate with `report-schema.json` and `validate-findings.cjs`, and validate the ledger with `validate-coverage-ledger.cjs`.
5. **Independent record verification**: fresh agents verify final records and reconcile corrections.
6. **Owner review**: write a short `SUMMARY.md`, turn the verified records into a decision tree, and work through it with the owner one decision at a time, each with a recommended answer, until every decision is made. Record the answers in `decisions.json` and `DECISIONS.md`.

The run ends in one of three states: the owner session is finished and its decisions are recorded; the summary and decision tree are written and the session is pending because the owner is not available; or `run_status: "incomplete"` is recorded with its reason and the gap is disclosed in the summary. Every validator passes in the first two. If a phase cannot finish, preserve its artifacts and record the precise incomplete state; do not imply completion.

## Completion evidence

Run all four validators against the actual final artifacts and record each command and exit status in `run-metadata.json` under `validation_checks`:

```sh
node <skill-dir>/validate-intent-register.cjs <output-dir>/intent-register.json
node <skill-dir>/validate-state-machines.cjs <output-dir>/state-machines.json
node <skill-dir>/validate-coverage-ledger.cjs <output-dir>/coverage-ledger.json
node <skill-dir>/validate-findings.cjs <output-dir>/findings.json
```

Only report the audit as complete after successful validation and the required independent dispositions. Record owner review separately as `owner_review_status: "pending"` or `"complete"`. A run with deferred coverage says it is partial even when every reported finding is verified. Validator success proves record structure, not that the intent is correct or the target works. The summary links the artifacts and states what was actually traced, executed and independently checked.
