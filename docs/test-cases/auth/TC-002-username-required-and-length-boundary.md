---
id: TC-002
title: Username required and length boundary enforced by the API
module: auth
flow: [1]
e2e: none
requirements: [VAL-010, VAL-011]
priority: P1
type: Boundary
layer: [API]
data: [DAT-010, DAT-011, DAT-012, DAT-013, DAT-014]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-002: Username required and length boundary enforced by the API

Preconditions: None — the sign-in API can be called without being
logged in. (This screen has no client-side validation, so these are all
API-only checks, not clicks in the browser.)

Steps:
1. Call the sign-in API with each username/password pair in the Test
   data table below

Expected Result: see the Expected column for each row.

## Test data
| Row | Username | Password | Expected | DAT |
|---|---|---|---|---|
| 1 | empty | `admin` | 400 — "size must be between 1 and 254" | DAT-010 |
| 2 | `q` (1 character) | any value | 401 — "user not found", so a 1-character username is accepted as a length | DAT-011 |
| 3 | 254 characters | any value | 401 — accepted as a length, rejected only on the account lookup | DAT-012 |
| 4 | 255 characters | any value | 400 — "size must be between 1 and 254" | DAT-013 |
| 5 | 256 characters | any value | 400 — same message as row 4, **not** a server error (500) | DAT-014 |

Notes:
- Row 2 shows there's no stated minimum length beyond "not empty".
- No row may come back as a server error (500) — that's always a bug,
  never a pass.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-010/VAL-011. |
| 2026-10-19 | Rewritten in plain language; exact API messages kept in `auth.validations.md`, not repeated here verbatim. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
