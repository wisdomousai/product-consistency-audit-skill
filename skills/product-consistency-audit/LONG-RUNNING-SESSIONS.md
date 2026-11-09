# Long-Running Sessions

## When to use this file

Select this file when reconnaissance finds work that spans more than a single request:

- Realtime sessions over WebSockets, server-sent events or long polling, including audio, video and collaborative editing.
- Reservations, locks, holds and leases: a slot reserved during checkout, a document locked while edited, a session slot held per person.
- Drafts and autosave, and any limit on concurrent drafts.
- Uploads, especially multi-part or resumable ones, and post-upload processing.
- Background jobs, queues and scheduled work whose results a person waits for.
- Approval and review flows where a person waits on another person.
- Timeouts, idle limits, maximum durations and close codes or close reasons.

## Core discipline

**Bar for a finding.** Work that spans time ends in many ways: completion, cancel, timeout, crash, lost connection, closed tab, a second tab, a server restart, a limit reached, a change made by someone else. A finding names the person, the work in progress, the way it ended, the state left behind, and what the person sees and can do afterwards. Each way of ending needs a defined fate (P10) and a message the person can act on (P11).

**Where intent is written.** Product docs and help pages describing sessions, drafts and uploads; in-product copy about saving, limits and timeouts ("your work is saved automatically", "sessions end after 30 minutes"); decision records about limits and concurrency; instruction files and memories that set caps, timeouts or locks (read under INSTRUCTIONS-AND-MEMORY.md, since a limit added after a single incident often spreads to every session type); provider documentation the code relies on for close codes and retry behaviour.

**Person and goal.** Name the person doing the work and anyone waiting on it: the editor and the co-editor blocked by a lock, the uploader and the reviewer, the requester and the approver. Name the device situation: a single tab, a second tab, a phone after the laptop went to sleep, a client that crashed.

**Lifecycle map.** For each kind of long-running work, write down the state written at start, during and at each kind of end; who or what clears each piece of state; every close reason or end code the server can produce, with the message and action the client shows for each; and the limits that apply with their sources.

**Evidence methods.**

- `source`: the lifecycle map, server close paths, client handlers, clean-up jobs.
- `history`: the commits that introduced limits, locks and close handling, with their origins.
- `local`: a walkthrough under the execution boundary in SKILL.md with realtime and model providers on fakes or deterministic local modes. Simulate a closed tab, a dropped connection and a second tab locally. Never use paid realtime or model providers to build a state.

## Orphaned reservation

Principles: P10, P8

Family: underfit

A reservation, lock, hold or lease is written at the start of work and released only on a clean end. Any other end leaves it in place and blocks the next attempt.

What to look for:

- Every reservation and lock: where it is taken, every release path, and whether it has an expiry.
- Release only in client-triggered handlers (an unload event, an explicit end button) with no server-side expiry.
- Per-person limits on concurrent sessions or drafts that count orphaned records.
- Locks on shared records that block other people until an owner returns.
- Expiry values that exist and are never enforced because no job checks them.

What establishes a gap: the reservation, an end that skips release, the next attempt it blocks with the person affected, and the wait or operator action needed to clear it.

Not a gap:

- An expiry short enough that a source accepts the delay, when the person is told how long to wait.

## Close reason mapping

Principles: P11, P13

Family: underfit

A session can end for many reasons. The client shows the same message for all of them, a wrong message, or nothing.

What to look for:

- Every close code, reason, error event and end status the server or provider can produce.
- The client handler for each, the message shown and the action offered.
- Reasons that fall to a generic "something went wrong" with a retry that repeats the same failure (a limit reached, a plan lapsed, a session replaced by another tab).
- Server-side ends that the client cannot see, leaving the interface in a live-looking state.
- Copy that tells the person their work was saved when the end path does not save it.

What establishes a gap: the end reason, a reachable way to produce it, the message and action the person gets, and why they do not fit: wrong cause, no action, or an action that fails.

Not a gap:

- Reasons grouped under a single message when the action offered is right for every reason in the group.

## Crashed client recovery

Principles: P10, P11

Family: underfit

The client disappears without a clean end: a crash, a killed tab, a laptop asleep, a phone switching networks. On return, the person finds work lost, a session still marked live, or a block.

What to look for:

- Server state for a session whose client vanished: still live, held, counted against a limit, billed.
- Heartbeat and idle detection: whether it exists, its timeout, and what it writes on expiry.
- What the returning client does with the earlier session: resume, start fresh, error because one is still live.
- Work in progress that exists only in client memory until a clean end.

What establishes a gap: the crash sequence, the leftover server state, what the person sees on return, and the absence of a recovery path or of an accurate message.

Not a gap:

- Loss of in-progress work that the product tells the person is not kept until they save, when the next attempt starts cleanly.

## Conflicting drafts

Principles: P10, P12

Family: underfit

Drafts and autosave write from several tabs or devices. One overwrites another, a second draft is refused, or a submitted draft stays editable on another tab.

What to look for:

- Autosave paths and their conflict handling: last write wins, version checks, merge.
- Limits on drafts per person or per record, and what happens when a second tab creates one.
- Submit or publish actions that do not close or refresh other open editors.
- Draft records left after submission or cancellation that a list or a limit still counts.

What establishes a gap: the multi-tab or multi-device sequence, the state each write leaves, and the person who loses work, is blocked from starting, or edits something already submitted.

Not a gap:

- Last-write-wins behaviour that the sources accept for a single-editor document, when no person loses work they were told was saved.

## Job outcome visibility

Principles: P11, P13, P8

Family: underfit

A person starts work that a background job finishes: an import, an export, a processed upload, a generated report. The job fails, stalls or finishes, and the person cannot see which.

What to look for:

- The status the person can see for each job and every job outcome that writes it. Failures and retries that never write a visible status.
- Jobs whose failure leaves the triggering record in a processing state forever.
- Notifications that announce success before the job confirms it.
- The retry or restart path for a failed job, and whether a person can reach it.

What establishes a gap: the job, an outcome that leaves the person without an accurate status or a next action, and the person waiting on it.

Not a gap:

- Jobs whose outcome no person waits for and no gate reads.

## Pending approval exit

Principles: P8, P9

Family: underfit

A person submits something for approval and waits. The approver leaves, loses the role, never acts, or the request expires. The requester stays in a pending state with no action.

What to look for:

- Every approval state and its exits: approve, reject, withdraw, expire, reassign.
- Requests whose approver was removed or lost the role, and whether anyone else can act.
- Withdraw or cancel actions for the requester, and whether they exist.
- Expiry of requests, and whether expiry tells the requester and lets them resubmit.

What establishes a gap: the pending state, a reachable sequence that leaves it with no approver able to act and no requester action, and the person stuck there.

Not a gap:

- A request the intent leaves pending until a named role acts, when the requester is told who that is and someone holds the role.

## Session limit spread

Principles: P3, P6, P2

Family: overfit

A cap, timeout, turn limit or concurrency rule added after a single incident on a particular kind of session applies to every session type, cutting off work the incident never involved.

What to look for:

- Every limit on sessions, uploads, drafts and jobs, with its value, where it is enforced and the commit that introduced it.
- Limits enforced in a shared helper or base session class, reaching session types added later.
- Limits whose origin names a cost or stability incident on a single session type or provider.
- Limits that end a person's work with no warning and no way to continue.

What establishes a gap: the limit, its origin, an enforcement point outside that origin, and the person whose work is cut off or burdened there.

Not a gap:

- A limit the sources state as product-wide on purpose, with a message telling the person before they reach it.

## Universal moves

- Build the lifecycle map for each kind of long-running work, listing every way it can end.
- For each piece of state written at start, find every path that clears it and whether a non-clean end reaches one.
- List every close reason and end code and read the client's handling of each.
- Reproduce the second-tab, closed-tab and dropped-connection cases locally with providers on fakes.
- Trace every limit to its origin and its enforcement points.
- Check what credits, seats or quotas a non-clean end consumes (see PLANS-BILLING-AND-ENTITLEMENTS.md).

## Validation rules

1. Rebuild the lifecycle map for the end in the candidate and confirm the state written and cleared at each step.
2. Look for server-side expiry, heartbeat timeouts, scheduled clean-up and admin actions that free leftover state. Confirm any job is scheduled in the deployed configuration.
3. Confirm the end reason is reachable in the deployed provider configuration. A reason that only a fake provider produces is out of scope.
4. For close reason findings, confirm the message and action the client shows from source or a local walkthrough.
5. For limit findings, look for a source that states the limit as product-wide. If one exists, reject the overfit reading. The source must pass the provenance test in P4 (PRINCIPLES.md).
6. Keep `method: source` for states that need a real provider or network condition the local setup cannot produce.
7. Check that the remediation gives every end a defined fate without removing a limit the origin needs.
