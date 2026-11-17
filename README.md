# product-consistency-audit

A coding-agent skill for finding where a codebase fails to do what it was built for. It compares the implementation with documented requirements and your decisions, checks each finding with an independent agent, and works through the proposed changes with you.

The audit covers tasks performed by people, agents and automated services. That might mean accepting an invitation, completing an export through tools, or resuming a worker after an interruption. Each finding needs evidence of what should happen and a reachable case where the code gets it wrong.

It looks for three kinds of problem:

- **Underfit:** an intended task is blocked or needlessly difficult. A user gets stuck, a retry fails because the first attempt left unfinished state, or an agent has no tool for a required step.
- **Overfit:** the code takes an instruction further than its purpose warrants. A correction meant for one case becomes a new status or rule that complicates every flow touching it.
- **Inconsistency:** two screens disagree about the same state, a rule is enforced on only some paths, or the product promises behaviour it does not have.

Instruction files such as `AGENTS.md` and `CLAUDE.md`, along with committed memories, are part of the audit. The skill traces rules back to the decisions or incidents behind them and checks whether they still make sense. Technical requirements need the same evidence; an architectural preference alone is not a finding.

## Installation

With the [Skills CLI](https://skills.sh):

```bash
npx skills add https://github.com/wisdomousai/product-consistency-audit-skill \
  --skill product-consistency-audit
```

Add `--global` for a user-level installation.

## Usage

Start your coding agent in the codebase and ask:

```
run a product consistency audit on this codebase
```

You can also ask a focused question:

- "Check the invitation flow for places people get stuck."
- "Which rules in AGENTS.md has the code taken too literally?"
- "Can an agent complete an export using only the documented tools?"
- "Does the worker meet the documented restart and retry requirements?"
- "What does 'visit' mean in this codebase, and where do the meanings differ?"

Focused questions use guidance mode and write no audit files. They load the intent principles and relevant domain sections, without full-audit coordination. A full audit writes its reports to `~/product-consistency-audit/<repo-name>/run-<N>`, outside the codebase. It requires a maintained ledger, independent review and successful execution of all five artifact validators; missing capabilities or unfinished verification produce an incomplete audit.

To limit a run, name a profile (`quick`, `standard` or `deep`), part of the codebase, roles to audit as, or a budget in agent invocations. For example: "Audit this product as an invited colleague and as a buyer on the free plan, using the quick profile."

You can request a term audit with "Check our domain terms." Agents build behaviour from a reading of a word: a coding agent that reads "visit" next to "companion" builds rules for paid visits, and a family member's visit then shows as needing cover. The audit selects the words that name records, gate behaviour or appear in prompts and tool descriptions, collects the senses in which the code and copy use each one, and asks you example cases one at a time ("A neighbour with no account drops in. Is that a visit?"). From your answers it settles each word: keep, define, redefine, rename, split or merge. Words the glossary is missing get a definition with what they cover and what they do not. The results go into `term-register.json` and a `GLOSSARY-PROPOSAL.md` for the target's glossary. Full audits run a shorter version of this check on the most important words.

You can request a state machine audit with "Find the implicit state machines in this codebase." Full audits already record state machines in `state-machines.json`; this scope examines them in detail, including lifecycles spread across booleans, timestamps or separate runtimes. Where a machine causes a problem, the audit recommends a simpler or more complete design and identifies the stored data and callers that a change must account for.

## How an audit works

1. **Establish intent.** Read requirements, decisions and history to identify who uses the product and what they need to do. Map the flows and data model, record the planned coverage, and check whether local walkthroughs are possible. Ask you about unresolved questions that affect the audit, including example cases that settle what the main domain words mean.
2. **Trace the code.** Agents examine assigned flows, including relevant cases such as expired sessions or changed roles. Other agents check for gaps in coverage.
3. **Challenge each finding.** A fresh agent reads the requirements before seeing the finding, then looks for evidence that disproves it: a recovery path the first agent missed, for example, or a requirement that justifies the complexity.
4. **Write the results.** Findings go into `findings.json` as `confirmed`, `needs_owner_intent` or `rejected`. A validator checks the records against the schema.
5. **Verify the records.** Fresh agents re-check the final records and resolve corrections.
6. **Review with you.** You get a short summary and one decision at a time, with a recommended answer. Settle open domain terms and unclear requirements first, then decide which rules to keep, narrow or remove, which fixes to make, and in what order. Answers are saved in `decisions.json` and `DECISIONS.md`.

Every finding cites the [audit principles](skills/product-consistency-audit/PRINCIPLES.md) and its supporting evidence. Your task instructions and decisions can serve as evidence when the verifier has the exact excerpt. Findings from other reviewers go through the same checks.

Later runs use previous coverage, findings and decisions, rechecking changed sources. They do not report an unchanged behaviour again after you have accepted it as intended. After fixes, you can request a verification run to check the earlier reproductions against the changes. Records now use `actor` and `actors`; older artifacts need the explicit [record migration](skills/product-consistency-audit/RECORD-FORMAT.md).

## Execution boundary

The audit reads source and git history without changing the codebase or adding files to it.

Walkthroughs run on localhost with test accounts and fake providers or local outboxes. The skill checks those settings before running the product. It does not contact deployed environments, use real accounts, send email, take payments, spend paid API quota, or create or delete cloud resources. Offline commands may use disposable fixtures outside the codebase once confirmed to have no external effects. If the local setup cannot be verified, the audit uses source and history only.

Only one browser agent runs at a time, separately from builds and test suites. It waits when the machine is under heavy load.

## Requirements

- A coding agent whose model supports tool use and parallel sub-agents
- Node.js for the validators
- Git, for rule and state origins

## Files

All skill files are in [`skills/product-consistency-audit/`](skills/product-consistency-audit/).

| File | Purpose |
|------|---------|
| `SKILL.md` | Audit contract, mode selection, evidence bar and execution boundary |
| `FULL-AUDIT.md` | Full-run coordination, profiles, budgets and completion evidence |
| `WALKTHROUGHS.md` | Local setup and host coordination, loaded before execution |
| `RECORD-FORMAT.md` | Actor record format and importing older artifacts |
| `PRINCIPLES.md` | Standards for judging findings |
| `RECONNAISSANCE.md` | Intent sources and coverage planning |
| `HUNTING.md` | Investigation and coverage checks |
| `FIT-CLASSES.md` | Problem categories and examples |
| `VALIDATION-AND-OWNER-REVIEW.md` | Verification, reports and decision review |
| `INSTRUCTIONS-AND-MEMORY.md` | Rule origins in instructions, memories and plans |
| `TECHNICAL-AND-AGENT-TASKS.md` | Agent tasks, development workflows and operational requirements |
| `DOMAIN-TERMS.md` | Domain words, glossaries, senses and the owner term check |
| `DATA-MODEL-AND-STATE.md` | Schemas, enums and flags |
| `STATE-MACHINES.md` | Lifecycle design and safe changes |
| `ACCESS-AND-IDENTITY-FLOWS.md` | Sign-up, sessions, invitations and roles |
| `ONBOARDING-AND-SETUP.md` | First-run flows and required setup |
| `PLANS-BILLING-AND-ENTITLEMENTS.md` | Plans, trials, seats, credits and checkout |
| `LONG-RUNNING-SESSIONS.md` | Realtime sessions, locks, drafts, uploads and jobs |
| `ADMIN-AND-CROSS-SURFACE.md` | State shared across interfaces |
| `PUBLIC-CLAIMS.md` | Marketing, pricing, help and in-product text |
| `report-schema.json` | Finding schema |
| `validate-*.cjs` | Validators for findings, coverage, intent, state machines and domain terms |
| `migrate-actor-records.cjs` | Explicit conversion to actor fields; validates before writing a new file |
| `*.test.cjs` | Validator tests; run with `node <file>` |

## Credits

Adapted from [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) (MIT): the six-phase structure, coverage ledger and validators come from there, retargeted from trust boundaries to product intent. The owner review follows the grilling method from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).

## License

MIT. See [LICENSE](LICENSE).
