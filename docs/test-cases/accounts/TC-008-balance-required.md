---
id: TC-008
title: Balance is required and rejected at both layers when missing
module: accounts
flow: [2]
e2e: E2E-02
requirements: [VAL-003]
priority: P2
type: Negative
layer: [UI, API]
data: [DAT-002, DAT-024, DAT-025, DAT-026]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-008: Balance is required and rejected at both layers when missing

Preconditions: Signed in as tenant-a (`admin`), on the Create Bank
Account page, for step 1. A valid tenant-a sign-in token for steps 2-3.

Steps:
1. Fill in a valid Name, leave Balance empty, then click away from Balance
2. Call the create-bank-account API with a valid name and `balance` set to `null`
3. Call the create-bank-account API with a valid name and `balance` set to an empty string

Expected Result: Step 1 shows two messages at once under Balance — "This
field is required." and "This field should be a number." Steps 2 and 3
are both rejected by the API.

Notes:
- Showing both messages together on step 1 is the recorded, expected
  behaviour — not a bug to simplify away.
- None of these steps may come back as a server error (500).

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-003. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
