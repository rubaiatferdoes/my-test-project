---
id: TC-009
title: Malformed Balance input is filtered client-side and rejected cleanly by the API
module: accounts
flow: [2]
e2e: none
requirements: [VAL-004, VAL-005]
priority: P2
type: Boundary
layer: [UI, API]
data: [DAT-002, DAT-027, DAT-028, DAT-029]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-009: Malformed Balance input is filtered client-side and rejected cleanly by the API

Preconditions: Signed in as tenant-a (`admin`), on the Create Bank
Account page, for rows 1-2. A valid tenant-a sign-in token for row 3.

Steps:
1. For rows 1-2: type the stated text into the Balance field
2. For row 3: call the create-bank-account API with a valid name and the stated balance value

Expected Result: see the table below.

## Test data
| Row | Input | Expected | DAT |
|---|---|---|---|
| 1 | Type `12abc` into Balance | The field only keeps `12` — letters are silently dropped as you type | DAT-027 |
| 2 | Type `1e999` into Balance | The field clears itself and shows both "required" and "should be a number" | DAT-028 |
| 3 (API) | Send `balance: "12abc"` directly | Rejected cleanly by the API | DAT-029 |

Notes:
- Row 2's absurd value never reaches the API, since the field clears
  itself first — sending `1e999` straight to the API instead is covered
  in TC-015, where it currently causes a server error (not asserted here).

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-004/VAL-005. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
