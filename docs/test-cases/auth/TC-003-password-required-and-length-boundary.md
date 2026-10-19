---
id: TC-003
title: Password required and length boundary enforced by the API
module: auth
flow: [1]
e2e: none
requirements: [VAL-012, VAL-013]
priority: P1
type: Boundary
layer: [API]
data: [DAT-015, DAT-016, DAT-017, DAT-018, DAT-019]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-003: Password required and length boundary enforced by the API

Preconditions: None — the sign-in API can be called without being
logged in. Rows 3-5 use the real tenant-a username with a deliberately
wrong password, so they never actually sign in and don't risk a lockout.

Steps:
1. Call the sign-in API with each username/password pair in the Test
   data table below

Expected Result: see the Expected column for each row.

## Test data
| Row | Username | Password | Expected | DAT |
|---|---|---|---|---|
| 1 | `qa-nosuchuser` | empty | 400 — "size must be between 4 and 100" | DAT-015 |
| 2 | `qa-nosuchuser` | `qaX` (3 characters) | 400 — same message, **and** the response echoes the password value back | DAT-016 |
| 3 | `admin` | 4-character wrong password | 401 — "bad credentials" (4 characters is accepted as a length) | DAT-017 |
| 4 | `admin` | 100-character wrong password | 401 — same, accepted at the upper length limit | DAT-018 |
| 5 | `admin` | 101-character wrong password | 400 — "size must be between 4 and 100" | DAT-019 |

Notes:
- Row 2's echo of the password value back in the response is a known
  defect (see `auth.validations.md` Finding 3) — this case records the
  current behaviour so a future fix is easy to confirm; don't quietly
  drop this check to make the case look clean.
- No row may come back as a server error (500).

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-012/VAL-013. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
