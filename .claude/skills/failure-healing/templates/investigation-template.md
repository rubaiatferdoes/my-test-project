# Failure Investigation — YYYY-MM-DD

> Status: DRAFT

| Run | Source report | Failures investigated | Reproduced |
|---|---|---|---|
| execution-YYYY-MM-DD | `docs/reports/execution-YYYY-MM-DD.md` | 4 | 4 of 4 |

## Verdicts
| Test | TC | Verdict | Outcome | Evidence |
|---|---|---|---|---|
| `[TC-014] revoked key rejected within 60 s` | TC-014 | Application issue | BUG-003 (Sev-2) | trace, video, 60 polled responses |
| `[TC-012] generate key shows full key once` | TC-012 | Broken test | FIX-001 (proposed) | selector moved |
| `[TC-031] endpoint list loads` | TC-031 | Stale expectation | Re-run discovery | column renamed deliberately |
| `[TC-018] missing key → 401` | TC-018 | Environment | No report | gateway 502 for all tests 14:02–14:09 |

## Root causes
| # | Cause | Explains | Action |
|---|---|---|---|
| 1 | Key dialog rewritten in build 412 — all `data-testid` renamed | TC-012, TC-016 | One discovery re-run, not two fixes |

---

## FIX-001 — `[TC-012] generate key shows full key once`

**Diagnosis:** the submit button's test id changed from
`generate-key-submit` to `key-generate-confirm` in build 412. The control
is the same control: same dialog, same position, same resulting
`POST /api/endpoints/{id}/keys` (EVT-012).

**Evidence:** trace step 7 (locator timeout) · live DOM check at
`/endpoints/{id}` · screenshot `artifacts/TC-012/failure.png`

**Proposed diff**
```diff
--- a/automation/ui/locators/key.locators.ts
+++ b/automation/ui/locators/key.locators.ts
-  generateSubmit: '[data-testid="generate-key-submit"]',
+  generateSubmit: '[data-testid="key-generate-confirm"]',
```

**Blast radius:** `KeyPage.generateKey()` — used by TC-012, TC-013,
TC-016, TC-019.

**Bug guard**
- [x] Does the fix change what is asserted? **No** — only where the button is
- [x] Does the app still do what TC-012 says? Yes — full key shown once, then masked
- [x] Same control, not a lookalike? Yes — same dialog and same API call
- [x] Selector priority respected? Yes — `data-testid`
- [x] Definitions need updating? Yes — EVT-012 element, SEQ-002 step 4

**Status:** PROPOSED — not applied. Approve to apply.
**Re-run after approval:** `npx playwright test --grep "TC-012|TC-013|TC-016|TC-019"`

---

## Application issues — drafted for approval
| BUG | Title | Sev | From |
|---|---|---|---|
| BUG-003 | [API Key] Revoked key still returns 200 after 60 seconds | Sev-2 | TC-014 |

## Needs a human decision
| # | Question | Why we stopped |
|---|---|---|
| 1 | Was the endpoint list column renamed on purpose in build 412? | Regression or intended change — a healer must not guess |

## Next
```
# after approving FIX-001
npx playwright test --grep "TC-012|TC-013|TC-016|TC-019"
# stale expectation
/discovery:explore-app seq:endpoint-list
```
