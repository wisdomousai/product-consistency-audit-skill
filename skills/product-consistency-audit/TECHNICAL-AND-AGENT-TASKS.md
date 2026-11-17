# Technical and Agent Tasks

## When to use this file

Select this companion when the requested scope or intent sources establish a technical obligation or a task for a developer, operator, agent or automated service. Examples include a coding agent changing a supported extension, a tool-using agent completing a workflow, a worker recovering after interruption, or an operator meeting a documented resource limit. The presence of an API, queue or agent library alone is not a reason to select it.

## Core discipline

**Bar for a finding.** Name the actor, assigned task or technical requirement, success condition, supported operating conditions and consequence. Cite a source independent of the implementation being checked. A technical failure needs no human UI symptom, but it does need evidence of an unmet requirement. A preference for a framework, abstraction, response format or performance target is insufficient.

**Task contract.** Record what the actor receives, what it may access or change, the steps and interfaces available to it, and how it can establish completion. For agents, distinguish the product's supported tools and context from the auditor's broader access. A tool-using agent may have no browser, source checkout or database credentials. A coding agent may have a checkout but no deployment authority. A deliberate approval step is a valid handoff when the task defines one.

**Technical intent.** Look in assigned tasks, interface contracts, operational runbooks, supported development workflows, decision records and requirement tests. Internal states may serve correctness, retries, concurrency, recovery, observability or compatibility even when no user sees them. Establish that need before calling the state overfit. Record uncertain targets as owner questions rather than inventing service levels or scaling needs.

Use the existing record shapes: `actor.role` names the actor; `actor.goal` gives the task and success condition; `intent.purpose` states the requirement; `conditions` and reproduction `setup` capture authority, context and operating conditions. Use `available_context`, `execution_environment` or `resource_limit` condition kinds where applicable, alongside existing kinds such as `role` and `timing`. In the intent register use `actors` for the same actors. A task quoted from the current conversation is a `transcript` source with an identifiable message and exact excerpt. Source type alone never proves its authority or the result of executing the task.

## Task path unavailable

Principles: P1, P8, P9

Family: underfit

An actor cannot complete a supported task through the interfaces and authority the task gives it.

- Trace discovery, prerequisites, inputs, execution and result retrieval from that actor's actual starting context.
- Check whether required identifiers, state or permissions can be obtained through a supported path.
- Check instructions for a coding or maintenance task against the files, commands and extension points they name.

What establishes a gap: a source promising the task, an unavailable required step, and no supported alternative or handoff. For example, a tool promises export completion but only a browser session can download the result, while the supported caller has no browser.

Not a gap: a UI-only capability with no agent support requirement, or a documented handoff the actor can initiate. Do not demand parity across all surfaces.

## Outcome cannot be established

Principles: P8, P11, P13

Family: underfit

The task returns without giving its caller a supported way to distinguish completion, pending work and failure.

- Follow returned identifiers, status queries, exit codes and result artifacts.
- Check refused operations for information the caller needs to recover or hand off.
- Separate successful submission from successful completion when the task spans time.

What establishes a gap: the required success condition, a reachable ambiguous result and the decision it prevents the caller from making. A stable response format is required only when the caller's supported contract needs it.

Not a gap: an asynchronous operation with a usable status or notification path, or readable text that suffices for the supported caller.

## Recovery violates the task contract

Principles: P6, P10, P11

Family: underfit

Interruption, duplicate delivery, cancellation or retry breaks a documented task guarantee.

- Trace what persists before and after the side effect and what the next attempt reads.
- Check recovery from an unknown outcome, not just a clean failure before the write.
- Check ownership of locks, reservations and cancellation, and who can safely resume work.

What establishes a gap: a supported failure condition, the promised recovery behaviour and a trace to duplicate effects, lost work or a blocked next attempt. Recommend the smallest mechanism that meets the contract.

Not a gap: a documented delivery or retry limitation the task accepts. Do not assume exactly-once execution or require every command to be retryable.

## Technical requirement unmet

Principles: P1, P4, P12

Family: underfit

A documented correctness, resource, compatibility or operational requirement fails in its supported environment.

- State the requirement and conditions exactly: supported input size, runtime, restart scenario, resource bound, retained data or interface contract.
- Find the path that violates it and the actor or service that depends on it.
- Distinguish source evidence of a missing bound from measurements of actual latency or memory use.

What establishes a gap: an independently sourced obligation and a trace or bounded local reproduction that demonstrates the violation. Source review alone cannot establish a measured performance result.

Not a gap: an invented scale target, an unsupported environment, or hypothetical future demand with no decided requirement.

## Universal moves

1. Read the task as the intended actor would receive it, without supplying the auditor's extra knowledge or authority.
2. Trace the supported route from inputs to an observable result, including failure, recovery and handoff where the contract requires them.
3. Compare tool descriptions, instructions, API/CLI outputs and actual behaviour under P12 and P13. Use FIT-CLASSES.md for divergent implementations or unsupported promises.
4. For suspected overfit, search for the technical obligation that could justify the machinery. Use DATA-MODEL-AND-STATE.md or STATE-MACHINES.md for state-specific findings.
5. Use source and history first. Offline tools may use disposable fixtures outside the target; networked walkthroughs remain localhost-only under SKILL.md. An audit of a coding-agent task does not authorize edits to the target.

## Validation rules

- Re-derive the task, success condition and authority from the sources before reading the hunter's interpretation.
- Confirm reachability in the supported environment, including local development and operations when they are the intended use.
- Search for supported alternatives, explicit limitations and technical invariants that refute the claimed gap.
- Apply P4 to task instructions and operational decisions just as to product decisions. An agent-generated plan is not an owner requirement merely because it is written down.
- Confirm only the demonstrated failure. Do not upgrade a source trace to execution evidence or a structural concern to a measured resource violation.
- Preserve open intent as `needs_owner_intent`; reject a claim the contract or implementation disproves.
