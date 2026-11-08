# Instructions and Memory

## When to use this file

Select this file whenever reconnaissance finds any written rule that shapes the code. That includes:

- Agent instruction files: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`, files under `.cursor/rules/`, `.github/copilot-instructions.md`, any other agent rule file reconnaissance lists, and nested copies of any of these in subdirectories.
- Memory or notes directories committed with the code, including per-agent memory folders, scratch notes and running logs of corrections kept by agents. Read their index files and every entry.
- Plan files, task lists, roadmaps and changelogs in the repository.
- Conventions documents, contributing guides, style guides and design contracts.
- Decision records (ADRs, RFCs, design notes) and any document that states how the domain works.
- Commit messages and merge descriptions that state a rule ("from now on", "always", "never", "per feedback", "as requested").
- Code comments that cite a rule or an instruction file ("per AGENTS.md", "as instructed", "do not remove: required by").

RECONNAISSANCE.md seeds one unit per material rule. A rule is material when it uses "must", "never", "always", "only", "every" or a stated limit, or when it states a model of the domain ("a workspace has one owner", "drafts are private until submitted").

## Core discipline

**Bar for a finding.** A written rule is a record of a decision. A finding in this domain is a gap between the problem the rule was written to solve and what the code does in the rule's name: enforcement past the origin (overfit), a stated need nobody built (underfit), or written sources and code paths that disagree (inconsistency). Every finding names the rule's text and location, its origin or a record of what was searched, the purpose that origin supports, the enforcement point or missing case, and the person affected or the change made harder (P1, P2, P3).

**Where intent is written.** The rule's own text is the first source and the least reliable for scope. Read, in this order:

1. The paragraph around the rule, including headings, examples and any incident it mentions.
2. The commit that introduced the rule: `git log -S '<distinctive phrase>' -- <file>`, `git log --follow -p -- <file>`, `git blame -w -C -C <file>`. Quote the commit message.
3. Code committed in the same commit or the next few commits: `git show --stat <sha>`. Agents often add a rule and its enforcement together, and the co-committed diff shows what problem was in view.
4. Issue or pull request numbers, dates, error messages or names of screens that the rule or its commit mentions. Search history and docs for them.
5. Later edits to the same rule: widenings, narrowings, rewordings, removal.
6. Other sources that state the same rule or its purpose: product docs, decision records, user-facing copy.
7. Prior owner decisions in `decisions.json`, which rank above every written source.

**Person and goal.** Name the person the rule was meant to protect or serve and the person the enforcement reaches. They are often different. A rule written to stop a workspace admin from deleting shared documents by mistake may end up blocking a member from deleting their own drafts. Name both, with their goals.

**Evidence methods.**

- `history`: the origin commit, the co-committed diff, later edits and removed lines. Most findings in this domain rest on history.
- `source`: every enforcement point of the rule in code and data, listed with paths.
- `local`: a walkthrough under the execution boundary in SKILL.md, used only when the effect on a person decides the finding (the person is blocked, sees a wrong message, cannot leave a state). Record the fixture person and the steps.

**Build a rule record before hunting.** For each assigned rule, write down in scratch:

- Text and location, plus every copy of the same rule in other instruction files.
- Origin: commit, message, co-committed paths, any incident named. Or `not_traceable` with the searches run.
- Purpose: the problem the origin shows, in one sentence.
- Supported scope: the surfaces, people and data where that problem can occur.
- Enforcement points: every place the rule shows up. Search identifiers, comments, schema, migrations, database constraints, seed data, validation schemas, middleware, shared helpers, tests, lint or boundary scripts, CI checks, model prompts the product sends, and user-facing copy.
- For each enforcement point: inside or outside the supported scope, and what it costs there.

A rule with no findable origin is read at its plainest scope (P2). It is a basis for an owner question only when the deciding case depends on its scope.

## Rule turned into schema

Principles: P2, P3, P6

Family: overfit

A correction given once, often in conversation with an agent, becomes columns, enums, tables, statuses or constraints that encode the wording of the correction. The data model then carries the correction forever, and every later feature must handle it.

What to look for:

- A rule whose key nouns or verbs appear as identifiers: a rule "drafts must not be visible before review" next to a `visibility_state` enum, a `review_gate_passed` boolean and a `pre_review_hidden_at` timestamp.
- Migrations committed together with an instruction-file edit, or within a few commits of it. Diff them side by side.
- Status values or flags whose only producer is the code path the rule describes, and whose consumers are guards added in the same change.
- A table that records exceptions to the rule, or compliance with it (`*_overrides`, `*_acknowledgements`, `*_exemptions`), when the rule's purpose needed only a predicate at one point.
- Database CHECK constraints or unique indexes that enforce a rule the origin tied to a single screen or action.
- Code comments on schema fields that cite an instruction file or a conversation.

What establishes a gap: the rule and its origin, the schema elements built from it with their introducing commit, a statement of the smaller shape that solves the origin's problem (often a single condition at the action the incident involved), and a cost: a state a person can enter and not leave, a combination other features must handle, a capability blocked, or a migration needed to change course. Severity follows the cost under SKILL.md.

Not a gap:

- Schema that the rule's source asks for in so many words, such as "keep an audit log of every role change".
- Fields that also serve a stated need unrelated to the rule (audit, recovery, compliance, a documented capability).
- A rule turned into a single column that every reader handles the same way and that no person can get stuck in.

## Absolute wording past its origin

Principles: P2, P3

Family: overfit

Instruction files favour short absolute sentences. "Never delete user data." "Always require confirmation." "Only admins can invite." An agent reading the sentence later applies it everywhere the words fit, while the origin covered a single surface or kind of data.

What to look for:

- Every "never", "always", "only", "every", "all", "must" and "no" in the assigned instruction files. Rank them by how much code cites or follows them.
- For each absolute: the noun it governs ("user data", "actions", "members"). Then search the code for every type, table and action that noun could be read to cover.
- Shared helpers, middleware, base classes, validation schemas and database defaults that apply the rule globally. One global helper often explains dozens of enforcement points.
- Enforcement on data the origin never involved. A rule written after a person lost a document applied to invitations, sessions and expired tokens. Soft-deleted invitations then collide with a unique index, and an admin cannot invite the same address again.
- Enforcement on audiences the origin never involved. A confirmation step written for destructive admin actions applied to a member saving a draft.

What establishes a gap: the absolute rule, an origin narrower than its words (from the commit, the surrounding paragraph or the incident it names), an enforcement point outside that origin, and a person who is blocked, confused or burdened there, or a model element that exists only to satisfy the wording.

Not a gap:

- An absolute whose source states the broad scope on purpose and explains why. Read the whole paragraph and the commit before deciding the scope is narrow.
- Broad enforcement that costs nobody anything and adds no state.
- An absolute with no findable origin, read at its plainest scope, when the code follows that plainest reading. Record what was searched.

## Instruction example as special case

Principles: P2, P7

Family: overfit

Instructions illustrate rules with examples: a sample plan name, a sample limit, a sample role, a sample workflow. Agents build the example. The code then handles the example correctly and the general case poorly or not at all.

What to look for:

- Literal values from instruction files in conditions: a plan name, a trial length, a seat count, a role name, a locale, an email domain, a sample workspace name, a file type.
- An instruction that says "for example" or "such as" followed by a value that appears in code as a constant or a branch condition.
- Code that handles exactly the cases an instruction listed, when the list was illustrative. An instruction says "for example, PDFs and images" and the upload validator accepts only those types while the product's docs describe documents in general.
- Tests whose fixtures match the instruction's example and whose assertions stop there.
- Branches that only the example data reaches, checked against seed data and the deployed configuration.

What establishes a gap: the instruction with its example, the code that encodes the example, the general case the instruction's purpose covers (cited from the instruction's own wording or another source), and a real person or record that the special case mishandles in the deployed configuration.

Not a gap:

- A list in an instruction that is exhaustive by its own wording ("only these file types are supported").
- Example values in fixtures, demos and test setups that the deployed configuration cannot reach.

## Conversation memory as product rule

Principles: P2, P3, P4

Family: overfit

Agent memory files record what one session learned: a correction, a preference, a mistake to avoid. They are written quickly, in general terms, and lose the context that produced them. A later agent reads the memory as a product requirement and builds it into code far from the original conversation.

What to look for:

- Memory or notes entries phrased as general rules whose body or commit names a single incident ("after the owner pointed out", "the reviewer complained", "in the invitation screen").
- Memory entries with no counterpart in product docs, decision records or user-facing copy. These are personal working notes until another source confirms them as product intent.
- Code comments or commit messages that cite a memory entry, or that repeat its distinctive wording.
- Memory entries about how an agent should write or work (tooling, style, process) that have turned into product behaviour, such as a writing preference turned into a validation rule on what people may type.
- Memory entries whose date precedes a later instruction or decision that changed the same topic, still followed by newer code.

What establishes a gap: the memory entry, the context it came from (its own body, its commit, the conversation or incident it names), the purpose that context supports, code that enforces the entry outside that purpose, and the cost for a person or for later changes.

Not a gap:

- A memory entry that restates a rule found in a product source. Assess the product source under the other classes instead.
- Memory about agent workflow that stays in agent workflow and never reaches product code or data.

## Withdrawn rule still enforced

Principles: P2, P6, P12

Family: overfit

A rule was removed, reversed or replaced in the instruction files, while the states, guards and copy it produced stayed. This class specialises the residue class in FIT-CLASSES.md for rules whose withdrawal is recorded in a written source.

What to look for:

- Removed lines in instruction, memory and plan files: `git log -p -- <file>` and read every `-` line that stated a rule. Include renamed and deleted files (`git log --diff-filter=D --name-only`).
- Rules marked superseded in decision records, and plan items marked dropped or reversed.
- For each withdrawn rule, the enforcement points it had at its peak. Use the commits that introduced it and search for its identifiers today.
- Enum values, columns, flags and branches whose producer was removed with the rule while consumers remain, or the reverse.
- Copy, help text and emails that still describe the withdrawn behaviour.
- A replacement rule implemented alongside the old enforcement, so both run.

What establishes a gap: the withdrawal (removed text and its commit, or the superseding record), the surviving enforcement or state, and its cost: a state a person can still reach, a guard that still blocks, a case other features must still handle, data that misleads, or copy that describes behaviour that no longer exists.

Not a gap:

- Data kept for history when a source names that need and no reader branches on it.
- A withdrawn rule whose removal commit states that existing data stays as it is, when no person can reach the old state.

## Contradicting written rules

Principles: P5, P12

Family: inconsistency

Instruction files, memories, plans, conventions and decision records accumulate over time and from several hands. Two of them can require incompatible things for the same surface. Code written under each one then disagrees.

What to look for:

- Rules on the same topic in different files: root and nested instruction files, instruction files for different agents, memory entries and decision records, a plan and a convention document.
- Rules on the same topic in a single file, added at different times. `git blame` shows the dates.
- Paths that follow each reading. Search for the code each rule produced and note which commit and which instruction version it followed.
- Conventions that decide precedence: a nested file narrows the root for its directory, a dated decision record supersedes an earlier one, an owner decision outranks both. Check whether any source states such a convention for this repository.

What establishes a gap: both rules quoted with locations, the surface where they collide, and code paths that follow different rules for the same person situation (inconsistency, P12). When the sources and their origins settle which rule governs, the path following the other is the finding. When nothing settles it, record `needs_owner_intent` with both readings and what each would require of the code (P5).

Not a gap:

- Rules that look contradictory and govern different audiences, surfaces or data, once their origins are read.
- A later rule that explicitly replaces an earlier one, with code that follows the later rule everywhere. Any surviving enforcement of the earlier rule belongs under Withdrawn rule still enforced.

## Drift between instruction copies

Principles: P4, P12

Family: inconsistency

Teams and agents keep parallel instruction files: a `CLAUDE.md` and an `AGENTS.md` with overlapping text, a root file and package-level copies, a rules folder for one agent and a single file for another. One copy is edited and the others are not. Agents reading different copies build different behaviour.

What to look for:

- Overlapping passages across instruction files. Diff them and list every rule that differs in wording, scope or presence.
- For each difference, which copy changed last and in which commit, and whether that commit's message explains the change.
- Code written under each version: commits whose trailer or message names the agent, or whose date falls between the two edits. Compare the behaviour each produced on the same capability.
- Divergent duplicates (FIT-CLASSES.md) whose split traces back to differing instruction copies.
- Nested copies that repeat a root rule with a narrower or wider scope than the root.

What establishes a gap: the differing passages with locations, the edit history showing which copy is current and why, and code that follows the stale copy on a path where a person or a later change is affected. When history cannot show which copy states the current intent, record `needs_owner_intent`.

Not a gap:

- Copies that differ in wording with no difference in meaning.
- A nested copy that narrows a rule for its own directory when the root states that nested files may do so.
- Drift in passages about agent workflow that never reached product code or data.

## Instructed case left unbuilt

Principles: P4, P8, P9

Family: underfit

Instruction files and decision records often state what a person must be able to do: "removed members keep read access to their own documents", "an expired invitation can be resent by any admin", "people can leave a workspace on their own". Some of those statements were never implemented, or were implemented on one path only.

What to look for:

- Rules phrased as a person capability ("can", "must be able to", "keeps", "is never left without").
- Lifecycle statements in decision records: what happens on removal, lapse, archive, expiry, role change.
- Plan items marked done whose described behaviour has no implementation.
- For each statement, the code path that should deliver it, traced from the person's entry point.

What establishes a gap: the statement with its location and date, its origin or a record of what was searched, the person and situation it covers, and a trace showing the situation is reachable and the stated capability is absent or broken there. The statement is intent from outside the code (P4). Its absence becomes a dead end or a prerequisite out of reach for the person (P8, P9).

Not a gap:

- A statement that a plan file, roadmap or decision record marks as future work, when no surface tells a person it exists.
- A statement withdrawn later in history.
- A capability delivered through a support path that the intent names, when the person is told how to reach it.

## Universal moves

- Read every instruction, memory and plan file in full, including nested copies. Rules in a nested file often explain code in that directory that looks odd from the root.
- Build the rule record for every assigned rule before reading enforcement. Origin first, then purpose, then supported scope, then enforcement.
- For every absolute, list enforcement points before deciding anything. Start at shared helpers, middleware, validation schemas, database constraints and defaults, because a single enforcement point there reaches every caller.
- Diff overlapping instruction files and read the removed lines in their history. Both produce findings that a reading of the current files alone misses.
- Read the co-committed diff for every rule-adding commit. When a rule and a migration or enum change arrive together, check the schema elements under Rule turned into schema.
- Grep code comments for instruction file names, "as instructed", "per feedback", "requested", "do not remove" and the distinctive wording of each assigned rule.
- Compare tests with the rules they cite. A test that asserts the instruction's example and nothing else points at Instruction example as special case.
- Group every finding by its `literal_source`. VALIDATION-AND-OWNER-REVIEW.md turns each rule into a decision for the owner, so the rule's exact location and text must be identical across findings that share it.
- Every overfit or drift finding names the instruction change in `remediation.instruction_changes`: narrow the rule to its origin's scope, add the origin to the rule's text, remove it, or reconcile copies.

## Validation rules

1. Re-derive the origin independently. Run the history searches yourself and confirm the cited commit introduced the rule. Look for other commits that restated or widened it with a broader purpose. A narrow first origin does not settle scope when a later commit restated the rule with a wider reason.
2. Read the rule's full paragraph and file. Surrounding text often states the broad scope on purpose, or limits it.
3. Confirm every listed enforcement point exists at the cited path and line and is reached in the deployed configuration.
4. Look for a stated need that refutes an overfit reading: a product doc, decision record, compliance or audit note, recovery requirement, or owner decision in `decisions.json` that asks for the broad enforcement. If one exists, reject.
5. Look for an exit that refutes an underfit reading: a support path the intent names, an admin action, a background clean-up, a later commit that built the stated capability on another path.
6. For contradictions and drift, confirm both sources were live at the same time and that code follows each. If history settles which source is current, the finding is the stale path. If nothing settles it, the verdict is `needs_owner_intent`.
7. For a `not_traceable` origin, confirm the searches listed were run and were adequate. Read the rule at its plainest scope. Overfit cannot rest on an untraceable origin unless the excess is clear from the plainest reading.
8. Check that the remediation names the instruction change and that applying it would not reopen the problem the origin describes.
