---
id: TC-004
title: Username/password mismatch is rejected, with an unresolved enumeration gap
module: auth
flow: [1]
e2e: none
requirements: [VAL-014]
priority: P0
type: Negative
layer: [UI, API]
data: [DAT-020, DAT-021]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-004: Username/password mismatch is rejected, with an unresolved enumeration gap

Preconditions: Tenant-a account (`admin`) exists; a username that does
not exist is available for row 2.

Steps:
1. On the Sign in page, enter the row's username and password, then click "Sign in"
2. Separately, call the sign-in API directly with the same username and password

Expected Result: see the table below — the on-screen message is the
same for every row, but the API's underlying response differs.

## Test data
| Row | Username | Password | On-screen message | API response | DAT |
|---|---|---|---|---|---|
| 1 | `admin` (real) | wrong password | "Failed to sign in! Please check your credentials and try again." | 401 — "bad credentials" | DAT-020 |
| 2 | `qa-nosuchuser` (doesn't exist) | any value | Same message as row 1 | 401 — "user not found" | DAT-021 |

Notes:
- Rows 1 and 2 show the **same message on screen** but a **different
  underlying API response** — this means someone probing the API
  directly can tell which usernames exist, even though the UI hides it.
  See Q-016. This case records today's behaviour, not an endorsement
  that the API should keep revealing it.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-014. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
