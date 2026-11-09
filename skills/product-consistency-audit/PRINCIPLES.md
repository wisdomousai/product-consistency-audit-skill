# Audit Principles

Every phase of the audit works from these principles. Reconnaissance uses them to build the intent register. Hunters, coverage critics and verifiers receive this file in their prompts, either verbatim or, for agents that can read files, as an absolute path with an instruction to read it in full before starting. Every finding cites at least one principle ID in its `principles` field, and every fit class in [FIT-CLASSES.md](FIT-CLASSES.md) names the principles it comes from.

The IDs are stable. Ledgers and findings from earlier runs reference them, so a principle may be reworded but never renumbered or reused for a different idea.

Each principle has four parts:

- **Statement**: the expectation the product should meet.
- **Check**: what the auditor looks at.
- **Evidence**: what establishes a gap.
- **Not a gap**: common readings that look like a gap and are not.

## Intent

### P1 Person and goal

**Statement.** Every capability serves a person who has a role and a goal. A gap exists only in relation to that person.

**Check.** Before reading implementation, name who uses the capability, what they are trying to get done, and what they can see and do at that point. Include people who reach the capability indirectly: an invited user, someone whose account an admin changed, a buyer whose plan lapsed, a person on a second device.

**Evidence.** A named person, a goal that the product's own sources attribute to them, and a reachable situation where the goal is affected.

**Not a gap.** Code that looks odd but affects no person and makes no future change harder. Developer convenience paths that the deployed product cannot reach.

### P2 Purpose of a rule

**Statement.** An instruction, rule, memory, ticket or comment exists to solve a problem. The intent is that purpose. Wording that reaches past the purpose is not intent.

**Check.** For each written rule that shapes a capability, find the problem it was written to solve. Look at the surrounding text, the commit or conversation that added it, and the incident it mentions. Then compare what the code enforces with what that problem needed.

**Evidence.** The rule's text, its origin, and code that enforces the rule in places or forms the origin does not support.

**Not a gap.** Code that follows a rule broadly when a source other than the rule's own file or a restatement of it states the broad scope on purpose and passes the provenance test in P4. A rule whose origin cannot be found is not automatically overfit; record what was searched and read the rule at its plainest scope.

### P3 Scope from origin

**Statement.** A rule that came from one incident or one example covers that kind of incident. Applying it to unrelated surfaces, data or people is overfit unless a source widens it.

**Check.** For each rule, list every place it is enforced. For each place, ask whether the incident behind the rule could happen there.

**Evidence.** A rule with a traceable narrow origin, and enforcement on a surface, audience or data type the origin does not cover, with a consequence for some person or for the model.

**Not a gap.** Shared helpers that apply a rule everywhere because a source that passes the provenance test in P4 states the rule as universal. Consistency for its own sake is fine when it costs nothing.

### P4 Intent from outside the code

**Statement.** The implementation shows what was built. It cannot be the only evidence of what was meant.

**Check.** Every intent statement in the register cites at least one source other than the code under review: product descriptions, docs, specs, decision records, user-facing copy, agent instruction files and memories, sibling surfaces, tests. Instruction files and memories count as evidence of a decision and are themselves checked under P2 and P3.

**Provenance.** Every source also has a provenance, separate from its kind (doc, instruction file, decision record, commit), that says who decided what it states:

- `owner_statement`: the owner stated the point themselves, in a recorded owner decision answered in their own words or to a single question that put the point to them, a document passage that quotes them, or a commit or message the owner confirms they wrote. It decides the point.
- `accepted_recommendation`: someone else, often an agent, wrote it and the owner accepted that item on its own. It decides the point unless its reason rests on the rule under review.
- `bulk_accepted_recommendation`: accepted together with other items without an answer to each ("accepted every recommendation").
- `unattributed`: nobody is recorded as deciding it. Most instruction files, memories and agent-written docs are here, and so is a commit that has agent trailers or session links or whose message restates an instruction file, unless the owner confirms writing it.

Bulk-accepted and unattributed sources state intent for the register, but they never refute an overfit candidate against a rule they restate. A decision that gives a written rule as its reason inherits that rule's scope question under P2 and P3, and a rule's own paragraph cannot widen the rule's scope. Only a source at `owner_statement` rank, or an `accepted_recommendation` whose reason does not rest on the rule, answers a scope question. Every validation rule in this skill that rejects a candidate because "a source states" or "a stated need exists" applies this test.

**Evidence.** A cited source, with location, that states or clearly implies the purpose.

**Not a gap.** A difference between code and an intent that was itself inferred from that same code.

### P5 Owner questions for ambiguity

**Statement.** When sources conflict, or are silent on a case that decides the outcome, the audit records a question for the owner instead of choosing an answer.

**Check.** Before reporting, confirm that the intent used is the only reasonable reading of the sources. If two readings survive, write the question and what the code would need under each answer.

**Evidence.** The conflicting or silent sources, quoted with locations.

**Not a gap.** Ambiguity that the sources resolve once read in full. Silence on a case nobody can reach.

## Fit

### P6 Proportionate model

**Statement.** Every state, status, table, mode, flag and branch stands for a situation the product must tell apart for some person. Ones that exist only because a rule was read literally, or that model a misunderstanding of the domain, are overfit.

**Check.** For each state and each flag, name the person situation it represents, what produces it, what reads it, and how a person leaves it. Look for states that differ only in wording, combinations the domain makes impossible but the model allows, flags with one reachable value, and branches that handle situations no producer creates.

**Evidence.** The model element, the absence of a distinct person situation behind it, the source it was built from where traceable, and the cost it imposes: extra cases other features must handle, states a person can enter and not leave, or migrations needed to change it.

**Not a gap.** States that exist for audit history, compliance or recovery when a source names that need. Internal states that never reach a person and keep a process correct.

### P7 General case

**Statement.** Code built for the example it was first written against, such as seed data, a demo identity, the first customer, a single locale or the scenario in the original prompt, is overfit.

**Check.** Look for literal identifiers, names, counts, locales, plan names and fixture values in conditions; branches that only the seed data reaches; and assumptions that hold for one record but not for many.

**Evidence.** The special case, the general case the intent covers, and a real person or record that the special case mishandles.

**Not a gap.** Fixtures and demo paths that the deployed configuration cannot reach.

### P8 A way forward or back

**Statement.** From every state the product can put a person in, there is a working action toward the goal or back to a state that has one.

**Check.** For each gate, redirect, error page and terminal status, follow where the person goes next. Confirm that the destination accepts them and that it is not the place they came from.

**Evidence.** A reachable state, the actions available in it, and a trace showing that none leads toward the goal or back to a working state.

**Not a gap.** Terminal states the intent defines as final, when the person is told so and has nothing further to do.

### P9 Prerequisites before demands

**Statement.** When a step requires something, such as a plan, a role, a verified email, an invitation or a profile field, the person can obtain it from where they are or is told who can.

**Check.** For each requirement a gate enforces, find the path that satisfies it and whether the person blocked by the gate can start that path.

**Evidence.** The gate, the requirement, and the absence of a reachable way to meet it or of any message naming who can.

**Not a gap.** Requirements met by another person, when the blocked person is told who that is.

### P10 Defined fate for interrupted work

**Statement.** A step abandoned midway, through a closed tab, a lost connection, back, refresh or a second tab, leaves state that the next attempt can use or clear without help.

**Check.** For each multi-step flow, list the state written at each step. Ask what happens when the person stops after that step and later starts again, from the same device or another.

**Evidence.** Leftover state, the next attempt, and a trace showing that the leftover blocks or corrupts it.

**Not a gap.** Leftover state that expires quickly enough that the person does not notice, when a source accepts that delay.

### P11 Failures the person can act on

**Statement.** Every error, expiry, revocation, lapse and rejection ends in a message and an action that fit the person who sees it. Ordinary mistakes are recoverable without support or a database edit.

**Check.** For each failure branch, read what the person sees and what they can do next. For each ordinary mistake (wrong input, wrong choice, abandoned step, forgotten credential), find the recovery path.

**Evidence.** A failure outcome with no message, a message aimed at a different person, or an action that does not work for this person; or a mistake whose only recovery is operator work.

**Not a gap.** Recovery that the intent deliberately reserves for an operator, when the person is told how to reach them.

## Consistency

### P12 Surfaces agree

**Statement.** Surfaces that read or enforce the same state give the same answer, and a rule applies on every path where its action can happen: UI, API, background job, admin tool, import and any second app.

**Check.** For each piece of shared state, list every writer and reader. For each rule, list every path that performs the guarded action.

**Evidence.** Two surfaces giving different answers about the same state for the same person, or a path that performs the action without the rule.

**Not a gap.** Deliberate differences between audiences that a source states.

### P13 Words match behaviour

**Statement.** Copy, labels, docs and emails describe what the product does at that moment for that person.

**Check.** Compare promises in user-facing text, marketing pages, help content and notifications with the behaviour on the path they describe.

**Evidence.** The text, its location, and the behaviour that contradicts it for the person who reads it.

**Not a gap.** Wording preferences with no difference in meaning.

### P14 One definition per lifecycle

**Statement.** When a record, a person or a screen moves through states, the states and the allowed moves between them are defined in one place. Every writer changes the state through that definition, and every reader gets the state from it: the product's screens, its API, its CLI and the tools agents use.

**Check.** For each lifecycle, find where its state is stored and where it is derived. List every writer with the guard and side effects it applies, every reader with the expression it uses to tell the state, and what API, CLI and tool responses and refusals say about the state and the allowed next actions. Compare instruction-file prose about the lifecycle with the code.

**Evidence.** The lifecycle, the places that encode or derive its state, and a cost: readers that tell the same record's state differently, a move the sources forbid that a writer can still make, a person or agent left in a state with no named next action, or a lifecycle change that has to be made in several places that have already drifted.

**Not a gap.** A fact with two values, a single writer and no moves that a boolean already names. A lifecycle defined in a library or framework the target uses, when every writer goes through it. A definition mirrored in a database constraint and a code type that a check keeps in step.
