---
id: TC-013
title: No rejection observed after creating 25 bank accounts in a row
module: accounts
flow: [2]
e2e: none
requirements: [VAL-009]
priority: P3
type: Boundary
layer: [API]
data: [DAT-003, DAT-004]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-013: No rejection observed after creating 25 bank accounts in a row

Preconditions: A valid tenant-a sign-in token.

Steps:
1. Call the create-bank-account API 25 times in a row, each with a
   unique `qa-` name and a valid balance

Expected Result: All 25 calls succeed; none are rejected.

Notes:
- This only shows "no limit found below 25", not "no limit at all" — the
  real cap, if there is one, is still unknown (Q-014). Don't push past
  25 here; that would be new discovery, not test execution.
- Cleanup: 25 `qa-` rows get created — same open question as TC-006 (Q-022).

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-009. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
