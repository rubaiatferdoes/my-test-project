---
id: SEQ-001
title: Sign in as admin
module: auth
flow: [1]
entry_url: /
roles: [admin (tenant a)]
screens: [home-anonymous, login, home-signed-in, entities-menu]
events: [EVT-001, EVT-002, EVT-003, EVT-004]
validations: []
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
| 1 | Home (anonymous) | Open `/` | Page "Welcome, Java Hipster! (Jhipster Sample Application)". Navigation shows only **Home** and **Account**. A green box prints the shipped logins in clear text: `Administrator (login="admin" and password="admin") - User (login="user" and password="user")`. In the background `GET /api/account` returned **401**, which the browser console shows as an error. | EVT-001 | [png](../screens/SEQ-001-01-home-anonymous.png) |
| 2 | Sign in | Open `/login` | Heading "Sign in". Three fields: `Username` (`#username`, `data-cy="username"`), `Password` (`#password`, `data-cy="password"`), `Remember me` checkbox (unticked). Buttons/links: **Sign in** (`data-cy="submit"`), "Did you forget your password?", "Register a new account". Neither text field carries `required`, `maxlength`, `minlength` or `pattern` in the DOM; both carry the Angular class `ng-invalid`. `GET /api/account` returned **401** twice more. | EVT-002 | [png](../screens/SEQ-001-02-login-empty.png) |
| 3 | Sign in (filled) | Type the tenant-a username and password, do not submit | Both fields hold a value, the password renders masked. No request was sent while typing. The **Sign in** button is enabled. | - (no call) | [png](../screens/SEQ-001-03-login-filled.png) |
| 4 | Home (signed in) | Click **Sign in** | `POST /api/authenticate` → **200** in 74 ms with body `{"username":"admin","password":"<masked>","rememberMe":false}`. The app moved to `/` and showed "You are logged in as user \"admin\"." Navigation now also offers **Entities** (`#entity-menu`) and **Administration** (`#admin-menu`). `GET /api/account` → **200** returning `authorities: ["ROLE_USER","ROLE_ADMIN"]`, `email: admin@localhost`, `login: admin`. The JWT was written to **sessionStorage** (not localStorage, because "Remember me" was unticked). | EVT-003 | [png](../screens/SEQ-001-04-home-signed-in.png) |
| 5 | Entities menu | Click **Entities** | Drop-down with exactly three items: **Bank Account** (`/bank-account`), **Label** (`/label`), **Operation** (`/operation`). No request was sent. | EVT-004 | [png](../screens/SEQ-001-05-entities-menu-open.png) |

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
| # | What we saw | Screenshot | Severity guess | Raised as |
|---|---|---|---|---|
| 1 | The anonymous home page prints working credentials for both shipped accounts in clear text (`admin`/`admin`, `user`/`user`). Anyone who can reach the host can sign in as an administrator. | SEQ-001-01 | High (security) | Q-001 |
| 2 | Before anyone signs in, the app calls `GET /api/account` and gets **401**; the browser console logs it as a failed resource. Expected probing, but it means a console-error assertion would fail on a clean page load. | SEQ-001-01, SEQ-001-02 | Low (noise) | — |
| 3 | The sign-in fields carry no `required`, `maxlength` or `pattern` attribute and no `aria-required`. Required-ness exists only inside the Angular form state. Screen readers and anyone reading the DOM cannot tell the fields are mandatory. | SEQ-001-02 | Medium (accessibility) | — |
| 4 | With "Remember me" unticked the JWT is kept in **sessionStorage**, readable by any script running on the page. Recorded as an observation about where the token lives, not a judgement. | — | Needs a decision | Q-002 |
| 5 | The `POST /api/authenticate` **response body cannot be read** by an observer in the browser: the SPA navigates away and the body read is aborted (`net::ERR_ABORTED`, "No data found for resource"). Status 200 is recorded; the token shape must be confirmed through the API, not the UI walk. | — | Low (evidence gap) | Q-003 |

## Questions
| ID | Question | Blocks |
|---|---|---|
| Q-001 | Is advertising the default `admin`/`admin` credentials on the public home page acceptable for this deployment, or is it a defect to raise? | The security test set; a decision on whether this is a bug |
| Q-002 | Where is the JWT expected to live - sessionStorage (no "Remember me") or localStorage (with it)? Is either in scope for an auth-security test? | `auth-security` checks |
| Q-003 | What does `POST /api/authenticate` return on success (field names, token lifetime)? It must be captured through the API, since the UI aborts the body read. | EVT for login; the API client's token handling |

## Change log
| CR | Date | Change |
|---|---|---|
| — | 2026-10-19 | First walk. |
