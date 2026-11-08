# Data Model and State

## When to use this file

Select this file whenever the target persists state. Reconnaissance agent 1d finds the surfaces:

- Schema files, ORM models and migrations, including generated SQL.
- Enums and status vocabularies in code, and the database constraints, lookup tables or types that mirror them.
- State machines, transition tables and reducers that move a record between states.
- Feature flags, settings, mode switches and configuration values that change behaviour for a person or a record.
- Columns whose null or empty value changes what the product does.
- Client-side persisted state that gates behaviour: cookies, local storage keys and cached profile fields.

RECONNAISSANCE.md seeds one unit per status enum, state machine and core entity.

## Core discipline

**Bar for a finding.** Every state, status, flag, mode and nullable field stands for a situation the product must tell apart for some person (P6). A finding names the model element, the person situation it represents or the absence of one, its producers, its consumers and its exits, and a cost: a state a person can enter and not leave, a combination other code must handle with no product meaning, a capability blocked, or a migration needed to change course. Odd modelling with no such cost is out of scope.

**Where intent is written.** The schema shows what was built. Intent for the model comes from:

- Product docs and decision records that describe the domain: what a workspace, a member, a subscription or a document is, and how many of each relate.
- User-facing copy that names states ("Pending", "Archived", "Expired") and what a person can do in each.
- Instruction files and memories that describe the model or correct it. Read them under INSTRUCTIONS-AND-MEMORY.md for origin and scope.
- The commit and message that introduced each element: `git log -S '<value>'`, `git log -p -- <schema file>`, and the migration that added it.
- Sibling entities that already model the same kind of situation.

**Person and goal.** For each state, name the person who is in it or whose record is in it, what they are trying to do, and what the state lets them do. A status on an invitation concerns the admin who sent it and the person who received it. A status on a subscription concerns the buyer and every member whose access depends on it.

**State record.** For each element in scope, write down in scratch:

- Definition and every mirror (database constraint, lookup table, API type, client type, copy).
- The person situation it represents, in a sentence, with a source.
- Producers: every path that writes or sets it, including admin tools, jobs, imports, migrations and backfills.
- Consumers: every path that reads it or branches on it.
- Exits: every transition out, who can trigger each, and from which surface.
- Introducing commit and message.

**Evidence methods.**

- `source`: the definition, mirrors, producers, consumers and exits, with paths.
- `history`: the introducing commit, the request or rule behind it, later changes to producers and consumers.
- `local`: a walkthrough under the execution boundary in SKILL.md, used to show that a person reaches a state and what they can do there. Use a disposable local data store and a fixture person. Never write to a shared or hosted database to build a state.

## State without a person situation

Principles: P6, P2

Family: overfit

States that differ only in wording, or that exist so a rule, a log line or a single code path can be expressed, add cases every consumer must handle.

What to look for:

- Status values that every consumer treats the same way. Search each consumer's branches; if `pending_review` and `awaiting_review` lead to identical behaviour and copy, they represent a single situation.
- Values with a producer and no consumer, or a consumer and no producer.
- Values introduced in the same commit as an instruction edit or a correction. Read the origin under INSTRUCTIONS-AND-MEMORY.md.
- Intermediate states written and overwritten within a single request or transaction, persisted anyway, and then found in production data by readers that do not expect them.
- Status names that describe the system's process ("sync_started", "webhook_received") stored on a record that people see, when no person action depends on the step.

What establishes a gap: the element, the absence of a distinct person situation (consumers treat it identically, or no consumer exists), its origin where traceable, and the cost: extra branches in other features, a person who can be left in it, or copy that shows a meaningless state.

Not a gap:

- States kept for audit history, compliance or recovery when a source names that need.
- Internal process states that never reach a person and keep a process correct, such as a job's retry counter.

## Impossible combination allowed

Principles: P6, P4

Family: overfit

The model permits field combinations the domain rules out. Code then grows guards, repairs and fallbacks for combinations that should never exist, and some of them reach people.

What to look for:

- Pairs and groups of fields that the domain ties together: `status = active` with `ended_at` set; `role = owner` with no workspace; `accepted_at` set on an invitation whose `revoked_at` is also set.
- Relations whose cardinality differs from the sources: one-to-one where a person can belong to several workspaces, or one-to-many where the sources give a workspace a single billing owner.
- Separate entities for what the sources describe as one thing, and combined entities for what the sources keep apart (a membership row that doubles as an invitation).
- Defensive code that detects the combination and repairs it, logs it or redirects the person, with no constraint that prevents it at write time.
- Readers that assume the combination cannot happen while another writer can produce it.

What establishes a gap: the combination, the source that says it cannot occur in the domain, a producer that can create it, and a consequence: a reader that mishandles it for a person, a repair path a person lands in, or code in other features that handles a case with no product meaning.

Not a gap:

- A combination the domain allows that the auditor did not expect. Check the sources before calling it impossible.
- A combination that no producer can create, guarded by a constraint the database enforces.

## Status without exit

Principles: P8, P10, P11

Family: underfit

A record can enter a status from which no producer moves it and no person can act. When the record gates a person, the person is stuck.

What to look for:

- For each status, the transitions out. A status with no outgoing transition and no documentation as final.
- Exits that only an operator can trigger (a script, a database edit, a support tool), when the intent does not reserve recovery for an operator.
- Exits that depend on an event that may never come: a webhook, a background job, a reply from another person, a timer that is not scheduled.
- Statuses written at the start of a multi-step flow and cleared only at the end, so an abandoned flow leaves the record there (P10).
- Final statuses that block a new attempt: an invitation marked `declined` that prevents a new invitation to the same address because of a unique constraint.

What establishes a gap: the status, a reachable path into it for a real record, the exits available, and a trace showing none moves the record or the person toward the goal or back to a working state. Name the person gated by the record and what they see.

Not a gap:

- A final status the intent defines as final, when the person is told so and has nothing further to do.
- An exit through a clean-up job or expiry that runs, when a source accepts the delay.

## Constant flag

Principles: P6

Family: overfit

A flag, mode or setting with a single reachable value in the deployed configuration is a constant that keeps both branches alive.

What to look for:

- Feature flags, environment switches, per-record mode columns and settings. For each, every value it can take in the deployed configuration and every writer that can set it.
- Flags set once in a migration or seed and never written again.
- Settings exposed in an admin tool or API with a single value accepted by validation.
- Branches behind the unreachable value that still contain logic, copy or state other code must keep compatible.
- Flags added for a rollout, a single customer request or a temporary fix, whose origin commit names that purpose and whose rollout is complete.

What establishes a gap: the flag, proof that a single value is reachable in the deployed configuration, and the cost of the unreachable branch: states or settings a person could still be shown, code other features must keep compatible, or a reachable path that diverges from the main one.

Not a gap:

- A provider or environment switch that deployment configuration legitimately varies, such as a fake provider for local runs.
- A flag whose second value is documented as a planned capability with a date or owner, when no person can reach a half-built state.

## Duplicated state fact

Principles: P12, P6

Family: inconsistency

The same fact about a person or record is stored in more than one place: a status column and a boolean, a timestamp and a status, a row in a join table and a field on the parent. Writers update some of them. Readers trust different ones.

What to look for:

- Fields whose meanings overlap: `is_active` and `status`, `deleted_at` and `status = deleted`, `onboarding_complete` and `onboarding_step = done`, a `plan` column and a subscription row.
- For each pair, every writer and which fields it updates. A writer that updates one field and leaves the other produces a disagreement.
- For each pair, every reader and which field it trusts. Readers on different surfaces trusting different fields turn a writer's omission into two answers for the same person.
- Cached copies of a fact on a session, token or client store, compared with the stored value and the moments each is refreshed.

What establishes a gap: the duplicated fact, a writer that leaves the copies apart, readers that trust different copies, and a person who gets different answers on different surfaces or is gated by the stale copy.

Not a gap:

- Denormalised copies maintained by a single write path inside a transaction, with no other writer.
- A cached copy whose staleness window a source accepts and that no gate reads.

## Null as a mode

Principles: P6, P4

Family: overfit

A nullable column carries a hidden meaning. Null means "not yet set up", "legacy record", "personal account" or "invited but not joined", and code branches on it in many places without a named state.

What to look for:

- Conditions on null or empty values that change what a person can do: `if (!workspace_id)` routes to a personal mode; `if (!password_hash)` treats the person as invited.
- Nullable foreign keys whose absence means something different on different surfaces.
- Columns added as nullable in a migration with no backfill, so every old record sits in an unnamed state.
- Null values that several situations share, so a reader cannot tell them apart (a null `ended_at` for a subscription that is live and one that was never started).

What establishes a gap: the field, the meanings readers assign to null with their paths, the person situations that share the null, and a consequence: a person routed into the wrong mode, a reader that cannot tell two situations apart, or branches in other features that exist only to interpret the null.

Not a gap:

- An optional field whose absence means only "not provided" and changes no behaviour beyond display.
- A null that every reader interprets the same way and that represents a single situation the sources describe.

## Enum mirror drift

Principles: P12

Family: inconsistency

A status vocabulary is declared in more than one place: a code enum, a database constraint or type, an API schema, a client type, a lookup table, copy keys. The copies disagree.

What to look for:

- Every declaration of the same vocabulary. Compare values, spelling and order where order carries meaning.
- Values present in code and missing from the database constraint, so a write fails at runtime for the person whose action produces it.
- Values present in the database and missing from code, so a reader falls through to a default branch.
- String unions re-declared by hand on a surface, which drift when the source vocabulary changes.
- Copy and label maps keyed by status that lack a value, so a person sees a raw key or an empty badge.
- Migrations that renamed or removed a value while data or code still holds the old one.

What establishes a gap: the declarations with locations, the value that differs, a producer that can write it, and a reader or write path that fails or misroutes for a person because of the difference.

Not a gap:

- A subset declared deliberately for a surface that cannot see the other values, when a source states the restriction and no producer can send the missing values there.

## Migration default misplacing records

Principles: P10, P8, P12

Family: underfit

A migration adds a field or state with a default, and existing records take a value the new feature reads as meaningful. People who were already set up are sent back through setup, lose access, or are shown as something they are not.

What to look for:

- New columns with defaults that feed gates: `setup_complete default false`, `role default 'viewer'`, `plan default 'free'`, `verified default false`.
- Backfills that cover some records and skip others (only active workspaces, only records created after a date).
- New required relations whose absence on old records sends readers down an error or onboarding branch.
- Data migrations that map old values to new ones and leave some old values unmapped.
- Gates added in the same release as the migration that read the new field.

What establishes a gap: the migration and its default or backfill, the class of existing records it misplaces, the gate that reads the field, and what a person with such a record experiences.

Not a gap:

- A default that matches what every existing record represents, confirmed by the sources or the backfill.
- A deliberate reset the release notes or a decision record describe, with the person told what changed.

## Universal moves

- Build the state record for every element in scope before reading features. Producers, consumers and exits come first.
- List every declaration of each vocabulary and diff them, including copy and label maps.
- For each status, draw the transition graph with every surface that can trigger each edge. Mark statuses with no outgoing edge and edges only an operator can trigger.
- For each pair of fields that could encode the same fact, list writers and readers side by side.
- Read the migration history for every element: the commit that added it, defaults, backfills, renames and removals.
- Search conditions on null, empty and default values that route a person somewhere different.
- Trace overfit elements to their origin under INSTRUCTIONS-AND-MEMORY.md. A model element built from a rule shares its fingerprint with the rule finding when removing the element would remove the effect.
- Link each stuck state to the model element that causes it. HUNTING.md asks for one fingerprint per root cause.

## Validation rules

1. Re-derive the person situation for each state from the intent sources before reading the candidate's wording.
2. Confirm every producer, consumer and exit cited, and search for ones the candidate missed: admin tools, background jobs, imports, scheduled clean-up, database triggers, cascading deletes.
3. For a status with no exit, look for clean-up jobs, expiry timers, admin actions and support paths the intent names. Confirm any job is scheduled in the deployed configuration.
4. For an impossible combination, confirm the source that rules it out and that a producer can create it. A database constraint that prevents it refutes the finding.
5. For a constant flag, confirm the deployed configuration and every writer. A writer on another surface that sets the second value refutes the finding.
6. For overfit elements, look for a stated need: audit history, compliance, recovery, a documented capability. If one exists, reject.
7. For drift between mirrors, confirm which declaration is the source of truth according to the repository's own conventions, and that the drifting value is reachable.
8. Check that the proposed remediation names any data migration it implies and that the smaller model leaves no existing record in a state with no exit.
