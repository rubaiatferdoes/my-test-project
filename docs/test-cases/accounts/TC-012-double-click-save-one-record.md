---
id: TC-012
title: Double-clicking Save creates exactly one bank account
module: accounts
flow: [2]
e2e: none
requirements: [VAL-008, EVT-007]
priority: P2
type: Negative
layer: [UI, API]
data: [DAT-002, DAT-003]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-012: Double-clicking Save creates exactly one bank account

**Tags:** `@persistence` (counted through the list API, not a direct
database read — see test-plan §0, `DB_ACCESS=none`).

Preconditions: Signed in as tenant-a (`admin`), on the Create Bank
Account page, with a fresh `qa-` name ready.

Steps:
1. Fill in Name and Balance with the fresh `qa-` value
2. Click "Save" twice, right after each other
3. Call the bank accounts list API and count how many rows have that exact name

Expected Result: Exactly one account is created, even though Save was
clicked twice.

Notes:
- This only shows what happened in this one run — there's no confirmed
  server-side safeguard against a double submit, only the page moving
  away quickly enough in this case.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-008. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
