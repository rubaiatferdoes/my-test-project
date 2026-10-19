# Test Cases — Bank accounts `[accounts]`

> Approved by: rubaiat.ferdoes@leads-bd.com, 2026-10-19

Based on `docs/discovery/` (approved) · Environment: test environment only · Data: dummy only

## Test cases
| TC ID | Title | Priority | Type | Layer | Flow | Status |
|---|---|---|---|---|---|---|
| [TC-006](TC-006-create-bank-account-valid-name-and-balance.md) | Create a bank account with a valid name and balance succeeds | P0 | E2E | UI, API | 2 | approved |
| [TC-007](TC-007-name-required-empty-string-api-gap.md) | Name required at both layers; API accepts an empty string the UI blocks | P1 | Negative | UI, API | 2 | approved |
| [TC-008](TC-008-balance-required.md) | Balance is required and rejected at both layers when missing | P2 | Negative | UI, API | 2 | approved |
| [TC-009](TC-009-balance-malformed-non-numeric.md) | Malformed Balance filtered client-side, rejected cleanly by the API | P2 | Boundary | UI, API | 2 | approved |
| [TC-010](TC-010-client-supplied-id-rejected.md) | A client-supplied id on create is rejected by the API | P2 | Negative | API | 2 | approved |
| [TC-011](TC-011-save-button-enablement.md) | Save stays disabled until Name and Balance both hold a value | P2 | UI | UI | 2 | approved |
| [TC-012](TC-012-double-click-save-one-record.md) | Double-clicking Save creates exactly one bank account | P2 | Negative | UI, API | 2 | approved |
| [TC-013](TC-013-no-rejection-at-25-accounts.md) | No rejection observed after creating 25 bank accounts in a row | P3 | Boundary | API | 2 | approved |
| [TC-014](TC-014-object-level-access-and-forged-owner.md) | Tenant B reads every account and the full user list; a forged owner is honoured | P1 | Security | API | 2 | approved |
| [TC-015](TC-015-oversized-or-invalid-input-must-not-5xx.md) | Oversized or invalid input must return a clean rejection, never a server error | P1 | Negative | API | 2 | approved |

## Coverage for this module
| Req ID | Test cases | Covered? |
|---|---|---|
| SEQ-002 | TC-006, TC-015 | ✅ |
| EVT-005 | TC-014 | ✅ |
| EVT-006 | TC-014 | ✅ |
| EVT-007 | TC-012, TC-014 | ✅ |
| VAL-001 | TC-007 | ✅ |
| VAL-002 | TC-007 (API-layer case, not UI-only) | ✅ |
| VAL-003 | TC-008 | ✅ |
| VAL-004 | TC-009 | ✅ |
| VAL-005 | TC-009 | ✅ |
| VAL-006 | TC-010 | ✅ |
| VAL-007 | TC-011 | ✅ |
| VAL-008 | TC-012 | ✅ |
| VAL-009 | TC-013 | ✅ |

## Regression candidates (parked)
| Idea | Why parked |
|---|---|
| Empty-form Save disabled with no accessible message (SEQ-002 Finding 3, VAL finding 8) | a11y, not core-flow — noted in TC-011, no dedicated case yet; max 5–7 negative/boundary cases per feature already reached |
| Malformed entity URL (`/bank-account//view`) → 401 + blank page (Q-008) | Low severity UI gap, no route exists to assert against yet |
| Duplicate account names accepted, no uniqueness rule (Q-009) | Undocumented, not a confirmed defect; revisit once Q-009 is answered |

## Open assumptions
| Assumption | Linked question |
|---|---|
| DELETE cleanup policy for `qa-` bank accounts is undecided (delete flows undiscovered) | Q-022 |
| A bank account should be owned by its creator | Q-005 |
| The list should be scoped to the owner, not return every account | Q-006 |
| The create form shouldn't need to expose the full user list | Q-007, Q-009 |
| A forged `user.id` should be rejected, not honoured | Q-011 |
