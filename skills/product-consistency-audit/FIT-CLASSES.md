# Fit Classes

#### Fit classes: choose and split based on Phase 1

Select the classes that apply to the target's capabilities. The list is a starting point; reconnaissance may add classes specific to the product, and large targets split units per capability. Every class names the principles from [PRINCIPLES.md](PRINCIPLES.md) it comes from. A proposed class with no principle behind it does not belong in a run.

Some companion classes are narrower versions of a class below (for example a withdrawal recorded in an instruction file, as against any reversed decision). When both apply, seed the unit with the companion class; when a hunter's results under both share a root cause, the parent merges them under one fingerprint.

Use `confirmed` only when the person, the cited intent, the trace and the reachable situation are established. Use `needs_owner_intent` when the deciding intent is open; state the question and what each answer would require.

> **Written rules** (agent instruction files, memory directories, plan files, conventions documents, decision records): use [INSTRUCTIONS-AND-MEMORY.md](INSTRUCTIONS-AND-MEMORY.md).
>
> **Persisted state** (schemas, migrations, enums, status machines, flags, settings, modes): use [DATA-MODEL-AND-STATE.md](DATA-MODEL-AND-STATE.md).
>
> **Sign-in and access** (sign-up, sign-in across apps, sign-out, sessions, invitations, account linking, credential reset, role routing, return-to parameters): use [ACCESS-AND-IDENTITY-FLOWS.md](ACCESS-AND-IDENTITY-FLOWS.md).
>
> **First run** (onboarding steps, required profile, workspace or organisation creation, forced redirects): use [ONBOARDING-AND-SETUP.md](ONBOARDING-AND-SETUP.md).
>
> **Paid access** (plans, trials, seats, credits, grants, checkout, lapse and downgrade): use [PLANS-BILLING-AND-ENTITLEMENTS.md](PLANS-BILLING-AND-ENTITLEMENTS.md).
>
> **Work that spans time** (realtime sessions, reservations and locks, drafts, uploads, background jobs, approvals, timeouts): use [LONG-RUNNING-SESSIONS.md](LONG-RUNNING-SESSIONS.md).
>
> **Several surfaces on the same state** (admin tools, second apps, APIs, jobs, imports writing what a person's surface reads; active workspace or account switching): use [ADMIN-AND-CROSS-SURFACE.md](ADMIN-AND-CROSS-SURFACE.md).
>
> **Public text** (marketing pages, pricing, help content, emails, in-product promises): use [PUBLIC-CLAIMS.md](PUBLIC-CLAIMS.md).

## Overfit

**Literal rule encoding** (P2, P3, P6)
A rule, correction or instruction turned into schema, statuses, guards or branches that enforce its wording rather than its purpose.
- Find the rule's origin: the incident, request or example it came from. State the problem in a sentence.
- List every enforcement point. For each, ask whether that problem can occur there.
- Look for states and fields whose only reason to exist is the rule: a status added so the rule can be checked, a flag that records compliance, a table that tracks an exception the rule created.
- Name the proportionate shape: the smallest enforcement that solves the original problem.
- The instruction itself is part of the fix when its wording invites the overreach.

**Misunderstanding in the model** (P4, P6)
Entities, relations or states that model a wrong reading of the domain.
- Compare the model with how the product's own sources describe the domain. Look for one-to-one relations where the sources describe many, separate entities for what the sources call one thing, a single entity holding what the sources call two.
- List field combinations the model allows that the domain makes impossible, and the code written to handle or forbid them.
- Trace the misunderstanding to its origin in history when possible: the first commit, the request it answered, the example data it was built against.
- Report the consequence for people (states they get stuck in, capabilities they cannot reach) and for the product (cases every feature must handle, migrations needed to change course).

**Rule spread** (P3)
A rule that came from one surface, audience or data type enforced on others.
- Start from shared helpers, middleware, base classes and validation schemas that apply a rule broadly.
- For each place the rule reaches, check whether its origin covers that place.
- A rule reaching further than its origin is a finding when it blocks, confuses or burdens someone there, or forces model elements that only exist to satisfy it.

**Machinery beyond purpose** (P6)
Flags, modes, settings, abstraction layers, fallbacks and compatibility paths for situations that cannot arise or that a single case needed.
- List flags and modes with their reachable values. A flag with a single reachable value is a constant with extra branches.
- Find fallbacks for failures the system cannot produce and compatibility paths for callers that no longer exist.
- Find abstractions with a single implementation that add states or configuration a person can end up in.
- Machinery is a finding when it creates states, settings or code paths that other features must handle, or that a person can end up in, with no purpose behind them.

**Built for the example** (P7)
Special cases for the fixture, demo, first customer or prompt scenario the code was first written against.
- Search conditions for literal identifiers, names, counts, locales, plan names and seed values.
- Find code paths that only the seed data reaches, and assumptions that hold for one record but break for many (a single workspace, a single admin, a single currency, a single language).
- Confirm that the deployed configuration reaches the special case and that a real person or record is mishandled.

**Residue of a reversed decision** (P2, P6)
States, aliases, branches and settings kept after the instruction that created them changed or was withdrawn.
- Compare current instruction files with their history. For each removed or reversed rule, search for code and data it introduced.
- Find enum values, columns and branches whose producing code was removed but whose consumers remain, or the reverse.
- Report what the residue costs: a state a person can still reach, a case other features must still handle, data that misleads.

## Underfit

**Lockout** (P8, P9, P11)
A person who should have access cannot get in, and nothing they can do from where they are restores it.
- For each gate, list the states it reads and every way that state can become false for a person who should pass: expiry, revocation, a change made by someone else, a partial write, a stale cookie or token, a second app's sign-out.
- Follow the failure path to where the person lands and check what they can do there.
- Check whether the recovery path itself passes through the same gate.

**Dead end and loop** (P8, P11)
A state with no action toward the goal or back, or a set of redirects and retries that return the person to where they started.
- Map each redirect's destinations, then each destination's own gates, until the chain ends or repeats.
- Check every error page, empty state and terminal screen for an action that works for the person who sees it.
- A retry button that repeats the same failing chain is a loop.

**Unrecoverable partial state** (P10, P11)
A flow interrupted midway leaves state that blocks or corrupts the next attempt.
- For each multi-step flow, list what is written at each step. Stop after each step and start again, from the same device and another.
- Look for reservations, locks, half-created records, single-use tokens consumed before the step completed, and drafts that block new drafts.
- Check whether anything clears the leftover state and how long the person waits.

**Missing lifecycle case** (P8, P11)
A case the intent covers that the implementation does not handle: expired, revoked, role changed, plan lapsed, parent record archived or removed, empty, error, second tab, back or refresh mid-step, several organisations or none.
- For each gate and screen on the path, enumerate the lifecycle cases its inputs can take and find the handling for each.
- An unhandled case is a finding only when it is reachable and the intent covers it.

**Prerequisite out of reach** (P9)
A gate demands something the person cannot obtain from where they are, and no one tells them who can.
- For each requirement a gate enforces (a plan, a role, a verified email, an invitation, a profile field, a setting an admin controls), find the path that satisfies it and whether the blocked person can start it.

**Promise without path** (P13, P8)
Text tells a person they can do something the product gives them no working way to do.
- Collect promises from onboarding, empty states, emails, help text and marketing. Follow each to its implementation for the person who reads it.

## Inconsistency

**Surface disagreement** (P12)
Two surfaces give different answers about the same state for the same person.
- For each piece of shared state, list every writer and reader across apps, admin tools, APIs and jobs.
- Compare how each reader interprets it: an admin screen shows a person as active while the person's app treats them as removed; one app considers a plan live and another does not.

**Uneven enforcement** (P12)
A rule is enforced on some paths that perform an action and skipped on others.
- For each rule, list every path that performs the guarded action: UI, API, job, import, admin tool, second app.
- The finding is the path without the rule, with the person or data it affects.

**Divergent duplicate** (P12, P6)
Parallel implementations of a single capability that have drifted apart.
- Find capabilities implemented more than once: per app, per audience, per legacy and new path.
- Compare their rules, states and failure handling. Report differences the intent does not explain, and note when one copy is overfit residue.

**Words and behaviour apart** (P13)
Labels, messages, docs or emails that describe behaviour the product does not have at that moment for that person.
- Compare each claim with the path it describes. Include error messages that name the wrong cause and buttons whose label promises a different action.

## Wildcard

You are not given a class. Find intent gaps outside the classes already assigned, with the same evidence bar.

- Which code is strangest relative to what the product says it does? Why does it exist? Read its history.
- Which features look half-finished, bolted on, or built for a single conversation? Find the conversation in history or instruction files.
- Which rule in the instruction files is most absolute ("never", "always", "every")? Follow it into the code.
- Which state would a new teammate find hardest to explain to a person using the product?
- What happens when features meet that were built at different times: an invitation sent before a plan change, a draft created before a role change, an account linked after a workspace was archived?
- Which tests encode an example rather than a rule? What does the code do outside that example?

Pursue anomalies inside your assigned scope until the fit is settled. If a comment explains why something exists, verify the explanation against the intent sources.

## Obvious things

Other hunters look for subtle gaps. This one checks the literal list, item by item, and reports each result.

- Every redirect target is a page the redirected person can pass.
- Every return-to parameter resolves to a page that exists and that the person can reach.
- Every error page and empty state offers an action that works for the person who sees it.
- Every form has a failure path that keeps what the person entered and tells them what to change.
- Every enum value has a producer and a consumer. Every status has an exit or is documented as final.
- Every flag and mode has more than one reachable value in the deployed configuration.
- No conditions on literal identifiers, emails, names or counts from seed or demo data in code the deployed configuration reaches.
- No TODO, FIXME or HACK comments on a gate, a status transition or a migration.
- Sign-out on one surface and sign-in on another leave the person in a consistent state.
- Every email or notification links to a page the recipient can open.
- Copy that says "you can", "we will" or "automatically" is true for the person reading it.

A literal hit is not a finding until the person, intent and reachable situation are traced.
