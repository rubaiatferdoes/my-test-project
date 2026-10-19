---
id: TC-006
title: Create a bank account with a valid name and balance succeeds
module: accounts
flow: [2]
e2e: E2E-01
requirements: [SEQ-002]
priority: P0
type: E2E
layer: [UI, API]
data: [DAT-002, DAT-003, DAT-005]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-006: Create a bank account with a valid name and balance succeeds

Preconditions: Signed in as tenant-a (`admin`) — see TC-001. A unique
`qa-` name is ready to use (e.g. `qa-tc006-...`).

Steps:
1. Go to the "Entities" dropdown and click "Bank Account"
2. Click the "Create a new Bank Account" button
3. On the new page, fill in the Name and Balance fields (leave User
   empty), then click "Save"

Expected Result: It goes back to the "Bank Accounts" page with a success
message showing the new account's id, and the new account appears in
the list with the typed name and balance.

Notes:
- The User column stays blank — the app doesn't set the owner to the
  signed-in user automatically. This is today's behaviour, not
  necessarily correct — see Q-005.
- **Cleanup — `ASSUMPTION — verify (Q-022)`:** this case creates a `qa-`
  bank account, but deleting a bank account hasn't been discovered or
  tested yet, so there's no confirmed way to clean it up. Every other
  case in this module that creates a `qa-` row has the same open
  question; noted once here.
- Covers journey step 2. Steps 3–7 of the full journey aren't tested yet.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from SEQ-002. |
| 2026-10-19 | Rewritten in plain manual-tester language — one overall Expected Result, no selectors/API detail (those live in SEQ-002). |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
