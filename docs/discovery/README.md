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
| Event definitions | `docs/discovery/events/` |
| Validation definitions | `docs/discovery/validations/` |

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

API routes confirmed by a walk (CLAUDE.md section 13 — compare against
`web/rest/*Resource.java` only after this is scored):

| Method + route | Fired by |
|---|---|
| `GET /api/account` | Every full load (SEQ-001, SEQ-002) |
| `POST /api/authenticate` | EVT-003, sign in |
| `GET /api/users` | EVT-006, opening the create form |
| `GET /api/bank-accounts?eagerload=true&sort=id,asc` | EVT-005 list load, EVT-007 after save |
| `POST /api/bank-accounts` | EVT-007, save |
| `GET /api/bank-accounts/{id}` | EVT-008, detail |
| `GET /management/info` | Every full document load (anonymous) |

## Sequences

| ID | Title | Module | Flow | Status | Walk |
|---|---|---|---|---|---|
| [SEQ-001](sequences/SEQ-001-login-admin.md) | Sign in as admin | auth | 1 | approved | `walks/login-admin.walk.ts` |
| [SEQ-002](sequences/SEQ-002-create-bank-account.md) | Create a bank account | accounts | 2, 3 | approved | `walks/create-bank-account.walk.ts` |

Supporting walks: `walks/login-probe.walk.ts` (harness smoke check, reads the
sign-in page without signing in) and `walks/qa-rows-check.walk.ts` (read-only
list of `qa-` rows still in the database).

## Events

| File | Module | Events | DB mapping | Status |
|---|---|---|---|---|
| [auth.events.md](events/auth.events.md) | auth | EVT-001..EVT-004 | PENDING (db-validator) | approved |
| [accounts.events.md](events/accounts.events.md) | accounts | EVT-005..EVT-008 | PENDING (db-validator) | approved |

8 events, 7 distinct API routes, 0 background/polling calls. No event
fired a route that wasn't also seen in the Swagger listing (CLAUDE.md
section 13's "none invented" check — to be scored once `../sample-app` is
read).

## Validations

| File | Module | Validations | Status |
|---|---|---|---|
| [accounts.validations.md](validations/accounts.validations.md) | accounts | VAL-001..VAL-009 | approved |
| [auth.validations.md](validations/auth.validations.md) | auth | VAL-010..VAL-014 | approved |

Every rule the bank-account form and the login form enforce is listed
there with its exact message and its `client` / `server` / `both` / `none`
verdict. The form DOM declares no HTML5 validation attributes anywhere
(no `required`, `maxlength`, `pattern`) — every client-side rule observed
is JavaScript-only.

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
| Q-009 | Should `GET /api/bank-accounts` embed the owner's full profile (login, email, names, `activated`, `langKey`) in every row when the screen shows only ID/Name/Balance? | accounts.events |
| Q-010 | What is the real maximum length for a bank account `name`? 255 is stored, 256 crashes the server (500) | accounts.validations |
| Q-011 | Should the API accept a client-supplied `user` object on create at all? Today it is trusted as-is (see Finding below) | accounts.events / accounts.validations |
| Q-012 | Is it acceptable for anonymous `GET /management/info` to return build version/time and `activeProfiles` (`dev`, `secret-samples`, `api-docs`)? | accounts.events |
| Q-013 | What are the intended minimum length and allowed characters for `name`? No rule found at either layer | accounts.validations |
| Q-014 | Is there meant to be a per-tenant cap on bank accounts? None found below 25 (probe stopped at its safety cap, per `DISCOVERY_QUOTA_PROBE_CAP`) — still `UNKNOWN`, not "unlimited" | accounts.validations |
| Q-015 | `balance` is `decimal(21,2)`; posting `1.555` returns `1.555` in the response but stores `1.56`. Is silent rounding with a mismatched response the intended contract? | accounts.validations |
| Q-016 | Should login distinguish "no such user" from "wrong password"? Today the API does (different messages) while the UI hides both behind one message — but the API difference is itself a user-enumeration channel | auth.validations |
| Q-017 | Should the login form validate anything client-side? Today it validates nothing — every rule is server-only | auth.validations |
| Q-018 | Is there meant to be login lockout/throttling? Not probed — would mean hammering the real `admin`/`user` accounts | auth.validations |
| Q-019 | Should username/password be trimmed of surrounding whitespace? Not probed | auth.validations |
| Q-020 | Does discovery/validation probing clean up its own `qa-` rows, or keep them like SEQ-002's? **ANSWERED 2026-10-19 — see "Data policy" below: Q-004's "keep the rows" decision was scoped to the two named SEQ-002 rows only, not a blanket rule. CLAUDE.md section 5's default (clean up at the end of every walk) applies to everything else, including validation-mapper's probe rows.** | validation-mapper |

## Approved findings that are not endorsements

Approved as accurate records of current behaviour. Each is a candidate
defect, so no test case may assert it as the desired outcome, and a BUG-
proposal needs a human's sign-off before it's filed (CLAUDE.md section 9):

| From | Observed behaviour | Why it must not become an assertion |
|---|---|---|
| Q-005 | A new bank account is saved with `user_id = NULL` | CLAUDE.md section 1 expects the account to belong to the signed-in user. A test asserting `user_id IS NULL` would lock the defect in |
| Q-006 | `GET /api/bank-accounts` returns every account to every signed-in user | This is the open object-level-access question in CLAUDE.md section 3, still unresolved |
| Q-007, Q-009 | The create form calls `GET /api/users`, and the list endpoint embeds each owner's full profile | Candidate data-exposure defects (over-exposure, not under-validation) |
| Q-008 | `/bank-account//view` returns 401 and renders a blank page | Candidate defect; a blank page is not a specified behaviour |
| Q-001 | The anonymous home page prints working credentials in clear text | Candidate defect |
| SEQ-002 #5 | The empty form disables Save with no message, asterisk or `aria-required` | Accessibility/usability candidate |
| VAL-002 | An empty-string `name` is rejected by the UI but accepted (201) and stored by the API | Client/server rule mismatch — a `both`-verdict field reporting as `client`-only is itself the defect |
| — (name) | `name` of 256 chars → HTTP 500 (255 is accepted, no `maxlength` on the field) | A 5xx is always a bug (CLAUDE.md section 6) — never write a test that expects it |
| — (balance) | `balance` of `1e20`/`1e999` → HTTP 500, `numeric field overflow` | Same — always a bug |
| Q-011 | A forged `user.id` in the POST body is trusted (`user_id` is set from the request, not the session); an unknown id → HTTP 500 on the FK constraint | Candidate authorization defect (trusting client input for ownership) + a 5xx on the invalid case |
| — (errors) | Every 500 response body leaks the raw SQL insert, the FK constraint name, and the controller's Java method signature | "An error message that leaks internals" — CLAUDE.md section 2 says always report, never bless |
| Q-016 | The API's 400 on a short password **echoes the password back** in the error body (`rejected value [qaX]`) | Credential leak via error message — always report |
| Q-016 | Unknown-user vs wrong-password distinguishable at the API even though the UI hides it | User-enumeration channel |

## Data policy

**Default: clean up.** CLAUDE.md section 5 — every walk deletes its own
`qa-` data when it finishes, even a failed one. `validation-mapper`
followed this correctly: 41 probe rows created, 41 deleted, confirmed by
a read-only `SELECT` over ids 1004–1060 returning nothing.

**Named exception, SEQ-002 only.** Q-004 decision, 2026-10-19: the two
rows SEQ-002 created are kept, so that walk's evidence stays inspectable.
A one-time call about those two rows, not a blanket override of §5 —
first written here too broadly, which is what produced Q-020. Corrected.

| Name | Type | State |
|---|---|---|
| `qa-seq002-mveuqzsq-f7km` (id 1002) | bank account | Retained by decision (Q-004) |
| `qa-seq002-mveut2zp-02u8` (id 1003) | bank account | Retained by decision (Q-004) |

No row outside the `qa-` prefix was created, edited or deleted by any
discovery or validation step so far.

Consequence later steps must account for: the two SEQ-002 rows make the
bank-accounts count drift upward by exactly 2 over the untouched demo
baseline — no test may assert an absolute count regardless; the `qa-`
prefix stays the only safe filter for "ours".

## Framework note — approved files edited outside the two allowed exceptions

CLAUDE.md §9 permits only two edits to a locked APPROVED file (data
factory's `data:`, db-validator's `db:`). `event-mapper` and
`validation-mapper` both filled `events:`/`validations:` into the two
approved SEQ- files anyway — flagged by both agents themselves, not
hidden. Left in place (pure cross-reference IDs, no fact changed), but
the same edit clobbered the `approved_by` stamp with a wrong identity —
caught and fixed separately. Decide before the next step: add this to
§9's exceptions, or have the two skills write the back-link only into
their own event/validation files. Candidate `docs/trial/` entry — not
written there, since that folder is humans' per the folder contract.

## Next

Sequences, events and validations approved 2026-10-19. Next:
`/test-design:test-planner`.
