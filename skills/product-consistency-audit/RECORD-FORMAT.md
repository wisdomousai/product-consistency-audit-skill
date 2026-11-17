# Actor Record Format

Read this when producing structured artifacts or importing an earlier run. New run metadata records `artifact_format: "actors-v2"`. The four artifact files remain top-level arrays.

| Artifact | Current field | Earlier field |
|---|---|---|
| Findings, all verdicts | `actor` | `person` |
| Intent register | `actors` | `people` |
| State machine inventory | `actors` | `people` |
| Coverage ledger | `actor`, `canonical_refs.actor` | `person`, `canonical_refs.person` |
| Coverage ID actor segment | `a=<encoded role>` | `p=<encoded role>` |
| Finding's `remediation.experience` | `human_users` | `people` |

`actor` holds the role and goal; `actors` lists the actors supported by a capability or affected by a machine. `human_users` explicitly describes the human-facing effect alongside `developers` and `agents`. It is not a general actor list. The schema and validators accept only current field names; do not emit both formats.

## Import earlier artifacts

Keep the prior run unchanged. Create an import directory outside the target and convert only the artifacts needed for the new run:

```sh
node <skill-dir>/migrate-actor-records.cjs findings <prior-run>/findings.json <import-dir>/findings.json
node <skill-dir>/migrate-actor-records.cjs intent-register <prior-run>/intent-register.json <import-dir>/intent-register.json
node <skill-dir>/migrate-actor-records.cjs state-machines <prior-run>/state-machines.json <import-dir>/state-machines.json
node <skill-dir>/migrate-actor-records.cjs coverage-ledger <prior-run>/coverage-ledger.json <import-dir>/coverage-ledger.json
```

The helper renames only the listed structural fields, preserves task text, source evidence, fingerprints and assignment history, recomputes and sorts coverage IDs, and runs the corresponding current validator before writing a new file. It rejects conflicting old/new fields, malformed artifacts and existing output paths. Already-current artifacts can be copied through the same check.

Coverage IDs change only for actor-scoped units. Rebuild the new run's briefs and assignments from the imported ledger; do not reuse old briefs or result wrappers containing the old IDs. Prior decisions remain linked by unchanged finding fingerprints. Record the original run and imported paths in the new run's metadata; migration does not revalidate the old claims against current source or confer current audit status.
