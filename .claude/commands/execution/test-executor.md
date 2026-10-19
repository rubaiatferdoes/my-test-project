---
description: Step 9 — Test Executor agent — readiness check, run suites, classify failures, parity check, hand failures to the healer
argument-hint: [all | api | ui | e2e | smoke | db | TC IDs | module:keys | flow:3 | F-003 | P0]
context: fork
agent: test-executor
background: false
---

Execute the test suites: $ARGUMENTS

If no argument was given, run the readiness check, then everything in
automation/ (api, ui, e2e, db) (Smoke → Functional → Regression).
Classify every failure, re-run failures once for the flaky check, and
write the report to docs/reports/.
