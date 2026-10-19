---
id: SEQ-002
title: Generate an API key for an endpoint
module: keys
flow: [3]
entry_url: /endpoints
roles: [customer admin]
screens: [endpoint-list, endpoint-detail, generate-key-dialog]
events: []
validations: []
walk: automation/discovery/walks/generate-api-key.walk.ts
status: draft
discovered: YYYY-MM-DD
---

# SEQ-002: Generate an API key for an endpoint

> Observation only. Nothing here is an expected result until approved.

## Goal
<the workflow in one sentence, as a user would describe it>

## Preconditions
- Logged in as `qa-tenant-a`
- One `qa-` endpoint exists (created by this walk: `qa-seq002-...`)

## Path
| # | Screen | Action | What happened (observed) | Event | Screenshot |
|---|---|---|---|---|---|
| 1 | Endpoint list | Open `/endpoints` | Table of endpoints, "Create endpoint" button top right | EVT-010 | [png](../screens/SEQ-002-01-endpoint-list.png) |
| 2 | Endpoint detail | Click the endpoint name | Detail page, "API keys" panel showing "No keys yet" | EVT-011 | [png](../screens/SEQ-002-02-endpoint-detail.png) |
| 3 | Generate key dialog | Click "Generate key" | Dialog with one field "Key name" and Cancel / Generate | EVT-012 | [png](../screens/SEQ-002-03-generate-key.png) |
| 4 | Key shown | Enter `qa-seq002-...`, click Generate | Full key shown once with a Copy button and the warning "You won't see this again" | EVT-013 | [png](../screens/SEQ-002-04-key-shown.png) |

## Seen, not explored
| Screen / control | Where | Why not explored |
|---|---|---|
| "Rotate key" button | Key list row | Destructive — needs permission before first use |

## Data created and cleaned
| Name | Type | Deleted? |
|---|---|---|
| `qa-seq002-lz3k9a-x7f1` | endpoint | ✅ |

## Findings
| # | What we saw | Screenshot | Severity guess | Raised as |
|---|---|---|---|---|
| 1 | "Copy key" button also appears on the key list after reload, though the key is masked there | SEQ-002-05 | Needs a decision | Q-0xx |

## Questions
| ID | Question | Blocks |
|---|---|---|
| Q-0xx | Is the key really shown only once? The list row still offers "Copy" | VAL-0xx, the key-masking test |

## Change log
| CR | Date | Change |
|---|---|---|
