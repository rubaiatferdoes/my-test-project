# Discovery — what the product does

> Status: APPROVED - rubaiat.ferdoes@leads-bd.com, 2026-10-19 (trial run)

Everything in this folder was recorded as **observation** by walking the
running sample app, and was approved at the discovery gate on 2026-10-19
(CLAUDE.md section 2 and section 9). The sequences are therefore the
expected results for test design.

**Approval means the record is accurate, not that the behaviour is right.**
Several approved observations are flagged as probable defects (Q-001,
Q-005..Q-008). Test design must not turn those into assertions that lock
the defect in - see "Approved findings that are not endorsements" below.

Product under test: the JHipster sample application on `TEST_ENV_BASE_URL`
(local only). Tenant A = `admin`, tenant B = `user`.

## How this was recorded

| Thing | Where |
|---|---|
| Walk harness (reusable) | `automation/discovery/` |
| Replayable walks | `automation/discovery/walks/*.walk.ts` |
| Raw recordings (screens, network, console) — gitignored | `automation/discovery/artifacts/<walk>/` |
| Evidence screenshots | `docs/discovery/screens/` |
| Sequences | `docs/discovery/sequences/` |

Run one walk: `cd automation && npm run discover -- walks/<name>.walk.ts`

Each step writes a screenshot, a DOM dump of every field and control, and
the network slice that the step caused, so any request can be traced back
to the click that made it.

## Modules

| Module | Screens found | Routes |
|---|---|---|
| `auth` | home (anonymous), sign in, home (signed in) | `/`, `/login` |
| `accounts` | bank account list, create/edit form, detail | `/bank-account`, `/bank-account/new`, `/bank-account/{id}/view`, `/bank-account/{id}/edit` |
| `labels` | not walked yet | `/label` (seen in the Entities menu) |
| `operations` | not walked yet | `/operation` (seen in the Entities menu) |

## Sequences

| ID | Title | Module | Flow | Status | Walk |
|---|---|---|---|---|---|
| [SEQ-001](sequences/SEQ-001-login-admin.md) | Sign in as admin | auth | 1 | approved | `walks/login-admin.walk.ts` |
| [SEQ-002](sequences/SEQ-002-create-bank-account.md) | Create a bank account | accounts | 2, 3 | approved | `walks/create-bank-account.walk.ts` |

Supporting walks: `walks/login-probe.walk.ts` (harness smoke check, reads the
sign-in page without signing in) and `walks/qa-rows-check.walk.ts` (read-only
list of `qa-` rows still in the database).

## Coverage of the journey (CLAUDE.md section 1)

| # | Journey step | Sequence | State |
|---|---|---|---|
| 1 | Log in | SEQ-001 | Walked |
| 2 | Create a bank account | SEQ-002 | Walked |
| 3 | Create a label | — | Not walked |
| 4 | Record an operation with that label | — | Not walked |
| 5 | Edit the operation | — | Not walked |
| 6 | Delete the operation | — | Not walked (needs delete permission) |
| 7 | Delete the account | — | Not walked (needs delete permission) |

## Open questions raised so far

| ID | Question | From |
|---|---|---|
| Q-001 | Are the default credentials printed on the public home page acceptable? | SEQ-001 |
| Q-002 | Where should the JWT live — sessionStorage or localStorage? | SEQ-001 |
| Q-003 | What does `POST /api/authenticate` return? The UI aborts the body read | SEQ-001 |
| Q-004 | May discovery delete the `qa-` rows it created? **ANSWERED 2026-10-19: no - the trial keeps its records. Do not delete `qa-` rows; do not ask again for this action type.** | SEQ-002 |
| Q-005 | Should a new bank account be owned by the signed-in user? Today `user_id` is NULL | SEQ-002 |
| Q-006 | Should the account list show every account to every signed-in user? | SEQ-002 |
| Q-007 | Should the create form expose the full user list (`GET /api/users`)? | SEQ-002 |
| Q-008 | What should a malformed entity URL show? Today: blank page, 401, no message | SEQ-002 |

## Approved findings that are not endorsements

Approved as accurate records of current behaviour. Each is a candidate
defect, so no test case may assert it as the desired outcome:

| From | Observed behaviour | Why it must not become an assertion |
|---|---|---|
| Q-005 | A new bank account is saved with `user_id = NULL` | CLAUDE.md section 1 expects the account to belong to the signed-in user. A test asserting `user_id IS NULL` would lock the defect in |
| Q-006 | `GET /api/bank-accounts` returns every account to every signed-in user | This is the open object-level-access question in CLAUDE.md section 3, still unresolved |
| Q-007 | The create form calls `GET /api/users` and exposes the full user list | Candidate data-exposure defect |
| Q-008 | `/bank-account//view` returns 401 and renders a blank page | Candidate defect; a blank page is not a specified behaviour |
| Q-001 | The anonymous home page prints working credentials in clear text | Candidate defect |
| SEQ-002 #5 | The empty form disables Save with no message, asterisk or `aria-required` | Accessibility/usability candidate; validation-definition will confirm |

## Data retained (deliberate)

Trial decision, 2026-10-19: **`qa-` rows created during discovery stay in
the database.** This overrides the usual cleanup rule in CLAUDE.md
section 5 for the duration of the trial, so that every walk's evidence
remains inspectable against the live data.

| Name | Type | State |
|---|---|---|
| `qa-seq002-mveuqzsq-f7km` (id 1002) | bank account | Retained by decision |
| `qa-seq002-mveut2zp-02u8` (id 1003) | bank account | Retained by decision |

No row outside the `qa-` prefix was created, edited or deleted.

Consequences later steps must account for: row counts drift upward as
walks are re-run, so no test may assert an absolute count; and the
`qa-` prefix stays the only safe filter for "ours".

## Next

Sequences approved 2026-10-19. Next: `/discovery:event-definition` and
`/discovery:validation-definition`.
