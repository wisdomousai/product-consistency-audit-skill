# product-consistency-audit

A coding-agent skill that checks whether a codebase does what the product is for. It infers the intent behind each capability from sources outside the code, finds where the implementation does not fit that intent, verifies every candidate with a fresh agent, and then works through the resulting decisions with you in short rounds of questions.

It looks for three kinds of gap:

- **Underfit**: a reachable case where the intent is not met. Someone is locked out, stuck in a state with no way forward or back, sent in a loop, left with half-finished state that blocks the next attempt, or shown an error they cannot act on.
- **Overfit**: code built from a literal reading of an instruction, memory, example or misunderstanding, going well past what the product needs. Agent-written codebases are prone to this: a single correction in a chat or an instruction file becomes new statuses, tables, flags, guards and branches that model the wording instead of the problem. The data model gets awkward, every feature has to handle the extra states, and people get stuck in them.
- **Inconsistency**: surfaces that disagree about the same state, rules enforced on some paths and skipped on others, parallel implementations that drifted apart, and copy that describes behaviour the product does not have.

Agent instruction files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules` and similar) and committed memory files are read as evidence of decisions and audited themselves: the skill traces each rule to the commit or incident it came from and checks whether the code applies it further than that origin supports.

## How a run works

1. **Reconnaissance**: map who uses the product and what they are trying to do, every written source of intent and where each rule came from, the gates and multi-step flows, state shared between surfaces, the data model, and whether the product can be run locally with fixture accounts and fake providers. The parent writes an intent register and a deterministic coverage ledger.
2. **Hunting**: isolated agents work through the ledger, walking each person through the code under every lifecycle case and checking each state against the purpose it serves. Coverage critics look for gaps after each wave.
3. **Candidate validation**: a fresh agent states the intent from the sources before it sees the hunter's reading, then tries to refute the candidate: by finding an exit the hunter missed, or a stated need that justifies an overfit element.
4. **Structured output**: `confirmed`, `needs_owner_intent` and `rejected` records go into `findings.json`, checked against `report-schema.json` by a zero-dependency validator.
5. **Record verification**: fresh agents re-check every final record.
6. **Owner review**: instead of a long report, you get a one-screen summary and a grilling session. Findings become a tree of decisions: open intent questions first, then the rules or memories behind each overfit cluster (keep, narrow or remove), then fixes, then order. Each round asks every decision whose prerequisites are decided, numbered, with a recommended answer you can accept with "yes". Your answers are recorded in `decisions.json` and `DECISIONS.md`, and later runs treat them as the highest-ranked source of intent.

Every finding cites the principles in [`PRINCIPLES.md`](skills/product-consistency-audit/PRINCIPLES.md) it breaks. Runs are additive: later runs read earlier ledgers, findings and decisions, revalidate changed source, and do not re-report what you accepted as intended.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Modes, execution boundary, setup, planning, core rules, workflow and anti-patterns |
| `PRINCIPLES.md` | The audit principles every phase works from |
| `RECONNAISSANCE.md` | Phase 1 agents, the intent register and the coverage ledger |
| `HUNTING.md` | Phase 2 hunter prompts, method, candidate gate and coverage critics |
| `FIT-CLASSES.md` | Underfit, overfit and inconsistency classes, plus wildcard and checklist hunters |
| `INSTRUCTIONS-AND-MEMORY.md` | Companion for instruction files, memories, plans and rule origins |
| `DATA-MODEL-AND-STATE.md` | Companion for schemas, enums, status machines and flags |
| `STATE-MACHINES.md` | Companion for explicit and implicit state machines, with the recommended shape and change safety |
| `ACCESS-AND-IDENTITY-FLOWS.md` | Companion for sign-up, sign-in, sessions, invitations and roles |
| `ONBOARDING-AND-SETUP.md` | Companion for first-run flows and required setup |
| `PLANS-BILLING-AND-ENTITLEMENTS.md` | Companion for plans, trials, seats, credits and checkout |
| `LONG-RUNNING-SESSIONS.md` | Companion for realtime sessions, locks, drafts, uploads and jobs |
| `ADMIN-AND-CROSS-SURFACE.md` | Companion for state written on one surface and read on another |
| `PUBLIC-CLAIMS.md` | Companion for marketing, pricing, help and in-product text |
| `VALIDATION-AND-OWNER-REVIEW.md` | Phases 3 to 6: validation, structured output, verification and the owner session |
| `report-schema.json` | JSON schema for the three `findings.json` verdicts |
| `validate-findings.cjs` | Validator for `findings.json` |
| `validate-coverage-ledger.cjs` | Validator for `coverage-ledger.json` |
| `validate-intent-register.cjs` | Validator for `intent-register.json` |
| `validate-state-machines.cjs` | Validator for `state-machines.json` |
| `*.test.cjs` | Validator tests (`node <file>`) |

## Installation

With the [Skills CLI](https://skills.sh):

```bash
npx skills add https://github.com/wisdomousai/product-consistency-audit-skill \
  --skill product-consistency-audit
```

Add `--global` for a user-level installation.

## Usage

Start your coding agent in the codebase and ask for an audit:

```
run a product consistency audit on this codebase
```

```
check the invitation flow for places people get stuck
```

```
which rules in AGENTS.md has the code taken too literally?
```

```
audit this product as an invited colleague and as a buyer on the free plan
```

```
find the implicit state machines in this codebase
```

Questions about a single flow, rule or data model run in guidance mode and write no files. A request for a full audit runs all six phases and writes run files to `~/product-consistency-audit/<repo-name>/run-<N>`, outside the target. Name a profile (`quick`, `standard`, `deep`), a scope, an audience (one or more kinds of people to audit as), or a budget in agent invocations to bound the run. Reconnaissance also infers people the docs never name, such as a member of two organisations or someone who receives a shared link without an account.

Every run lists the product's state machines in `state-machines.json`, including implicit ones: lifecycles spread across booleans and timestamps, held in two runtimes at once, kept in client variables, or described only in instruction files. A state machine run focuses on them. For each machine with a gap it recommends a shape that improves the product for the people using it, for developers and for agents, and lists every stored value, writer, reader, outside contract and check that the change has to keep working.

## Execution boundary

The skill reads source and git history without changing them. It runs the product only on localhost, with fixture accounts and with model, email, payment, storage and identity providers confirmed to be on fakes or local outboxes. It never contacts deployed environments, uses real accounts, sends email, takes payments, spends paid quota, creates or deletes cloud resources, edits the target, or adds files to it. If the local setup cannot be confirmed, the run stays source-only.

## Requirements

- A coding agent whose model supports tool use and parallel sub-agents
- Node.js for the validators
- Git, for rule and state origins

## Credits

Adapted from [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) (MIT): the six-phase structure, coverage ledger and validators come from there, retargeted from trust boundaries to product intent. The owner review follows the grilling method from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).

## License

MIT. See [LICENSE](LICENSE).
