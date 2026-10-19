---
id: TC-007
title: Name is required at both layers; the API accepts an empty string the UI blocks
module: accounts
flow: [2]
e2e: E2E-06
requirements: [VAL-001, VAL-002]
priority: P1
type: Negative
layer: [UI, API]
data: [DAT-022, DAT-023]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-007: Name is required at both layers; the API accepts an empty string the UI blocks

Preconditions: Signed in as tenant-a (`admin`), on the Create Bank
Account page, for row 1. A valid tenant-a sign-in token for row 2's
direct API call.

Steps:
1. For row 1: leave or clear the Name field, then click into Balance
2. For row 2: call the create-bank-account API directly with the stated name

Expected Result: see the table below.

## Test data
| Row | Name value | Expected | DAT |
|---|---|---|---|
| 1 | left empty on the form | The form shows "This field is required." under Name, and nothing is sent to the server | DAT-022 |
| 2 | empty string, sent to the API directly | The API accepts it (201) and creates an account with a blank name — the form blocks this, the API doesn't | DAT-023 |

Notes:
- Row 2 is a known gap, not something to "fix" by changing this case's
  expected result — see `accounts.validations.md` Finding 2. If it's
  fixed later, update this row to expect a rejection.
- Cleanup: row 2 creates a `qa-` row too — same open question as TC-006 (Q-022).

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-001/VAL-002. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
