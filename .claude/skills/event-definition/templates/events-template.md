---
module: keys
sequences: [SEQ-002]
events: [EVT-010, EVT-011, EVT-012, EVT-013]
db_mapping: pending        # pending | partial | confirmed
status: draft
discovered: YYYY-MM-DD
---

# Events — API keys `[keys]`

> Observation only. Tier 1 (API calls) is recorded fact. Tier 2 (DB) is a
> claim and must name its evidence.

## Index
| Event | Type | Screen | Trigger | Sequence step | API calls | DB |
|---|---|---|---|---|---|---|
| EVT-012 | click | generate-key-dialog | "Generate" button | SEQ-002 step 4 | 2 | PENDING |

---

## EVT-012 — Generate key

| Field | Value |
|---|---|
| Type | `click` |
| Screen | generate-key-dialog |
| Element | `[data-testid="generate-key-submit"]` (button "Generate") |
| From | SEQ-002 step 4 · [screenshot](../screens/SEQ-002-04-key-shown.png) |
| Observed | Dialog closes, full key shown once with a Copy button |

### API calls (Tier 1 — observed)
| # | Method | Route | Request (shape) | Status | Response (shape) | ms |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/endpoints/{id}/keys` | `{ name: string }` | 201 | `{ id, name, key, createdAt, status }` | 240 |
| 2 | GET | `/api/endpoints/{id}/keys` | — | 200 | `{ items: [{ id, name, maskedKey, status }] }` | 90 |

Order matters: POST completes before the list GET fires. A test waits on
call 2 before asserting the list.

### DB effect (Tier 2)
> PENDING — no read-only DB access yet. Raised as Q-0xx.

<!-- When read-only DB access arrives, db-validator replaces the line
     above with a table like this. For an INSERT, "Change" lists the
     columns filled; for an UPDATE it shows each column before → after,
     which is the "where is it updated" answer.

| Table | Operation | Change | Confidence | How we know |
|---|---|---|---|---|
| `api_keys` | INSERT | filled `id, endpoint_id, name, key_hash, created_at, status` | confirmed | tracer found in `api_keys.name` |
| `endpoints` | UPDATE | `key_count` 0 → 1 · `updated_at` bumped | confirmed | row diff by PK (FK walk from `endpoints.id`) |

Not reachable by tracer: `audit_log` (+1 row, no foreign key to our row)
     — counted only, not attributed.
-->

### Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| 1 | The POST response contains the full `key` in plain text — expected for show-once, but it is also written to the browser console by the app | Key could leak into logs | BUG-0xx (candidate) |

---

## Shared background calls (this module)
| Route | When | Note |
|---|---|---|
| `GET /api/session` | Every screen load | Noise — ignore in per-event tables |

## Not reachable by tracer (this module)
Writes with no link back to our own row, so they cannot be attributed to
one event. Listed once here rather than guessed at per event.

| Table | Observed | Note |
|---|---|---|
| `audit_log` | Row count rises on most actions | No foreign key to our record; would need the app SQL log to attribute |

## Not verifiable (this module)
Only in `DB_ACCESS=none` mode. What no probe through the API can establish,
listed once per module so the quality report can state it.

| What | Why it cannot be seen | What would restore it |
|---|---|---|
| Whether the API key is hashed at rest | Only the stored row can show it | A read-only DB user |
| Exact table and columns written by EVT-012 | Nothing in the HTTP traffic names a table | App SQL log, or backend repo access |
| Audit/analytics rows | No API surface | App SQL log |

## Standard comparison
One row per applicable item from the standard event baseline
(`references/event-baseline.md` in this skill) — `Match`es included; an
item not checked must appear as `N/A — <reason>`. Every `Gap` repeats in
Findings or Questions. Items are cited by name, never by number.

The baseline marks each item **Rule** or **Decision**: a missing Rule is
a finding, a missing Decision is a `Q-`. Never the other way round.

| Baseline item | Mark | Applies to | What we found | Verdict | Raised as |
|---|---|---|---|---|---|
| **One write per submit** | Rule | EVT-012 generate key | Double-click guarded; one row either way | Match | — |
| **Success means success** | Rule | EVT-012 | Toast appears before the POST resolves | Gap | BUG-0xx (candidate) |
| **No secrets in URLs** | Rule | all events this module | No key or token in any path or query | Match | — |
| **Optimistic UI** | Decision | EVT-012 | List updates before the server confirms; no rollback seen | Gap | Q-0xx |
| **Stops on leave** | Rule | EVT-015 key-status poll | Polling continued after navigating away | Gap | BUG-0xx (candidate) |
| **Create status** | Decision | EVT-012 | 201 with no `Location` header | Gap | Q-0xx |
| **Concurrent edits** | Decision | — | Not reachable from this module's screens | N/A — no shared record | — |

Verdicts: `Match` · `Gap` · `Stricter` · `N/A — <reason>` · `UNKNOWN — Q-0xx`

## Change log
| CR | Date | Change |
|---|---|---|
