---
module: auth
sequences: [SEQ-001]
screens: [login]
validations: [VAL-010, VAL-011, VAL-012, VAL-013, VAL-014]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
discovered: 2026-10-19
---

# Validations — Sign in `[auth]`

> A rule recorded here is what the application did when probed — not what
> it ought to do. The `## Standard comparison` section is the exception:
> a `Gap` there is a finding, never an expected result.
>
> **Status: APPROVED** — rubaiat.ferdoes@leads-bd.com, 2026-10-19 (trial
> run). Accurate record of what the product does — the user-enumeration
> gap and the credential echo stay candidate defects, not expected results.

**Scope:** SEQ-001 (approved), screen `login` (`/login`) — Username,
Password, Remember me. Enforcement route: `POST /api/authenticate`
(SEQ-001 #4).

**Deliberate restraint:** lockout/throttling after repeated failures is
unconfirmed (Q-018), so almost every probe used a non-existent username
(`qa-nosuchuser`, `qa-…`). Exactly 2 wrong-password attempts hit the real
`admin` account, to read the message a real user sees. No lockout
occurred — `admin` still signs in.

**Evidence:** `automation/discovery/walks/val-login-form.walk.ts`,
`automation/discovery/artifacts/val-login-form/`.

## Fields covered
| Field | Selector | Declared in DOM | Rules |
|---|---|---|---|
| Username | `#username`, `data-cy="username"` | nothing — no `required`/`aria-required`/`maxlength`/`minlength`/`pattern`/`autocomplete` | VAL-010, 011 |
| Password | `#password`, `data-cy="password"` | nothing — same list | VAL-012, 013 |
| Remember me | `#rememberMe` checkbox | not required, unticked by default | none |
| (form) | Sign in `data-cy="submit"` | **enabled from the start**, even with both fields empty | see below |

## Rules
| ID | Field | Rule | Message | Enforced |
|---|---|---|---|---|
| VAL-010 | Username | required, min length 1 | UI: `Failed to sign in! Please check your credentials and try again.` — API 400 `size must be between 1 and 254` | **server** |
| VAL-011 | Username | max length 254 | Same messages. Boundary: 254 chars → 401, 255 → 400 | **server** |
| VAL-012 | Password | required, min length 4 | API 400 `size must be between 4 and 100`. Boundary: 3 chars → 400, 4 → 401 | **server** |
| VAL-013 | Password | max length 100 | Boundary: 100 chars → 401, 101 → 400 | **server** |
| VAL-014 | Username+Password | pair must match an account | API 401. **Body differs**: wrong password → `{"detail":"Bad credentials"}`; unknown user → `{"detail":"User qa-nosuchuser was not found in the database"}` | **server** |

**Every rule on this screen is `server`-only** — no client-side
validation exists (Finding 1).

## Form-level
| Rule | Observed |
|---|---|
| What enables Sign in? | Nothing — never disabled; empty submit fires a real `POST /api/authenticate` → 400 |
| Username trimmed? | No — `"  admin  "` + wrong password → 401 like any unknown login, spaces sent as typed |
| Password in DOM/URL? | No value attribute, not in `page.content()`, not in the URL — but **see Finding 3** for the error body |

## Quota
No collection to probe — sign-in creates no child records. Lockout/
throttling is a separate, unprobed limit: `UNKNOWN — Q-018`.

## Probe log
| Field | Probe | Value | Result |
|---|---|---|---|
| Username+Password | empty | both empty, submitted | 400, both field errors → VAL-010, VAL-012, Finding 1 |
| Password | empty | `qa-nosuchuser` + empty | 400 `size must be between 4 and 100` |
| Password | short | `qaX` (3) | 400, body echoes `rejected value [qaX]` → Finding 3 |
| Password | boundary | 4 / 100 / 101 chars | 401 / 401 / 400 → VAL-013 |
| Username | 1 char | `q` | 401 `User q was not found` — length 1 allowed |
| Username | 256 chars | `qa-`+253 chars | 400, clean, no 5xx ✅ |
| Username | boundary | 254 / 255 chars | 401 / 400 → VAL-011 |
| Username | spaces | `"  admin  "` + wrong pw | 401 — not trimmed |
| Username | unicode | `qa-日本-🔑` | 401, clean ✅ |
| Username+Password | SQLi | `' OR '1'='1` both | 401, nothing executed ✅ |
| Username duplicate, Password spaces/unicode/duplicate | — | Skipped — form creates/stores nothing to collide or round-trip |
| (form) | password in DOM | typed, page read | Not present ✅ |
| (account) | lockout/throttling | — | Not probed — needs permission (Q-018) |

## Standard comparison
`Match` unless noted. Every `Gap` is also a Finding or `Q-`.

| Baseline item | Field | Verdict | Raised as |
|---|---|---|---|
| Required + message (overlay) | Username, Password | Required server-only; one generic banner names neither field | Finding 1, Q-017 |
| Required (text) | Username, Password | Match — server rejects with a specific size message | — |
| Minimum length | Password | Match — 3 rejected, 4 accepted | — |
| Maximum length | Username, Password | Match — 254/100 enforced by the API | — |
| Trim whitespace | Username | **Gap** — not trimmed, not rejected | Finding 5, Q-019 |
| Sanitization | Username | Match — injection/unicode come back clean | — |
| No username-exists signal (overlay) | form | **Gap** — API body differs (`Bad credentials` vs `User <name> was not found`) | Finding 2, Q-016 |
| Password never in DOM/URL/trace (overlay) | Password | **Gap** — echoed in the 400 body on length failure | Finding 3 |
| Lockout/throttling (overlay, ASSUMPTION) | form | UNKNOWN — not probed | Q-018 |
| Messages are user-safe | form | **Gap** — 400 body quotes the controller's full Java signature | Finding 4 |
| Same rule, same wording everywhere | form | **Gap** — one generic wording covers 6 causes, names no field | Q-017 |
| Any 5xx is always a bug | all | Match — none produced | — |
| Boolean only (checkbox) | Remember me | N/A — forging it only affects token storage (SEQ-001 Q-002), not a validation question | Q-002 |
| Email/URL/date/file/select rules | — | N/A — no such field | — |
| Secret-field rules | — | N/A — no generated secret here (JWT is SEQ-001 Q-002) | — |
| Quota probe | — | N/A — no collection | — |

## Findings
| # | What we saw | Severity | Raised as |
|---|---|---|---|
| 1 | No client-side validation at all; Sign in never disabled; empty submit costs a real round trip | Medium (a11y/usability) | Q-017 |
| 2 | API body differs for unknown-user vs wrong-password — user enumeration, invisible to UI-only testing | High (security) | Q-016 |
| 3 | Short password echoed back in the 400 body (`rejected value [qaX]`) | High (security) | — |
| 4 | 400 body quotes the controller's full Java signature and Spring internals | Medium (security) | — |
| 5 | Username not trimmed — `"  admin  "` ≠ `admin` | Low | Q-019 |
| 6 | One wording covers 6 different failure causes, names no field | Low | Q-017 |

## Questions
| ID | Question |
|---|---|
| Q-016 | Should the API return the same body for unknown-user and wrong-password? |
| Q-017 | Should the form validate required fields client-side and name the field? |
| Q-018 | Is lockout/throttling intended after repeated failures? Needs permission to probe. |
| Q-019 | Should the username be trimmed before matching? |

## Data created and cleaned
No records created — every probe was a failed sign-in. 21 attempts total
(8 UI, 13 boundary/error-body), 2 against the real `admin` with a wrong
password, rest against non-existent logins. `admin` signed in
successfully 3 times afterward (API/quota/cleanup runs) — no lockout at
this volume, which bears only on this volume, not on Q-018.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First validation pass over SEQ-001. VAL-010..VAL-014 created. |
| 2026-10-19 | Tightened for length (CLAUDE.md §12) — no facts/IDs removed. |
