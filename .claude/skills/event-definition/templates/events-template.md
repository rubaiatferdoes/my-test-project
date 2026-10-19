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

## Change log
| CR | Date | Change |
|---|---|---|
