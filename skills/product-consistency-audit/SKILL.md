---
name: product-consistency-audit
description: Audit whether an implementation serves its intended human users, agents and technical tasks. Find missing task paths, unnecessary machinery and conflicting behaviour using sourced requirements. Use for focused flow, tool, data-model or state-machine reviews, or explicit full codebase audits with verified findings and owner decisions.
---

# Product Consistency Audit

Check whether an implementation serves its intended actors and tasks. Find three kinds of gap:

- **Underfit**: a supported task or requirement has no working path, recovery or correct outcome.
- **Overfit**: a rule, memory, example or misunderstanding became machinery beyond the purpose it serves, with a demonstrated cost.
- **Inconsistency**: surfaces, implementations or descriptions disagree about the same state or rule.

An actor may be a human user, developer, operator, agent or automated service. Start from its task, success condition, authority and available context. A capability can serve a technical requirement such as recovery or bounded resource use without a human-facing feature. Do not infer requirements from architectural preference or a technology choice.

## Mode and reading path

**Guidance is the default.** For a focused question about a flow, rule, task or model, read P1–P5 in [PRINCIPLES.md](PRINCIPLES.md), then the relevant fit principles and reference sections below. Include each selected principle's “Not a gap” distinction. Read additional sections as evidence makes them relevant; do not load every companion or the full-audit procedures. Do not create audit artifacts. Return the supported conclusion, source locations, uncertainty and smallest useful change. Do not claim independent verification unless it occurred.

**Full audit requires an explicit request** to audit a codebase end to end or produce audit artifacts. Read [FULL-AUDIT.md](FULL-AUDIT.md) before starting. It defines the six phases, profiles, budgets, write ownership, prior runs and validation requirements. A completed full audit requires actual artifacts, a maintained ledger, executed validators and independent review. If those cannot be completed, report the run as incomplete with its demonstrated coverage.

For an ambiguous request, start with bounded guidance. Ask only when missing information prevents useful work.

| Question or discovered surface | Read when relevant |
|---|---|
| Instructions, memories, rule origins or overfit | P2–P7 and [INSTRUCTIONS-AND-MEMORY.md](INSTRUCTIONS-AND-MEMORY.md) |
| Gates, recovery, contradictions or an unfamiliar gap | Relevant P6–P14 and selected classes in [FIT-CLASSES.md](FIT-CLASSES.md) |
| Technical obligations or agent task completion | [TECHNICAL-AND-AGENT-TASKS.md](TECHNICAL-AND-AGENT-TASKS.md) and its cited principles |
| Persisted state or lifecycle changes | P6, P10, P12, P14 and [DATA-MODEL-AND-STATE.md](DATA-MODEL-AND-STATE.md) or [STATE-MACHINES.md](STATE-MACHINES.md) |
| Access, onboarding, billing, long-running work, cross-surface state or public claims | The matching companion linked from [FIT-CLASSES.md](FIT-CLASSES.md) |
| Running the target locally | [WALKTHROUGHS.md](WALKTHROUGHS.md), before execution |

## Evidence bar

Every finding needs a named actor and goal, intent grounded outside the implementation under review, a reachable situation and evidence of the consequence. Trace from entrypoint to outcome; distinguish source, history and local execution evidence. Missing features are gaps only when sources require them. A planned fix does not establish behaviour on the reviewed ref.

[PRINCIPLES.md](PRINCIPLES.md) is authoritative for purpose, provenance and exceptions. Apply P4 to every source, including owner decisions, task transcripts and instruction files; an unattributed restatement cannot settle the scope of the rule it repeats. When the deciding intent remains open, use `needs_owner_intent` with the question and what each answer requires. It has no severity. A disproved claim is rejected, not left as an intent question.

For a stuck task, check the supported exits. For overfit, establish both the unnecessary distinction and its cost, and look for technical or operational needs that justify it. Recommend the smallest change that restores the fit, including an instruction change when its wording caused the excess. Do not modify the target as part of the audit.

Put decisions to the owner one at a time with a recommended answer and the evidence needed to decide. Use existing answers; never answer for the owner or record an unanswered recommendation as a decision. Full-audit recording lives in [VALIDATION-AND-OWNER-REVIEW.md](VALIDATION-AND-OWNER-REVIEW.md).

## Execution boundary

- Keep target source, configuration, environment files and git history read-only. Do not change branches, reset, stash or add files to the target.
- Run the target only through confirmed localhost or offline fixture setups under [WALKTHROUGHS.md](WALKTHROUGHS.md). If setup cannot be confirmed, stay source-only. No production or preview access, real accounts, email sending, payments, paid API usage or cloud-resource mutations.
- Keep walkthrough output in scratch outside the target. A full audit may use an output directory inside the target only when the user selects it and version control ignores the whole directory.
- Read outside memories or transcripts only when supplied, named or already authorized; never modify them. Do not send target content to an outside model or service the owner has not named. Follow the owner's tool and model restrictions.
