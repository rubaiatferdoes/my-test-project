---
name: requirement-analysis
description: Analyze PRD/FRD documents, mockup images, and client notes for the API endpoint builder product, when such documents exist. Produces features (F-), business rules (BR-), E2E flow coverage, missed scenarios, a market-standard comparison, and questions for product (Q-), most important first. Use when asked to analyze requirement documents or compare them against what the application actually does.
---

# Requirement Analysis — optional, and a comparison

**Goal:** turn raw requirements into a clear, testable list — and find
what is missing BEFORE anyone writes test cases.

**This step is optional.** The application already exists, and discovery
(`/discovery:explore-app`) is what tells us how it behaves. This skill
covers the other half: what it was *supposed* to do. Run it when
`docs/requirements/` actually holds documents; if the folder is empty,
say so and stop — discovery plus the lead's confirmation is then the only
source of expected results, and the test plan must say so.

Where both exist, the pair is worth more than either alone:

| Discovery says | Requirements say | Meaning |
|---|---|---|
| The app does X | X | Confirmed — a safe expected result |
| The app does X | Y | **Conflict** — suspected bug or an out-of-date document. Raise a `Q-`, never pick a side |
| The app does X | nothing | Undocumented behaviour — test it as found, raise a `Q-` to confirm it is wanted |
| — | Z | Not built, not found, or missed by the walk — keep it, mark `BLOCKED — not observed` |

If discovery has already run, note every row that is not "Confirmed" in
the summary: those are the findings that earn this step.

**Input:** everything under `docs/requirements/` (or the path given): PRD, FRD,
user stories, mockup images, meeting notes, emails.
**Output:** `docs/analysis/requirement-analysis.md`, using
[templates/output-template.md](templates/output-template.md).

## Modules

Every feature belongs to ONE module. Use the PRD's own module names; if
it has none, use these defaults (slug in brackets):

| Module | Covers |
|---|---|
| Endpoint management `[endpoints]` | Create, list, view, delete endpoints in the UI |
| Swagger docs `[docs]` | Auto-generated OpenAPI spec and docs page |
| API keys `[keys]` | Generate, show, mask, revoke, expire, rotate keys |
| Endpoint runtime `[runtime]` | Calling a generated endpoint with a key |
| Access & tenants `[access]` | Login, roles, tenant isolation |

## Analyzing one module or one workflow

If the arguments name a module (`module:keys` or `"API keys"`), a flow
step (`flow:3`), or a folder (`docs/requirements/keys/`):

1. Read all input as usual, but analyze ONLY material about that module
   or flow step. Print what you included and what you skipped.
2. Write it into `docs/analysis/requirement-analysis.md` under that
   module's section (create the file from the template if missing).
   IDs continue from the highest number already in the file — never
   restart at 001. Leave every other module's section untouched.
3. Mark the module's row in the Module index `Analyzed — awaiting approval`.
4. Module already approved? Don't redo it — tell the user to use
   `/change:impact-analysis` for updates.
5. Still check the market checklist and E2E flow coverage, but only for
   the items belonging to this module or flow step.

## Steps (do them in order)

1. **Inventory** — list every file you read, with version/date if shown.
   Open every mockup image and note each screen, field, button, and
   error message.

2. **User roles** — for each role (customer admin, platform admin, the
   app/person calling the generated API): what they can do, what they
   must NOT do, how they log in or authenticate.

3. **Features and rules** — group features by module. Write each one as
   a testable sentence:
   `F-001: The system shall <do something> when <condition>.`
   Under each feature, list its business rules (`BR-001`): validations,
   limits, permissions, states (e.g. key: active → revoked).

4. **Map to the E2E flow** — for each of the 6 steps in `CLAUDE.md`
   (create → docs → key → call → revoke key → delete endpoint), list the
   F-/BR- IDs that cover it. A step with no requirement is a gap.

5. **Market check** — compare against
   [references/market-checklist.md](references/market-checklist.md).
   Every checklist item the requirements don't mention becomes a gap.

6. **Missed scenarios** — tag each one:
   - `[MISSING]` — not mentioned at all
   - `[UNCLEAR]` — mentioned but can't be tested as written
   - `[CONFLICT]` — two sources disagree (quote both)

7. **Questions** — one `Q-001` per gap, most important first: the ones
   that stop test cases being written, then the rest. Don't label them
   with a priority — the order says it. Each question names the F-/BR-
   or flow step it unblocks.

## When NOT to re-run this skill

Once the analysis is approved, updates from product (answers, change
requests, new document versions) go through the `change-impact` skill
(`/change:impact-analysis`) — it updates only what changed and keeps
every ID. Re-run this skill from scratch only for a brand-new baseline
(e.g. a completely rewritten PRD), and say so in the summary.

## Rules

- Never invent a requirement. If it isn't written down, it's a gap or a
  question.
- Never guess a field limit (length, format, count) — ask.
- Respect the scope table in `CLAUDE.md` (e.g. endpoint customization is
  out of scope) — list out-of-scope items, don't analyze them.
- In chat, show only a short summary: counts, top 5 gaps, and the
  questions needed before test cases can be written. Full detail goes
  in the file.
- Never treat a document as proof that the app behaves that way, or the
  app as proof that the document is wrong. Both are evidence; the lead
  decides.
- Finish with: "Ready for review. After approval, run
  `/test-design:test-planner`."
