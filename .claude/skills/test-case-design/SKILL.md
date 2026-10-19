---
name: test-case-design
description: Design manual test cases from approved discovery definitions (sequences, validations) and requirement documents where they exist, using standard techniques — equivalence partitioning, boundary values, decision tables, state transitions, error guessing. Produces one Markdown file per TC- case in a folder per module, plus module and overall indexes with a traceability matrix. Use when writing test cases or checking test coverage.
---

# Test Case Design

**Goal:** the smallest set of test cases that covers every requirement
and every important risk. More cases is not better — better cases are.

**Input** (approved): the test plan, the sequences
(`docs/discovery/sequences/`), the validations
(`docs/discovery/validations/`), and — only where requirement documents
exist — `docs/analysis/requirement-analysis.md`.
**Output:** one file per test case:

```
docs/test-cases/
├── README.md                          overview — template: templates/overall-index-template.md
└── <module-slug>/
    ├── README.md                      module index — template: templates/module-index-template.md
    └── TC-014-revoked-key-rejected.md one case — template: templates/tc-template.md
```

Templates: [tc-template.md](templates/tc-template.md) ·
[module-index-template.md](templates/module-index-template.md) ·
[overall-index-template.md](templates/overall-index-template.md)

**File rules**
- Folder = the module slug from the analysis (`keys`, `endpoints`, …).
- File name = `TC-<nnn>-<short-title-in-kebab-case>.md`. TC numbers are
  global across modules and never reused.
- The front matter (between `---` lines) holds the fields agents read:
  `id, title, module, flow, e2e, requirements, priority, type, layer,
  data, status`. Keep them exact — the body is for people.
- `requirements:` means "where this case's expected results come from".
  It holds the discovery IDs the case rests on (`SEQ-002`, `VAL-008`)
  and, where documents exist, `F-`/`BR-` IDs too. A case with an empty
  `requirements:` cannot be impact-analysed later, so it is never
  allowed.
- `status`: `draft` → `approved` → (later, if removed) `deprecated`.
  A deprecated file stays in place.
- After adding or changing cases, update the module `README.md` and the
  overall `docs/test-cases/README.md` (counts, links, traceability).

## Step 1 — Pick the technique for each rule

| If the rule is about... | Use this technique | Example |
|---|---|---|
| A field with valid/invalid groups | **Equivalence partitioning** — one test per group | Name: valid / empty / special chars |
| A limit (length, count, size) | **Boundary values** — min-1, min, max, max+1 | Name max 50 → test 49, 50, 51 |
| Several conditions together | **Decision table** — one test per meaningful combination | Key valid? × Endpoint active? |
| Something with states | **State transition** — each allowed and blocked move | Key: active → revoked → (call) ✗ |
| Known weak spots | **Error guessing** — duplicates, double-click, refresh mid-flow | Create same name twice |
| The whole journey | **E2E scenario** — see the `app-journey` skill | Create → docs → key → call → delete |

## Step 2 — Write the cases

- One file per test case, from `tc-template.md`: flat `Preconditions:` /
  `Test data:` lines, a plain numbered `Steps:` list written the way a
  manual tester would describe clicking through the app ("Click the
  Entities menu, then Bank Account"), and **one** `Expected Result:` for
  the whole case at the end. No "etc.".
- Write steps and expected results **for a non-technical reader**: name
  screens, buttons and menus the way they appear on screen, not their
  selector (`data-cy="submit"`) or the API call behind them. Selectors,
  payloads and exact status codes already live in the `SEQ-`/`EVT-`/
  `VAL-` file this case links from `requirements:` — the automation
  generator reads those directly, so the case file doesn't need to
  repeat them. The one exception is an **API-only** case (nothing to
  click): there the "step" IS the API call, so name the endpoint and
  method in plain terms (e.g. "Call the sign-in API with this username
  and password") and the expected status/message, since that's the only
  concrete, checkable outcome available.
- One `Expected Result:` per case, not one per step — a single sentence
  or two describing the end state a tester can see (page reached,
  message shown, row appearing in a list). For a **data-driven** case
  (several input rows through the same steps), each row in the `Test
  data` table gets its own `Expected` column instead — that row's
  outcome is its one expected result.
- Expected result: a concrete, checkable outcome — exact message,
  status code, or visible state. Never "works correctly". Copy messages
  and labels exactly as discovery recorded them; a paraphrased message
  becomes a failing assertion.
- Every case links to at least one `SEQ-`, `VAL-`, `F-`, or `BR-` ID via
  the `requirements:` field — this is what lets `module:`/`P0`/`layer:`
  selectors (CLAUDE.md §8) and automation `@tags` (`ts-pom-standards`)
  work. Never drop these fields to shorten a case.
- No "Actual Result" or "Pass/Fail" field in the case file — that's a run
  result, owned by `test-executor`/`quality-reporter` in `docs/reports/`,
  not by the case design. The case's own `status:` (draft/approved/
  deprecated) tracks the design's lifecycle, not an execution outcome.
- Keep `Notes:` to what a human genuinely needs — an `ASSUMPTION —
  verify (Q-xxx)` link, or a one-line pointer to why a value is what it
  is. Not a restatement of the discovery finding; link its ID instead.
- Data-driven cases list their input rows in the file's "Test data"
  table (delete the section if the case isn't data-driven); the data
  factory adds the DAT- IDs. Never real customer data.

## Step 3 — Set priority

| Priority | Meaning | Example |
|---|---|---|
| P0 | Core flow broken = product unusable | Can't create endpoint / key doesn't work |
| P1 | Security or data-isolation risk, or major feature | Other tenant's key accepted |
| P2 | Important validation or error handling | Duplicate name error message |
| P3 | Cosmetic / rare edge | Tooltip text |

## Step 4 — Keep it lean

- Merge similar checks into ONE data-driven case with a data table
  (e.g. all invalid name formats = one case, 6 data rows).
- Max 5–7 negative/boundary cases per feature. Park the rest under
  "Regression candidates" in the module `README.md`.
- Duplicate coverage is a mistake, not thoroughness.

## Step 5 — Self-check before finishing

- [ ] Traceability matrix: every in-scope SEQ-, VAL- (and F-/BR- where
      they exist) maps to ≥1 TC
- [ ] Every `VAL-` marked `client` or `none` has a case that sends the
      bad value at the API layer, not only through the form
- [ ] Every E2E flow step (CLAUDE.md) has ≥1 P0 case
- [ ] Every feature has positive AND negative cases
- [ ] Security cases from the `auth-security` skill included
- [ ] No case expects a 5xx response
- [ ] Unknowns marked `ASSUMPTION — verify` and linked to a Q- ID
- [ ] A junior QA could run every case without asking questions
- [ ] Every case file's front matter is complete; file name matches its ID
- [ ] Module `README.md` and overall `README.md` list every case, with
      correct counts and links

Finish with a summary: total cases by priority and type, uncovered
requirements (should be zero), open assumptions.
