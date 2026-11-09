# Access and Identity Flows

## When to use this file

Select this file when reconnaissance finds any of these surfaces:

- Sign-up, sign-in and sign-out routes, including hosted identity provider callbacks and magic-link or code verification steps.
- More than one app or surface that shares an identity: a marketing site with a sign-in button, separate product apps, an admin app, a members area.
- Session creation, refresh and expiry; cookies or tokens that one surface sets and another reads; sign-out markers.
- Invitations to a workspace, organisation, document or role.
- Account linking, email change, merging accounts and adding a second sign-in method.
- Credential reset and account recovery.
- People who are members of something without their own login (people added by an admin, seats assigned by email, delegates).
- Role-based routing after sign-in, and return-to or redirect parameters.

## Core discipline

**Bar for a finding.** A person who should get in cannot, gets in as the wrong account or role, loops between surfaces, loses their place, or is left with an error they cannot act on. Every finding names the person, the entry point they used, each hop of the chain with the state read at that hop, and where the chain ends. A gate that looks strict is in scope only when a person the intent admits is stopped by it.

**Where intent is written.** Product docs and onboarding copy describing who can join and how; invitation and sign-in emails; help pages on account recovery; decision records about identity providers and multi-app sign-in; instruction files describing the sign-in chain or session rules (read under INSTRUCTIONS-AND-MEMORY.md); the wording on sign-in, error and expired-link pages.

**Person and goal.** Name the person precisely: first-time visitor, returning member, invited person who has no account yet, invited person who already has an account under another email, member whose role an admin changed, person whose session expired mid-task, member without their own login, person signed in on another app of the same product. Their goal is usually to reach a specific page, often one a link or email sent them to.

**Chain map.** For each entry point, write down every hop: URL, the gate, the cookies, tokens or records it reads, the destination on success and on each failure, and any parameter passed forward. Repeat for each identity state the person can be in at that hop. Stop when the chain ends or repeats.

**Evidence methods.**

- `source`: middleware, route guards, callback handlers, session code and the chain map.
- `history`: commits that added gates, markers and redirects, and the incident or instruction behind each.
- `local`: a walkthrough under the execution boundary in SKILL.md, using the target's local or demo identity provider with fixture people and a local email outbox. Never use a real identity provider account or a deployed sign-in page. States that need a real provider (a third-party session expiring, a provider-side account lock) stay at `method: source`.

## Cross-app sign-in loop

Principles: P8, P12

Family: underfit

Several apps or surfaces share a sign-in. Each has its own gate and redirect. A person whose state satisfies one gate and fails another bounces between them.

What to look for:

- Every app's sign-in redirect target and every callback's destination. Chain them for each identity state: signed in on app A only, signed in on the identity provider and not in app B, session cookie present and expired, cookie scoped to another subdomain.
- Gates that read different session sources: a cookie on one app, a token in storage on another, a provider session on a third.
- Callback handlers that redirect to a default app regardless of where the person started.
- Retry buttons on error pages that restart the same chain.

What establishes a gap: the chain map showing a repeat or a dead end for a reachable identity state, with the state read at each hop, and the person who reaches that state through ordinary use.

Not a gap:

- A chain that ends on a working sign-in form where the person can continue.
- A loop that only a state no producer creates can trigger.

## Sign-out marker left behind

Principles: P10, P12, P11

Family: inconsistency

Sign-out writes a marker (a cookie, a flag, a revoked-session row, a query parameter) so other surfaces know the person signed out. The marker outlives its purpose and blocks the next sign-in, or is missing on a surface that should read it.

What to look for:

- Every place sign-out writes state, and every reader of that state. Check whether a later sign-in clears the marker on every surface.
- Markers scoped to a domain or path that a sign-in on another surface cannot clear.
- Surfaces that ignore the marker and keep the person signed in after they signed out elsewhere, when the intent says sign-out is product-wide.
- Sign-out on one app that clears the shared session and leaves another app's local session alive, so the person sees conflicting answers.

What establishes a gap: the marker, its writer and readers, the sequence (sign out on surface A, sign in on surface B, visit surface C) and the state the person ends in, with the intent for sign-out scope cited.

Not a gap:

- Independent sessions per app when a source states that apps sign in and out separately.

## Session expiry and return path

Principles: P8, P10, P11

Family: underfit

A session expires while a person is mid-task. The product sends them to sign in and then fails to return them, drops what they entered, or returns them to a page that rejects them.

What to look for:

- Every return-to, next or redirect parameter: how it is set, encoded, validated, stored across the identity provider round trip, and consumed.
- Validation that rejects legitimate destinations (a path with a query string, a deep link into another app of the same product) and falls back to a default page.
- Return targets that require state the fresh session lacks, such as an active workspace selection, so the person lands on an error.
- Form submissions and server actions that fail on an expired session with a generic error and discard input.
- Background requests that fail silently on expiry, leaving the page looking saved.

What establishes a gap: the expiry point, the parameter or state that should bring the person back, the hop where it is lost or rejected, and what the person loses or where they land.

Not a gap:

- A return-to restricted to the same origin for safety, when the fallback page offers a working route to the destination.
- Loss of unsaved input on expiry when the surface tells the person before they start that input is not kept.

## Invitation lifecycle

Principles: P8, P9, P11

Family: underfit

An invitation passes through sent, opened, accepted, expired, revoked and resent. Each transition can strand the inviter or the invited person.

What to look for:

- What the invited person sees for each invitation state: valid, expired, revoked, already accepted, accepted by another account, for a workspace that was archived, from an admin who was removed.
- Whether an expired or revoked invitation page tells the person who can send a new one, and whether the inviter can resend from where they see the invitation.
- Single-use tokens consumed before acceptance completes, so a failure after consumption leaves no valid link.
- Invitations to an address that already has an account: is the person asked to sign in, or sent to sign up and blocked by a duplicate email?
- Unique constraints on (workspace, email) that block a new invitation after an earlier one was declined, expired or revoked.
- Role and plan checks at acceptance time that differ from those at sending time.

What establishes a gap: the invitation state, a reachable sequence that produces it, what the invited person or inviter can do there, and the absence of a path forward or of a message naming who can help.

Not a gap:

- An expired invitation page that names the inviter or workspace admin and explains how to ask for a new invitation, when the admin can resend.

## Account linking mismatch

Principles: P9, P11, P12

Family: underfit

The account a person signs in with differs from the one the product expects: an invitation sent to a work email accepted while signed in with a personal address, an added sign-in method that creates a duplicate account, an email change that breaks a link.

What to look for:

- Acceptance code that compares the invitation email with the signed-in account. What happens on mismatch: a block, a silent attach, an error with no way to switch accounts?
- Sign-in methods that key accounts differently (provider subject on some paths, email on others), so the same person ends up with duplicate accounts.
- Email change flows that leave invitations, memberships or purchases attached to the old address.
- Merge or link flows that leave half-linked records when interrupted.

What establishes a gap: the mismatch sequence, the records on each side, the person's goal, and the outcome: blocked with no way to switch account, a duplicate account holding part of their data, or access attached to the wrong identity.

Not a gap:

- A deliberate requirement that the invited email match, when the mismatch page explains it and offers sign-out and sign-in with the right account.

## Credential recovery path

Principles: P11, P8, P9

Family: underfit

A person who forgot a password, lost access to an email inbox or a second factor, or never set a password, needs a way back that does not depend on what they lost.

What to look for:

- Reset flows and what they require. A reset email sent to an address the person no longer controls with no alternative named.
- Accounts created through invitation, a hosted provider or an admin, which have no password to reset. What the reset page does for them.
- Reset tokens that a second request invalidates, so the first email's link fails with an unclear message.
- Reset success paths that land on a page requiring another step the person cannot complete.
- Recovery reserved for an operator with no message telling the person how to reach one.

What establishes a gap: the person's situation, the recovery path offered, the step that fails for them, and the absence of an alternative or of a message naming who can help.

Not a gap:

- Recovery that the intent reserves for support, when the person is told how to contact support from the page where they are stuck.

## Member without a login

Principles: P1, P9, P12

Family: underfit

Some members exist without their own login: added by an admin by name or email, holding an assigned seat, or represented through another person. Surfaces that assume every member can sign in break for them.

What to look for:

- Member records with no linked identity, and every surface that lists, notifies or gates them.
- Emails and notifications that ask such a member to sign in, open a link or confirm, when there is no account to sign in to.
- Paths for such a member to claim their record later: sign-up with the same email, an invitation, an admin action. What happens when they try.
- Admin views that show such members as active, pending or broken in ways that differ from what the member's later sign-up produces.

What establishes a gap: the member state, the surface that assumes a login, what the member or admin sees, and the intent source describing how such members are meant to take part.

Not a gap:

- Members without a login whom the product describes as passive records, when no surface asks them to act.

## Role landing mismatch

Principles: P8, P12, P3

Family: inconsistency

After sign-in the product routes people by role. A role the router does not expect, a role changed by an admin, or a person with several roles in several workspaces lands somewhere that rejects them.

What to look for:

- The role-to-destination map and every role value the data model allows. Values missing from the map fall to a default.
- Destinations whose own gate requires a different role than the router assumed.
- People with different roles in different workspaces, routed by a role read from the wrong workspace.
- Role checks added for a single incident and applied to every route (read the origin under INSTRUCTIONS-AND-MEMORY.md).
- Role changes made while the person is signed in, read from a stale session claim by the router and from the database by the destination.

What establishes a gap: the role or role combination, a person who holds it, the router's choice, the destination's gate, and the outcome.

Not a gap:

- A default destination that works for every role and offers navigation to the role-specific areas.

## Universal moves

- Build the chain map for every entry point and every identity state before reading individual gates. Most findings here sit between gates.
- For every cookie, token and session record, list the surface that sets it, its domain, path and lifetime, and every surface that reads it.
- For every redirect parameter, follow it from creation to consumption across the identity provider round trip.
- Walk each flow as the person who is furthest from the default: no account, a second account, an expired session, a changed role, several workspaces, no login of their own.
- For each failure page in the chain, read what it says and test what its action does for that person.
- Trace every identity-related state written by an admin tool or job, and compare it with what the person's surface reads (see ADMIN-AND-CROSS-SURFACE.md for the wider class).

## Validation rules

1. Rebuild the chain map independently from source for the identity state in the candidate. Confirm each hop and what it reads.
2. Confirm the identity state is reachable through ordinary use and the deployed identity configuration. A state only the local demo provider can create is out of scope.
3. Look for exits the candidate missed: a sign-out link on the error page, an account switcher, a support contact the page names, a resend action the admin can reach.
4. For loops, confirm the chain repeats without any state change that would break it on a second pass.
5. For states that need a real provider, keep `method: source` and confirm the source trace covers the provider's documented behaviour as the code depends on it.
6. Check the intent for sign-in scope (product-wide or per app), invitation matching and recovery ownership. If sources leave it open, the verdict is `needs_owner_intent`.
7. Check that the remediation names the hop where the fix belongs and does not open a path that admits a person the intent excludes.
