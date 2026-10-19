# Test Cases — Overview

All test cases, one file each, grouped by module. This page is the
summary; open a module folder for its cases.

## Modules
| Module | Folder | Cases | P0 | P1 | P2 | P3 | Approved |
|---|---|---|---|---|---|---|---|
| Sign in | [auth/](auth/README.md) | 6 | 3 | 2 | 1 | 0 | ✅ 2026-10-19 |
| Bank accounts | [accounts/](accounts/README.md) | 10 | 1 | 3 | 5 | 1 | ✅ 2026-10-19 |
| **Total** | | **16** | **4** | **5** | **6** | **1** | |

## Totals by type
| Positive (E2E) | Negative | Boundary | Security | UI | Total |
|---|---|---|---|---|---|
| 2 | 6 | 4 | 3 | 1 | 16 |

## Traceability — every discovered behaviour to its test cases
| Req ID | Module | Test cases | Covered? |
|---|---|---|---|
| SEQ-001 | auth | TC-001, TC-005, TC-016 | ✅ |
| SEQ-002 | accounts | TC-006, TC-015 | ✅ |
| EVT-005 | accounts | TC-014 | ✅ |
| EVT-006 | accounts | TC-014 | ✅ |
| EVT-007 | accounts | TC-012, TC-014 | ✅ |
| VAL-001 | accounts | TC-007 | ✅ |
| VAL-002 | accounts | TC-007 | ✅ |
| VAL-003 | accounts | TC-008 | ✅ |
| VAL-004 | accounts | TC-009 | ✅ |
| VAL-005 | accounts | TC-009 | ✅ |
| VAL-006 | accounts | TC-010 | ✅ |
| VAL-007 | accounts | TC-011 | ✅ |
| VAL-008 | accounts | TC-012 | ✅ |
| VAL-009 | accounts | TC-013 | ✅ |
| VAL-010 | auth | TC-002 | ✅ |
| VAL-011 | auth | TC-002 | ✅ |
| VAL-012 | auth | TC-003 | ✅ |
| VAL-013 | auth | TC-003 | ✅ |
| VAL-014 | auth | TC-004 | ✅ |

Every approved SEQ-/EVT-/VAL- (SEQ-001, SEQ-002, EVT-001..008,
VAL-001..014) is covered. EVT-001..004 fire no request that needs its
own case — they're exercised as part of TC-001's sign-in flow instead of
getting separate IDs.

Journey steps 3–7 (label, operation, edit, delete ×2) have no cases —
`BLOCKED — not observed` per the test plan, not a silent gap.

## Change log
| Date | Change | IDs touched |
|---|---|---|
| 2026-10-19 | First draft test cases from approved SEQ-001/002, EVT-001..008, VAL-001..014 | TC-001..TC-013 |
| 2026-10-19 | Added TC-014/TC-015 (object-level access, server-error findings) and TC-016 (Q-001) to close coverage gaps; added this overview and the module READMEs | TC-014, TC-015, TC-016 |
| 2026-10-19 | All 16 cases approved — rubaiat.ferdoes@leads-bd.com | all |
