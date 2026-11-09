# Onboarding and Setup

## When to use this file

Select this file when reconnaissance finds any of these surfaces:

- First-run steps after sign-up or first sign-in: welcome screens, step-by-step setup, checklists, tours.
- Required profile fields gated before the person can use the product.
- Workspace, organisation, team or project creation as part of first run.
- Client-side or server-side redirects that send a person to setup until a condition holds.
- Setup state stored per person, per workspace or in the client (a "setup complete" flag, a current step, a dismissed checklist).
- Skip, later and resume actions on setup steps.

## Core discipline

**Bar for a finding.** A person who should reach the product is held in setup, sent through setup they do not need, asked for something they cannot provide, or loses progress. Every finding names the person, how they arrived (self sign-up, invitation, admin-created account, a returning person after a migration), the setup condition the gate reads, and the outcome for that person.

**Where intent is written.** Onboarding copy and help pages describing first run; product docs saying who sets up a workspace and who joins one; decision records about required fields; instruction files and memories about setup steps (read under INSTRUCTIONS-AND-MEMORY.md, since setup steps are a common place where a single correction grows into a required field or a forced screen); marketing copy promising how quickly a person can start (cross-check under PUBLIC-CLAIMS.md).

**Person and goal.** Setup paths are usually built for the founder of a new workspace. Name the other people who pass through the same gate: an invited member joining an existing workspace, a person added by an admin, a member of several workspaces, a person whose earlier setup was interrupted, an existing person after a release added a new required step. Their goal is to reach the work they were invited or signed up for.

**Setup map.** For each setup step, write down the state it writes, the condition the gate reads to decide setup is needed, the destinations on each answer, and what skip, back, refresh and a second device do.

**Evidence methods.**

- `source`: the gate, the setup state, every writer and reader of it.
- `history`: the commit that added each required step or field, and its origin.
- `local`: a walkthrough under the execution boundary in SKILL.md with a fresh fixture person per path (founder, invited member, admin-created member). Stop at the first screen that holds the person.

## Forced setup redirect

Principles: P8, P9

Family: underfit

A gate redirects to setup until a condition holds. When the person cannot make the condition true from the setup screen, they loop or stop.

What to look for:

- Every redirect into setup and the condition it reads. Every action on the setup screen and the condition it writes. Compare them.
- Setup screens that themselves sit behind a gate the person fails (a plan check, a role check, a verified-email check), so the redirect target rejects them.
- Client-side redirects that run before data loads and send a person to setup on every page view.
- Conditions read from a cached session or client store that setup completion does not refresh.
- Setup steps that require an action only an admin can take, shown to a member.

What establishes a gap: the redirect, the condition, the person who fails it, and a trace showing the setup screen gives them no action that satisfies it, or sends them back to the redirect.

Not a gap:

- A redirect to a step the person can complete in place.
- A step that waits on an admin, when the screen names the admin and the member can leave and return.

## Required profile beyond need

Principles: P6, P2, P9

Family: overfit

Fields made required during setup that no capability uses, or that a single feature needs while they block the whole product.

What to look for:

- Every required field at setup and every reader of each field. A field with no reader beyond display, or a reader only in a feature the person may never use.
- Required fields introduced with an instruction edit or correction. Read the origin: often a single report ("the admin couldn't tell members apart") became a required job title for every person.
- Fields the person may not have or may not want to give, with no "not applicable" path, blocking the whole product.
- Fields required at setup and optional everywhere else (the profile editor allows clearing them).

What establishes a gap: the field, its readers, the origin of the requirement where traceable, the person blocked or burdened, and the smaller shape (asked at the point of use, optional, or limited to the audience the origin concerned).

Not a gap:

- A field a source says the product needs before any use (a legal name for a contract, a country for tax), when the person can provide it.

## Interrupted setup

Principles: P10, P11

Family: underfit

Setup spans several steps. A person who closes the tab, loses connection, uses back or refresh, or continues on another device returns to a state that blocks them.

What to look for:

- State written at each step: a half-created workspace, a reserved name or slug, a pending membership, a partially filled profile.
- What the next attempt does with that state: resumes, restarts and collides (a workspace name already taken by the person's own abandoned attempt), or errors.
- Setup progress stored only in the client, lost on another device, while server state already moved on.
- Steps that consume a single-use token or credit before completing.

What establishes a gap: the step after which the person stops, the leftover state, the next attempt, and a trace showing the leftover blocks or corrupts it.

Not a gap:

- Leftover state that expires quickly enough that a source accepts the delay, when the person is told to wait or can continue anyway.

## Workspace creation assumption

Principles: P7, P1

Family: overfit

First run assumes every person is founding a workspace. People joining an existing one are sent through creation, end up owning an empty workspace, or are asked billing and setup questions meant for an owner.

What to look for:

- First-run branches keyed on "has no workspace" that treat invited members, admin-created members and people with pending invitations as founders.
- Setup steps that create a workspace before checking for pending invitations.
- Owners of empty auto-created workspaces who then cannot find the workspace they were invited to, or whose active workspace defaults to the empty one.
- Seed and demo data where every person owns exactly one workspace, matching the first-run code's assumption.

What establishes a gap: the person who is not a founder, the branch that treats them as one, the resulting state (an extra workspace, wrong active workspace, owner-only questions), and the intent source that describes how such people join.

Not a gap:

- Products whose sources state that every person has a personal workspace by design, when joining another workspace works from there.

## Setup completion signal

Principles: P12, P6

Family: inconsistency

More than one place records whether setup is done: a per-person flag, a per-workspace flag, a step counter, the presence of required fields, a client store. Gates read different ones.

What to look for:

- Every writer and reader of setup completion. Compare which signal each gate reads.
- A gate that reads per-person completion in a product where setup is per workspace, so joining a second workspace skips its setup, or the reverse.
- Completion written at the end of the last step only, while an earlier step already made the product usable.
- Admin tools or imports that create people or workspaces without writing the signal, so those people are sent to setup.

What establishes a gap: the signals, the writers that leave them apart, the gates that read different ones, and the person who gets different treatment on different surfaces or is sent to setup after completing it.

Not a gap:

- Several signals maintained by a single writer in one transaction.

## Skipped step with no return

Principles: P8, P13

Family: underfit

Setup offers skip or later. After skipping, the step is unreachable, or a later feature requires what the step would have provided and does not offer it.

What to look for:

- Every skip or later action and what it writes.
- Whether the skipped step is reachable afterwards from settings, a checklist or the feature that needs it.
- Features that fail or show an empty state because a skipped step left data missing, without linking to the step.
- Copy on the skip action ("you can do this later in settings") compared with what settings offer.

What establishes a gap: the skip, the later need, the absence of a route back to the step from where the need appears, and any copy that promised one.

Not a gap:

- A skipped step whose data no feature requires, or whose need surfaces with a working link to complete it.

## Universal moves

- Build the setup map for each arrival path (self sign-up, invitation, admin-created account, existing person after a release) and walk each one.
- For every gate into setup, compare the condition it reads with every action that can make the condition true.
- Stop after each step, then return on the same device and on another, and record what the leftover state does.
- Trace every required field to its readers and its origin commit.
- Check what admin tools, imports and seeds write for setup state, since people created there skip the setup screens.

## Validation rules

1. Rebuild the setup map for the arrival path in the candidate and confirm the path is reachable in the deployed configuration.
2. Confirm the gate's condition and every writer of it. A writer the candidate missed (an admin action, a job, an import) may supply the exit.
3. Look for exits on the setup screen: skip, sign out, switch workspace, contact an admin, a link to the destination.
4. For required fields, look for a stated need in docs, decision records, legal or billing requirements. If one exists, reject the overfit reading. The source must pass the provenance test in P4 (PRINCIPLES.md).
5. For interrupted setup, confirm what the next attempt does from source or a walkthrough, and whether a clean-up or expiry frees the leftover state.
6. If sources do not say whether setup is per person or per workspace, or who must complete it, the verdict is `needs_owner_intent`.
