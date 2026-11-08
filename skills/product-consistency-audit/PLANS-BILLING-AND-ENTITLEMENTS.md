# Plans, Billing and Entitlements

## When to use this file

Select this file when reconnaissance finds any of these surfaces:

- Plan or tier checks that gate a capability, a limit or a quantity.
- Trials, grace periods, lapse, cancellation, downgrade and upgrade handling.
- Seats, credits, usage quotas and metered allowances.
- Manual grants, coupons, comps, overrides and complimentary access set by an operator or admin.
- Checkout and billing portal flows, with their success, cancel and failure returns, and payment provider webhooks.
- Pricing data stored in code, configuration or the database, and any copy that names plans or limits.

## Core discipline

**Bar for a finding.** A person who has paid, is entitled, or is willing to pay cannot use what the intent says they get, cannot find how to get it, loses something the intent says they keep, or is told one thing and given another. A finding names the buyer and every person whose access depends on the purchase, the entitlement state, every place that reads it, and the outcome.

**Where intent is written.** Pricing pages and plan comparison copy; checkout and upgrade copy; billing and cancellation help pages; terms that describe what a person keeps after a plan ends; decision records about plans, seats and grants; instruction files and memories about billing (read under INSTRUCTIONS-AND-MEMORY.md); the plan catalogue in configuration or the database, read as data and checked against the copy.

**Person and goal.** Billing separates the person who pays from the people who use. Name both: the buyer or billing admin who can change the plan, and the member who meets the gate and often cannot change it. Also name the person after the plan changes: lapsed, downgraded, removed from a seat, at the end of a trial, mid-way through a paid task when the limit is reached.

**Entitlement map.** For each entitlement, write down its source of truth (a provider subscription, a local plan column, a grant table, a credit balance), every writer (checkout, webhook, admin tool, job, migration), every reader (gates, limits, copy), and the moments each reader refreshes.

**Evidence methods.**

- `source`: the entitlement map and each gate's failure path.
- `history`: the commits that added plan checks, grants and special cases, and their origins.
- `local`: a walkthrough under the execution boundary in SKILL.md, with the payment provider on a fake or test mode the target documents and a local data store. Never take a real payment or call a live provider. States that need a real subscription lifecycle (a failed renewal at the provider, a dispute) stay at `method: source`.

## Paywall without a purchase route

Principles: P9, P11

Family: underfit

A gate requires a plan, seat or credit. The person who meets it cannot buy it and is not told who can.

What to look for:

- Every plan gate's failure path and what it shows. An upgrade button shown to a member who lacks billing rights, leading to a page that rejects them.
- Gates that show a generic error or an empty screen and never name the requirement.
- Upgrade flows that require a role, a verified email or a completed profile the person lacks.
- Gates on capabilities that the pricing copy lists for the person's current plan.

What establishes a gap: the gate, the requirement, the person blocked, and the absence of a reachable route to meet it or of a message naming who can (the billing admin, the workspace owner).

Not a gap:

- A gate that tells a member the billing admin must upgrade and names them or how to reach them.

## Access after plan end

Principles: P8, P11, P13

Family: underfit

A trial ends, a payment fails, a plan is cancelled or downgraded. The product's sources say what a person keeps. The implementation removes more, keeps more, or leaves people in a state with no way forward.

What to look for:

- What the sources promise after a plan ends: read access to existing documents, export, a grace period, data retention for a stated time.
- Every gate that reads plan state, and what it does on lapse: hide, block, delete, read-only.
- Over-limit states after downgrade: more members than seats, more projects than the plan allows. What each person sees and what an admin can do to resolve it.
- Data created under the higher plan that becomes unreachable, including the person's own documents.
- The route back: resubscribe, update payment, upgrade. Whether a lapsed person can reach it from the screens they see.

What establishes a gap: the plan-end event, the promised outcome with its source, the implemented outcome traced through each gate, and the person affected. Loss of a person's own data with no recovery meets the critical severity in SKILL.md.

Not a gap:

- Removal of access the sources say ends with the plan, when the person is told and offered a route back.

## Checkout return paths

Principles: P10, P11, P12

Family: underfit

Checkout leaves the product and comes back through a success, cancel or failure return, while the entitlement arrives separately through a webhook. Either can arrive first, late or not at all.

What to look for:

- The success return page and what it reads. A success page that checks the local entitlement before the webhook has written it and shows "not subscribed".
- Cancel and failure returns: where they land, and whether the person can retry without a duplicate subscription or a stuck pending record.
- Pending checkout records written before redirect that block a second attempt.
- Webhook handlers that fail on an unexpected event order (an update before a create) and leave the entitlement unwritten.
- Retry and idempotency handling for webhooks, and what the person sees while the entitlement is pending.

What establishes a gap: the sequence (redirect, return, webhook timing), the state written at each step, and a trace showing the person is denied what they paid for, charged twice, or blocked from retrying.

Not a gap:

- A short pending window the success page explains, with the page updating when the entitlement arrives.

## Entitlement source disagreement

Principles: P12

Family: inconsistency

The entitlement is read from more than one place: the provider, a local plan column, a cached session claim, a grant table, a per-app copy. Readers disagree.

What to look for:

- Every reader of plan state and which source it uses. Apps of the same product that read different sources.
- Grants or overrides that some gates check and others ignore.
- Session or token claims that carry the plan and are refreshed only at sign-in, so an upgrade or lapse shows on one surface and not another.
- Admin views showing a plan or seat status that the person's surface does not honour.

What establishes a gap: the sources, the readers that use each, a sequence that puts them apart (upgrade, lapse, grant, seat removal), and the person who gets different answers.

Not a gap:

- A cached copy whose refresh window a source accepts, when no gate denies a paid capability during that window.

## Seat and credit counting

Principles: P10, P12, P11

Family: inconsistency

Seats and credits are counted at several points: on invite, on acceptance, on use, on removal, on refund. Counting points that disagree leave seats held by nobody or credits spent on work that failed.

What to look for:

- Where seats are taken (invitation sent or accepted) and released (member removed, invitation revoked or expired). Pending invitations that hold seats forever.
- Credits deducted before a task completes and not returned on failure, cancellation or a crashed client (see LONG-RUNNING-SESSIONS.md).
- Limits checked on one path (UI) and skipped on another (API, import), so counts exceed the plan and later gates block everyone.
- Counts computed differently on the billing page and at the gate.

What establishes a gap: the counting points, the sequence that puts the count wrong, and the person blocked or charged as a result.

Not a gap:

- A count that a source says is reconciled by a scheduled job, when the job runs and the person is not blocked in the meantime.

## Plan identifiers in conditions

Principles: P7, P12

Family: overfit

Gates compare literal plan names, price identifiers or trial lengths. The first catalogue works. Any new plan, renamed plan or grant falls through.

What to look for:

- Conditions on plan names or price identifiers (`plan === 'pro'`, a list of price IDs) in gates and copy.
- Trial lengths, seat counts and limits written as literals in several places, compared with the plan catalogue.
- Grants and complimentary access that map to no plan name and so fail every literal check.
- Plan names from an instruction file's example or the first seed data.

What establishes a gap: the literal condition, the general rule the pricing sources state, and a real plan, grant or record in the deployed configuration that the literal mishandles.

Not a gap:

- A literal for a plan that the sources define as the only plan of its kind, with no grants or variants in the deployed configuration.

## Entitlement machinery beyond pricing

Principles: P6, P2, P3

Family: overfit

Plan logic grows states, tables and flags that the pricing never described: per-person overrides added for a single customer request, a trial status machine with values no path produces, grant types for situations that occurred once.

What to look for:

- Grant, override and exception tables. For each, its producers, the request or incident behind it, and whether any reader treats its types differently.
- Trial and subscription statuses beyond what the provider and the pricing copy distinguish.
- Flags that exempt one person or workspace from a gate, added in a commit that names a single case.
- Instruction-file rules about billing that produced this machinery (read under INSTRUCTIONS-AND-MEMORY.md).

What establishes a gap: the machinery, its origin, the absence of a distinct person situation in the pricing sources, and the cost: gates that must handle the extra states, a person stuck in one, or disagreement with the provider's view.

Not a gap:

- Grant and override machinery that a source names as an operating need (support credits, partner access) and that every gate reads.

## Universal moves

- Build the entitlement map before reading gates. Most findings here come from a writer and a reader using different sources or moments.
- Walk every gate as a member without billing rights, as the billing admin, and as a person after lapse, downgrade and seat removal.
- Follow checkout through every return and every webhook order the provider documents.
- List every literal plan name, price identifier, limit and trial length in code and compare with the catalogue and the pricing copy.
- Compare the pricing copy line by line with the gates for each plan (PUBLIC-CLAIMS.md holds the wider copy checks).

## Validation rules

1. Rebuild the entitlement map for the state in the candidate and confirm every writer and reader cited.
2. Confirm the plan state is reachable in the deployed configuration. A state that only a test-mode fixture can produce, with no production writer, is out of scope.
3. Look for exits: an upgrade path the person can reach, a message naming the billing admin, a grace period, a support route the intent names.
4. For plan-end findings, confirm the promised outcome in the cited source and its date. A later source that changed the promise refutes or narrows the finding.
5. For overfit machinery, look for a stated operating need (support, partner, compliance) before reporting.
6. For provider-dependent states, keep `method: source` and confirm the source trace matches the provider behaviour the code relies on.
7. Check that the remediation does not grant paid capability to a person the pricing excludes.
