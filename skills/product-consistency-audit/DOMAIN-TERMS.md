# Domain Terms

## When to use this file

Select this file whenever reconnaissance selects a term for `term-register.json` (RECONNAISSANCE.md, Term register). In an audit, terms are selected by signal, never because a word is common. A glossary build (below) takes every domain term instead. The surfaces are:

- Words that name records, statuses, role fields and actions in the schema, APIs and tools.
- Glossaries, vocabulary sections in style or voice guides, vocabulary lint tools, and product descriptions that define domain words, by statement or by example.
- Copy in every locale, model prompts the product sends, and tool descriptions agents read.
- Fields that code reads to decide which word applies to a record.

Agents build behaviour from a reading of a word. A coding agent that reads "visit" next to "companion" builds claiming and cover for paid visits, and every later feature inherits that reading. The audit's own agents do the same unless the register tells them what the word means. A glossary that governs word choice in copy does not settle what a word covers.

## Core discipline

**Bar for a finding.** A term finding names the term, its senses with use sites, the written definition or its absence, the behaviour that rests on one sense, and an actor or record that this behaviour mishandles (P15). Two meanings of a word with no behaviour, state or reader difference between them are not a finding.

**Where intent is written.** The code shows which reading was built. The meaning comes from:

- The settled entry in `term-register.json`, which records the owner's answers to example cases. It ranks with the decisions it cites.
- Glossaries and product descriptions that define the term. Record their provenance under P4. A definition written by an agent is `unattributed` until the owner confirms it.
- Example sentences in docs, guides and instruction files. They show the case the writer had in mind, not the edge of the term. A glossary status of `implied_by_examples` marks a term whose only definition is examples.
- Sibling terms the glossary does define. A glossary that defines "companion" and "support" but not "visit" leaves "visit" to whoever writes the next feature.

**Identifiers.** A table, enum, route, tool or file name shows what was built (P4). Old identifiers may keep an old word when a source says so; the finding is then about behaviour, not the name.

**Term record.** For each assigned term, write down in scratch:

- The term, its forms in each locale and its identifiers.
- The written definition with provenance, or `missing`, or the example sentences that imply one.
- Each sense: what it means, and its use sites by surface (schema, code, API, copy, prompt, tool description, doc, instruction, test).
- For each sense, the rules, states, gates and messages that depend on it.
- The field, if any, from which code chooses between this word and another.
- The settled definition and the case from the register that covers the situation under review, or that the term is open.

## Term selection

The parent selects a term for the register when at least one signal holds:

- `names_record`: it names a persisted record or status.
- `gates_behaviour`: it appears in a guard, an error message or a flag.
- `actors_narrower_than_sources`: its role field admits fewer actors than the sources name, for example a visitor field that references app accounts while the sources name visitors without an account.
- `sense_from_other_field`: code chooses between this word and another from a different field, for example "appointment" when a place is filled in.
- `in_prompt_or_tool`: it appears in a model prompt the product sends or a tool description.
- `locales_differ`: locales translate it with words that carry different meanings.
- `undefined_in_glossary`: the glossary defines its neighbours and omits it, or defines it only by example.
- `glossary_inventory`: a glossary build listed it, and the owner kept it on the list. Only a glossary build uses this signal.

In an audit, a word with no signal gets no entry. Default caps are 3 terms in `quick`, 6 in `standard` and 12 in `deep`, ranked by the number of signals and then by the number of capabilities that use the term. List the rest in `architecture.md` as not examined. Words for roles ("member", "admin", "companion") go to the Actors and organisation check unless a gate reads a role word in more than one sense.

## Example cases

The owner is never asked for a definition. Each question is one situation with ordinary people, and the owner says whether the term covers it.

- **Use-site cases.** One per sense, built from a real use site: who is involved, what happens, and what the product does with it today, with file and line. "A neighbour with no account drops in on Tuesday. The schedule cannot name her as the visitor and shows Needs cover (`visit-status.ts:15`). Is that a visit?"
- **Boundary cases.** Take an answered case and change one attribute along an axis on which the senses differ: who takes part, paid or unpaid, with an account or without, where, booked or dropped in, whose event it is, what must happen after. "The daughter and her mother walk to a café instead. Still a visit?"
- **Undefined terms.** For a term with no definition, the cases build one. Start from the use sites, then test the edges the code assumes.
- **Missing words.** When the answers show a thing the product has no word for, such as accompanying the person to their own appointment, ask a case that names it and propose a word.

Ask one case per question, worded so "yes" accepts the recommendation. When the sources are silent, give no recommendation. Accept answers in the owner's own words, including answers that reject every option offered. Stop a term at five cases, or when two answers in a row move no boundary.

## Outcomes

After the cases, read the definition back with its is and is-not lists, and ask the outcome as the final question for that term:

- **Keep**: the word and its written meaning stand. Use sites that depart from it are hunter work.
- **Define**: the term had no written definition or only examples. The read-back becomes the proposed glossary entry.
- **Redefine**: the word stays and its boundary moves.
- **Rename**: a new word replaces it in text people read. Identifiers stay unless the owner says otherwise.
- **Split**: each sense gets its own word and definition, for example visit, session and appointment.
- **Merge**: two words name one thing, and one survives.

Every resulting term has a definition, at least one is case and one is-not case, its words in each locale, and either `unchanged` identifiers or a mapping from old to new. It may list in `avoid` the words that must not be used for it, such as "helper" for a paid companion.

## Glossary build

A glossary build finds the product's domain terms, settles each one with the owner through example cases, and writes a complete glossary. It starts only on an explicit request, such as "build the glossary", "build a glossary for this codebase" or "define our domain terms". It does not audit the code: it writes no ledger and no findings, and it runs no hunters or verifiers.

**Setup.** Resolve the target, the repo name and the source ref as in FULL-AUDIT.md, Full audit setup. The output directory defaults to `~/product-consistency-audit/<repo-name>/glossary-<N>`. Read the latest earlier glossary build or audit run for the same repo. A term settled there carries over when its definitions and use sites are unchanged and its decisions have `owner_statement` provenance. Earlier `open` and `unconfirmed` terms continue where they stopped. The execution boundary in SKILL.md applies: read source, docs and history only, and never edit the target.

**Inventory.** Launch one `research` agent with this prompt:

```text
List the domain terms of <target>: the nouns and verbs for the records, events,
roles, places and actions that the product, its users and its agents talk about.
Read the schema and migrations, API and tool schemas, tool and MCP descriptions,
model prompts the product sends, copy in every locale, docs, guides, glossaries,
vocabulary lint tools and instruction files. Do not run anything and do not
decide what a term should mean. Leave out programming terms (request, cache,
handler) and everyday words that carry no product meaning. Return per term:
1. The term as the sources write it, and its forms: each locale's words and the
   identifiers that use it.
2. Its written definition, quoted with location, the example sentences that
   imply one, or "none".
3. The surfaces it appears on, with a count and two or three repository-relative
   file:line examples.
4. The signals from DOMAIN-TERMS.md, Term selection, that hold for it.
5. Words that seem to name the same thing, and words the glossary says to avoid.
Then list existing glossaries and vocabulary sections, with their format.
```

Save its report as `recon/inventory.md`. Rank the terms by the behaviour that depends on them: the number of signals, then the number of surfaces. Show the owner the ranked list with each term's glossary status, and let them drop terms, add terms and merge obvious duplicates before any case is asked. Roles go on the same list, since a glossary build has no separate actor check.

**Senses.** Run agent 1f (RECONNAISSANCE.md) on the kept terms, in batches of about ten in ranked order, so that the first questions can start while later batches are read. Write each term to `term-register.json` with `status: "open"`, `glossary_inventory` in `selected_for`, and any other signal that holds. Validate the register after each batch.

**Questions.** Ask the terms in ranked order, with the method in Example cases and Outcomes and the question format of the Owner term check (RECONNAISSANCE.md).

- A term with one sense, a written definition that matches its uses, and no signal other than `glossary_inventory` gets one confirmation question: the definition read back with one is case and one is-not case. "Yes" settles it as `keep`, or as `define` when the definition was only implied.
- Other terms get use-site cases, boundary cases and the outcome question, with the five-case limit.
- Once a term is settled, later cases use the settled words. After the owner says booked companion time is a "session", a later case says "a session", not "a paid visit".
- When the answers show a thing with no word, add it to the list with `glossary_status: "missing"`, propose a word, and ask its cases next.
- Record each answer in `decisions.json` as in the Owner term check, and validate the register with `decisions.json` after each settled term.

The owner may stop at any point. Terms not yet asked stay `open`, and the next glossary build continues with them.

**Uses that differ.** When a use site contradicts a settled definition, such as code that treats every visit as paid time, list it in `<output-dir>/MISMATCHES.md` with the term, the file and line, and what the code assumes. Do not trace it further. A later audit or term run can start from that file.

**Glossary.** Write `<output-dir>/GLOSSARY.md` with every settled term, including terms kept as they were:

- The term and its definition.
- What it covers and what it does not, from the owner's is and is-not cases.
- Its words in each locale, and the words to avoid.
- Old identifiers and the term they now mean, when a rename or split leaves them unchanged.
- Related terms, such as the other terms of a split.

When the target has a glossary, follow its format and order, and mark each entry as new, changed or unchanged. When it has none, name the file where one should live, following the target's documentation and instruction-file conventions. End with the terms still `open` or `unconfirmed`. After the session, offer to apply the glossary to the target, and start only when the owner says so.

## Term narrowed to one case

Principles: P15, P6, P7

Family: overfit

The term covers more than one kind of situation, but the code was built for one of them, usually the first feature or the example in an instruction. Rules for that case then apply to every use of the word.

What to look for:

- Guards, errors and statuses that assume one sense ("This visit already has a companion", a cover flag on every unassigned visit) on records that the definition or the owner's cases place in another sense.
- Role fields that admit only the actors of one sense, such as a reference to app accounts when the sources name people without an account.
- Model prompts that describe one kind of actor for every record of the term ("what a home support worker said about one visit").
- Example sentences in guides and instruction files that tie the term to one actor, with code built in the same or following commits.

What establishes a gap: the definition or the owner's case that includes the other situation, the use site that assumes the narrow sense, and a reachable record from the other situation that the code mishandles: a wrong flag, a blocked action, an actor who cannot be recorded. When reporting severity, use [the severity guide](VALIDATION-AND-OWNER-REVIEW.md#separate-priority-from-certainty).

Not a gap:

- A narrow sense that the definition itself states, or that the owner confirmed in a case.
- Machinery for one sense that never runs for records of the others.

## Term with several senses

Principles: P15, P12

Family: inconsistency

One word stands for two or more different things on different surfaces, and the surfaces disagree about the same record or tell an actor something false.

What to look for:

- The same word for a domain record and an unrelated event, such as "since your last visit" meaning the last page view on a screen about care visits.
- Lists, counts and filters that mix the senses, or exclude one, under a single label.
- APIs and tools that return records of several senses under one name with no field that tells them apart.

What establishes a gap: the senses with use sites, a surface where an actor reads the word in the wrong sense or where two surfaces count or treat the same record differently, and the consequence for that actor.

Not a gap:

- Everyday use that a reader cannot mistake for the domain term and that carries no behaviour.
- Senses that the definition names and every surface keeps apart.

## Sense read from another field

Principles: P15, P6, P4

Family: overfit

Code decides which word, and so which rules, apply to a record from a field that does not carry that meaning. A filled place turns a visit into an appointment, or a filled price turns a member into a customer.

What to look for:

- Fallbacks such as `coalesce(kind, case when label <> '' then 'appointment' else 'visit' end)`.
- Backfills and migrations that assign a kind from a proxy field.
- Forms where filling an optional field changes the record's type without telling the actor.

What establishes a gap: the field the code reads, the owner's case or definition showing that the field does not decide the term, and a reachable record that gets the wrong word and the wrong rules.

Not a gap:

- A field that the definition names as the deciding attribute.

## Sense differing by surface or language

Principles: P15, P13, P12

Family: inconsistency

The same term carries a different meaning on one surface or in one locale. A translation chooses a word with a narrower meaning, such as a staffing word for a family visit, or a tool description gives agents a meaning the screens do not use.

What to look for:

- Translations of the term in each locale, compared with the definition. Look for words that imply staffing, payment, professional roles or a place.
- Tool descriptions, MCP instructions and model prompts compared with the copy on the screens that show the same records.
- Instruction-file text that uses the term in a sense the code does not use.

What establishes a gap: the definition, the surface or locale that departs from it, and the actor who reads that surface and acts on the wrong meaning, including an agent that calls tools on it.

Not a gap:

- A translation that is less natural but carries the same meaning.

## Undefined term

Principles: P15, P4, P5

Family: underfit

A term names records or gates behaviour, and no source defines it, or only example sentences do. Its meaning was set by whoever wrote the code first.

What to look for:

- Selected terms with `glossary_status` of `missing` or `implied_by_examples`.
- Glossaries that define sibling terms and omit this one.
- Use sites whose senses differ, with no written source to settle which is meant.

What establishes a gap: the selected term, the absence of a definition with what was searched, and behaviour that rests on the reading the code chose. Before the owner answers, the finding is `needs_owner_intent` with a case as the question. After the owner answers, report the effects under the class that fits them, and propose the glossary entry in `remediation.instruction_changes`.

Not a gap:

- An undefined word with a single sense and no rule, state or gate that depends on where its edge lies.

## Distinction with no word

Principles: P15, P1, P6

Family: underfit

The domain has a thing that actors need to name and act on, and the product has no word or record for it, so it is forced into another term's machinery. Accompanying the person to their own appointment became a cover gap on a visit.

What to look for:

- Owner answers or sources that describe a situation none of the selected terms covers.
- Flags and statuses that do two jobs, such as a cover flag that means both "nobody is coming" and "someone should go along".
- Workarounds in copy or notes that describe a process the product has no step for.

What establishes a gap: the source or owner case that names the situation, the term whose machinery absorbs it, and the actor who gets a wrong signal or cannot record what happened.

Not a gap:

- A situation the sources do not ask the product to support.

## Universal moves

- Build the term record before reading features. Use sites and senses come first.
- Search every form of the term: each locale's words, singular and plural, identifiers, route segments and tool names.
- Read model prompts and tool descriptions as use sites. Agents act on them.
- Read the glossary as a whole. Note the neighbours it defines and the terms it leaves out.
- Read example sentences in guides and instruction files as evidence of the case the writer had in mind, not as the edge of the term.
- For each sense, list the rules, states and gates that depend on it. A sense with no behaviour attached rarely matters.
- Find the commit that first tied the term to one sense, and the request or example it answered.
- When a word is the root cause of a model finding, seed the term class and use one fingerprint, starting with `term:<id>:`.
- Every confirmed term finding names the glossary change in `remediation.instruction_changes`. A rename or split that touches stored values also gives `remediation.change_safety`, with every stored record mapped to its new term.

## Validation rules

1. Read the term's register entry before the candidate. When the term is settled, re-derive which case or definition covers the situation in the trace. When it is open, confirm that the senses differ for this situation and that no source settles it; the verdict is then `needs_owner_intent` with a case as the question.
2. Confirm each cited use site exists and uses the term in the sense claimed. Search for use sites the candidate missed, especially prompts, tool descriptions and other locales.
3. Confirm the behaviour that rests on the sense is reachable for a record of the other sense.
4. A sense taken from an identifier, a table name or everyday usage is not intent. Reject a claim whose only support is that the word usually means something.
5. For a definition written by an agent, apply the provenance test in P4 before using it to refute or confirm.
6. For a rename or split, check that the remediation lists every surface that uses the term, every locale, and the stored values that need mapping, and that it gives no new word two meanings.
