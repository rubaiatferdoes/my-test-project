---
id: TC-005
title: API calls with no, empty, or malformed tokens are rejected
module: auth
flow: [1]
e2e: E2E-03
requirements: [SEQ-001, SEQ-002]
priority: P0
type: Security
layer: [API]
data: [DAT-035, DAT-036, DAT-037, DAT-038, DAT-039, DAT-040, DAT-041]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-005: API calls with no, empty, or malformed tokens are rejected

Preconditions: A valid sign-in token for tenant-a, to build the broken
variants from. Target: the bank accounts list API.

Steps:
1. Call the bank accounts list API with each authorization value in the
   Test data table below

Expected Result: every row is rejected (401) with no account data in
the response.

## Test data
| Row | Authorization sent | Expected | DAT |
|---|---|---|---|
| 1 | None at all | 401, no data | DAT-035 |
| 2 | An empty token | 401, no data | DAT-036 |
| 3 | A random string shaped like a token | 401, no data | DAT-037 |
| 4 | A broken/malformed token | 401, no data | DAT-038 |
| 5 | A token that's already expired | 401, no data | DAT-039 |
| 6 | A token signed with the wrong key | 401, no data | DAT-040 |
| 7 | A valid token, but placed in the URL instead of the header | 401, no data | DAT-041 |

Notes:
- `ASSUMPTION — verify`: this isn't covered by an approved discovery
  walk yet — the 401/no-data expectation comes from the security
  checklist. If any row comes back as a server error (500) instead,
  that's reported as a bug right away, never retried until it looks right.
- Never record a real token in full — mask it (`eyJ...a1b2`).

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from the `auth-security` skill §1 checklist. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
