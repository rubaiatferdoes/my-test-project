---
module: auth
sequences: [SEQ-001]
events: [EVT-001, EVT-002, EVT-003, EVT-004]
db_mapping: pending        # pending | partial | confirmed
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
discovered: 2026-10-19
---

# Events — Sign in `[auth]`

> Tier 1 (API calls) is recorded fact, from
> `automation/discovery/artifacts/login-admin/network.json`. Tier 2 (DB)
> stays `PENDING` until `db-validator` fills it (CLAUDE.md §9).
>
> **Status: APPROVED** — rubaiat.ferdoes@leads-bd.com, 2026-10-19 (trial
> run). Accurate record of what the product does — not an endorsement of
> the 5xx/enumeration/leak findings below; those stay candidate defects.

Source: `automation/discovery/artifacts/login-admin/`, walk
`automation/discovery/walks/login-admin.walk.ts`.

Noise dropped from every table: Angular bundle/CSS/image/translation
chunks. A step with no request and no URL change gets no `EVT-` (field
typing — that's `validation-definition`'s job); its sequence row reads
`— (no call)`.

## Index
| Event | Type | Screen | Trigger | Seq step | API calls | DB |
|---|---|---|---|---|---|---|
| EVT-001 | onload | home-anonymous | Open `/` | SEQ-001 #1 | 2 | PENDING |
| EVT-002 | traverse | login | Navigate to `/login` | SEQ-001 #2 | 3 | PENDING |
| EVT-003 | submit | login | **Sign in** button | SEQ-001 #4 | 2 | PENDING |
| EVT-004 | click | home-signed-in | **Entities** menu | SEQ-001 #5 | 0 | PENDING |

---

## EVT-001 — Anonymous home page renders

Screen: home-anonymous · [screenshot](../screens/SEQ-001-01-home-anonymous.png)
Observed: welcome page, nav shows only Home/Account; prints shipped
credentials in clear text (Q-001).

| # | Method | Route | Status | Response (shape) | ms |
|---|---|---|---|---|---|
| 1 | GET | `/management/info` | 200 | `{display-ribbon-on-profiles, git:{}, build:{artifact,name,time,version,group}, activeProfiles:string[]}` | 54 |
| 2 | GET | `/api/account` | **401** | empty | 54 |

Both fire on bootstrap, independent of each other. The 401 logs to
console as an error — a "no console errors" assertion fails on a clean
anonymous load.

**DB:** PENDING (`db-validator`). Read-only access exists — not blocked
on credentials.

**Finding:** `GET /management/info` answers 200 anonymously with build
artifact/version/time and `activeProfiles: ["dev","secret-samples","api-docs"]`. **Q-012.**

---

## EVT-002 — Sign-in screen loads

Screen: login · [screenshot](../screens/SEQ-001-02-login-empty.png)
Observed: `#username`/`data-cy="username"`, `#password`/`data-cy="password"`,
Remember me, **Sign in**/`data-cy="submit"`.

| # | Method | Route | Status | Response | ms |
|---|---|---|---|---|---|
| 1 | GET | `/api/account` | 401 | empty | 48 |
| 2 | GET | `/management/info` | 200 | as EVT-001 | 49 |
| 3 | GET | `/api/account` | 401 | empty | 5 |

**DB:** PENDING.

**Finding (low):** `/api/account` fires twice for one `/login` load
(baseline **No duplicate fetch**) — a response-wait keyed to the first
call resolves early.

---

## EVT-003 — Sign in

Screen: login · trigger `[data-cy="submit"]` · [screenshot](../screens/SEQ-001-04-home-signed-in.png)
Observed: navigates to `/`, "You are logged in as user \"admin\".", nav
gains Entities/Administration. JWT → **sessionStorage** (Remember me
unticked).

| # | Method | Route | Request | Status | Response | ms |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/authenticate` | `{username, password (masked), rememberMe}` | 200 | **UNKNOWN** — body read aborted (`net::ERR_ABORTED`) | 77 |
| 2 | GET | `/api/account` | — | 200 | `{activated, authorities[], createdBy, createdDate:null, email, firstName, id, imageUrl, langKey, lastModifiedBy, lastModifiedDate:null, lastName, login}` | 8 |

Call 1 completes before call 2 — wait on call 2 before asserting the
signed-in menus. Admin values: `authorities:["ROLE_USER","ROLE_ADMIN"]`,
`email:admin@localhost`, `login:admin`, `id:1`. Credentials travel in the
body only (**No secrets in URLs** holds); recorder masks the password.

**DB:** PENDING. A sign-in may touch audit columns; not visible from network.

**Findings:**
- `POST /api/authenticate`'s response body is unreadable from the UI —
  token shape/lifetime must be captured via a direct API call (Q-003).
- Failed sign-in not submitted here — message/status unknown (Q-016).

---

## EVT-004 — Open the Entities menu

Screen: home-signed-in · trigger `#entity-menu` · [screenshot](../screens/SEQ-001-05-entities-menu-open.png)
Observed: drop-down with exactly Bank Account (`/bank-account`), Label
(`/label`), Operation (`/operation`). No request fired — DOM-only
assertion. Follow-up navigation lands after a short delay (SEQ-002
finding 9) — needs a condition-based wait.

**DB:** PENDING. No call fired, so no effect expected; **No write on
read** unverified here.

## Shared calls (this module)
| Route | When | Note |
|---|---|---|
| `GET /management/info` | Every full load | Build/profile info, answers anonymously (Q-012) |
| `GET /api/account` | Every full load + after route resolve | 401 anon / 200 signed in; fires twice on login (EVT-002) |

## Not reachable by tracer
| Table | Note |
|---|---|
| session/login-audit | A sign-in leaves no row the tracer can reach from this walk |

## Standard comparison
`Match` unless noted. Every `Gap`/`UNKNOWN` is also a Finding or `Q-`.

| Baseline item | Applies to | Verdict | Raised as |
|---|---|---|---|
| No write on read | EVT-001,002,004 | Match | — |
| No duplicate fetch | EVT-002 | **Gap** | Finding (low) |
| Server is the source | EVT-003 | Match | — |
| Bounded list / Loading state | — / EVT-001-3 | N/A (no list) / N/A (nothing >~1s) | — |
| Something happens | EVT-004 | Match | — |
| One write per submit · Guarded in flight · Retry safety | EVT-003 | **UNKNOWN** — double-submit not probed | Q-015 |
| Success means success · State reflects server · No forged fields | EVT-003 | Match | — |
| Failure is shown | EVT-003 | N/A — failure path not walked | Q-016 |
| In-flight requests | EVT-003 | **Gap** — own POST's body read aborts, logged as a console error | Q-013 |
| GET is safe · Method matches intent · Client error status (401 not 403) · Never 5xx | all | Match | — |
| One error envelope · Auth on every call | EVT-001-3 | **UNKNOWN** — no headers recorded, no second error to compare | Q-013 |
| No secrets in URLs | all | Match | — |
| No over-exposure | EVT-003 | **Gap (minor)** — `/api/account` returns `createdBy`/`lastModifiedBy`/`imageUrl`/`langKey`/`id`, own-profile only | Finding (low) |
| URL reflects state | EVT-002,003 | Match | — |
| Token stored where XSS can't trivially read it (overlay) | EVT-003 | **Gap** — sessionStorage, intent unstated | Q-002 |
| Failure must not reveal username exists (overlay) | EVT-003 | UNKNOWN — not walked | Q-016 |
| Credentials in body not URL (overlay) | EVT-003 | Match | — |
| Background-polling rules · sorting · concurrent edits · CRUD rules | — | N/A — none apply to this module | — |
| DB rules (one row per create, no orphans, audit columns, soft/hard delete) | — | N/A — pending `db-validator` | — |

## Questions
| ID | Question |
|---|---|
| Q-012 | Should `/management/info` answer anonymously with build/profile data? |
| Q-013 | Recorder has no headers and loses bodies on SPA navigation — how do we evidence Auth-on-every-call / error envelope? |
| Q-015 | Is a submit guarded in flight (double-click → 1 session or 2)? |
| Q-016 | What does a failed sign-in show — does it reveal whether the username exists? |

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First mapping from `artifacts/login-admin`. EVT-001..EVT-004. |
| 2026-10-19 | Tightened for length (CLAUDE.md §12) — no facts/IDs removed. |
