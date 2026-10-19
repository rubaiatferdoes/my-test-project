---
id: TC-011
title: Save stays disabled until Name and Balance both hold a value
module: accounts
flow: [2]
e2e: none
requirements: [VAL-007]
priority: P2
type: UI
layer: [UI]
data: [DAT-006, DAT-007, DAT-008]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-011: Save stays disabled until Name and Balance both hold a value

Preconditions: Signed in as tenant-a (`admin`), on the Create Bank
Account page.

Steps:
1. Open the Create Bank Account page
2. Type a Name only, leave Balance empty
3. Clear Name, type `0` into Balance only
4. Type both a Name and a Balance of `0`

Expected Result: Save stays disabled until both fields hold a value
(step 4) — a Balance of `0` is enough, and User can stay empty.

Notes:
- The empty fields show no asterisk or accessible "required" message,
  only a red line on the left — parked as a possible accessibility
  improvement, not asserted here (see module README).

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from VAL-007. |
| 2026-10-19 | Rewritten in plain language. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
