---
description: Step 7d — Playwright UI Reviewer agent — review, run, and stabilize UI + E2E tests (3-run stability gate)
argument-hint: [all | TC IDs | module:keys | flow:3 | F-003 | P0 | E2E | path to tests]
context: fork
agent: playwright-reviewer
background: false
---

Review and stabilize the Playwright UI and E2E tests in: $ARGUMENTS

If no path was given, use automation/ui/, automation/tests/ui/, and
automation/tests/e2e/ and check them against the Page Object Model rules
and docs/test-cases/. Run them, fix script bugs (never weaken
assertions to force green), and apply the stability gate (3 consecutive
green runs) before reporting.
