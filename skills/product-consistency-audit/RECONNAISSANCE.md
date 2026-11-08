# Reconnaissance

### Phase 1: Map intent, people, gates and the data model, then plan coverage

The parent initializes `run-metadata.json`, applies the budget gate in `SKILL.md`, then creates agent directories and the shared ledger before hunting. Reconnaissance reads source, documentation, instruction files and git history. It does not run the target, contact deployed services, or write files; agents return structured facts to the parent.

Launch these `research` agents in parallel. Give each one [PRINCIPLES.md](PRINCIPLES.md) verbatim.

**Agent 1a: Product, people and goals**

```text
Read the target at <target>. Do not run it and do not use the network. Return:
1. What the product does and for whom, in the product's own words, citing README,
   docs, landing or marketing copy, onboarding text and help content with
   repository-relative file:line.
2. Every kind of person who uses it: end users, invited users, organisation admins,
   members without their own login, buyers, reviewers, anonymous visitors, operators,
   API clients. For each: how they arrive, what they are trying to get done, and what
   the product lets them do by design. Cite sources.
3. The capabilities that serve those goals, as a list of named capabilities with the
   apps, routes, screens, APIs or jobs that implement each.
4. Apps, packages and services, and which capabilities each one owns.
Return only facts with repository-relative file:line references.
```

**Agent 1b: Intent sources and rule origins**

```text
Find every written source of product intent in <target>:
- Product docs, specs, ADRs, decision records, READMEs, design notes.
- Agent instruction files: CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules,
  .cursor/rules, .github/copilot-instructions.md, .windsurfrules, nested copies in
  subdirectories, and any memory or notes directories committed with the code.
- Plan files, TODO lists and changelogs.
For each material rule (a "must", "never", "always", "only", a stated limit or a
stated model of the domain), return:
1. The rule text and location.
2. Its origin: use git log -S, git log --follow and git blame to find the commit that
   introduced it, quote the commit message, and note any incident, correction,
   example or conversation the text or commit mentions. If no origin is findable,
   say what you searched.
3. The purpose the origin supports, stated as the problem it solves.
4. The scope that purpose supports (which surfaces, people and data), and any later
   text that widened or narrowed it.
5. Conflicts with other sources, quoted with locations.
Use only read-only git commands. Do not assess the code yet.
```

**Agent 1c: Gates, routing and cross-surface state**

```text
Map where the product decides what a person can see or do, in <target>:
1. Every gate: middleware, route guards, layout checks, server actions, API
   authorization, plan or entitlement checks, onboarding redirects, feature checks.
   For each: the state it reads and where it sends the person on each failure.
2. Every redirect and return-to mechanism, with the destinations it can produce.
3. Every multi-step flow with state that persists between steps (sign-up, sign-in,
   invitations, account linking, credential reset, onboarding, checkout, long-running
   sessions, drafts, submissions, approvals). For each step: the state written and
   the state the next step reads.
4. Every piece of state written on one surface and read on another: admin tools
   versus user apps, API versus UI, background jobs, second apps, cookies or tokens
   set in one place and read in another.
5. Error pages, empty states and terminal screens, with the actions each offers.
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
4. Exits: how a record or person leaves that state.
5. The commit that introduced it (git log -S on the value), with its message.
Mark values with no producer, no consumer or no exit, flags with a single reachable
value, and combinations of fields the code allows but other code assumes cannot
happen. Report these as facts, not findings.
```

**Agent 1e: Local walkthrough capability**

```text
Read the target's own setup documentation, scripts, environment examples, test
configuration and seed tooling. Do not run anything and never print secret values.
Return:
1. How to start each app or service locally, and on which ports.
2. How to sign in as fixture or demo people without real accounts, and which roles
   those fixtures cover.
3. Which data store a local run uses, whether it is disposable, and how it is reset.
   Note any rule in the target's docs about which databases or branches may be used.
4. The settings that keep model, email, payment, storage, identity and analytics
   providers on fakes, local outboxes or disabled, and their default values.
5. Commands that would contact production, preview or paid services, send email,
   take payments, create or delete cloud resources, or pull environment files; mark
   them prohibited.
6. Existing harnesses usable as bounded evidence: end-to-end specs, workflow
   scripts, seeded scenarios, and how they are run.
7. What cannot be built locally (for example third-party session expiry or a lapsed
   real subscription).
```

Add focused reconnaissance agents for apps or capabilities these five do not map. If the budget blocks one, seed the unmapped area as a `deferred` ledger unit with reason `budget_cannot_reserve_critics_and_validation` and disclose the gap.

## Prior-run input

Before selecting work, the parent reads every available prior `coverage-ledger.json`, `findings.json`, `intent-register.json` and `decisions.json` for the same repo and applies the rules in `SKILL.md`. Record paths and source refs used in `run-metadata.json`. Summarize only the coverage consequences in `architecture.md`.

## Intent register

The parent writes `<output-dir>/intent-register.json` from agents 1a and 1b, checked against 1c and 1d. It is a top-level array with one entry per capability:

```json
{
  "capability": "Invite a teammate to a workspace",
  "people": [{"role": "workspace admin", "goal": "add a colleague"}, {"role": "invited colleague", "goal": "join and start working"}],
  "purpose": "Admins bring colleagues into the workspace; the colleague joins with the role the admin chose.",
  "sources": [{"kind": "file", "ref": "docs/workspaces.md", "line": 12, "quote": "..."}],
  "rules": [
    {
      "text": "Never let an invitation be reused.",
      "location": {"kind": "file", "ref": "AGENTS.md", "line": 88},
      "origin": {"kind": "commit", "ref": "3f2a9c1", "quote": "fix: second click on invite link created a duplicate member"},
      "purpose": "Stop a double click from creating a duplicate membership.",
      "supported_scope": "The accept step of a single invitation."
    }
  ],
  "conflicts": [],
  "open_questions": []
}
```

Rules:

- Every `purpose` cites at least one source that is not the implementation of that capability (P4).
- `origin.kind` is `commit`, `file` or `not_traceable`; for `not_traceable`, `quote` lists what was searched.
- Conflicts between sources are recorded with both quotes. A conflict the sources do not settle becomes an `open_questions` entry and, if it decides a candidate, a `needs_owner_intent` record later.
- The register states intent. It does not list suspected gaps.

## Architecture summary and companion selection

The parent writes `<output-dir>/architecture.md`, capped at about 1,000 words:

1. What the product does, for whom, in its own words.
2. People and their goals.
3. Apps, packages and services, and the capabilities each owns.
4. Gates and the important multi-step flows.
5. Shared state and the surfaces that write and read it.
6. The data model elements with the most behaviour attached.
7. Instruction files and memories found, with the rules that shape the most code.
8. Local walkthrough capability: enabled or blocked, and why.
9. Prior coverage gaps and revalidation targets.
10. Selected companions from [FIT-CLASSES.md](FIT-CLASSES.md), each with the surface that requires it.

Select a companion because reconnaissance found the surface its `When to use this file` section describes, never because a library or a word appears. [INSTRUCTIONS-AND-MEMORY.md](INSTRUCTIONS-AND-MEMORY.md) is selected whenever the target has any written rules, and [DATA-MODEL-AND-STATE.md](DATA-MODEL-AND-STATE.md) whenever it has persisted state.

## Deterministic coverage ledger

The parent writes `<output-dir>/coverage-ledger.json` as a top-level array. Derive one unit for every material combination of entry surface, gate, capability and applicable fit class at the granularity the profile sets (`quick` uses the fixed capability value `profile/quick/all-in-scope-capabilities`; `deep` adds lifecycle modes). For a scoped run, retain discovered excluded surfaces as `out_of_scope` units.

Seed these units in addition to flow units:

- An Instructions-and-memory unit for every material rule in the intent register, with the rule's location as the surface and its enforcement points as starting paths.
- A Data-model unit for every status enum, state machine and core entity, with the definition as the surface.

Each dimension has a human label and a stable source-derived value in `canonical_refs`. Suitable references are a repository-relative path plus a route, export or heading; a rule location; an enum or table name; and the exact fit-class block reference. A block reference is `FILE.md#` plus the exact class name as written in that file: the `##` heading text in a companion, or the bold class name in [FIT-CLASSES.md](FIT-CLASSES.md) without the principle list that follows it (`FIT-CLASSES.md#Lockout`). Section blocks use their heading text (`INSTRUCTIONS-AND-MEMORY.md#Core discipline`). Do not lowercase or slug display labels.

Derive `coverage_id` without lossy slugs:

1. Require every reference to be Unicode NFC with visible content, no control, format, line or paragraph separator or default-ignorable code point, and no surrounding whitespace.
2. Encode its UTF-8 bytes with RFC 3986 percent encoding: leave only `A-Z a-z 0-9 - . _ ~` unescaped and use uppercase `%HH` for every other byte.
3. Join encoded `surface`, `gate`, `capability` and `fit_class` references with `::`; append encoded `lifecycle` when present.

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

`prior_needs_owner_intent` marks a unit linked to a prior `needs_owner_intent` record. When `lifecycle` is material, add both `canonical_refs.lifecycle` and a human `lifecycle` field. `ordinary_fit_class_block` is null only when no ordinary block applies. The selected companion list includes each applicable class plus its companion `Core discipline`, `Universal moves` and `Validation rules`; `excluded_blocks` records every considered but unselected block and the source fact that excludes it.

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
