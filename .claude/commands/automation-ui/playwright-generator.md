---
description: Step 7c — Playwright UI Generator agent — UI + E2E tests in TypeScript (Page Object Model) from approved test cases
argument-hint: [all | TC-014 TC-020 | TC-010..TC-015 | module:keys | flow:3 | F-003 | P0 | E2E | path to test cases]
context: fork
agent: playwright-generator
background: false
---

Generate Playwright UI and E2E automation from approved test cases: $ARGUMENTS

If no path was given, use docs/test-cases/ + test-data/.
Write into automation/ (reuse what exists), start with E2E-01 and make
it pass, then generate the rest and report results.
