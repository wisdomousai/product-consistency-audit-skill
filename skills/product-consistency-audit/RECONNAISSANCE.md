# Reconnaissance

### Phase 1: Map intent, actors, gates and the data model, then plan coverage

The parent initializes `run-metadata.json`, applies the budget reservations in [FULL-AUDIT.md](FULL-AUDIT.md), then creates agent directories and the shared ledger before hunting. Reconnaissance reads source, documentation, instruction files and git history. It does not run the target, contact deployed services, or write files; agents return structured facts to the parent.

Before launch, ask the owner whether agent memories or session transcripts for this repository are kept outside it (per-user project memory directories are common) and whether any may be read. Pass the paths the owner gives to agent 1b.

When the host already loads a memory index for this repository into the parent's session, the owner has made it part of the working context. Treat those memory paths as named: tell the owner which paths agent 1b will read, and do not ask again. They stay read only, and their rules are read for purpose and origin like any other written rule ([INSTRUCTIONS-AND-MEMORY.md](INSTRUCTIONS-AND-MEMORY.md)).

Launch these `research` agents in parallel. Give each one [PRINCIPLES.md](PRINCIPLES.md) verbatim, or its absolute path with an instruction to read it in full when the agent can read files.

**Agent 1a: Product, actors and goals**

```text
Read the target at <target> and the supplied task or owner statements. Do not run
it and do not use the network. Return:
1. What the product does and for whom, in the product's own words, citing README,
   docs, landing or marketing copy, onboarding text and help content with
   repository-relative file:line.
2. Every kind of actor who uses it: end users, invited users, organisation admins,
   members without their own login, buyers, reviewers, anonymous visitors, operators,
   developers, coding agents, tool-using agents, API clients and automated services.
   For each: how they arrive, what they are trying to get done, and what
   the product lets them do by design. Cite sources. Mark actors a source names
   whom no supported path serves yet; distinguish current requirements from plans.
3. The capabilities that serve those goals, as a list of named capabilities with the
   apps, routes, screens, APIs, tools, commands or jobs that implement each. Include
   supported development and operational tasks and their success conditions. For
   agents, record available context, permitted tools and delegated authority.
4. Apps, packages and services, and which capabilities each one owns.
5. Actors no source names but the product implies. Infer them from roles,
   permissions and account states in the schema and auth code; plan, seat and
   trial tiers; invitation, membership and verification states; actors who
   receive an email, link, export or shared view without an account; actors who
   hold several roles or belong to several organisations, or none; and a named
   actor in a later situation (removed, lapsed, expired, demoted, on a second
   device). For each, give the code evidence and the named actor they derive
   from, if any.
6. When the run names an audience: which named or inferred actors each audience
   term covers, with the source or code that ties them, and every surface those
   actors reach.
Return only facts with repository-relative file:line references or precise
conversation/message references for supplied task and owner statements.
```

**Agent 1b: Intent sources and rule origins**

```text
Find every written source of product intent in <target>:
- Product docs, specs, ADRs, decision records, READMEs, design notes.
- Assigned tasks, interface contracts, runbooks, reliability and resource limits,
  supported development workflows and agent tool descriptions. Cite actual
  requirements; do not infer a target from a technology choice alone.
- Agent instruction files: CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules,
  .cursor/rules, .github/copilot-instructions.md, .windsurfrules, nested copies in
  subdirectories, any memory or notes directories committed with the code, and the
  memory or transcript paths outside the repository listed below, read only.
- Plan files, TODO lists and changelogs.
For each material rule (a "must", "never", "always", "only", a stated limit or a
stated model of the domain), return:
1. The rule text and location.
2. Its origin: use git log -S, git log --follow and git blame to find the commit that
   introduced it, quote the commit message, and note any incident, correction,
   example or conversation the text or commit mentions. When history is squashed
   or the rule predates the repository, look in decision logs, QA and meeting notes,
   unmerged branches (git branch -a, git log --all) and the outside memories and
   transcripts. If no origin is findable, say what you searched.
3. The purpose the origin supports, stated as the problem it solves.
4. The scope that purpose supports (which surfaces, actors and data), and any later
   text that widened or narrowed it.
5. Conflicts with other sources, quoted with locations.
6. Provenance of each decision: the owner stated it (quote the owner), the owner
   accepted a recommendation someone else wrote (say whether one by one or in
   bulk), or nobody is recorded as deciding it. A commit by the owner's account
   that has agent trailers or session links, or whose message restates an
   instruction file, counts as nobody's decision until the owner confirms it. When
   a decision gives a written rule as its reason, name that rule.
7. Decided changes that are not on the reviewed ref: unmerged branches, plans or
   decision records that rename, remove or change a rule or capability. Give the
   branch or file and what it changes.
Outside memory and transcript paths: <paths the owner gave, or none>.
Use only read-only git commands. Do not assess the code yet.
```

**Agent 1c: Gates, routing and cross-surface state**

```text
Map where the product decides what an actor can see or do, in <target>:
1. Every gate: middleware, route guards, layout checks, server actions, API
   authorization, plan or entitlement checks, onboarding redirects, feature checks.
   For each: the state it reads and where it sends the actor on each failure.
2. Every redirect and return-to mechanism, with the destinations it can produce.
3. Every multi-step flow with state that persists between steps (sign-up, sign-in,
   invitations, account linking, credential reset, onboarding, checkout, long-running
   sessions, drafts, submissions, approvals). For each step: the state written and
   the state the next step reads.
4. Every piece of state written on one surface and read on another: admin tools
   versus user apps, API versus UI, background jobs, second apps, cookies or tokens
   set in one place and read in another.
5. Error pages, empty states, terminal screens, command exits and tool results,
   with the actions each offers. Trace task discovery, completion signals, retries,
   cancellation and handoff for supported technical and agent workflows.
Return repository-relative file:line references. Do not run anything.
```

**Agent 1d: Data model inventory**

```text
Inventory the data model of <target>: schema files, migrations, ORM models, enums,
status and state-machine definitions, feature flags, settings and mode switches.
For each entity: its fields that drive behaviour and its relations.
For each status, enum value, mode and flag:
1. Where it is defined, and where a database constraint mirrors it.
2. Producers: every code path that writes or sets it.
3. Consumers: every code path that reads or branches on it.
4. Exits: how a record or actor leaves that state.
5. The commit that introduced it (git log -S on the value), with its message.
Mark values with no producer, no consumer or no exit, flags with a single reachable
value, and combinations of fields the code allows but other code assumes cannot
happen. Report these as facts for hunters to assess.
Then list every state machine, explicit or implicit: any record, actor or screen
that moves through states which change what someone can do. Look for status
columns, booleans and nullable timestamps read together, time-derived states,
rows whose existence stands for a stage, attempt counters, the same lifecycle held
in several runtimes (database, realtime server, queue, cache, third-party service),
client state that forms a machine (loading, error and step variables, wizard steps
in URLs, local storage or cookies), and instruction-file prose that describes a
lifecycle. Use the signals in STATE-MACHINES.md, "When to use this file". For each:
1. What moves, the actors affected, and where the states are defined
   once, if anywhere.
2. Storage: every field, row, runtime or client variable that holds part of the state.
3. States: each with the task situation or technical invariant it stands for and
   every expression readers use to tell it, with file:line.
4. Transitions: from, to, trigger, and every writer with the guard it applies.
5. Readers, and contracts that expose the state (API, SDK, CLI, tool server,
   webhooks, exports, analytics, cookies, local storage, other apps).
6. Instruction, memory and doc text that describes the lifecycle.
7. The checks (tests, workflow scripts, end-to-end specs) that exercise each
   transition, with paths.
```

**Agent 1e: Local walkthrough capability**

```text
Read the target's own setup documentation, scripts, environment examples, test
configuration and seed tooling. Do not run anything and never print secret values.
Return:
1. How to start each app or service locally, and on which ports.
2. How to sign in as fixture or demo actors without real accounts, and which roles
   those fixtures cover.
3. Which data store a local run uses, whether it is disposable, and how it is reset.
   Note any rule in the target's docs about which databases or branches may be used.
4. The settings that keep model, email, payment, storage, identity and analytics
   providers on fakes, local outboxes or disabled, and their default values.
   Name every tool (CLI, MCP server, desktop app, SDK, script) that falls back to
   a production or hosted URL when an origin setting is unset, and the setting
   that pins it to localhost.
5. Commands that would contact production, preview or paid services, send email,
   take payments, create or delete cloud resources, or pull environment files; mark
   them prohibited.
6. Existing harnesses usable as bounded evidence: end-to-end specs, workflow
   scripts, seeded scenarios, and how they are run.
7. What cannot be built locally (for example third-party session expiry or a lapsed
   real subscription).
```

Save each report verbatim as `<output-dir>/recon/<agent>.md` as soon as it returns. Hunters and verifiers can then be pointed at a report, and the parent's context is not its only copy.

Add focused reconnaissance agents for apps or capabilities these five do not map. If the budget blocks one, seed the unmapped area as a `deferred` ledger unit with reason `budget_cannot_reserve_critics_and_validation` and disclose the gap.

## Prior-run input

Before selecting work, the parent reads every available prior `coverage-ledger.json`, `findings.json`, `intent-register.json` and `decisions.json` for the same repo and applies the prior-run rules in [FULL-AUDIT.md](FULL-AUDIT.md). Record paths and source refs used in `run-metadata.json`. Summarize only the coverage consequences in `architecture.md`.

## Intent register

The parent writes `<output-dir>/intent-register.json` from agents 1a and 1b, checked against 1c and 1d. It is a top-level array with one entry per capability:

```json
{
  "capability": "Invite a teammate to a workspace",
  "actors": [{"role": "workspace admin", "goal": "add a colleague", "served": true}, {"role": "invited colleague", "goal": "join and start working", "served": true}],
  "purpose": "Admins bring colleagues into the workspace; the colleague joins with the role the admin chose.",
  "sources": [{"kind": "file", "ref": "docs/workspaces.md", "line": 12, "quote": "...", "provenance": "unattributed"}, {"kind": "file", "ref": "docs/decisions.md", "line": 40, "quote": "D7: invitations are single use (accepted recommendation)", "provenance": "accepted_recommendation", "cites_rule": {"kind": "file", "ref": "AGENTS.md", "line": 88}}],
  "rules": [
    {
      "text": "Never let an invitation be reused.",
      "location": {"kind": "file", "ref": "AGENTS.md", "line": 88},
      "origin": {"kind": "commit", "ref": "3f2a9c1", "line": null, "quote": "fix: second click on invite link created a duplicate member"},
      "provenance": "unattributed",
      "purpose": "Stop a double click from creating a duplicate membership.",
      "supported_scope": "The accept step of a single invitation."
    }
  ],
  "conflicts": [],
  "open_questions": [],
  "decided_not_on_ref": [{"ref": "branch invite-expiry", "change": "Invitations expire after 14 days and can be resent."}]
}
```

Rules:

- Every `purpose` cites at least one source that is not the implementation of that capability (P4). `actors` contains actors, including agents and services. Their `goal` states the task and success condition; `purpose` records any technical requirement. Preserve authority and operating constraints in the architecture summary and finding conditions.
- `origin.kind` is `commit`, `file`, `branch`, `transcript` or `not_traceable`; for `not_traceable`, `ref` is null and `quote` lists what was searched.
- Findings accept `file` (repository-relative), `commit` and `transcript` in `intent.sources`. A transcript ref identifies a conversation and message or a prior run decision ID; quote the actual instruction or answer and retain its provenance in the register. It may confirm intent only when the verifier can read the cited excerpt and P4 permits that conclusion. Do not invent a repository path for outside material. Branch names alone do not establish intent: resolve to a cited commit or retain the question as `needs_owner_intent`.
- `line` is a positive integer, or null when the source has no line (a commit, a branch, a transcript). Never write 0.
- `provenance` on each source and rule is `owner_statement`, `accepted_recommendation`, `bulk_accepted_recommendation` or `unattributed`, as defined in P4. It is separate from `kind`. A decision whose reason is a written rule records that rule's location in `cites_rule`, so verifiers can see the scope question it inherits.
- An actor no source names but reconnaissance inferred has `inferred: {"basis": [<location>, ...], "derived_from": "<role of a named actor>" | null}`, where each location is `{kind, ref, line}`. When `derived_from` names an actor, that actor's sourced goal applies in the derived situation, so a gap for the inferred actor can be confirmed. When it is null, the goal rests on the code alone (P4): write the goal the code implies, and a gap for that actor becomes `needs_owner_intent`, asking whether the product means to serve them.
- An actor with no supported path has `served: false`. This is an observation, not a scope decision: a missing path can be underfit when a source requires it now. If the source describes a future audience or leaves timing open, ask about intent instead of inventing a current obligation.
- `decided_not_on_ref` lists decided changes missing from the reviewed ref, such as an unmerged branch. They can guide a recommendation but do not establish behaviour on the reviewed ref. Report a current gap when it still exists, note the planned fix, and avoid recommending duplicate work.
- Each `conflicts` entry is `{"description": "...", "sources": [...]}` with at least two source entries, so both quotes are recorded. A conflict the sources do not resolve becomes an `open_questions` entry and, if it decides a candidate, a `needs_owner_intent` record later.
- Leave suspected gaps out of the register; hunters assess them.

Run `node <skill-dir>/validate-intent-register.cjs <output-dir>/intent-register.json` after writing the register and after every change to it. Fix every error before seeding the ledger.

## State machine inventory

The parent writes `<output-dir>/state-machines.json` from agent 1d, checked against 1c. It is a top-level array with one entry per machine, explicit or implicit:

```json
{
  "id": "invitation-lifecycle",
  "name": "Invitation lifecycle",
  "subject": "invitations row",
  "kind": "implicit",
  "actors": ["workspace admin", "invited colleague"],
  "definition": null,
  "storage": [{"kind": "timestamp", "ref": "src/db/schema.ts", "line": 40, "description": "accepted_at"}],
  "states": [{"name": "pending", "situation": "The colleague has not answered yet.", "identified_by": [{"ref": "src/invitations/list.ts", "line": 12, "expression": "!accepted_at && !revoked_at"}]}],
  "transitions": [{"from": null, "to": "pending", "trigger": "Admin sends an invitation.", "writers": [{"ref": "src/invitations/create.ts", "line": 8, "guard": null}]}],
  "readers": [{"ref": "src/invitations/list.ts", "line": 12, "reads": "accepted_at and revoked_at"}],
  "contracts": [{"ref": "src/api/invitations.ts", "line": 30, "surface": "GET /api/invitations returns accepted_at"}],
  "instruction_refs": [{"ref": "AGENTS.md", "line": 88, "text": "Never let an invitation be reused."}],
  "coverage": [{"from": null, "to": "pending", "checks": [{"ref": "tests/invitations.workflow.ts", "line": 15}]}]
}
```

Rules:

- `kind` is `explicit` when a single place defines the states and the moves, and `definition` cites it; otherwise `implicit` with `definition: null`. An explicit machine whose writers bypass the definition stays explicit; the bypass is hunter work.
- `storage.kind` is `column`, `boolean`, `timestamp`, `nullable_field`, `row`, `derived`, `runtime`, `client` or `external`.
- State names describe the task situation or technical invariant represented by the record; `actors` lists the affected human, agent or service actors. For an implicit machine, take them from copy or docs where possible and say in `situation` where the name came from.
- `from: null` marks creation. Every transition has at least one writer, and every `coverage` entry names a listed transition. A transition with no check has no `coverage` entry.
- Every `ref` is repository-relative and every `line` is a positive integer or null.
- Leave suspected gaps out of the inventory; hunters assess them.

Run `node <skill-dir>/validate-state-machines.cjs <output-dir>/state-machines.json` after writing it and after every change. Fix every error before seeding the ledger.

## Actors and organisation check

Every finding depends on who the actors are and how they relate. Reconnaissance builds that map from sources, code and memories, which can disagree or be out of date. A role the owner sees as a position inside an organisation can be modelled as a separate party, for example. Hunting on a wrong map produces findings that all have to be redone.

After the intent register is written and validated, check the map against existing sources and owner decisions. Before hunting dependent units, put only material unresolved relations to the owner, one question at a time, in the format of Phase 6 ([VALIDATION-AND-OWNER-REVIEW.md](VALIDATION-AND-OWNER-REVIEW.md), Run the session):

- Each unresolved actor role and task, with its organisation or group where relevant. For agents and services, include whom they act for, the interfaces they can use and their authority.
- Each relation between kinds of organisation and actor that the gates depend on: who belongs to whom, who acts for whom, who leads a case or account, and who may read what another actor writes.
- Where sources disagree with each other or with the code about one of these, the options, with a recommended answer.

Ask only about the map, not about findings. Record the answers in `decisions.json` with the provenance rules of Phase 6, and update `intent-register.json` and `architecture.md` before hunting. A correction to the map is an `owner_statement` source for every capability it touches. If the owner is not available, record the map as unconfirmed in `architecture.md`. Continue independent work. Each finding that depends on an unresolved relation then becomes `needs_owner_intent` on that relation.

## Architecture summary and companion selection

The parent writes `<output-dir>/architecture.md`, capped at about 1,000 words:

1. What the product does, for whom, in its own words.
2. Actors, tasks, success conditions, authority and technical requirements.
3. Apps, packages and services, and the capabilities each owns.
4. Gates and the important multi-step flows.
5. Shared state and the surfaces that write and read it.
6. The data model elements with the most behaviour attached.
7. Instruction files and memories found, with the rules that shape the most code.
8. Local walkthrough capability: enabled or blocked, and why.
9. Prior coverage gaps and revalidation targets.
10. Selected companions from [FIT-CLASSES.md](FIT-CLASSES.md), each with the surface that requires it.

Select [TECHNICAL-AND-AGENT-TASKS.md](TECHNICAL-AND-AGENT-TASKS.md) when reconnaissance finds a supported agent task or technical requirement.

Select a companion because reconnaissance found the surface its `When to use this file` section describes, never because a library or a word appears. [INSTRUCTIONS-AND-MEMORY.md](INSTRUCTIONS-AND-MEMORY.md) is selected whenever the target has any written rules, [DATA-MODEL-AND-STATE.md](DATA-MODEL-AND-STATE.md) whenever it has persisted state, and [STATE-MACHINES.md](STATE-MACHINES.md) whenever `state-machines.json` holds an implicit machine or a machine with more than a single writer, runtime or surface.

## Deterministic coverage ledger

The parent writes `<output-dir>/coverage-ledger.json` as a top-level array. Derive one unit for every material combination of entry surface, gate, capability and applicable fit class at the granularity the profile sets (`quick` uses the fixed capability value `profile/quick/all-in-scope-capabilities`; `deep` adds lifecycle modes; an audience-scoped run adds the actor). For a scoped run, retain discovered excluded surfaces as `out_of_scope` units.

Before seeding, check that every starting path and gate path reconnaissance gave exists in the target at the reviewed state. Correct or drop a path that does not, and note the correction in `architecture.md`.

For a required task with no implemented path, use its repository-relative requirement or interface declaration as the starting path and surface; use a stable gate reference such as `missing/task-entry`. If only a conversation establishes the missing capability and no relevant source path exists, record the coverage gap rather than inventing a path to satisfy the ledger.

Seed these units in addition to flow units:

- An Instructions-and-memory unit for every material rule in the intent register, with the rule's location as the surface and its enforcement points as starting paths.
- A Data-model unit for every status enum and core entity, with the definition as the surface.
- A State-machines unit for every machine in `state-machines.json` and each STATE-MACHINES.md class its record makes plausible, with the definition, or the main storage location of an implicit machine, as the surface and its writers as starting paths.

Each dimension has a human label and a stable source-derived value in `canonical_refs`. Suitable references are a repository-relative path plus a route, export or heading; a rule location; an enum or table name; and the exact fit-class block reference. A block reference is `FILE.md#` plus the exact class name as written in that file: the `##` heading text in a companion, or the bold class name in [FIT-CLASSES.md](FIT-CLASSES.md) without the principle list that follows it (`FIT-CLASSES.md#Lockout`). Section blocks use their heading text (`INSTRUCTIONS-AND-MEMORY.md#Core discipline`). Do not lowercase or slug display labels.

Derive `coverage_id` without lossy slugs:

1. Require every reference to be Unicode NFC with visible content, no control, format, line or paragraph separator or default-ignorable code point, and no surrounding whitespace.
2. Encode its UTF-8 bytes with RFC 3986 percent encoding: leave only `A-Z a-z 0-9 - . _ ~` unescaped and use uppercase `%HH` for every other byte.
3. Join encoded `surface`, `gate`, `capability` and `fit_class` references with `::`. When present, append `a=` followed by the encoded `actor`, then the encoded `lifecycle`, each after another `::`. A reference always encodes `=`, so the prefix keeps an actor segment apart from a lifecycle segment.

Do not include wave, agent, verdict, severity or line number in a reference or ID. Sort units by `coverage_id` before each assignment. Fail on duplicate IDs; treat duplicate IDs with different semantic fields as an identity collision and never merge them.

Each unit records:

```json
{
  "coverage_id": "...",
  "canonical_refs": {
    "surface": "app/invite/[token]/page.tsx#GET /invite/:token",
    "gate": "lib/invitations.ts#acceptInvitation",
    "capability": "Invite a teammate to a workspace",
    "fit_class": "FIT-CLASSES.md#Dead end and loop"
  },
  "surface": "...",
  "gate": "...",
  "capability": "...",
  "fit_class": "...",
  "starting_paths": ["repo/relative/path"],
  "ordinary_fit_class_block": "FIT-CLASSES.md#Dead end and loop",
  "selected_companion_blocks": ["ACCESS-AND-IDENTITY-FLOWS.md#Core discipline"],
  "excluded_blocks": [{"block": "FILE.md#section", "reason": "..."}],
  "prior_status": "new|prior_confirmed_same_source|prior_confirmed_changed_source|prior_needs_owner_intent|prior_deferred|prior_blocked|prior_out_of_scope|prior_covered_same_source|prior_covered_changed_source|prior_rejected_claim_changed|none",
  "attempts": [],
  "wave": 1,
  "status": "planned",
  "agent_id": null,
  "reviewed_paths": [],
  "local_checks": [],
  "result_fingerprints": [],
  "unresolved": []
}
```

`prior_needs_owner_intent` marks a unit linked to a prior `needs_owner_intent` record. When `lifecycle` is material, add both `canonical_refs.lifecycle` and a human `lifecycle` field. In an audience-scoped run, add both `canonical_refs.actor`, the register role exactly as written, and a human `actor` field. `ordinary_fit_class_block` is null only when no ordinary block applies. The selected companion list includes each applicable class plus its companion `Core discipline`, `Universal moves` and `Validation rules`; `excluded_blocks` records every considered but unselected block and the source fact that excludes it.

`attempts` is an append-only archive for evidence-bearing assignments that a coverage critic reopens. Before reassignment, append the unit's exact `wave`, `status`, `agent_id`, `reviewed_paths`, `local_checks`, `result_fingerprints` and `unresolved`, plus the critic's `reassignment_reason`. Only `blocked`, `covered` and `candidate` states are archived. The next assignment increments `wave`, uses a fresh owner, and starts with empty live evidence.

Enforce this state table exactly:

| Status | Unit `agent_id` | `reviewed_paths` / `local_checks` | `result_fingerprints` | `unresolved` |
|---|---|---|---|---|
| `planned` | null | empty | empty | empty |
| `not_applicable`, `out_of_scope`, `deferred` | null | empty | empty | nonempty reason |
| `in_progress` | owner | empty | empty | empty |
| `blocked` | owner | both nonempty | empty | nonempty blocker |
| `covered` | owner | both nonempty | empty | empty |
| `candidate` | owner | both nonempty | nonempty | optional |

Every check records its own `agent_id`, nonempty `reviewed_paths`, and a `method`:

- `source`: read the code; `artifact` is null.
- `history`: read git history; `artifact` is null and the check's `result` names the commits.
- `local`: a walkthrough under the execution boundary; `artifact` is a file the parent copied to exactly `agents/<check.agent_id>/artifacts/`.

The unit-level `reviewed_paths` is exactly the union of its checks' paths. The ledger is the coverage claim; an architecture summary or agent count is not.

Run `node <skill-dir>/validate-coverage-ledger.cjs <output-dir>/coverage-ledger.json` after seeding, after every parent update, and before Phase 6. Fix every error before assigning work or making a coverage claim.
