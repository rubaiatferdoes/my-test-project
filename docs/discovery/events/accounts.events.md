---
module: accounts
sequences: [SEQ-002]
events: [EVT-005, EVT-006, EVT-007, EVT-008]
db_mapping: pending        # pending | partial | confirmed
status: draft
discovered: 2026-10-19
---

# Events — Bank accounts `[accounts]`

> Observation only. Tier 1 (API calls) is recorded fact, taken from
> `automation/discovery/artifacts/create-bank-account/network.json`.
> Tier 2 (DB) is a claim and must name its evidence — it stays `PENDING`
> until `db-validator` fills it (CLAUDE.md section 9).

Source recording: `automation/discovery/artifacts/create-bank-account/`
(`network.json`, `console.json`, `walk.json`), walk
`automation/discovery/walks/create-bank-account.walk.ts`.
Record created by the walk: `qa-seq002-mveut2zp-02u8`, id `1003`.

**Noise dropped from every table below:** the Angular bundle, lazy route
chunks (`bank-account-*.js`, `entity.routes-*.js`), CSS, images and
translation chunks. Only the application's own API calls are kept.
`GET /management/info` and `GET /api/account` fire on every full document
load and are listed once under "Shared calls", not per event.

**Convention used here:** a step that fires no request and changes no URL
(typing into the form, reading a row) gets no `EVT-`; the sequence row
reads `— (no call)`. Field behaviour belongs to
`/discovery:validation-definition`.

## Index
| Event | Type | Screen | Trigger | Sequence step | API calls | DB |
|---|---|---|---|---|---|---|
| EVT-005 | onload | bank-account-list | Open `/bank-account` | SEQ-002 step 1 | 1 (+2 shared) | PENDING |
| EVT-006 | traverse | bank-account-form | **Create a new Bank Account** | SEQ-002 step 2 | 1 | PENDING |
| EVT-007 | submit | bank-account-form | **Save** | SEQ-002 step 4 | 2 | PENDING |
| EVT-008 | traverse | bank-account-detail | Open `/bank-account/{id}/view` | SEQ-002 step 6 | 1 (+2 shared) | PENDING |

---

## EVT-005 — Bank account list renders

| Field | Value |
|---|---|
| Type | `onload` |
| Screen | bank-account-list |
| Element | — (route `/bank-account`, reached in the UI through **Entities → Bank Account**) |
| From | SEQ-002 step 1 · [screenshot](../screens/SEQ-002-01-bank-account-list-before.png) |
| Observed | Heading "Bank Accounts", **Refresh list**, **Create a new Bank Account** (`data-cy="entityCreateButton"`), a table of 32 rows (33 after the save) with ID / Name / Balance and per-row View / Edit / Delete. No paging control, no search box |

### API calls (Tier 1 — observed)
| # | Method | Route | Request (shape) | Status | Response (shape) | ms |
|---|---|---|---|---|---|---|
| 1 | GET | `/api/bank-accounts?eagerload=true&sort=id,asc` | — | 200 | `[{ balance: number, id: number, name: string, operations: null, user: null \| { activated, createdBy, createdDate, email, firstName, id, imageUrl, langKey, lastModifiedBy, lastModifiedDate, lastName, login, resetDate } }]` | 14 |

Order: the list GET fires last, after the bootstrap calls and after the
lazy route chunk loads. This is the route every list assertion waits on:
`waitForResponse('**/api/bank-accounts?*')`.

Query parameters observed: `eagerload=true`, `sort=id,asc`. Sorting is
therefore **server-side**. No `page` or `size` parameter is sent and the
whole collection comes back in one response (33 rows at the time of the
walk).

**Shape note.** SEQ-002 step 1 records "every row carries `user: null`".
The recording shows that is true of the 31 shipped rows and the `qa-`
rows, but **row id `1001` (`test1`) carries a full nested `user` object**
— `login`, `email`, `firstName`, `lastName`, `activated`, `langKey`,
`imageUrl`, `createdBy`, `lastModifiedBy`, `resetDate`. The list screen
shows only ID, Name and Balance. See finding 1.

### DB effect (Tier 2)
> PENDING — `db-validator` fills this block. Read-only access already
> exists (`DB_TYPE=postgres`), so this is not blocked on credentials.
> A read should write nothing; **No write on GET** must be confirmed,
> not assumed.

### Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| 1 | `GET /api/bank-accounts` embeds the owning user's **full profile** (`login`, `email`, names, flags) for any row that has an owner, while the screen renders only ID / Name / Balance | Baseline Rule **No over-exposure**: every signed-in user can read every other user's e-mail and login from a list endpoint. `eagerload=true` is what pulls the graph in | BUG candidate · Q-009 |
| 2 | The response is **unbounded**: no `page`/`size` parameter, no `X-Total-Count`-style paging in use, the whole collection in one body (33 rows now, grows without limit) | Baseline Rule **Bounded list**. Combined with finding 1, the payload grows with both the number of accounts and the size of each user graph | BUG candidate · Q-010 |
| 3 | Evidence gap: the recorder truncates response bodies at 4000 characters, so the tail of the list body was not stored | The shape is recorded with confidence; the full set of rows is not. Any claim about *all* rows needs an API-level read | Q-013 |

---

## EVT-006 — Open the create form

| Field | Value |
|---|---|
| Type | `traverse` |
| Screen | bank-account-form |
| Element | `[data-cy="entityCreateButton"]` ("Create a new Bank Account") |
| From | SEQ-002 step 2 · [screenshot](../screens/SEQ-002-02-bank-account-form-empty.png) |
| Observed | URL becomes `/bank-account/new`, heading "Create or edit a Bank Account". Fields `Name` (`#field_name`, `data-cy="name"`), `Balance` (`#field_balance`, `data-cy="balance"`), `User` (select `#field_user`, options `""` / `admin` / `user`, pre-selected `""`). **Save** (`data-cy="entityCreateSaveButton"`) is disabled; **Cancel** enabled |

### API calls (Tier 1 — observed)
| # | Method | Route | Request (shape) | Status | Response (shape) | ms |
|---|---|---|---|---|---|---|
| 1 | GET | `/api/users` | — | 200 | **UNKNOWN** — body read aborted (`net::ERR_ABORTED`). From the rendered select, it returns at least every user's `login` (`admin`, `user`) | 9 |

Order: the click is an in-app route change — no document reload, no
`/api/account`, no `/management/info`. The only API call is the user
lookup that fills the optional **User** drop-down, and it fires **after**
the route resolves. A test opening this form waits on
`**/api/users`.

The navigation and the form's own render are inseparable in the
recording, so they are one event rather than a `click` plus an `onload`.

### DB effect (Tier 2)
> PENDING — `db-validator` fills this block. Opening a form must write
> nothing; that is a check, not an assumption.

### Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| 1 | Opening a create form hands the browser the **whole user list** (`GET /api/users`) to populate an optional drop-down | Baseline Rule **No over-exposure**. Any signed-in user can enumerate the application's users from this screen | BUG candidate · Q-007 (existing) |
| 2 | The response body of `GET /api/users` could not be read (`net::ERR_ABORTED`), so the exact fields it exposes are unknown — only that it carries at least the logins | We cannot say yet whether it also returns e-mails and roles. Needs a direct API read | Q-013 |

---

## EVT-007 — Save a new bank account

| Field | Value |
|---|---|
| Type | `submit` |
| Screen | bank-account-form |
| Element | `[data-cy="entityCreateSaveButton"]` (button "Save") |
| From | SEQ-002 step 4 · [screenshot](../screens/SEQ-002-04-bank-account-list-after-save.png) |
| Observed | App returns to `/bank-account`, green banner "A new Bank Account is created with identifier 1003", list reloads and the row count goes 32 → 33. The new row is appended at the bottom (`sort=id,asc`) |

### API calls (Tier 1 — observed)
| # | Method | Route | Request (shape) | Status | Response (shape) | ms |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/bank-accounts` | `{ id: null, name: string, balance: number, user: null }` | **201** | **UNKNOWN** — body read aborted (`net::ERR_ABORTED`); the created id had to be read off the list row | 8 |
| 2 | GET | `/api/bank-accounts?eagerload=true&sort=id,asc` | — | 200 | as EVT-005 | 13 |

Order matters: the POST completes **before** the list GET fires. A test
asserts the new row only after call 2 resolves — waiting on the POST
alone asserts against a stale table.

Recorded request body (verbatim, from `walk.json`):
`{"id":null,"name":"qa-seq002-mveut2zp-02u8","balance":123.45,"user":null}`.

Timing note: this recording measures the POST at 8 ms and the reload at
13 ms; SEQ-002 records 16 ms and 14 ms for the same calls. Use the
route, never the number — the timings are run-to-run noise, all far
below any threshold.

### DB effect (Tier 2)
> PENDING — `db-validator` fills this block. Do not read the pointer
> below as a confirmed mapping.
>
> Pointer for `db-validator`: the approved SEQ-002 step 7 ran a
> read-only tracer query and recorded one row — `id 1003`,
> `name qa-seq002-mveut2zp-02u8`, `balance 123.45`, `user_id NULL`
> (`walk.json` → `data.dbTrace`). That is the explorer's observation, not
> this mapping's claim: the table, the full column list, the audit
> columns and the FK walk still have to be established by the tracer
> method and recorded with their confidence and source.

### Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| 1 | The **owner is supplied by the client**: the form sends `"user": null` and the record is stored with no owner, even though the creator is a signed-in admin. The server does not derive the owner from the session | Baseline Rule **No forged fields accepted** (and the product overlay: "the account is created for the signed-in user"). If the server takes `user` from the body without checking it, posting another user's id assigns them the record — that is E2E-06 / OWASP API3, and it is not yet probed | BUG candidate · Q-011 · relates to Q-005 (existing) |
| 2 | `"id": null` is sent by the client on create | A client-supplied primary key is the same class of problem as finding 1. The server must ignore it; not yet probed | Q-011 |
| 3 | The POST **response body cannot be read** from the browser, so the create response shape (echoed fields, `Location`) is unrecorded. Status 201 is fact | The API schema for `POST /api/bank-accounts` has no recorded starting point; `Create status` (Decision) cannot be judged | Q-013 · Q-014 |
| 4 | Nothing in the walk probes a **double-click on Save**, and the button's in-flight state was not captured | Baseline Rules **One write per submit** and **Guarded while in flight** are unverified for the app's main create path | Q-015 |
| 5 | The success banner names the internal database identifier ("...with identifier 1003") rather than the name the user typed | Minor information exposure and poor usability; already recorded as SEQ-002 finding 5 | Finding — low |

---

## EVT-008 — Open the bank account detail

| Field | Value |
|---|---|
| Type | `traverse` |
| Screen | bank-account-detail |
| Element | Route `/bank-account/{id}/view` (the row's `[data-cy="entityDetailsButton"]` link; the walk reached it by direct URL) |
| From | SEQ-002 step 6 · [screenshot](../screens/SEQ-002-06-bank-account-detail.png) |
| Observed | Heading "Bank Account". ID `1003`, Name `qa-seq002-mveut2zp-02u8`, Balance `123.45`, **User blank**. Buttons **Back** and **Edit** |

### API calls (Tier 1 — observed)
| # | Method | Route | Request (shape) | Status | Response (shape) | ms |
|---|---|---|---|---|---|---|
| 1 | GET | `/api/bank-accounts/{id}` | — | 200 | **UNKNOWN** — body read aborted (`net::ERR_ABORTED`). The screen renders `id`, `name`, `balance`, `user` | 12 |

Path parameter generalised: `{id}` was `1003` in this walk. The wait is
`waitForResponse('**/api/bank-accounts/*')` — note it also matches the
list route unless the query string is excluded.

Because the walk reached this screen by a full document load, the two
shared bootstrap calls fired as well (`/management/info` 36 ms,
`/api/account` 35 ms). Reached by clicking **View** inside the app, only
call 1 fires.

### DB effect (Tier 2)
> PENDING — `db-validator` fills this block. A detail read must write
> nothing (**No write on GET**).

### Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| 1 | The detail response body could not be read, so list-versus-detail **Consistent shape** cannot be compared | A documented subset is fine; an undocumented difference is a contract finding for `api-contract-check` | Q-013 |
| 2 | A full page load of a malformed entity URL (`/bank-account//view`) returned **401** for the HTML document and rendered a blank page with no message | No route exists for that path; the user is given nothing. Already recorded as SEQ-002 finding 7 | Q-008 (existing) |

---

## Shared calls (this module)
| Route | When | Note |
|---|---|---|
| `GET /management/info` | Every full document load | Build and profile information; answers anonymously (Q-012, `auth` module) |
| `GET /api/account` | Every full document load | 200 when signed in. Not an event in this module; it is bootstrap noise for list and detail waits |

In-app navigation (clicking inside the SPA) does **not** repeat these
two. Only a browser reload or a direct URL does. Tests that `goto()` a
deep link will see three calls where a click-through sees one.

## Not reachable by tracer (this module)
| Table | Observed | Note |
|---|---|---|
| any audit / revision table | Unknown | Not probed. If the schema has `created_by` / `created_date` columns on `bank_account`, the row diff will show them; anything with no link back to our row cannot be attributed to an event |
| `operation`, `operation_label` | Not touched by this walk | They belong to journey steps 4–7, not yet walked. Listed so nobody reads their absence here as "no effect" |

## Standard comparison
Items from the standard event baseline (`references/event-baseline.md`
in the `event-definition` skill), cited by name. `Match`es included.
Every `Gap` is repeated under Findings or Questions.

| Baseline item | Mark | Applies to | What we found | Verdict | Raised as |
|---|---|---|---|---|---|
| **No write on read** | Rule | EVT-005, EVT-006, EVT-008 | Only GETs on load; no POST/PUT/PATCH/DELETE fired | Match | — |
| **Server is the source** | Rule | EVT-007 | After the create, the list is **refetched** (call 2) rather than patched locally | Match | — |
| **No duplicate fetch** | Rule | EVT-005, EVT-006, EVT-008 | Each API GET fired once per render | Match | — |
| **Bounded list** | Rule | EVT-005 | All 33 rows in one response; no `page`/`size`, no server-side cap observed | Gap | BUG candidate · Q-010 (finding EVT-005 #2) |
| **Loading state** | Rule | EVT-005, EVT-007 | All calls 8–14 ms; nothing near the ~1 s threshold | N/A — nothing slow enough to need one | — |
| **Call depth** | Decision | EVT-005 | Bootstrap calls and the list GET run without a deep chain | Match | — |
| **No write** (read-only click) | Rule | EVT-006 | Opening the form writes nothing; it only reads `/api/users` | Match | — |
| **Where sorting happens** | Decision | EVT-005 | `sort=id,asc` is sent to the server, so sorting is server-side. Whether it survives paging is untestable — there is no paging | Match (stated) | — |
| **Something happens** | Rule | EVT-006 | The button navigates and renders the form | Match | — |
| **One write per submit** | Rule | EVT-007 | One POST per click in the recording; a double-click was not probed | UNKNOWN — Q-015 | Q-015 (finding EVT-007 #4) |
| **Guarded while in flight** | Rule | EVT-007 | Save's state during the request was not captured; the walk only recorded it disabled-when-empty / enabled-when-filled | UNKNOWN — Q-015 | Q-015 |
| **Success means success** | Rule | EVT-007 | The green banner appeared after a **201**, not before | Match | — |
| **Failure is shown** | Rule | EVT-007 | No rejected save was walked (validation work) | N/A — failure path belongs to validation-definition | — |
| **State reflects the server** | Rule | EVT-007 | The row shown (1003 / name / 123.45) comes from the reload, and matches the detail read | Match | — |
| **No forged fields accepted** | Rule | EVT-007 | The client sends `id` and `user`; the stored row has `user_id NULL`, i.e. the client decides the owner and the session does not | Gap | BUG candidate · Q-011 (finding EVT-007 #1) |
| **Optimistic UI** | Decision | EVT-007 | Not optimistic — the list waits for the refetch | N/A — not optimistic | — |
| **Retry safety** | Decision | EVT-007 | Resubmission not probed | UNKNOWN — Q-015 | Q-015 |
| **URL reflects state** | Rule | EVT-006, EVT-008 | `/bank-account/new` and `/bank-account/{id}/view` are linkable and load directly | Match | — |
| **Back does not resubmit** | Rule | EVT-007 | Back after a save was not walked | N/A — not walked | — |
| **In-flight requests** | Decision | EVT-006, EVT-007, EVT-008 | The SPA navigation aborts its own response reads; the console records `net::ERR_ABORTED` as an error on three calls | Gap | Q-013 |
| **GET is safe** | Rule | EVT-005, EVT-006, EVT-008 | No GET changed anything observable | Match | — |
| **Method matches intent** | Rule | EVT-007 | POST creates | Match | — |
| **Create status** | Decision | EVT-007 | **201** observed; the `Location` header cannot be read from the recording | Gap (undocumented) | Q-014 |
| **Client error status** | Rule | this module | No 4xx produced by any mapped event (the malformed-URL 401 is a document load, SEQ-002 finding 7) | N/A — no error path walked | Q-008 (existing) |
| **Never 5xx** | Rule | all events | No 5xx anywhere in the recording | Match | — |
| **One error envelope** | Rule | this module | No API error body observed | N/A — no error path walked | — |
| **DELETE is idempotent · Delete status** | Rule/Decision | — | Delete is not walked (destructive; Q-004 answered "do not delete") | N/A — delete not walked | — |
| **Auth on every call** | Rule | EVT-005..EVT-008 | The recorder stores **no request headers**. Behaviourally these routes answer 200 only in a signed-in context, but the header itself is not evidenced | UNKNOWN — Q-013 | Q-013 |
| **No secrets in URLs** | Rule | all events | Paths and query strings carry only `eagerload`, `sort` and a numeric `{id}`. No token, key, password or e-mail. Note the numeric id is an internal database identifier, also printed in the success banner | Match | — |
| **No over-exposure** | Rule | EVT-005, EVT-006 | The list embeds the owner's full user profile; the form downloads the whole user list | Gap | BUG candidates · Q-009, Q-007 |
| **Consistent shape** | Decision | EVT-005 vs EVT-008 | Detail body unreadable, so list-versus-detail could not be compared | UNKNOWN — Q-013 | Q-013 |
| **Payload bounded** | Rule | EVT-007 | Oversized body not probed (API-layer work) | N/A — not probed | — |
| **Pending state** | Rule | EVT-005, EVT-007, EVT-008 | Everything under 15 ms | N/A — under the ~1 s threshold | — |
| **Slow actions recorded** | Rule | all events | All timings recorded above; nothing over 5 s. SEQ-002 finding 9 records a UI navigation delay with no request behind it — a wait concern, not a slow call | Match | — |
| **Concurrent edits** | Decision | — | No edit event mapped yet (flow 5) | N/A — edit not walked | — |
| **Timeouts surface** | Rule | — | Not probed | N/A — not probed | — |
| **Stated interval · Stops on leave · No retry storm · Pauses when hidden** | Rule/Decision | — | No polling, websocket or timer traffic in the recording, which is what the product overlay expects | N/A — no background events found | — |
| **One row per create · No orphans · Audit columns filled · Soft or hard delete · No write on GET** | Rule/Decision | EVT-007 and others | Tier 2 not filled | N/A — `db-validator` fills the `db:` blocks | — |

Verdicts: `Match` · `Gap` · `Stricter` · `N/A — <reason>` · `UNKNOWN — Q-0xx`

## Questions
| ID | Question | Blocks |
|---|---|---|
| Q-009 | Should `GET /api/bank-accounts` return the owning user's full profile (`login`, `email`, names) to every signed-in caller, or only an id? Is `eagerload=true` needed by this screen at all? | The data-exposure defect decision; the API schema for the list route |
| Q-010 | Is the entity list meant to be unbounded? The baseline expects collection endpoints to page or cap server-side; this one returns everything | Performance and list test cases; E2E-04 scoping |
| Q-011 | Should the owner (`user`) and the `id` of a bank account be taken from the session and the server, rather than from the request body? Today the client supplies both | Whether SEQ-002 finding 1 is a bug; E2E-06; the object-level-access tests |
| Q-014 | Does `POST /api/bank-accounts` return a `Location` header with the new resource (the baseline's **Create status** Decision)? Not readable from the browser recording | The API schema and `api-contract-check` |

Q-007, Q-008 and Q-005 are existing questions from SEQ-002 and are
repeated above where an event re-evidences them. Q-013 and Q-015 are
raised in `auth.events.md` and apply to this module too.

## Change log
| CR | Date | Change |
|---|---|---|
| — | 2026-10-19 | First mapping from `artifacts/create-bank-account`. EVT-005..EVT-008. |
