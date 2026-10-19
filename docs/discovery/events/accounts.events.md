---
module: accounts
sequences: [SEQ-002]
events: [EVT-005, EVT-006, EVT-007, EVT-008]
db_mapping: pending        # pending | partial | confirmed
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
discovered: 2026-10-19
---

# Events — Bank accounts `[accounts]`

> Tier 1 (API calls) is recorded fact, from
> `automation/discovery/artifacts/create-bank-account/network.json`.
> Tier 2 (DB) stays `PENDING` until `db-validator` fills it (CLAUDE.md §9).
>
> **Status: APPROVED** — rubaiat.ferdoes@leads-bd.com, 2026-10-19 (trial
> run). Accurate record of what the product does — not an endorsement of
> the 5xx/enumeration/leak/forged-owner findings below; those stay
> candidate defects.

Source: `automation/discovery/artifacts/create-bank-account/`, walk
`automation/discovery/walks/create-bank-account.walk.ts`. Record created:
`qa-seq002-mveut2zp-02u8`, id `1003`.

Noise dropped: Angular bundle/lazy-route chunks/CSS/images/translations.
`GET /management/info` and `GET /api/account` fire on every full load and
are listed once under "Shared calls", not per event. A step with no
request and no URL change gets no `EVT-` (field typing — see
`validation-definition`); its sequence row reads `— (no call)`.

## Index
| Event | Type | Screen | Trigger | Seq step | API calls | DB |
|---|---|---|---|---|---|---|
| EVT-005 | onload | bank-account-list | Open `/bank-account` | SEQ-002 #1 | 1 (+2 shared) | PENDING |
| EVT-006 | traverse | bank-account-form | **Create a new Bank Account** | SEQ-002 #2 | 1 | PENDING |
| EVT-007 | submit | bank-account-form | **Save** | SEQ-002 #4 | 2 | PENDING |
| EVT-008 | traverse | bank-account-detail | Open `/bank-account/{id}/view` | SEQ-002 #6 | 1 (+2 shared) | PENDING |

---

## EVT-005 — Bank account list renders

Screen: bank-account-list, route `/bank-account` (via Entities → Bank
Account) · [screenshot](../screens/SEQ-002-01-bank-account-list-before.png)
Observed: "Bank Accounts" heading, Refresh list, **Create a new Bank
Account** (`data-cy="entityCreateButton"`), table of 32 rows (33 after
save): ID/Name/Balance + View/Edit/Delete. No paging, no search.

| # | Method | Route | Status | Response (shape) | ms |
|---|---|---|---|---|---|
| 1 | GET | `/api/bank-accounts?eagerload=true&sort=id,asc` | 200 | `[{balance, id, name, operations:null, user: null \| {activated,createdBy,createdDate,email,firstName,id,imageUrl,langKey,lastModifiedBy,lastModifiedDate,lastName,login,resetDate}}]` | 14 |

This is the route every list assertion waits on:
`waitForResponse('**/api/bank-accounts?*')`. `eagerload=true`,
`sort=id,asc` — sorting is server-side; no `page`/`size`, whole
collection in one response (33 rows at walk time).

**Shape note:** SEQ-002 #1 says "every row carries `user: null`" — true
for the 31 shipped + `qa-` rows, but row `1001` (`test1`) carries a
**full nested `user` object**. List screen shows only ID/Name/Balance.

**DB:** PENDING (`db-validator`). Read-only access exists. **No write on
GET** to be confirmed, not assumed.

**Findings:**
- `GET /api/bank-accounts` embeds the owner's full profile (login, email,
  names, flags) when one exists; screen shows only ID/Name/Balance.
  **No over-exposure** gap — BUG candidate, **Q-009**.
- Response is unbounded: no `page`/`size`, no total-count paging, whole
  collection in one body, grows without limit. **Bounded list** gap —
  BUG candidate, **Q-010**.
- Recorder truncates bodies at 4000 chars — tail of the list wasn't
  stored; any "all rows" claim needs an API-level read (**Q-013**).

---

## EVT-006 — Open the create form

Screen: bank-account-form · trigger `[data-cy="entityCreateButton"]` ·
[screenshot](../screens/SEQ-002-02-bank-account-form-empty.png)
Observed: URL `/bank-account/new`. Fields `Name`
(`#field_name`/`data-cy="name"`), `Balance`
(`#field_balance`/`data-cy="balance"`), `User` (select `#field_user`,
options `""`/`admin`/`user`, pre-selected `""`). Save
(`data-cy="entityCreateSaveButton"`) disabled; Cancel enabled.

| # | Method | Route | Status | Response | ms |
|---|---|---|---|---|---|
| 1 | GET | `/api/users` | 200 | **UNKNOWN** — body read aborted; rendered select shows at least `admin`, `user` logins | 9 |

In-app route change — no document reload, no `/api/account`/`/management/info`.
Fires after the route resolves; a test waits on `**/api/users`. Navigation
and form render are inseparable in the recording — one event, not
click+onload.

**DB:** PENDING. Opening a form must write nothing — to confirm, not assume.

**Findings:**
- Opening the create form hands the browser the **whole user list** to
  fill an optional drop-down. **No over-exposure** — BUG candidate,
  **Q-007** (existing).
- `/api/users` body unreadable (`net::ERR_ABORTED`) — full field set
  unknown beyond logins (**Q-013**).

---

## EVT-007 — Save a new bank account

Screen: bank-account-form · trigger `[data-cy="entityCreateSaveButton"]` ·
[screenshot](../screens/SEQ-002-04-bank-account-list-after-save.png)
Observed: returns to `/bank-account`, banner "A new Bank Account is
created with identifier 1003", list reloads 32→33, new row appended
(`sort=id,asc`).

| # | Method | Route | Request | Status | Response | ms |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/bank-accounts` | `{id:null, name, balance, user:null}` | **201** | **UNKNOWN** — body read aborted; id read off the list row instead | 8 |
| 2 | GET | `/api/bank-accounts?eagerload=true&sort=id,asc` | — | 200 | as EVT-005 | 13 |

POST completes before the list GET — assert the new row only after call
2. Verbatim body: `{"id":null,"name":"qa-seq002-mveut2zp-02u8","balance":123.45,"user":null}`.
(Timings here: 8/13 ms vs SEQ-002's 16/14 ms — run-to-run noise, both far
below any threshold; use the route, not the number.)

**DB:** PENDING. Pointer only, not a confirmed mapping — the approved
SEQ-002 #7 tracer query recorded one row: `id 1003, name
qa-seq002-mveut2zp-02u8, balance 123.45, user_id NULL`
(`walk.json → data.dbTrace`). Table, full columns, audit columns and the
FK walk are still `db-validator`'s to establish.

**Findings:**
- **Owner supplied by the client**: form sends `"user":null`, server
  stores no owner, does not derive it from the session. **No forged
  fields accepted** gap — BUG candidate, **Q-011**, relates to Q-005.
- `"id":null` is also client-supplied on create — same class of problem,
  not yet probed (**Q-011**).
- POST response body unreadable — create schema (echoed fields,
  `Location`) has no recorded starting point (**Q-013, Q-014**).
- Double-click on Save not probed; button's in-flight state not captured
  — **One write per submit** / **Guarded while in flight** unverified
  (**Q-015**).
- Success banner names the internal DB id, not the name typed — minor
  exposure/usability (SEQ-002 finding 5).

---

## EVT-008 — Open the bank account detail

Screen: bank-account-detail, route `/bank-account/{id}/view` (reached
here by direct URL; in-app it's the row's `data-cy="entityDetailsButton"`
link) · [screenshot](../screens/SEQ-002-06-bank-account-detail.png)
Observed: ID `1003`, Name `qa-seq002-mveut2zp-02u8`, Balance `123.45`,
**User blank**. Back/Edit buttons.

| # | Method | Route | Status | Response | ms |
|---|---|---|---|---|---|
| 1 | GET | `/api/bank-accounts/{id}` | 200 | **UNKNOWN** — body read aborted; screen renders `id,name,balance,user` | 12 |

Wait: `waitForResponse('**/api/bank-accounts/*')` — also matches the list
route unless the query string is excluded. Reached by full document load
here, so the two shared bootstrap calls also fired
(`/management/info` 36 ms, `/api/account` 35 ms); clicking **View**
in-app fires only call 1.

**DB:** PENDING. A detail read must write nothing (**No write on GET**).

**Findings:**
- Detail body unreadable — can't compare list-vs-detail **Consistent
  shape**; contract finding for `api-contract-check` (**Q-013**).
- A malformed `/bank-account//view` full-page load returned **401** and a
  blank page with no message (SEQ-002 finding 7, **Q-008**, existing).

---

## Shared calls (this module)
| Route | When | Note |
|---|---|---|
| `GET /management/info` | Every full document load | Build/profile info, anonymous (Q-012, `auth` module) |
| `GET /api/account` | Every full document load | 200 signed in; bootstrap noise for list/detail waits |

In-app navigation does not repeat these two — only a reload or `goto()`
deep link does, firing 3 calls where a click-through sees 1.

## Not reachable by tracer
| Table | Note |
|---|---|
| audit/revision columns | Not probed; if `bank_account` has `created_by`/`created_date` the row diff will show them |
| `operation`, `operation_label` | Not touched — belong to journey steps 4–7, not yet walked |

## Standard comparison
`Match` unless noted. Every `Gap`/`UNKNOWN` is also a Finding or `Q-`.

| Baseline item | Applies to | Verdict | Raised as |
|---|---|---|---|
| No write on read · No duplicate fetch | EVT-005,006,008 | Match | — |
| Server is the source | EVT-007 | Match — list refetched, not patched locally | — |
| Bounded list | EVT-005 | **Gap** — 33 rows, no page/size, no cap | Q-010 |
| Loading state / Call depth | EVT-005,007 | N/A — 8-14ms, no deep chain | — |
| No write (read-only click) | EVT-006 | Match | — |
| Where sorting happens | EVT-005 | Match (stated) — `sort=id,asc` server-side, no paging to test against | — |
| Something happens | EVT-006 | Match | — |
| One write per submit · Guarded in flight · Retry safety | EVT-007 | **UNKNOWN** — double-submit not probed | Q-015 |
| Success means success | EVT-007 | Match — banner after 201 | — |
| Failure is shown | EVT-007 | N/A — belongs to validation-definition | — |
| State reflects the server | EVT-007 | Match | — |
| No forged fields accepted | EVT-007 | **Gap** — client sends `id`/`user`; session ignored | Q-011 |
| Optimistic UI | EVT-007 | N/A — not optimistic | — |
| URL reflects state | EVT-006,008 | Match | — |
| Back does not resubmit | EVT-007 | N/A — not walked | — |
| In-flight requests | EVT-006,007,008 | **Gap** — own response reads abort, logged as console errors | Q-013 |
| GET is safe · Method matches intent · Never 5xx | all | Match | — |
| Create status | EVT-007 | **Gap** — 201 observed, `Location` header unreadable | Q-014 |
| Client error status · One error envelope | this module | N/A — no error path walked | Q-008 |
| DELETE is idempotent · Delete status | — | N/A — delete not walked (Q-004: do not delete) | — |
| Auth on every call | EVT-005-8 | **UNKNOWN** — no headers recorded | Q-013 |
| No secrets in URLs | all | Match — paths/queries carry only `eagerload`,`sort`,`{id}` | — |
| No over-exposure | EVT-005,006 | **Gap** — list embeds owner profile; form downloads full user list | Q-009, Q-007 |
| Consistent shape | EVT-005 vs 008 | **UNKNOWN** — detail body unreadable | Q-013 |
| Payload bounded | EVT-007 | N/A — not probed | — |
| Pending state | EVT-005,007,008 | N/A — under ~1s threshold | — |
| Slow actions recorded | all | Match — SEQ-002 #9's UI delay is a wait concern, not a slow call | — |
| Concurrent edits | — | N/A — edit not walked (flow 5) | — |
| Timeouts surface | — | N/A — not probed | — |
| Background-polling rules | — | N/A — none found | — |
| DB rules (one row/create, no orphans, audit cols, soft/hard delete) | EVT-007+ | N/A — pending `db-validator` | — |

## Questions
| ID | Question |
|---|---|
| Q-009 | Should the list return the owner's full profile to every caller, or just an id? Is `eagerload=true` needed at all? |
| Q-010 | Is the list meant to be unbounded? |
| Q-011 | Should `user` and `id` come from the session/server, not the request body? |
| Q-014 | Does `POST /api/bank-accounts` return a `Location` header? Unreadable from the browser recording. |

Q-005, Q-007, Q-008 are existing SEQ-002 questions, re-evidenced above.
Q-013, Q-015 are raised in `auth.events.md` too.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First mapping from `artifacts/create-bank-account`. EVT-005..EVT-008. |
| 2026-10-19 | Tightened for length (CLAUDE.md §12) — no facts/IDs removed. |
