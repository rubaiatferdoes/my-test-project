---
description: Step 10 — Test Healer agent — investigate every failure from log, video, screenshot and trace; broken test → a proposed fix, application issue → a drafted bug for your approval
argument-hint: [all | TC-014 | module:keys | api | ui | e2e | verify | apply FIX-001]
context: fork
agent: test-healer
background: false
---

Investigate the test failures in: $ARGUMENTS

If nothing was given, take every failure from the latest
`docs/reports/execution-*.md`.

Reproduce each failure twice before deciding anything. Then give each one
a verdict: broken test, application issue, stale expectation,
environment, or data — using the trace, video, screenshot and network
evidence, not the error message alone.

- Broken test → a `FIX-` proposal with the exact diff, its blast radius,
  and the bug-guard checklist answered. **Propose only — do not apply it.**
- Application issue → a `BUG-` report with the evidence attached.
- Stale expectation → tell me which discovery command to re-run instead.

Add `verify` to the arguments if you want a proposed fix applied,
run, and then reverted. Add `apply FIX-001` to apply one I approved.

Never weaken an assertion, add a sleep, or skip a test to make a failure
go away.

Write `docs/reports/investigation-<date>.md` and show me the verdict
table.
