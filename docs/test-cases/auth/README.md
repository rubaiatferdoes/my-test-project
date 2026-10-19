# Test Cases — Sign in `[auth]`

> Approved by: rubaiat.ferdoes@leads-bd.com, 2026-10-19

Based on `docs/discovery/` (approved) · Environment: test environment only · Data: dummy only

## Test cases
| TC ID | Title | Priority | Type | Layer | Flow | Status |
|---|---|---|---|---|---|---|
| [TC-001](TC-001-sign-in-as-admin.md) | Sign in as admin reaches the signed-in home page | P0 | E2E | UI, API | 1 | approved |
| [TC-002](TC-002-username-required-and-length-boundary.md) | Username required and length boundary enforced by the API | P1 | Boundary | API | 1 | approved |
| [TC-003](TC-003-password-required-and-length-boundary.md) | Password required and length boundary enforced by the API | P1 | Boundary | API | 1 | approved |
| [TC-004](TC-004-username-password-mismatch-rejected.md) | Username/password mismatch rejected, with an unresolved enumeration gap | P0 | Negative | UI, API | 1 | approved |
| [TC-005](TC-005-malformed-or-missing-token-rejected.md) | API calls with no, empty, or malformed tokens are rejected | P0 | Security | API | 1 | approved |
| [TC-016](TC-016-anonymous-home-page-credential-disclosure.md) | Anonymous home page should not advertise working credentials | P2 | Security | UI | 1 | approved |

## Coverage for this module
| Req ID | Test cases | Covered? |
|---|---|---|
| SEQ-001 | TC-001, TC-005, TC-016 | ✅ |
| VAL-010 | TC-002 | ✅ |
| VAL-011 | TC-002 | ✅ |
| VAL-012 | TC-003 | ✅ |
| VAL-013 | TC-003 | ✅ |
| VAL-014 | TC-004 | ✅ |

## Regression candidates (parked)
| Idea | Why parked |
|---|---|
| No client-side validation on the Sign in form at all (Q-017) | Usability, not a security or core-flow gap; every rule already has an API-layer case |
| Username not trimmed before matching (Q-019) | Low severity, not yet confirmed as wanted behaviour either way |

## Open assumptions
| Assumption | Linked question |
|---|---|
| Where the sign-in token should be stored (sessionStorage vs localStorage) | Q-002 |
| The sign-in API's response shape on success (field names, token lifetime) — never read from the UI | Q-003 |
| Whether the API should hide the unknown-user-vs-wrong-password difference | Q-016 |
| Whether lockout/throttling is intended after repeated failures (not probed — needs permission) | Q-018 |
| Whether printing the shipped credentials on the home page is acceptable | Q-001 |
