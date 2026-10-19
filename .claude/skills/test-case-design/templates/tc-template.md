---
id: TC-014
title: Revoked key rejected within 60 s
module: keys
flow: [5]
e2e: E2E-03
requirements: [SEQ-002, VAL-012]   # SEQ-/VAL- from discovery, plus F-/BR- when documents exist
priority: P0
type: E2E
layer: [API]
data: []
status: draft
---

# TC-014: Revoked key rejected within 60 s

## Precondition
- Logged in as `qa-tenant-a`
- One `qa-` endpoint with one active API key

## Steps
| # | Action | Expected result |
|---|---|---|
| 1 | Call the endpoint with the key | 200, response matches the documented schema |
| 2 | Revoke the key | Key shows as revoked in the key list |
| 3 | Call the endpoint again with the same key, retrying every second | 401 within 60 seconds; no data in the response |

## Test data
<!-- Only for data-driven cases: one row per input. DAT- IDs are filled by the data factory. -->
| Row | Input | Expected | DAT |
|---|---|---|---|

## Notes and assumptions
- ASSUMPTION — verify (Q-xxx): …

## Change log
| CR | Date | Change |
|---|---|---|
