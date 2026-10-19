# Discovery — what the product does

> Status: DRAFT

Everything in this folder is **observation**, recorded by walking the
running sample app. Nothing here is an expected result until a human
approves it (CLAUDE.md section 2 and section 9).

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
| [SEQ-001](sequences/SEQ-001-login-admin.md) | Sign in as admin | auth | 1 | draft | `walks/login-admin.walk.ts` |
| [SEQ-002](sequences/SEQ-002-create-bank-account.md) | Create a bank account | accounts | 2, 3 | draft | `walks/create-bank-account.walk.ts` |

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
| Q-004 | May discovery delete the `qa-` rows it created? | SEQ-002 |
| Q-005 | Should a new bank account be owned by the signed-in user? Today `user_id` is NULL | SEQ-002 |
| Q-006 | Should the account list show every account to every signed-in user? | SEQ-002 |
| Q-007 | Should the create form expose the full user list (`GET /api/users`)? | SEQ-002 |
| Q-008 | What should a malformed entity URL show? Today: blank page, 401, no message | SEQ-002 |

## Data left behind

| Name | Type | State |
|---|---|---|
| `qa-seq002-mveuqzsq-f7km` (id 1002) | bank account | Awaiting permission to delete (Q-004) |
| `qa-seq002-mveut2zp-02u8` (id 1003) | bank account | Awaiting permission to delete (Q-004) |

No row outside the `qa-` prefix was created, edited or deleted.

## Next

After these sequences are approved: `/discovery:event-definition` and
`/discovery:validation-definition`.
