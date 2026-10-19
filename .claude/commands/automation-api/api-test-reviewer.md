---
description: Step 7b — API Test Reviewer agent — review, run, and stabilize API tests (3-run stability gate)
argument-hint: [all | TC IDs | module:keys | flow:3 | F-003 | P0 | E2E | path to tests]
context: fork
agent: api-test-reviewer
background: false
---

Review and stabilize the API tests in: $ARGUMENTS

If no path was given, use automation/api/ and automation/tests/api/ and
check them against docs/test-cases/. Run them (npm run test:api), fix
script bugs (never weaken assertions to force green), and apply the
stability gate (3 consecutive green runs) before reporting.
