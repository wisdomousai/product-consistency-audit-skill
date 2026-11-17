# Local Walkthroughs

Read this file before running the target in either guidance or full-audit mode. The read-only execution boundary in [SKILL.md](SKILL.md) still applies. Source-only work does not need this file.

## Confirm the local setup

Read the target's setup docs, environment examples, seed tooling and test configuration. In a full audit, use reconnaissance agent 1e's report. Confirm these settings by name without printing secrets:

- How to start each required localhost server, which data store is disposable, and how to use fixture actors without real accounts.
- How model, email, payment, storage, identity and analytics providers are faked, disabled or routed to local outboxes.
- Every CLI, MCP server, SDK or other tool that defaults to a hosted origin, and the setting that pins it to localhost. Do not run a networked tool whose origin cannot be pinned.
- For offline tools, that inputs and outputs are disposable fixtures and that execution cannot contact external services or write into the target. No server is needed.

When a required setting cannot be confirmed, keep the affected walkthrough blocked and use source or history evidence. Do not pull hosted environment files, create cloud resources or use a real account to make the local scenario work.

## Run bounded checks

Start the localhost servers needed for the check using the documented setup. In a full audit the parent owns them and assigns each walker its own fixture actor and scratch directory. In guidance mode use temporary scratch space outside the target; do not create an audit run just to hold a walkthrough.

Use the browser or terminal tool the owner names. Scripts, notes and screenshots stay in scratch, never in the target. Do not add tests or change source, configuration or environment files. Delete only files in your own scratch directory. Confirm that existing harnesses obey these restrictions before running them.

Run one walker at a time unless the owner allows more, and serialize walkthroughs sharing a data store. Do not run a walker beside builds, type checks or test suites. Check host load before launching; if the one-minute load exceeds the CPU-core count, defer the launch and continue source work. Close your browser session and stop only the servers you started when finished.

Stop at the smallest observation that decides the claim. Save the exact steps, fixture setup and result. The parent copies cited artifacts as regular files into the walker's `artifacts/` directory. Never turn source evidence into execution evidence by assumption; an unavailable provider state remains a source-only claim.
