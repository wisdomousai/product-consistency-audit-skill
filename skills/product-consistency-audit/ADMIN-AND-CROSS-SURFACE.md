# Admin and Cross-Surface State

## When to use this file

Select this file when reconnaissance finds state written on one surface and read on another:

- Admin tools, back offices and operator scripts that change people, memberships, roles, plans or records.
- A second app or surface of the same product reading the same database or the same identity.
- Public or internal APIs that write the same records the interface writes.
- Background jobs, scheduled tasks and webhooks that change records a person is looking at.
- Imports, bulk uploads and data syncs.
- Active workspace, organisation or account switching, and any "current context" stored in a session, cookie or URL.
- Removal, role change and archive actions that one person takes on another person's access or records.

## Core discipline

**Bar for a finding.** A person's surface gives a wrong answer, blocks them, or loses their work because another surface changed shared state, or because a rule the person's surface enforces is skipped on another path. A finding names the writer, the reader, the shared state, the person on the reading side and the sequence that puts the surfaces apart (P12).

**Where intent is written.** Docs and help pages for admin tools; product docs describing roles, removal and archiving; decision records about which surface owns which state; instruction files about app boundaries and shared state (read under INSTRUCTIONS-AND-MEMORY.md); copy on admin actions describing their effect ("the member will lose access immediately", "archived projects stay readable").

**Person and goal.** Name the person who acts (an admin, an operator, an API client, a scheduled job acting for the product) and the person affected, who is usually mid-task on another surface. Their goal is to finish what they were doing or to understand what changed.

**Writer and reader table.** For each piece of shared state, list every writer with the values it can produce and the rules it applies, and every reader with the values it handles and the moments it refreshes. Mark values a writer can produce that a reader does not handle, and rules a writer skips.

**Evidence methods.**

- `source`: the writer and reader table and each path.
- `history`: commits that added admin actions, imports or second-app readers, and the origin of each rule they apply or skip.
- `local`: a walkthrough under the execution boundary in SKILL.md with the actor and the affected person as separate fixture people on separate local sessions. Serialise walkthroughs that share a data store.

## Unhandled externally produced values

Principles: P12, P11

Family: inconsistency

An admin tool, API, import or job can write a value that the person's surface never produces itself and does not handle.

What to look for:

- For each shared field, the set of values each writer can produce, compared with the values each reader branches on.
- Status values only an admin tool sets (suspended, flagged, locked) and what the person's surface shows for them.
- Imports that write free-form or legacy values into enum-like fields.
- Readers that fall through to a default branch, crash, or show a raw value for an unexpected input.

What establishes a gap: the writer and the value, a reachable path for it to be written, the reader that mishandles it, and what the affected person sees or cannot do.

Not a gap:

- A value the reader handles through a general case that gives the person the right answer and action.

## Rules skipped by imports and jobs

Principles: P12, P3

Family: inconsistency

The interface applies a rule (validation, a limit, a uniqueness check, a role requirement, a notification). An import, API, admin tool or job performs the same action without it.

What to look for:

- For each rule on an interface action, every other path that performs the same action.
- Validation in client forms or route handlers that the domain layer does not repeat.
- Bulk paths that bypass limits, then leave records that the interface's later checks reject.
- Notifications and side effects that only the interface triggers, so people added by import never receive an invitation email.

What establishes a gap: the rule, its source, the path that skips it, and the person or record affected afterwards (a person who never hears they were added, a workspace over its limit where every later action fails).

Not a gap:

- A path the sources say may skip the rule on purpose (an operator correction, a migration), when the result leaves no person in a state the interface cannot handle.

## Active workspace switching

Principles: P12, P8

Family: inconsistency

A person belongs to several workspaces or accounts and switches between them. Surfaces disagree about which one is active, or keep state from the previous one.

What to look for:

- Where the active context is stored (session, cookie, URL, client store, a column on the person) and every reader.
- Readers that use a different source from the switcher, so lists show one workspace while actions write to another.
- Links, emails and return-to parameters that point into a workspace other than the active one, and what happens on arrival.
- Caches, drafts and client stores keyed without the workspace.
- People with no active workspace (after removal from the last one) and what every surface does for them.

What establishes a gap: the switch sequence, the sources that disagree, and the person who sees or writes data in the wrong workspace, or reaches a page that rejects them for the wrong context.

Not a gap:

- Surfaces that intentionally span workspaces, such as a personal account page, when the sources say so.

## Removal during a task

Principles: P8, P11

Family: underfit

An admin removes a person from a workspace, deletes their account or revokes their access while they are working. The person's next action fails without explanation, or their work in progress is lost with no way to keep it.

What to look for:

- What the removal writes and how quickly each of the person's surfaces sees it: on next request, on session refresh, on next sign-in.
- What the person sees on their next action after removal: an accurate message, a generic error, a redirect loop, a silent failure.
- Work in progress (drafts, uploads, open sessions) and its fate on removal.
- What the sources say a removed person keeps, such as their own documents or an export, and whether that is reachable.

What establishes a gap: the removal, the person mid-task, the sequence of their next actions, and the outcome compared with the intent for removed people.

Not a gap:

- Immediate loss of access the sources describe, when the person sees a message saying they were removed and, where the sources promise it, a way to keep their own work.

## Role change during a session

Principles: P12, P11

Family: inconsistency

An admin changes a person's role while they are signed in. Some surfaces read the new role and others keep the old one until a refresh.

What to look for:

- Where roles are read: session claims, a per-request database read, a client store.
- Surfaces that show controls from the old role while the server enforces the new one, so actions fail with a generic error.
- Elevated roles granted that do not take effect until the person signs out and in, with no message saying so.
- Role changes that leave role-specific state behind (pending approvals assigned to someone who can no longer approve).

What establishes a gap: the role change, the readers that disagree, and the person who sees controls that fail, is denied what the new role grants, or leaves work stranded.

Not a gap:

- A refresh delay the sources accept, when actions fail with a message telling the person their role changed.

## Archived parent record

Principles: P8, P12

Family: underfit

Someone archives, deletes or closes a workspace, project or document that other records depend on. Child records, links, invitations and sessions pointing into it lead nowhere.

What to look for:

- Every relation into the archived record and what readers do when the parent is archived: hide, show read-only, error.
- Invitations, notifications and saved links into an archived parent.
- Child records whose own state machine has no case for an archived parent.
- Restore paths and whether they bring back memberships, roles and child state as the sources promise.

What establishes a gap: the archive, a reachable path from a child record or link, what the person sees, and the intent for archived records.

Not a gap:

- Children that become unreachable when the sources say archive removes access, and the person is told what happened.

## Stale copy after external change

Principles: P12, P10

Family: inconsistency

A surface keeps a copy of shared state (a cache, a session claim, a client store, a search index, a denormalised field) that an external change does not refresh.

What to look for:

- Every cached or copied form of shared state and its refresh triggers.
- External writers (admin tools, jobs, imports, other apps) that change the source without invalidating the copy.
- Gates that read the copy, so a person is blocked or admitted by stale data.
- Lists and counts that show the copy while detail pages show the source.

What establishes a gap: the copy, the external writer that leaves it stale, the reader that uses it, and the person who gets a wrong answer or is gated by it, with the staleness window.

Not a gap:

- A staleness window the sources accept, when no gate reads the copy.

## Universal moves

- Build the writer and reader table for every piece of shared state in scope before reading individual paths.
- For every interface rule, list every other path that performs the same action.
- Walk each external change with two fixture people: the actor and the person mid-task on another surface.
- Check what every surface does for the person after removal, role change, archive and workspace switch.
- Read copy on admin actions and compare it with the effect on the affected person's surface (PUBLIC-CLAIMS.md covers wider copy checks).

## Validation rules

1. Rebuild the writer and reader table for the state in the candidate and confirm each writer's values and each reader's handling.
2. Confirm the external writer is reachable in the deployed configuration and by the person or process named.
3. Look for invalidation, refresh or reconciliation the candidate missed: event handlers, cache busting, per-request reads, scheduled jobs.
4. Look for a source that states the surfaces differ on purpose for different audiences. If one exists, reject. The source must pass the provenance test in P4 (PRINCIPLES.md).
5. For removal and archive findings, confirm what the sources promise the affected person keeps, and check its reachability.
6. If sources do not say which surface owns the state or how quickly changes must reach other surfaces, the verdict is `needs_owner_intent`.
7. Check that the remediation names the writer or reader where the fix belongs and does not create a new disagreement on another surface.
