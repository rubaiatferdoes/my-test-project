---
id: SEQ-002
title: Create a bank account
module: accounts
flow: [2, 3]
entry_url: /bank-account
roles: [admin (tenant a)]
screens: [bank-account-list, bank-account-form, bank-account-detail]
events: [EVT-005, EVT-006, EVT-007, EVT-008]
validations: [VAL-001, VAL-002, VAL-003, VAL-004, VAL-005, VAL-006, VAL-007, VAL-008, VAL-009]
walk: automation/discovery/walks/create-bank-account.walk.ts
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
discovered: 2026-10-19
---

# SEQ-002: Create a bank account

> Status: APPROVED - rubaiat.ferdoes@leads-bd.com, 2026-10-19 (trial run).
> These observations are now the expected results for test design.
> Approval confirms they are an accurate record of what the product does;
> it does not declare the flagged findings below to be correct behaviour.

## Goal
A signed-in user opens the bank account list, creates a new account with a
name and a balance, and sees it in the list.

## Preconditions
- Signed in as `qa-tenant-a` (`admin`) - see SEQ-001. The walk reuses a saved session.
- The list already held **32 rows** before this walk (31 rows shipped with the sample plus one `qa-` row left by an earlier, failed walk - see "Data created").
- Account created by this walk: `qa-seq002-mveut2zp-02u8`, balance `123.45`.

## Path
| # | Screen | Action | What happened (observed) | Event | Screenshot |
|---|---|---|---|---|---|
| 1 | Bank account list | Open `/bank-account` (via Entities → Bank Account) | "Bank Accounts" heading, Refresh list, **Create a new Bank Account** (`data-cy="entityCreateButton"`). Table of 32 rows: ID/Name/Balance + View/Edit/Delete. `GET /api/bank-accounts?eagerload=true&sort=id,asc` → **200** (14 ms); every row carries `"user":null`, `"operations":null`. No paging, no search. | EVT-005 | [png](../screens/SEQ-002-01-bank-account-list-before.png) |
| 2 | Bank account form (empty) | Click **Create a new Bank Account** | URL `/bank-account/new`. `Name` (`#field_name`,`data-cy="name"`), `Balance` (`#field_balance`,`data-cy="balance"`), `User` (select `#field_user`, options `""`/`admin`/`user`, pre-selected `""`). **Save** (`data-cy="entityCreateSaveButton"`) disabled; Cancel enabled. Name/Balance show a red left bar, no asterisk, no `required`, no message. Opening the form fires `GET /api/users` → **200** — full user list downloaded. | EVT-006 | [png](../screens/SEQ-002-02-bank-account-form-empty.png) |
| 3 | Bank account form (filled) | Type `qa-seq002-mveut2zp-02u8` / `123.45`, leave User untouched | Both shown; Save enabled with User still empty — User is optional. No request while typing. | — (no call) | [png](../screens/SEQ-002-03-bank-account-form-filled.png) |
| 4 | Bank account list (after save) | Click **Save** | `POST /api/bank-accounts` → **201** (16 ms), body `{"id":null,"name":"qa-seq002-mveut2zp-02u8","balance":123.45,"user":null}`. Returns to `/bank-account`, banner "A new Bank Account is created with identifier 1003". List reloads via `GET /api/bank-accounts?eagerload=true&sort=id,asc` → 200. | EVT-007 | [png](../screens/SEQ-002-04-bank-account-list-after-save.png) |
| 5 | Bank account list (new row) | Read the new row | `1003 · qa-seq002-mveut2zp-02u8 · 123.45`. Row count 32→**33**, appended at the bottom (`sort=id,asc`). | — (no call) | [png](../screens/SEQ-002-05-bank-account-list-new-row.png) |
| 6 | Bank account detail | Open `/bank-account/1003/view` | ID `1003`, Name `qa-seq002-mveut2zp-02u8`, Balance `123.45`, **User blank**. Back/Edit buttons. `GET /api/bank-accounts/1003` → **200** (12 ms). | EVT-008 | [png](../screens/SEQ-002-06-bank-account-detail.png) |
| 7 | (read-only DB trace) | `SELECT id,name,balance,user_id FROM bank_account WHERE name=$1` | `id 1003, name qa-seq002-mveut2zp-02u8, balance 123.45, user_id NULL` — name/balance stored as typed, **no owner recorded**. | — (evidence for EVT-007) | — |

## Seen, not explored
| Screen / control | Where | Why not explored |
|---|---|---|
| **Delete** button on every row | List | Destructive - permission not yet given (CLAUDE.md section 5) |
| **Edit** button / `/bank-account/{id}/edit` | List and detail | Belongs to a later sequence (flow 5) |
| **Refresh list** button | List | Not needed to complete this workflow |
| **User** select (`admin`, `user`) | Create form | Left empty on purpose, to record what the app stores when the user does nothing. Choosing an owner is a separate path |
| **Cancel** button | Create form | Would abandon the record under test |
| Empty-form submit, over-long name, negative or non-numeric balance | Create form | Field rules belong to `/discovery:validation-definition` |

## Data created and cleaned
| Name | Type | Deleted? |
|---|---|---|
| `qa-seq002-mveut2zp-02u8` (id 1003) | bank account | Retained by decision (Q-004 answered — see `docs/discovery/README.md`) |
| `qa-seq002-mveuqzsq-f7km` (id 1002) | bank account | Retained by decision — created by an earlier failed run of this walk |

No row that does not start with `qa-` was touched. The 31 shipped rows are unchanged.

## Findings
| # | What we saw | Severity guess | Raised as |
|---|---|---|---|
| 1 | Account created by admin stored with **`user_id=NULL`** — UI never defaults the owner; CLAUDE.md §1 expects it to be the signed-in user | High (ownership) | Q-005 |
| 2 | `GET /api/bank-accounts` returns every account, no owner filter; whether `user` sees the same is untested here (E2E-04) | Needs a decision | Q-006 |
| 3 | Empty create form: Save disabled with no asterisk/`required`/`aria-required`, only a red left bar | Medium (a11y) | — |
| 4 | Opening the create form calls `GET /api/users`, downloading the full user list for an optional drop-down | Medium (data exposure) | Q-007 |
| 5 | Success banner names the internal DB id ("...identifier 1003"), not the account the user typed | Low | — |
| 6 | List renders all rows, no paging/search/sort, grows without limit | Low (performance) | — |
| 7 | Malformed `/bank-account//view` (hit accidentally) → **HTTP 401**, blank page, no heading/message/way back | Medium | Q-008 |
| 8 | `POST /api/bank-accounts` response body unreadable (`net::ERR_ABORTED`); created id had to be read off the list row. Same on `GET /api/users`, `GET /api/bank-accounts/1003` | Low (evidence gap) | — |
| 9 | Entities → Bank Account navigates after a short delay; a screenshot right after the click still showed the home page — needs a condition-based wait | Low (flaky-test risk) | — |

## Questions
| ID | Question |
|---|---|
| Q-004 | May discovery delete the two `qa-` accounts it created (1002, 1003)? First destructive action — CLAUDE.md §5 asks once per action type. |
| Q-005 | Should a bank account be owned by the signed-in user? Today `user_id` is NULL unless picked by hand. |
| Q-006 | Should the list show every account to every user, or only owned ones? |
| Q-007 | Should the create form expose the full user list to any signed-in user? |
| Q-008 | What should a malformed entity URL show? Today: blank page, 401, no message. |

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First walk. |
| 2026-10-19 | Tightened for length (CLAUDE.md §12); updated "Data created" to match the Q-004 retention decision. No facts/IDs removed. |
