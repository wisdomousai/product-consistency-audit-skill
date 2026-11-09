---
name: product-consistency-audit
description: Audits a codebase for gaps between what the product is for and what was built. Infers each capability's intent from sources outside the code, then finds underfit (people locked out, stuck, looping or left without a next step), overfit (instructions, memories or examples taken literally and built into states, tables, flags and guards the purpose never needed) and inconsistency (surfaces that disagree, rules enforced on some paths and skipped on others, copy that describes behaviour the product lacks). Ends with a short grilling session that puts the resulting decisions to the owner in rounds, each with a recommended answer. Use for product consistency questions, intent reviews of a flow or data model, or a full audit. Run the complete workflow only for explicit full-audit requests or requested report artifacts.
---

# Product Consistency Audit

Find places where the implementation does not fit the product's intent, then put the decisions that follow to the owner, one round of questions at a time, each with a recommended answer backed by the evidence, the person affected, the source of the intent, and the smallest change that restores the fit. This is a read-first workflow. A candidate without a named person, a cited intent and a reachable situation is not a confirmed finding.

The audit hunts three families of gap:

- **Underfit**: a reachable case where the intent is not met. A person is locked out, stuck in a state with no way forward or back, sent in a loop, or left with an error they cannot act on.
- **Overfit**: code built from a literal reading of an instruction, memory, example or misunderstanding that goes well past what the product needs. In agent-written codebases a single correction often becomes statuses, tables, modes, flags, guards and branches that model the wording of the correction instead of the problem behind it. The resulting states are awkward for every feature that touches them, and are often where people get stuck.
- **Inconsistency**: surfaces or parallel implementations that disagree about the same state or rule, and words that describe behaviour the product does not have.

[PRINCIPLES.md](PRINCIPLES.md) defines the principles every phase works from. Read it before anything else in this skill.

## Operating modes

This skill is guidance by default. Loading it does not authorize the complete workflow or file creation.

- **Guidance mode**: for questions about a single flow, rule, data model, finding or kind of person, use only the relevant parts of this skill. Do not run all six phases, create an output directory, or write audit artifacts. Focused agents may be launched; they return results to the current task.
- **Full audit mode**: use the complete workflow when the user explicitly asks to audit a codebase for product consistency or intent fit, asks for a full or end-to-end review, or requests report artifacts. Run all six phases and write the files defined below.

If the request could mean either mode, ask a focused question before creating files or starting the complete workflow.

## Platform terminology

This skill is agent-neutral:

- **Parent** is the agent that coordinates the run and owns shared state.
- **Task tool** is the platform's delegation or sub-agent mechanism.
- **`research` agent** is a delegated agent for focused source reading and factual verification. It does not run the target.
- **`general` agent** is a delegated agent for broad investigation and bounded local walkthroughs.
- **Continuing an agent** means sending a follow-up message to an agent that has already returned, so it keeps its context. A continuation does not count as a new invocation against the budget.

Use equivalent platform capabilities while preserving the role, write-isolation, prompt and independence boundaries.

## Execution boundary

These rules apply in both modes. The target is the owner's product, so the boundary protects real people, money and data rather than the host.

- Source and git history are read-only. Use `git log`, `git show` and `git blame`; never check out, reset, stash or change branches in the target.
- Run the target only on localhost servers the parent starts, using the target's own documented local setup. Reconnaissance finds how to sign in as fixture people without real accounts, which data store is disposable, and which settings keep model, email, payment, storage and identity providers on fakes or local outboxes. It also lists every tool (CLI, MCP server, desktop app, SDK, script) that falls back to a production or hosted URL when an origin setting is unset.
- Before any walkthrough the parent confirms those settings by name, without printing secret values, including the origin setting of every tool that defaults to a hosted URL. If a setting cannot be confirmed, walkthroughs are blocked for the run and evidence stays `source` or `history`. A tool whose origin cannot be pinned to localhost is never run.
- Agent memories and session transcripts kept outside the repository, such as per-user project memory directories, are read only when the owner names them or agrees to their use, and are never modified.
- Never contact production or preview deployments, use real accounts or credentials, send email, take payments, spend paid model or API quota, create or delete cloud database branches or projects, or pull environment files from a hosting provider.
- Never edit target source, configuration or environment files, and never add test files to the target. Walkthrough scripts, notes and screenshots live in the agent's `scratch/` directory.
- The parent serializes walkthroughs that share a data store and gives each walkthrough its own fixture person.
- A state that cannot be built locally, such as an expired third-party session or a lapsed paid subscription, keeps the finding at `method: source`. It is not upgraded by assumption.

## Full audit setup

In full audit mode, resolve these values before reconnaissance:

- **Skill directory**: the absolute directory containing this `SKILL.md`.
- **Target**: the absolute repository root under review.
- **Repo name**: a stable repository identifier from the directory or local Git remote.
- **Output directory**: a new writable directory outside the target, defaulting to `~/product-consistency-audit/<repo-name>/run-<N>`, where `<N>` is the next unused integer. Use a directory inside the target only when the user selects it and version control ignores the whole directory.
- **Source ref**: the reviewed commit and whether the worktree is dirty. For a dirty worktree, record the changed paths as `dirty_paths` in `run-metadata.json` and audit the working copy as it is. A finding whose trace includes a dirty path says so in `evidence`, and the owner session asks whether those edits are the plan before recommending a fix that builds on them.

### Write isolation

The parent creates and is the only writer of shared run files:

- `run-metadata.json`
- `architecture.md`
- `intent-register.json`
- `coverage-ledger.json`
- `findings.json`
- `SUMMARY.md`
- `decision-tree.json`
- `decisions.json`
- `DECISIONS.md`
- `recon/`, holding each reconnaissance report verbatim as `recon/<agent>.md`
- `briefs/`, holding shared hunter and verifier briefs ([HUNTING.md](HUNTING.md), [VALIDATION-AND-OWNER-REVIEW.md](VALIDATION-AND-OWNER-REVIEW.md))

Each hunter or verifier receives a unique root under `<output-dir>/agents/<agent-id>/` with `scratch/` and `artifacts/` directories. Agent IDs match `^[a-z0-9][a-z0-9_-]{0,63}$` and must not equal a Windows device name (`con`, `prn`, `aux`, `nul`, `com1` to `com9`, `lpt1` to `lpt9`). A verifier using the file-order mechanism also has a parent-written `sealed/` directory. An agent writes only inside its own `scratch/`, apart from input files the parent places there (such as `assigned-units.json`), which the agent reads and never changes. Every delegated agent except reconnaissance writes its result to `agents/<agent-id>/scratch/result.json` and replies with only the path and a short summary; the parent reads the file, and a missing or malformed file is a failed result. Reconnaissance agents reply with their report, which the parent saves under `recon/`. After the agent finishes, the parent copies the walkthrough notes or screenshots it will cite into that agent's `artifacts/`, as regular files only. Agents never write shared files, target files, or another agent's directory.

Before delegation, the parent writes `run-metadata.json` with at least `run_id`, `repo`, `target`, `source_ref`, `profile`, `scope_paths`, `budget` (null if unset), `execution_policy: "read-only-source-history-and-local-walkthrough"`, `walkthrough_capability` (enabled or blocked, with the reason), selected companion files, prior-run paths, shared-file owners, and `run_status: "in_progress"`.

## Full audit planning

### Coverage and prior runs

No single pass is complete. Build a deterministic coverage plan before hunting and update it after every agent result. [RECONNAISSANCE.md](RECONNAISSANCE.md) defines the coverage units and [HUNTING.md](HUNTING.md) defines coverage-critic waves. The parent alone updates the ledger.

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

An **audience-scoped run** audits the product as one or more kinds of people the owner names: a role, a user type or a target audience, such as invited colleagues, buyers or people on a free plan. Record them as `audience` in `run-metadata.json`.

- Reconnaissance maps each audience term to people in the intent register, named or inferred. An audience that matches nobody, or only people with `served: false`, is noted in `architecture.md` and becomes the first owner question, because the product may not mean to serve it.
- The ledger gets a unit per person, using the optional `person` dimension, for every surface that person reaches and every gate and state they pass through. It also covers actions by other people that change their state, such as an admin removing them, a plan lapsing on the owner's account, or a shared record being deleted. Surfaces only other people reach are `out_of_scope`.
- With several audiences, a surface they share gets a unit for each person, because the same screen can let one person through and lock another out.
- Hunters walk as the unit's person, verifiers confirm that person can reach the entrypoint, and the summary and decision tree group findings by person.

An audience scope combines with any profile and with the other scopes.

Profiles change breadth and redundancy. The evidence bar is the same in every profile.

#### Cost budget

Each ledger unit costs roughly a hunter assignment, and each surviving candidate costs a verifier assignment or two, depending on profile. When the user sets a budget, or the parent proposes one for a large target, record `budget` in `run-metadata.json` as a maximum number of agent invocations across all phases.

Before launching reconnaissance, reserve the five baseline reconnaissance calls, the mandatory critics (a single critic for `quick`; a post-wave critic plus a final-clean critic for `standard` and `deep`), and at least a verifier. If the budget cannot fund that minimum, launch nothing: ask for a larger budget, narrower scope or different profile, and if the request stays the same set `run_status: "incomplete"` with `incomplete_reason: "budget_cannot_fund_reconnaissance_and_reserves"`.

Spend in this order: reserve critics and a validation reserve (about 30% of the balance after critics) before each hunter wave; assign hunters in priority order until the hunting allowance is spent; mark units the budget cannot reach as `deferred` with reason `budget_cannot_reserve_critics_and_validation`. If validation runs out, stop hunting, validate candidates in fingerprint order while budget remains, set `run_status: "incomplete"` with `incomplete_reason: "validation_budget_exhausted"`, and keep every unvalidated candidate in the ledger only. Never exceed a user-set budget silently.

Cap candidates per hunter so validation can fund every candidate it receives. Subtract the verifier invocations that prior records brought into the run will need from the validation reserve. Divide the rest by the verifier invocations one candidate costs in the profile (two in `standard` and `deep`, one in `quick`), multiply by the candidates a verifier may take (one, or at most three in `quick`, an upper bound that holds only when that many independent root causes turn up), divide by the number of hunters in the wave, and round down. When the cap comes out below one, assign fewer hunters and defer the remaining units. Hunters return candidates beyond the cap under `uncovered`, and the parent seeds them as `deferred` units with reason `budget_cannot_reserve_critics_and_validation`.

## Core principles in practice

[PRINCIPLES.md](PRINCIPLES.md) holds the full text. These rules apply them to evidence.

### Candidate evidence

For every candidate, name the person and their goal (P1), the intent and the sources it comes from (P4), the gate, state or model element involved, the reachable situation, and what the person can or cannot do there. Do not report a style preference, a missing best practice, or a pattern that affects no person and makes no change harder.

### Read rules for their purpose

Treat agent instruction files, memory files, plan files, tickets and code comments as records of decisions. Find the problem each was written to solve and the scope that problem supports (P2, P3). Measure the code against the purpose. When the code follows the wording into places the purpose never reached, that is the overfit finding, and the instruction itself is part of the remediation.

### Keep intent independent of the implementation

An intent drawn only from the code under review is circular (P4). When sources conflict or are silent on the deciding case, record a `needs_owner_intent` question (P5). It has no severity, and it states what the code would need under each answer.

### Use bounded evidence

Source tracing establishes the path. Git history establishes where a rule, state or branch came from. A local walkthrough, under the execution boundary, establishes what a person sees. Use the narrowest method that decides the claim, stop at the first observed stuck state, wrong answer or contradiction, and record the method in `reproduction.method`.

### Separate priority from certainty

Only `confirmed` records receive severity. Overall severity cannot exceed demonstrated impact.

- **critical**: a person permanently loses access to an account, a purchase or their own data with no recovery path; or every person in an organisation is blocked from a core capability.
- **high**: a common path (sign-up, sign-in, invitation, first run, checkout, the product's core task) blocks the person with no in-product exit; or the data model encodes a misunderstanding that produces states people get stuck in, or that block an intended capability, and fixing it needs a migration.
- **medium**: a block that needs uncommon preconditions, or an exit that needs support contact or clearing browser data; overfit machinery that forces other features to handle states with no product meaning; a rule spread onto surfaces where it blocks real people.
- **low**: a detour with a working exit; machinery with no reachable effect beyond maintenance cost; wording drift with no difference in behaviour.
- **informational**: an observation used as a prerequisite inside a larger finding.

The high/medium test: does the demonstrated result fully deny the capability's intent to the person, or only make it harder?

### Recommend the smallest change that restores the fit

For underfit and inconsistency, name the decision point where the missing exit, case or rule belongs. For overfit, name the proportionate shape: the smaller model or narrower rule that serves the purpose, the states or branches to remove, any data migration that implies, and the change to the instruction or memory that produced the excess. The audit describes changes; it does not modify the target.

## Full audit workflow

In full audit mode, follow all six phases in order:

1. **Reconnaissance**: map people, goals, intent sources and their origins, gates, cross-surface state, the data model and local walkthrough capability; write `architecture.md`, `intent-register.json` and the initial ledger with [RECONNAISSANCE.md](RECONNAISSANCE.md), and validate the register with `validate-intent-register.cjs`.
2. **Coverage-led hunting waves**: assign isolated hunters from the ledger and collect structured results with [HUNTING.md](HUNTING.md), [FIT-CLASSES.md](FIT-CLASSES.md) and the selected companions.
3. **Candidate validation**: give every candidate to a fresh verifier that re-derives the intent before reading the hunter's wording, as defined in [VALIDATION-AND-OWNER-REVIEW.md](VALIDATION-AND-OWNER-REVIEW.md).
4. **Structured output**: write final `confirmed`, `needs_owner_intent` and `rejected` records to `findings.json`; validate with `report-schema.json` and `validate-findings.cjs`, and validate the ledger with `validate-coverage-ledger.cjs`.
5. **Independent record verification**: fresh agents verify final records and reconcile corrections.
6. **Owner review**: write a short `SUMMARY.md`, turn the verified records into a decision tree, and work through it with the owner in rounds of questions, each with a recommended answer, until every decision is made. Record the answers in `decisions.json` and `DECISIONS.md`.

The run ends in one of three states: the owner session is finished and its decisions are recorded; the summary and decision tree are written and the session is pending because the owner is not available; or `run_status: "incomplete"` is recorded with its reason and the gap is disclosed in the summary. Both validators pass in the first two. Never stop mid-phase.

## Anti-patterns

1. Inferring intent from the code under review and then reporting the code against it.
2. Treating an instruction file or memory as unquestionable intent instead of reading it for its purpose and origin.
3. Reporting the absence of a feature nobody intended as underfit.
4. Calling every abstraction overfit. Machinery is overfit only when no person situation or stated need stands behind it.
5. Choosing between two plausible intents instead of asking the owner.
6. Live or shared-environment walkthroughs, real accounts, or anything that sends mail, takes money or spends quota.
7. Reporting a stuck state without checking the exits available to the person, including support paths the intent names.
8. Prose-only hunter results that cannot be deduplicated or verified.
9. Assigning severity to `needs_owner_intent` records.
10. Starting the owner session before independent verification, or letting the summary and JSON disagree.
11. Handing the owner a long report to read instead of the decisions they need to make, or answering a decision on the owner's behalf.
