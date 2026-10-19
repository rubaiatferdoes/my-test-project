# CR-<nnn> Impact — <short title>

> Status: DRAFT

| Source | Received | Analyzed | Size |
|---|---|---|---|
| <file / email / answers.md Q-003> | YYYY-MM-DD | YYYY-MM-DD | Small / Medium / Large |

## 1. What changed
| Type | ID | Before | After | Source |
|---|---|---|---|---|
| Modified | BR-007 | Key works until deleted | Key expires after 90 days | CR-<nnn> §2 |
| Added | BR-031 (new) | — | Expiry warning email 7 days before | CR-<nnn> §3 |
| Answered | Q-004 | Open | Cross-tenant → 404 | answers.md |

## 2. Impact
| Level | Affected | Action |
|---|---|---|
| Sequences | SEQ-002 (step 4 changed) | Re-walk |
| Events | EVT-012 (route unchanged, response gained `expiresAt`) | Re-map |
| Validations | VAL-008 | Re-probe |
| Features / rules | BR-007, BR-031 | Update / add |
| Test cases | TC-014 (modify), TC-040 (new) | Update / add |
| Test data | DAT-012 (used by TC-014) | Regenerate |
| Automated tests | `tests/api/keys.api.spec.ts` › `[TC-014] …` | Update |
| Scope decisions | CROSS_TENANT_STATUS → 404 | Lead updates `CLAUDE.md` + `.env` |

Unaffected: everything else (<n> test cases, <n> automated tests).

## 3. Conflicts and questions
- [CONFLICT] …

## 4. Follow-up commands (after approval)
```
/discovery:explore-app SEQ-002
/discovery:validation-definition VAL-008
/test-design:test-case-designer TC-014 TC-040
/test-data:data-factory TC-014 TC-040
/automation-api:api-test-generator TC-014 TC-040
/execution:test-executor TC-014 TC-040
```
