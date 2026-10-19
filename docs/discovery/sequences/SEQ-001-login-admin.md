---
id: SEQ-001
title: Sign in as admin
module: auth
flow: [1]
entry_url: /
roles: [admin (tenant a)]
screens: [home-anonymous, login, home-signed-in, entities-menu]
events: [EVT-001, EVT-002, EVT-003, EVT-004]
validations: [VAL-010, VAL-011, VAL-012, VAL-013, VAL-014]
walk: automation/discovery/walks/login-admin.walk.ts
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
discovered: 2026-10-19
---

# SEQ-001: Sign in as admin

> Status: APPROVED - rubaiat.ferdoes@leads-bd.com, 2026-10-19 (trial run).
> These observations are now the expected results for test design.
> Approval confirms they are an accurate record of what the product does;
> it does not declare the flagged findings below to be correct behaviour.

## Goal
A visitor opens the application, signs in with the `qa-tenant-a` account
(`admin`), and lands on a home page that shows the signed-in menus.

## Preconditions
- The sample app answers on `TEST_ENV_BASE_URL` (`/management/health` reported `UP`).
- Credentials come from `.env` (`QA_TENANT_A_USER` / `QA_TENANT_A_PASSWORD`). No data is created by this walk.

## Path
| # | Screen | Action | What happened (observed) | Event | Screenshot |
|---|---|---|---|---|---|
| 1 | Home (anonymous) | Open `/` | "Welcome, Java Hipster!". Nav shows only Home/Account. A green box prints both shipped logins in clear text (`admin`/`admin`, `user`/`user`). `GET /api/account` → **401** (logged as a console error). | EVT-001 | [png](../screens/SEQ-001-01-home-anonymous.png) |
| 2 | Sign in | Open `/login` | "Sign in" heading. `Username` (`#username`,`data-cy="username"`), `Password` (`#password`,`data-cy="password"`), Remember me (unticked). **Sign in** (`data-cy="submit"`), "forgot password?", "Register". Neither field has `required`/`maxlength`/`minlength`/`pattern` in the DOM; both carry `ng-invalid`. `GET /api/account` → 401 ×2 more. | EVT-002 | [png](../screens/SEQ-001-02-login-empty.png) |
| 3 | Sign in (filled) | Type tenant-a creds, don't submit | Both fields hold a value, password masked. No request while typing. Sign in enabled. | — (no call) | [png](../screens/SEQ-001-03-login-filled.png) |
| 4 | Home (signed in) | Click **Sign in** | `POST /api/authenticate` → **200** (74 ms), body `{"username":"admin","password":"<masked>","rememberMe":false}`. Moves to `/`, "You are logged in as user \"admin\"." Nav gains Entities (`#entity-menu`)/Administration (`#admin-menu`). `GET /api/account` → 200, `authorities:["ROLE_USER","ROLE_ADMIN"]`, `email:admin@localhost`, `login:admin`. JWT → **sessionStorage** (Remember me unticked). | EVT-003 | [png](../screens/SEQ-001-04-home-signed-in.png) |
| 5 | Entities menu | Click **Entities** | Drop-down: Bank Account (`/bank-account`), Label (`/label`), Operation (`/operation`). No request fired. | EVT-004 | [png](../screens/SEQ-001-05-entities-menu-open.png) |

## Seen, not explored
| Screen / control | Where | Why not explored |
|---|---|---|
| "Register a new account" (`/account/register`) | Home and sign-in page | Creates a real user account; outside this workflow |
| "Did you forget your password?" (`/account/reset/request`) | Sign-in page | Sends an e-mail; needs permission before use |
| **Administration** menu | Navigation bar, signed in | Admin/monitoring screens are out of scope (CLAUDE.md section 3) |
| **Account** menu (settings, password, sign out) | Navigation bar | Not part of this workflow |
| "Remember me" checkbox | Sign-in page | Left unticked; its effect on token storage is recorded as a question |
| **Label** and **Operation** entity screens | Entities menu | Later steps of the journey (flow 4-7) |

## Data created and cleaned
| Name | Type | Deleted? |
|---|---|---|
| none | — | — |

## Findings
| # | What we saw | Severity guess | Raised as |
|---|---|---|---|
| 1 | Anonymous home page prints both shipped credentials in clear text | High (security) | Q-001 |
| 2 | `GET /api/account` → 401 before sign-in, logged as a console error — a "no console errors" assertion fails on a clean load | Low (noise) | — |
| 3 | Sign-in fields have no `required`/`maxlength`/`pattern`/`aria-required` — screen readers can't tell they're mandatory | Medium (a11y) | — |
| 4 | JWT kept in sessionStorage (Remember me unticked), readable by any script on the page | Needs a decision | Q-002 |
| 5 | `POST /api/authenticate`'s response body is unreadable from the UI (SPA navigates away, `net::ERR_ABORTED`); status 200 is recorded, token shape must come from a direct API call | Low (evidence gap) | Q-003 |

## Questions
| ID | Question | Blocks |
|---|---|---|
| Q-001 | Is advertising the default `admin`/`admin` credentials on the public home page acceptable for this deployment, or is it a defect to raise? | The security test set; a decision on whether this is a bug |
| Q-002 | Where is the JWT expected to live - sessionStorage (no "Remember me") or localStorage (with it)? Is either in scope for an auth-security test? | `auth-security` checks |
| Q-003 | What does `POST /api/authenticate` return on success (field names, token lifetime)? It must be captured through the API, since the UI aborts the body read. | EVT for login; the API client's token handling |

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First walk. |
| 2026-10-19 | Tightened for length (CLAUDE.md §12) — no facts/IDs removed. |
