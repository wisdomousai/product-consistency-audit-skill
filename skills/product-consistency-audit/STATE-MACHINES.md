# State Machines

## When to use this file

Select this file whenever a record, a person or a screen moves through states that change what someone can do. Most products have such lifecycles; few write them down. Use it for every unit seeded from `state-machines.json` and for a state machine run (SKILL.md).

A state machine is implicit when no single place names its states and the moves between them. Its state is spread across fields, rows, runtimes or client variables, and each writer and reader works the state out for itself. Reconnaissance agent 1d finds them from these signals:

- Several booleans on one entity whose combinations stand for stages (`is_active`, `is_verified`, `has_paid`, `onboarding_done`).
- Nullable timestamps read as state: `accepted_at`, `revoked_at`, `ended_at`, `completed_at`, `deleted_at`, `published_at`. A condition such as `accepted_at && !revoked_at` names a state that no field holds.
- Time-derived states that no field holds: `expires_at < now()` makes a record expired with no write.
- String status columns with no constraint, compared with literals in several files, or written with values the type does not list.
- The existence of a row standing for a stage: an invitation row means pending, its deletion means accepted or withdrawn, and readers cannot tell which.
- Status values switched on in many files, with each writer setting the status directly.
- Counters and attempt fields that gate behaviour (`attempts >= 3` locks the person out).
- The same lifecycle held in more than a single runtime: a database row and a realtime server, a queue, a cache, a worker's memory or a third-party service, each with its own status and its own timer.
- Client state that forms a machine: clusters of `isLoading`, `isSubmitting`, `hasError`, `step` variables; wizard steps in the URL, local storage or a cookie; optimistic updates with their own rollback logic.
- Soft deletion combined with a status, so a record can be `active` and deleted at once.
- Instruction files, memories and comments that describe a lifecycle in prose ("once a session ends it cannot restart", "a draft becomes live when published"), which the code then implements in several places.

DATA-MODEL-AND-STATE.md covers single states and fields: a status without an exit, an impossible combination, null as a mode, a duplicated fact, mirror drift. This file covers the lifecycle as a whole. When a machine record shows one of those problems, seed the unit with the DATA-MODEL-AND-STATE.md class and link the fingerprints.

## Core discipline

**Bar for a finding.** P14 (PRINCIPLES.md) asks that each lifecycle is defined once and that every writer and reader goes through that definition. A lifecycle being implicit is not a finding by itself. A finding shows a cost to someone:

- A person sees conflicting answers about the same record, is moved to a state the product means to forbid, or is left in a state with no next action.
- An agent that operates the product through its API, CLI or tools cannot tell the state or the allowed next actions, attempts a move the product rejects, and gets an error that names neither.
- A developer or a coding agent changing the lifecycle has to change several places that have already drifted, or follows an instruction file whose prose no longer matches the code.

**Who uses a state machine.** Every finding and every recommendation in this file names its effect on each of these groups:

- **People using the product** (UX): the states they see, what each state lets them do, the way out of each, and the message when a move is refused.
- **Developers** (DX): how many places define the states, where a new state or move gets added, whether types and constraints reject an invalid state, and whether checks exercise the moves.
- **Agents** (AX): coding agents editing the repository, and agents that use the product through an API, SDK, CLI or tool server. An agent should find the machine from a file the instruction files point to, read the state and the allowed next actions from tool and API responses, and get a refusal that names the current state and what is allowed from it.

**Where intent is written.** The lifecycle's intent comes from the product's description of the thing that moves (what a draft, an invitation, a session or an order is), copy that names states and their actions, decision records, instruction files read under INSTRUCTIONS-AND-MEMORY.md, and the commits that introduced each field and each transition. The code shows which moves exist; the sources say which moves the product means to have.

**Machine record.** `state-machines.json` holds a record per machine, explicit or implicit (RECONNAISSANCE.md). The hunter checks its machine's record against source before using it, and adds to its scratch notes any storage, writer, reader, contract or transition the record missed. A machine record is evidence for hunters; the parent alone edits the file.

**Evidence methods.**

- `source`: storage, the expressions readers use to tell each state, every writer with its guard, contracts that expose the state, and the checks that exercise each transition.
- `history`: the commit that introduced each field and transition, and later commits that added a writer or a reader that skips the others' guard.
- `local`: a walkthrough under the execution boundary in SKILL.md that moves a fixture record through the machine on a disposable data store. Never query or write a shared or hosted store to count values or build a state.

## Lifecycle spread across fields

Principles: P14, P6, P12

Family: inconsistency

The current state of a record is a combination of booleans, timestamps, nullable fields and related rows. Each reader works the state out with its own expression, and the expressions disagree for some combinations.

What to look for:

- For each machine, every expression that tells a state from the stored fields. Put them side by side and find the combinations where the expressions give different answers.
- Combinations no expression covers, where readers fall to a default branch.
- States named in copy or docs ("Expired", "Awaiting payment") that no field holds and that each screen computes differently.
- Time-derived states computed in several places with different clocks, time zones or boundaries (`<` in one, `<=` in another).

What establishes a gap: the machine, at least a pair of reader expressions with paths, a combination a writer can produce, and the person, agent or developer who gets a different answer on each surface or path.

Not a gap:

- Several fields that a single function turns into a named state, when every reader calls that function.
- History timestamps kept beside a named state and never read to decide it.

## Transitions written in place

Principles: P14, P12, P8

Family: inconsistency

Each writer sets the state directly with its own guard. Some paths check that the move is allowed and others do not, so a move the product means to forbid is reachable from some surface.

What to look for:

- Every writer of the machine's state: UI handlers, API routes, tool servers, CLI commands, jobs, webhooks, admin tools, migrations and recovery scripts. For each, the state it requires before writing.
- Moves that a writer refuses and another performs: restarting an ended session from the API while the UI refuses, reopening an accepted invitation from an admin tool.
- Writers that skip side effects the main path performs on the same move (notifications, timestamps, counters, cache invalidation, an update to another runtime).
- Recovery or clean-up code that writes values outside the vocabulary.

What establishes a gap: the move, the writer that performs it without the guard or the side effect, the writer that enforces it, the source that says which is intended, and the person, agent or record affected.

Not a gap:

- An admin or recovery path that a source reserves for operators and that applies the same side effects.
- Writers that differ only in surface code and all call the same transition function.

## Lifecycle held in two runtimes

Principles: P14, P12, P10

Family: inconsistency

The same lifecycle is stored in separate places that each move on their own: a database row and a realtime server, a job queue, a cache, a third-party service or a worker's memory. Each has its own status, timers and clean-up. Some moves update both; others update only the place they started in.

What to look for:

- For each machine, every runtime that holds its state and the vocabulary each uses.
- Moves that reach a single runtime: a timer ending the realtime session without updating the row, an API call ending the row while the realtime server keeps running, a third-party webhook that is never delivered.
- Readers that trust different runtimes, so a launcher, a list and a person's screen each show a different state.
- Recovery code that reconciles the runtimes and writes values the vocabulary does not list.

What establishes a gap: the runtimes, a move that updates only part of them, the readers that then disagree, and the person or agent who sees the disagreement or is blocked by the stale copy.

Not a gap:

- A runtime that holds a cache of the state with a refresh the source accepts, when no gate reads the cache.
- A runtime that reports events to the owner of the state and never decides it.

## Client state apart from server state

Principles: P14, P10, P11, P12

Family: underfit

A screen keeps its own machine in independent variables, local storage, the URL or a cookie. The variables allow combinations no screen design covers, or they disagree with the server after a failure, a reload, a second tab or a change made elsewhere.

What to look for:

- Independent loading, submitting, error and success variables on a screen, and the combinations they allow: loading and error at once, success shown after a failed save.
- A failure branch that leaves a spinner or a disabled button with no way to retry (P11).
- Wizard steps or progress kept in the client that outlive the server record, so the person is sent to a step for a record that moved on or was removed (P10).
- Optimistic updates whose rollback leaves the client in a state the server never had.
- Reloads and second tabs that rebuild client state from defaults instead of from the server.

What establishes a gap: the screen, the client variables, a reachable combination or divergence, and what the person sees and can do there.

Not a gap:

- Purely visual state (an open menu, a hover) that changes nothing the person can do.
- Client state rebuilt from the server on every load, when the source accepts the delay before it refreshes.

## Lifecycle hidden from agents

Principles: P14, P11, P13

Family: inconsistency

Agents work from the repository's instruction files and from the product's API, SDK, CLI and tool responses. When those describe the lifecycle differently from the code, or expose raw fields with no state and no allowed next actions, agents make moves the product refuses, retry blindly, or edit a single writer and miss the others.

What to look for:

- API, CLI and tool responses for the machine's records: whether they include the current state, and whether a client can tell what it may do next without copying the server's rules.
- Refusals that return a generic error or a status code without the current state and the allowed moves.
- Tool and SDK types that re-declare the vocabulary by hand and lack values the server writes.
- Instruction files, memories and docs that state transition rules in prose. Compare each rule with the code's moves, and note when no instruction file points to where the machine is defined.
- Coding-agent instructions that tell agents to set the state directly in a place that skips the guard other writers use.

What establishes a gap: the agent surface or instruction text, the code it disagrees with or the information it withholds, and the move an agent makes or the change a coding agent gets wrong because of it. An agent counts as the person (P1) when the product's sources name agents, API clients or tool users as people it serves, or when the repository's instruction files direct coding agents.

Not a gap:

- An internal machine with a single writer that no API, tool or instruction file exposes or describes.
- Instruction text that points to the definition and adds a purpose without restating the moves.

## Choosing the recommended shape

A finding from this file recommends a shape for the whole machine, and that shape must improve the experience of people using the product, developers and agents. Write the effect on each in `remediation.experience` (`people`, `developers`, `agents`). Choose the smallest shape that improves all of them. When no shape improves one group, say which and why in that field, and put the choice to the owner as a fix decision with the alternatives.

Start from this shape and remove whatever the machine does not need (P6):

- **States are the person situations.** Name each state for what it means to the person or agent who sees it. A step that only the system cares about stays out of a state that people see. Remove states that every reader treats alike, and add none that no situation needs.
- **A single definition.** The states and the allowed moves live in one module, written in the target's existing idiom: an enum with a transition map, a reducer, a typed union, a database type with a constraint mirroring it. Do not recommend a new state machine library unless the target already uses one.
- **A single field for exclusive states.** When the states exclude each other, a single field holds the state. Timestamps stay as history beside it and stop being read as state. A state that time alone produces (expired) is computed by a function next to the definition.
- **A single way to move.** Every writer calls the same transition function. It checks the move against the definition, applies the move's side effects in one place, and refuses a disallowed move with an error that names the current state and the moves allowed from it.
- **An owner across runtimes.** When the lifecycle is held in more than a single runtime, the recommendation picks the runtime that owns the state, and the others report events to it or read it.
- **Client state follows the server.** A screen keeps a single state value, such as a typed union, instead of independent flags, rebuilds it from the server on load, and gives every failure state a retry or a way back.
- **State and next actions in every response.** API, SDK, CLI and tool responses return the state and the allowed next actions from the definition. Refusals include the same information.
- **Instruction files point to the definition.** Instruction text names the file that defines the machine and keeps only the purpose behind each rule. Transition rules restated in prose are removed or replaced by that pointer, so the next change happens in one place.

## Change safety

A recommended change to a machine must keep every existing record, caller and stored value working. Fill `remediation.change_safety` with:

- `value_mapping`: every value and field combination that current writers can produce or that existing data may hold, including values outside the vocabulary written by recovery or legacy code, each mapped to exactly one new state. A combination with no sensible state gets a stated fate (migrate to a named state, repair, or keep readable and stop writing).
- `writers` and `readers`: every one, with file and line, and the change each needs.
- `contracts`: every place outside the code that exposes or stores the state, such as public API responses, SDK and tool types, CLI output, webhooks, exports, analytics events, cookies, local storage and other apps that read the same store, each with how it stays compatible while callers move.
- `steps`: the order of work, each step shippable and reversible on its own. The usual order adds the new definition and field, backfills, moves writers to the transition function, moves readers, and then removes the old fields and branches.
- `coverage`: for each allowed move and each refused move, the existing check that exercises it through the real writer, with its path. A move with no check names the check that would exercise it, following the target's own testing conventions and any limits its instruction files set.
- `owner_checks`: facts the audit cannot read under the execution boundary, such as how many production records hold each value. Each is phrased as a read-only check the owner can run.

## Universal moves

- Start from `state-machines.json`. For your machine, confirm storage, states, transitions, writers, readers, contracts and coverage against source, and list what the record missed.
- Put every reader's state expression side by side and test each combination writers can produce against each expression.
- List every writer with the state it requires before writing and the side effects it applies. A move that a writer performs and another refuses is the first thing to report.
- Follow every timer, job, webhook and clean-up that moves the machine, in every runtime that holds it.
- Read the client code for every screen that shows the machine, including failure, reload and second-tab paths.
- Read the API, CLI and tool responses and refusals for the machine as an agent would receive them.
- Compare instruction-file prose about the lifecycle with the code, and trace each rule's origin under INSTRUCTIONS-AND-MEMORY.md.
- Link every stuck state, wrong answer and refused move to the machine's root cause under a single fingerprint (HUNTING.md).

## Validation rules

1. Re-derive the intended states and moves from the sources before reading the candidate's wording.
2. Confirm every writer, reader, runtime and contract cited, and search for ones the candidate missed: jobs, webhooks, admin tools, recovery scripts, migrations, tool servers and second apps.
3. For disagreeing readers, confirm that a writer can produce the combination they disagree on. A constraint that prevents the combination refutes the finding.
4. For an unguarded move, confirm the source that forbids it and that the unguarded writer is reachable by a person or agent.
5. For a hidden lifecycle, confirm the agent surface or instruction text, and that the sources name agents, API clients or tool users as people the product serves, or that the instruction files direct coding agents.
6. Check `remediation.experience`: each of `people`, `developers` and `agents` names a concrete improvement, or says why none is possible and the decision is put to the owner.
7. Check `remediation.change_safety` against source: every value writers produce is mapped, every writer and reader cited is listed, every contract found is listed, and the steps keep each existing caller working. A missing writer, reader, value or contract makes the record need a correction before it is final.
8. For overfit elements of the machine, look for a stated need such as audit history, compliance or recovery. If one exists, reject. The source must pass the provenance test in P4 (PRINCIPLES.md).
