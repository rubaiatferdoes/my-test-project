---
id: TC-014
title: Tenant B can read every bank account and the full user list; a forged owner is honoured
module: accounts
flow: [2]
e2e: E2E-04
requirements: [EVT-005, EVT-006, EVT-007]
priority: P1
type: Security
layer: [API]
data: [DAT-002, DAT-003, DAT-043, DAT-044, DAT-045]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-014: Tenant B can read every bank account and the full user list; a forged owner is honoured

Preconditions: Valid sign-in tokens for both tenant-a (`admin`) and
tenant-b (`user`). At least one `qa-` bank account already exists under
tenant-a (e.g. from TC-006).

Steps:
1. As tenant B, call the bank accounts list API
2. As tenant B, call the users list API
3. As tenant A, create a new bank account but set its owner to tenant B's user id

Expected Result: see the table below — each is current behaviour, not
confirmed as correct.

## Test data
| Row | Check | Expected | DAT |
|---|---|---|---|
| 1 | Tenant B's bank accounts list | Includes accounts tenant B doesn't own — there's no owner filter | DAT-043 |
| 2 | Tenant B's users list | Returns the full list, including tenant-a's details | DAT-044 |
| 3 | Tenant A creates an account owned by tenant B | Succeeds — the server doesn't check who's allowed to own the new account | DAT-045 |

Notes:
- All three rows are known, approved findings, not endorsements — see
  Q-006, Q-007, Q-009, Q-011. Each is a candidate defect waiting on a
  product decision.
- Setting the owner to an id that doesn't exist at all is a different,
  separate bug — covered only in TC-015, since it currently causes a
  server error and this case must never expect one.
- Cleanup: row 3 creates a `qa-` row — same open question as TC-006 (Q-022).

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft — covers the object-level-access requirement that wasn't yet a case. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
