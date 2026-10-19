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

Preconditions: Logged in as `qa-tenant-a`; one `qa-` endpoint with one
active API key.

Test data: endpoint `qa-...`, key `qa-...` (data-driven variants go in
the table below, not here).

Steps:
1. Call the endpoint with the key
2. Revoke the key
3. Call the endpoint again with the same key, retrying every second

Expected Result: Call 1 succeeds (200, response matches the documented
schema). After revoking, the key list shows it as revoked. Call 3 is
rejected (401) within 60 seconds, with no data in the response.

Notes: none.
<!-- ASSUMPTION — verify (Q-xxx): ... , when there is one -->

## Test data
<!-- Only for data-driven cases: one row per input, each with its own Expected column. DAT- IDs are filled by the data factory. Delete this section otherwise. -->
| Row | Input | Expected | DAT |
|---|---|---|---|

## Change log
<!-- Add a row only when the case changes after its first version. Delete this section otherwise. -->
| Date | Change |
|---|---|
