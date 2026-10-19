---
id: TC-010
title: A client-supplied id on create is rejected by the API
module: accounts
flow: [2]
e2e: none
requirements: [VAL-006]
priority: P2
type: Negative
layer: [API]
data: [DAT-002, DAT-003, DAT-009, DAT-030]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-010: A client-supplied id on create is rejected by the API

Preconditions: A valid tenant-a sign-in token. (This isn't reachable
from the UI — the form never sends an id — so both steps are direct API
calls.)

Steps:
1. Call the create-bank-account API with a valid name/balance and no id set
2. Call it again with the same name/balance, but this time with an id already set to a number

Expected Result: Step 1 succeeds. Step 2 is rejected — the API won't
accept a caller-supplied id.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-006. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
