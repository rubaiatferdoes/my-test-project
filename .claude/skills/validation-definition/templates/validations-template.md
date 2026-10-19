---
module: keys
sequences: [SEQ-002]
screens: [generate-key-dialog]
validations: [VAL-007, VAL-008, VAL-009, VAL-010]
status: draft
discovered: YYYY-MM-DD
---

# Validations — API keys `[keys]`

> Observation only. A rule recorded here is what the application did when
> we probed it — not what it ought to do.

## Fields covered
| Screen | Field | Type | Declared in DOM | Rules found |
|---|---|---|---|---|
| generate-key-dialog | Key name | text | `required`, `maxlength=40` | VAL-007..VAL-010 |

## Rules
| ID | Screen | Field | Rule | Trigger | Message (exact) | Enforced | Evidence |
|---|---|---|---|---|---|---|---|
| VAL-007 | generate-key-dialog | Key name | required | on submit | `Key name is required.` | both | [png](../screens/VAL-007-required.png) |
| VAL-008 | generate-key-dialog | Key name | max length 40 | on type | — (typing stops at 40) | **client** | [png](../screens/VAL-008-maxlen.png) |
| VAL-009 | generate-key-dialog | Key name | min length 3 | on submit | `Key name must be at least 3 characters.` | both | [png](../screens/VAL-009-minlen.png) |
| VAL-010 | generate-key-dialog | Key name | unique per endpoint | server response | `A key with this name already exists.` | server | [png](../screens/VAL-010-unique.png) |

Enforced: `both` · `server` · `client` (finding) · `none` (finding)

## Cross-field and form-level rules
| ID | Rule | Observed |
|---|---|---|
| VAL-011 | "Generate" stays disabled until Key name is non-empty | Button enables on first character |

## Count and quota limits
One row per collection, not per field. Measured on `qa-tenant-a` —
quotas are often per plan, so this may not hold for other tenants.

| ID | Collection | Limit | Message (exact) | Enforced | Measured on |
|---|---|---|---|---|---|
| VAL-012 | API keys per endpoint | max 5 | `You have reached the limit of 5 keys for this endpoint.` | both | qa-tenant-a |
| VAL-013 | Endpoints per tenant | `UNKNOWN — no limit found below 25` (Q-0xx) | — | — | qa-tenant-a |

## Probe log — what we sent
| Field | Probe | Value used | Result |
|---|---|---|---|
| Key name | empty | `` | Blocked, VAL-007 message |
| Key name | long | `{repeat:k:256}` | Input accepted only 40 characters |
| Key name | API direct | `{repeat:k:256}` via `POST /api/endpoints/{id}/keys` | **201 Created** — server stored 256 characters |
| Key name | injection | `' OR '1'='1` | 201, stored as plain text, rendered escaped ✅ |
| keys/endpoint | quota | created 1..6 via API | 6th rejected, 400, VAL-012 message |
| endpoints/tenant | quota | created 1..25 via API (cap) | none rejected — UNKNOWN, Q-0xx |

## Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| 1 | VAL-008 is enforced in the browser only. The API accepted a 256-character key name | Any API caller can write names the UI can never display | BUG-0xx (candidate) |

## Questions
| ID | Question | Blocks |
|---|---|---|
| Q-0xx | Is 40 characters the intended maximum, and should the API enforce it? | VAL-008, the boundary test case |

## Data created and cleaned
| Name | Deleted? |
|---|---|
| `qa-val010-lz3k9a-x7f1` (duplicate probe) | ✅ |
| `qa-val012-*` × 6 (quota probe) | ✅ |
| `qa-val013-*` × 25 (quota probe) | ✅ |

## Change log
| CR | Date | Change |
|---|---|---|
