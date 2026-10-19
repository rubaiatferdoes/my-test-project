---
module: auth
sequences: [SEQ-001]
events: [EVT-001, EVT-002, EVT-003, EVT-004]
db_mapping: pending        # pending | partial | confirmed
status: draft
discovered: 2026-10-19
---

# Events — Sign in `[auth]`

> Observation only. Tier 1 (API calls) is recorded fact, taken from
> `automation/discovery/artifacts/login-admin/network.json`. Tier 2 (DB)
> is a claim and must name its evidence — it stays `PENDING` until
> `db-validator` fills it (CLAUDE.md section 9).

Source recording: `automation/discovery/artifacts/login-admin/`
(`network.json`, `console.json`, `walk.json`), walk
`automation/discovery/walks/login-admin.walk.ts`.

**Noise dropped from every table below:** the Angular bundle
(`/main.js`, `/polyfills.js`, `/chunk-*.js`, lazy route chunks), CSS,
images and translation chunks. Only calls to the application's own API
are kept. `GET /management/info` is kept because it is an application
endpoint and it answers anonymously.

**Convention used here:** a step that fires no request and changes no URL
(typing into a field) gets no `EVT-`. Field behaviour belongs to
`/discovery:validation-definition`. The sequence row for such a step
reads `— (no call)`.

## Index
| Event | Type | Screen | Trigger | Sequence step | API calls | DB |
|---|---|---|---|---|---|---|
| EVT-001 | onload | home-anonymous | Open `/` as a visitor | SEQ-001 step 1 | 2 | PENDING |
| EVT-002 | traverse | login | Navigate to `/login` | SEQ-001 step 2 | 3 | PENDING |
| EVT-003 | submit | login | **Sign in** button | SEQ-001 step 4 | 2 | PENDING |
| EVT-004 | click | home-signed-in | **Entities** menu | SEQ-001 step 5 | 0 | PENDING |

---

## EVT-001 — Anonymous home page renders

| Field | Value |
|---|---|
| Type | `onload` |
| Screen | home-anonymous |
| Element | — (document load of `/`) |
| From | SEQ-001 step 1 · [screenshot](../screens/SEQ-001-01-home-anonymous.png) |
| Observed | Welcome page. Navigation shows only **Home** and **Account**. The page prints the shipped logins in clear text (SEQ-001 finding 1, Q-001) |

### API calls (Tier 1 — observed)
| # | Method | Route | Request (shape) | Status | Response (shape) | ms |
|---|---|---|---|---|---|---|
| 1 | GET | `/management/info` | — | 200 | `{ "display-ribbon-on-profiles": string, git: {}, build: { artifact, name, time, version, group }, activeProfiles: string[] }` | 54 |
| 2 | GET | `/api/account` | — | **401** | empty body | 54 |

Order: both fire during bootstrap, `/management/info` first in the
recording. Neither depends on the other.

The 401 is the app probing for a session; the browser console records it
as `Failed to load resource: ... 401` (`console.json` step 1). A UI test
that asserts "no console errors" fails on a clean anonymous load.

### DB effect (Tier 2)
> PENDING — `db-validator` fills this block. Read-only access already
> exists (`DB_TYPE=postgres`), so this is not blocked on credentials.
> Expected to be a read-only event; **No write on read** must be
> confirmed, not assumed.

### Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| 1 | `GET /management/info` answers **200 to an anonymous caller** and returns the build artifact, version, build time, group and `activeProfiles: ["dev","secret-samples","api-docs"]` | It tells an unauthenticated visitor which profiles and docs endpoints are live. Monitoring screens are out of scope (CLAUDE.md section 3), but this call fires on an in-scope page | Q-012 |

---

## EVT-002 — Sign-in screen loads

| Field | Value |
|---|---|
| Type | `traverse` |
| Screen | login |
| Element | Navigation to `/login` (document load in the recording) |
| From | SEQ-001 step 2 · [screenshot](../screens/SEQ-001-02-login-empty.png) |
| Observed | "Sign in" form: `#username` (`data-cy="username"`), `#password` (`data-cy="password"`), Remember me, **Sign in** (`data-cy="submit"`) |

### API calls (Tier 1 — observed)
| # | Method | Route | Request (shape) | Status | Response (shape) | ms |
|---|---|---|---|---|---|---|
| 1 | GET | `/api/account` | — | **401** | empty body | 48 |
| 2 | GET | `/management/info` | — | 200 | as EVT-001 | 49 |
| 3 | GET | `/api/account` | — | **401** | empty body | 5 |

Order matters: `/api/account` fires **twice** for one screen load — once
during bootstrap and once more after the login route resolves. A test
that waits on `**/api/account` here matches the first of two.

### DB effect (Tier 2)
> PENDING — `db-validator` fills this block.

### Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| 1 | One load of `/login` fires `GET /api/account` twice (48 ms, then 5 ms) | Baseline Rule **No duplicate fetch**. Low impact here (401, cheap), but it makes response waits ambiguous in generated tests | Finding — low |

---

## EVT-003 — Sign in

| Field | Value |
|---|---|
| Type | `submit` |
| Screen | login |
| Element | `[data-cy="submit"]` (button "Sign in") |
| From | SEQ-001 step 4 · [screenshot](../screens/SEQ-001-04-home-signed-in.png) |
| Observed | The app navigates to `/`, shows "You are logged in as user \"admin\".", navigation gains **Entities** (`#entity-menu`) and **Administration** (`#admin-menu`). The JWT is written to **sessionStorage** (Remember me unticked) |

### API calls (Tier 1 — observed)
| # | Method | Route | Request (shape) | Status | Response (shape) | ms |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/authenticate` | `{ username: string, password: string (masked in evidence), rememberMe: boolean }` | 200 | **UNKNOWN** — body read aborted (`net::ERR_ABORTED`, "No data found for resource") | 77 |
| 2 | GET | `/api/account` | — | 200 | `{ activated: boolean, authorities: string[], createdBy: string, createdDate: null, email: string, firstName: string, id: number, imageUrl: string, langKey: string, lastModifiedBy: string, lastModifiedDate: null, lastName: string, login: string }` | 8 |

Order matters: `POST /api/authenticate` completes **before**
`GET /api/account` fires. A test waits on call 2 before asserting the
signed-in menus; waiting on call 1 alone asserts too early.

Observed values for call 2 (admin): `authorities: ["ROLE_USER","ROLE_ADMIN"]`,
`email: admin@localhost`, `login: admin`, `id: 1`.

Credentials travel in the request **body**, never in the URL — baseline
**No secrets in URLs** holds. The recorder masks the password before
anything is written to disk.

### DB effect (Tier 2)
> PENDING — `db-validator` fills this block. A sign-in may touch
> last-login or audit columns; none of that is visible from a network
> recording, so nothing is claimed here.

### Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| 1 | The **response body of `POST /api/authenticate` cannot be read** from the browser: the SPA navigates away and the read aborts. Status 200 is fact; the token field name, shape and lifetime are not recorded | Every API client and auth test needs the real response shape. It must be captured by calling the API directly, not by a UI walk | Q-003 (existing) |
| 2 | A failed sign-in was never submitted, so the error message, status and wording are unknown | The baseline asks for a visible, specific failure message that does not reveal whether the username exists | Q-016 |

---

## EVT-004 — Open the Entities menu

| Field | Value |
|---|---|
| Type | `click` |
| Screen | home-signed-in |
| Element | `#entity-menu` |
| From | SEQ-001 step 5 · [screenshot](../screens/SEQ-001-05-entities-menu-open.png) |
| Observed | Drop-down with exactly three items: **Bank Account** (`/bank-account`), **Label** (`/label`), **Operation** (`/operation`) |

### API calls (Tier 1 — observed)
| # | Method | Route | Request (shape) | Status | Response (shape) | ms |
|---|---|---|---|---|---|---|
| — | — | none | — | — | — | — |

No request is sent. The menu is rendered from client-side routes, so a
test asserts on the DOM, never on a response. SEQ-002 finding 9 records
that the follow-up navigation lands only after a short delay —
condition-based waits are required here.

### DB effect (Tier 2)
> PENDING — `db-validator` fills this block. No API call fired, so no DB
> effect is expected; **No write on read** is *unverified*, not proven.

### Findings
| # | What we saw | Why it matters | Raised as |
|---|---|---|---|
| — | Nothing beyond SEQ-001 | — | — |

---

## Shared calls (this module)
| Route | When | Note |
|---|---|---|
| `GET /management/info` | Every full document load, signed in or not | Returns build and profile information; answers anonymously (Q-012) |
| `GET /api/account` | Every full document load, and again after a route resolves | 401 anonymous, 200 signed in. Fires twice on the login screen (EVT-002 finding 1) |

## Not reachable by tracer (this module)
| Table | Observed | Note |
|---|---|---|
| any session / login-audit table | Unknown | A sign-in leaves no row the tracer can reach: this walk creates no named record. Absence of evidence, not evidence of absence |

## Standard comparison
Items from the standard event baseline (`references/event-baseline.md`
in the `event-definition` skill), cited by name. `Match`es included.
Every `Gap` is repeated under Findings or Questions.

| Baseline item | Mark | Applies to | What we found | Verdict | Raised as |
|---|---|---|---|---|---|
| **No write on read** | Rule | EVT-001, EVT-002, EVT-004 | Only GETs fired on load; no POST/PUT/PATCH/DELETE | Match | — |
| **No duplicate fetch** | Rule | EVT-002 | `GET /api/account` fired twice for one load of `/login` | Gap | Finding EVT-002 #1 (low) |
| **Server is the source** | Rule | EVT-003 | The signed-in menus follow `GET /api/account`, not local state | Match | — |
| **Bounded list** | Rule | — | No collection endpoint in this module | N/A — no list screen | — |
| **Loading state** | Rule | EVT-001..EVT-003 | Slowest call 77 ms; nothing near the ~1 s threshold | N/A — nothing slow enough to need one | — |
| **Something happens** | Rule | EVT-004 | The menu opens and shows three routes | Match | — |
| **One write per submit** | Rule | EVT-003 | One `POST /api/authenticate` per click in the recording; a double-click was not probed | UNKNOWN — Q-015 | Q-015 |
| **Guarded while in flight** | Rule | EVT-003 | The button's state during the request was not captured | UNKNOWN — Q-015 | Q-015 |
| **Success means success** | Rule | EVT-003 | The signed-in home page appeared only after a 200 | Match | — |
| **Failure is shown** | Rule | EVT-003 | A wrong password was never submitted in this walk | N/A — failure path not walked | Q-016 |
| **State reflects the server** | Rule | EVT-003 | Menus are driven by the `authorities` the server returned | Match | — |
| **No forged fields accepted** | Rule | EVT-003 | Only `username`, `password`, `rememberMe` are sent | Match | — |
| **Optimistic UI** | Decision | EVT-003 | Nothing is shown before the 200 arrives | N/A — not optimistic | — |
| **Retry safety** | Decision | EVT-003 | Resubmission not probed | UNKNOWN — Q-015 | Q-015 |
| **URL reflects state** | Rule | EVT-002, EVT-003 | `/login` is linkable; after sign-in the URL returns to `/` | Match | — |
| **Back does not resubmit** | Rule | EVT-003 | Back to `/login` was not walked | N/A — not walked | — |
| **In-flight requests** | Decision | EVT-003 | The navigation aborts the body read of its own POST, and the console logs `net::ERR_ABORTED` as an error | Gap | Q-013 |
| **GET is safe** | Rule | all events | No GET changed anything observable | Match | — |
| **Method matches intent** | Rule | EVT-003 | POST used to create a session | Match | — |
| **Client error status** | Rule | EVT-001, EVT-002 | Unauthenticated `/api/account` returns **401**, not 403 or an empty 200 | Match | — |
| **Never 5xx** | Rule | all events | No 5xx anywhere in the recording | Match | — |
| **One error envelope** | Rule | EVT-001, EVT-002 | The only error seen is a 401 with an empty body; nothing to compare against | UNKNOWN — Q-013 | Q-013 |
| **Auth on every call** | Rule | EVT-003 call 2 | The recorder stores **no request headers**, so an `Authorization` header cannot be evidenced. Behaviourally `/api/account` flips 401 → 200 after sign-in, which implies credentials are sent | UNKNOWN — Q-013 | Q-013 |
| **No secrets in URLs** | Rule | all events | Credentials in the POST body; no token, password or e-mail in any path or query | Match | — |
| **No over-exposure** | Rule | EVT-003 | `GET /api/account` returns `createdBy`, `lastModifiedBy`, `imageUrl`, `langKey` and the internal `id`, none of which the screen shows. Own-profile data only, so the risk is low | Gap (minor) | Finding — low |
| **Consistent shape** | Decision | EVT-003 | Only one representation of the account was seen | N/A — single view | — |
| **Payload bounded** | Rule | EVT-003 | An oversized body was not probed (API-layer work) | N/A — not probed | — |
| **Pending state** | Rule | EVT-003 | 77 ms; no pending state needed | N/A — under the ~1 s threshold | — |
| **Slow actions recorded** | Rule | all events | Slowest call 77 ms, all timings recorded above | Match | — |
| **Timeouts surface** | Rule | EVT-003 | Not probed | N/A — not probed | — |
| **Token stored where XSS could not trivially read it** (product overlay) | Decision | EVT-003 | JWT in `sessionStorage`, readable by any script on the page; nothing states the intent | Gap | Q-002 (existing) |
| **Failure must not reveal whether the username exists** (product overlay) | Decision | EVT-003 | Failure path not walked | UNKNOWN | Q-016 |
| **Credentials in the body, not the URL** (product overlay) | Rule | EVT-003 | Body only | Match | — |
| **Stated interval · Stops on leave · No retry storm · Pauses when hidden** | Rule/Decision | — | No polling, websocket or timer traffic in the recording | N/A — no background events found | — |
| **Where sorting happens** | Decision | — | No list in this module | N/A — no list | — |
| **Concurrent edits** | Decision | — | No editable record in this module | N/A — nothing editable | — |
| **Create status · Delete status · DELETE is idempotent** | Decision/Rule | — | No resource created or deleted in this module | N/A — no CRUD here | — |
| **One row per create · No orphans · Audit columns filled · Soft or hard delete · No write on GET** | Rule/Decision | — | Tier 2 not filled yet | N/A — `db-validator` | — |

Verdicts: `Match` · `Gap` · `Stricter` · `N/A — <reason>` · `UNKNOWN — Q-0xx`

## Questions
| ID | Question | Blocks |
|---|---|---|
| Q-012 | Should `GET /management/info` answer anonymously with the build version, build time and `activeProfiles` (`dev`, `secret-samples`, `api-docs`)? | The security test set; whether this becomes a defect |
| Q-013 | The walk recorder stores **no request or response headers**, and loses response bodies when the SPA navigates away. How do we evidence **Auth on every call**, `Location`, `Content-Type` and the error envelope — an API-level probe, or a recorder change? | EVT-003 and EVT-007 response shapes; the API client; `api-contract-check` |
| Q-015 | Is a submit guarded while in flight — does a double-click create one session / one record, or two? No walk probes it | Baseline **One write per submit** for EVT-003 and EVT-007 |
| Q-016 | What does a failed sign-in show, and does the message reveal whether the username exists? | Negative-path test cases for sign-in |

## Change log
| CR | Date | Change |
|---|---|---|
| — | 2026-10-19 | First mapping from `artifacts/login-admin`. EVT-001..EVT-004. |
