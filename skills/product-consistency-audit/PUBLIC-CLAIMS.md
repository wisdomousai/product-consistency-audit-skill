# Public Claims

## When to use this file

Select this file when reconnaissance finds text that tells a person what the product does or will do:

- Marketing pages, landing pages and product descriptions, including page metadata.
- Pricing pages and plan comparison tables.
- Help content, documentation for people using the product, FAQs and changelogs shown to them.
- Transactional emails and notifications: invitations, receipts, reminders, alerts.
- In-product promises: empty states, onboarding copy, tooltips, confirmation dialogs, success messages, labels on actions.
- Error messages and failure pages.

## Core discipline

**Bar for a finding.** Text describes behaviour the product does not have at that moment for the person who reads it (P13), or sends them to a path that does not work for them (P8). A finding names the text and its location, the person who reads it, the behaviour on the path it describes for that person, and the difference. Wording preferences with no difference in meaning are out of scope.

**Where intent is written.** Public text is itself an intent source (P4). It can be the stale side or the current side of a disagreement. Decide which by its history and other sources: the commit that wrote the text, product docs and decision records, instruction files about copy (read under INSTRUCTIONS-AND-MEMORY.md), and the history of the behaviour. When text and behaviour disagree and no source shows which one states the intent, record `needs_owner_intent`.

**Person and goal.** Name the reader precisely: an anonymous visitor deciding to sign up, a buyer comparing plans, a member who received an email, a person reading an error, an invited person reading the invitation. The same text can be true for one reader and false for another (a feature listed for every plan and gated for some).

**Claim inventory.** For each surface in scope, extract every sentence that states a capability, a limit, a timing, a price, an automatic behaviour, a guarantee about data, or a next step. Record location, reader and the path it describes.

**Evidence methods.**

- `source`: the text and the code path it describes.
- `history`: when the text and the behaviour last changed, and which changed after the other.
- `local`: a walkthrough under the execution boundary in SKILL.md as the reader, following the text's own instructions. Emails go to a local outbox only. Never send real email or load a deployed page.

## Capability claims

Principles: P13, P4

Family: inconsistency

Marketing and product descriptions state capabilities. Some are missing, partial, available only to some readers, or removed since the text was written.

What to look for:

- Every capability sentence on marketing and description pages, traced to its implementation.
- Capabilities described as available to everyone that a plan, role or setting gates.
- Capabilities removed or reshaped in history while the description stayed.
- Specific numbers in copy (limits, durations, counts, supported formats) compared with the values in code.

What establishes a gap: the claim, its reader, the implementation for that reader, and the difference. Cite history to show which side changed last.

Not a gap:

- Descriptions of planned capabilities clearly marked as coming later.
- General product descriptions with no specific claim to check.

## Pricing and plan limits

Principles: P13, P12

Family: inconsistency

The pricing page lists what each plan includes. Gates, limits and checkout apply something else.

What to look for:

- Each row of the plan comparison, traced to the gate or limit that enforces it for that plan.
- Prices, trial lengths and seat counts in copy compared with the plan catalogue and checkout.
- Features listed as included that the gate checks against a different plan, or a literal plan name the catalogue no longer uses (see PLANS-BILLING-AND-ENTITLEMENTS.md).
- What the pricing copy says about cancellation, downgrade and data kept, compared with the implementation.

What establishes a gap: the pricing statement, the plan, the enforced behaviour for a person on that plan, and the difference.

Not a gap:

- Rounding or presentation differences with no effect on what a person can do or pays.

## Help content drift

Principles: P13, P8

Family: inconsistency

Help pages and docs for people using the product describe steps, screens and settings that have changed.

What to look for:

- Step-by-step instructions, followed literally against the current interface.
- Named buttons, menus and settings that no longer exist or have moved.
- Help that describes a self-service action now reserved for an admin, or the reverse.
- Help linked from the product itself (a "learn more" link next to a control) whose target describes other behaviour.

What establishes a gap: the help text, the reader, the steps that fail or differ, and the person's resulting dead end.

Not a gap:

- Outdated wording where the steps still work.

## Email and notification links

Principles: P13, P8, P11

Family: underfit

Emails and notifications send people to a page. The page rejects them, has moved, needs a state they lack, or no longer offers what the email described.

What to look for:

- Every link in every email and notification template, and the page each resolves to.
- The recipient's likely state when they click: not signed in, signed in as another account, invitation expired, workspace archived, plan lapsed, on another device.
- The gate on the destination and what it does for each of those states.
- Email text describing an action ("click to accept", "review your draft") compared with what the destination offers.
- Links that contain a token or return-to parameter and what happens when it is missing or expired.

What establishes a gap: the email, the recipient, their state on click, the destination's behaviour for that state, and the absence of a working next action.

Not a gap:

- A link to a sign-in page that returns the person to the intended destination after sign-in.

## Error message cause

Principles: P11, P13

Family: inconsistency

Error messages name a cause and suggest an action. The real cause differs, or the suggested action does not help.

What to look for:

- Every error branch on the paths in scope, and the message each produces.
- Messages that blame the person's input for a server-side or plan-side failure.
- "Try again" on failures that repeat on every attempt.
- Messages that name an internal identifier, a status value or a stack trace in place of a cause the reader understands.
- Several distinct causes collapsed into one message whose action fits only some of them.

What establishes a gap: the failure, the message and action shown, the real cause, and why the action does not work for the reader.

Not a gap:

- A general message whose action fits every cause it covers.

## In-product promises

Principles: P13, P10

Family: inconsistency

Interface text promises behaviour: "saved automatically", "you can undo this", "we'll notify you", "you can change this later", "your data is kept for 30 days". The behaviour differs.

What to look for:

- Every sentence with "automatically", "always", "you can", "we will", "later", "undo" or a stated duration in interface copy.
- The path each promise describes, traced for the person reading it.
- Confirmation dialogs that describe the effect of an action, compared with what the action writes.
- Success messages shown before the operation is confirmed.

What establishes a gap: the promise, its location, the reader, and the behaviour that contradicts it on that path.

Not a gap:

- Promises that hold for the reader, even when the implementation reaches them in an unexpected way.

## Copy aimed at another audience

Principles: P11, P1

Family: inconsistency

Text written for one person is shown to another: admin instructions shown to members, buyer copy shown to people who cannot buy, setup steps shown to invited people who will never perform them.

What to look for:

- Shared components and templates that render the same copy for different roles.
- Messages that tell the reader to do something only another role can do, without naming that role.
- Emails sent to every member that describe billing or admin actions.

What establishes a gap: the text, the reader who cannot act on it, the action it asks for, and the absence of guidance on who can.

Not a gap:

- Text that addresses a role and tells other readers who that is.

## Universal moves

- Build the claim inventory before reading code. Read each claim as its reader and follow its instruction.
- For every number in copy, find the value in code or configuration.
- For every link in templates, resolve the destination and walk it in each likely recipient state.
- For every error branch, read the message next to the code that raises it.
- Use history to decide which side of each disagreement changed last.

## Validation rules

1. Confirm the text exists at the cited location and is shown to the named reader in the deployed configuration.
2. Trace the described behaviour independently for that reader and confirm the difference.
3. Check history for which side changed last and whether a source states which is the intent. If nothing decides it, the verdict is `needs_owner_intent`.
4. For link findings, look for a sign-in step that returns the person, an alternative destination, or a message naming who can help.
5. For error findings, confirm the real cause from source and that the action shown does not work for it.
6. Check that the remediation names whether the text or the behaviour should change, and that changing one does not break another surface that relies on it.
