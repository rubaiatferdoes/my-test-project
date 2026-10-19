# Requirement Analysis — <product/module name>

> Status: DRAFT

| Analyzed on | Analyst | Sources |
|---|---|---|
| YYYY-MM-DD | <name / agent> | <count> documents, <count> mockups |

## 1. Summary
- Features found: <n> · Business rules: <n> · Gaps: <n> · Questions: <n>
- Top risks (max 5, one line each)

## 2. Sources analyzed
| # | File | Type | Version/date |
|---|---|---|---|

## 3. User roles
| Role | Can do | Must NOT do | How they authenticate |
|---|---|---|---|

## 4. Features and business rules

### Module index
| Module | Slug | Features | Flow steps | Status |
|---|---|---|---|---|
| API keys | keys | F-004..F-007 | 3, 5 | Analyzed — awaiting approval / Approved YYYY-MM-DD |

### Module: <name> `[slug]`
#### F-001: The system shall ...
| Rule | Description | Source (file + section) |
|---|---|---|
| BR-001 | ... | PRD §3.2 |

## 5. E2E flow coverage
| Flow step | Covered by | Gap? |
|---|---|---|
| 1. Create endpoint (UI) | F-001, BR-001..BR-004 | |
| 2. Swagger docs generated | | ⚠️ no requirement |
| 3. Generate API key | | |
| 4. Call endpoint with key | | |
| 5. Revoke key → key is dead | | |
| 6. Delete endpoint → endpoint is gone | | |

## 6. Market-standard comparison
| Checklist item | In requirements? | Note |
|---|---|---|

## 7. Missed scenarios
| Tag | Scenario | Related F-/BR- / flow step |
|---|---|---|
| [MISSING] | ... | |

## 8. Out of scope (per CLAUDE.md scope table)
- Endpoint customization/editing — not confirmed, revisit

## 9. Assumptions
- ASSUMPTION — verify: ...

## 10. Questions for product/customer
Most important first — the ones that stop test cases being written come first.

| ID | Question | Unblocks |
|---|---|---|
| Q-001 | ... | F-003, flow step 6 |

## Change log
| CR | Date | Summary | IDs touched |
|---|---|---|---|
| Baseline | YYYY-MM-DD | First approved analysis | all |
