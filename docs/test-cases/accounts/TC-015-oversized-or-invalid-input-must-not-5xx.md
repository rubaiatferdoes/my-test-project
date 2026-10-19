---
id: TC-015
title: Oversized or invalid input must return a clean rejection, never a server error
module: accounts
flow: [2]
e2e: none
requirements: [SEQ-002]
priority: P1
type: Negative
layer: [API]
data: [DAT-002, DAT-003, DAT-031, DAT-032, DAT-033, DAT-034]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-015: Oversized or invalid input must return a clean rejection, never a server error

Preconditions: A valid tenant-a sign-in token.

Steps:
1. Call the create-bank-account API with each bad value in the table
   below, otherwise filled in normally

Expected Result (target behaviour): every row is rejected cleanly, with
a message that says what's wrong — and never with a server error, and
never with the response leaking a database query or a stack trace.

## Test data
| Row | Field | Value | What actually happens today (do not assert this) | DAT |
|---|---|---|---|---|
| 1 | Name | 256 characters | Server error, and the error message leaks the raw database query | DAT-031 |
| 2 | Balance | `1e20` | Server error | DAT-032 |
| 3 | Balance | `1e999` | Server error | DAT-033 |
| 4 | Owner (user id) | an id that doesn't exist | Server error, and the message leaks an internal database constraint name | DAT-034 |

Notes:
- This case is **expected to fail on all four rows today** — that's
  correct, the failure is itself the bug report. Never loosen this case
  to accept the server error just to make it pass.
- Each row is the basis for a separate defect report once this case runs.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft — written to cover the three server-error findings instead of leaving them undocumented. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
