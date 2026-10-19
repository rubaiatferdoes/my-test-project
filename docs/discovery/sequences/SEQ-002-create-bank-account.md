---
id: SEQ-002
title: Create a bank account
module: accounts
flow: [2, 3]
entry_url: /bank-account
roles: [admin (tenant a)]
screens: [bank-account-list, bank-account-form, bank-account-detail]
events: [EVT-005, EVT-006, EVT-007, EVT-008]
validations: []
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
| 1 | Bank account list | Open `/bank-account` (reached in the UI through **Entities → Bank Account**) | Heading "Bank Accounts" with **Refresh list** and **Create a new Bank Account** (`data-cy="entityCreateButton"`). A table of 32 rows, columns ID / Name / Balance and per-row **View**, **Edit**, **Delete**. `GET /api/bank-accounts?eagerload=true&sort=id,asc` → **200** in 14 ms. Every row in the response carries `"user": null` and `"operations": null`. The whole table is rendered at once - no paging control, no search box. | EVT-005 | [png](../screens/SEQ-002-01-bank-account-list-before.png) |
| 2 | Bank account form (empty) | Click **Create a new Bank Account** | URL `/bank-account/new`, heading "Create or edit a Bank Account". Fields: `Name` (text, `#field_name`, `data-cy="name"`), `Balance` (number, `#field_balance`, `data-cy="balance"`), `User` (select, `#field_user`, options `""`, `admin`, `user`, pre-selected `""`). **Save** (`data-cy="entityCreateSaveButton"`) is **disabled**; **Cancel** is enabled. Name and Balance show a red bar on the left edge; there is no asterisk, no `required` attribute and no message saying what is missing. Opening the form fired `GET /api/users` → **200**, so the form downloads the full user list. | EVT-006 | [png](../screens/SEQ-002-02-bank-account-form-empty.png) |
| 3 | Bank account form (filled) | Type `qa-seq002-mveut2zp-02u8` into Name and `123.45` into Balance; leave **User** untouched | Both values are shown. **Save** became enabled with the User select still empty, so User is optional. No request was sent while typing. | - (no call) | [png](../screens/SEQ-002-03-bank-account-form-filled.png) |
| 4 | Bank account list (after save) | Click **Save** | `POST /api/bank-accounts` → **201** in 16 ms. Request body: `{"id":null,"name":"qa-seq002-mveut2zp-02u8","balance":123.45,"user":null}`. The app returned to `/bank-account` and showed a green banner: **"A new Bank Account is created with identifier 1003"**. The list reloaded with `GET /api/bank-accounts?eagerload=true&sort=id,asc` → **200**. | EVT-007 | [png](../screens/SEQ-002-04-bank-account-list-after-save.png) |
| 5 | Bank account list (new row) | Read the new row | Last row reads `1003` · `qa-seq002-mveut2zp-02u8` · `123.45` · View Edit Delete. Row count went from 32 to **33**. The new row is appended at the bottom (sort is `id,asc`). | - (no call) | [png](../screens/SEQ-002-05-bank-account-list-new-row.png) |
| 6 | Bank account detail | Open `/bank-account/1003/view` | Heading "Bank Account". ID `1003`, Name `qa-seq002-mveut2zp-02u8`, Balance `123.45`, **User is blank**. Buttons **Back** and **Edit**. `GET /api/bank-accounts/1003` → **200** in 12 ms. | EVT-008 | [png](../screens/SEQ-002-06-bank-account-detail.png) |
| 7 | (read-only DB trace, not a screen) | `SELECT id, name, balance, user_id FROM bank_account WHERE name = $1` | One row: `id 1003, name qa-seq002-mveut2zp-02u8, balance 123.45, user_id NULL`. The name and balance are stored as typed; **no owner is recorded**. | - (not a UI event; evidence for EVT-007) | — |

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
| `qa-seq002-mveut2zp-02u8` (id 1003) | bank account | ❌ Not yet - waiting for permission to delete (Q-004) |
| `qa-seq002-mveuqzsq-f7km` (id 1002) | bank account | ❌ Not yet - created by an earlier run of this walk that failed at step 6 (Q-004) |

No row that does not start with `qa-` was touched. The 31 rows shipped with the sample are unchanged.

## Findings
| # | What we saw | Screenshot | Severity guess | Raised as |
|---|---|---|---|---|
| 1 | An account created by the signed-in admin is stored with **`user_id = NULL`**. The UI never offers to default the owner to the signed-in user, the request sends `"user": null`, and the detail screen shows User blank. The journey in CLAUDE.md expects `user_id` to be the signed-in user - observed behaviour differs. | SEQ-002-06 | High (ownership / data model) | Q-005 |
| 2 | `GET /api/bank-accounts` returns **every** account, with no filter by owner, and the list shows all 33. Whether a non-admin sees the same list was not tested in this walk (that is E2E-04). | SEQ-002-01 | Needs a decision | Q-006 |
| 3 | On the empty create form, **Save is disabled and nothing explains why**. There is no asterisk, no `required`/`aria-required` attribute and no message; the only signal is a red bar on the left edge of the input. A user who cannot see colour gets no cue at all. | SEQ-002-02 | Medium (usability / accessibility) | — |
| 4 | Opening the create form calls `GET /api/users`, so the form hands the browser the full list of application users (here `admin`, `user`) just to populate an optional drop-down. | SEQ-002-02 | Medium (data exposure) | Q-007 |
| 5 | The success banner names an internal database identifier - "A new Bank Account is created with identifier 1003" - rather than the account the user typed. | SEQ-002-04 | Low | — |
| 6 | The list renders all rows with no paging, no search and no sort control; it grows without limit as accounts are added. | SEQ-002-01 | Low (performance risk) | — |
| 7 | A full page load of a malformed entity URL (`/bank-account//view`, produced accidentally during this walk) returned **HTTP 401** for the HTML document and rendered a completely blank page: no heading, empty `<title>`, no error message and no way back. | — (artifact only) | Medium | Q-008 |
| 8 | The **response body** of `POST /api/bank-accounts` could not be read from the browser - the SPA navigates away and the read is aborted (`net::ERR_ABORTED`). Status 201 is recorded; the created id had to be read off the list row instead. Same effect on `GET /api/users` and `GET /api/bank-accounts/1003`. | — | Low (evidence gap) | — |
| 9 | Clicking **Entities → Bank Account** navigates only after a short delay; a screenshot taken straight after the click still showed the home page. No request had been sent at that point. Re-run with an explicit wait, the navigation happened and `GET /api/bank-accounts` followed. Recorded because any UI test on this menu will need a condition-based wait, not an immediate assertion. | SEQ-001-05 | Low (flaky-test risk) | — |

## Questions
| ID | Question | Blocks |
|---|---|---|
| Q-004 | May discovery delete the two `qa-` bank accounts it created (ids 1002, 1003)? This is the first destructive action of the run; CLAUDE.md section 5 requires asking once per action type. | Cleanup of this walk; sequences for flow 6-7 |
| Q-005 | Should a bank account created through the UI be owned by the signed-in user? Today `user_id` is NULL unless the creator picks an owner by hand. | Whether finding 1 becomes a bug; the DB check for flow 2 |
| Q-006 | Is the bank account list meant to show every account to every signed-in user, or only the ones they own? | E2E-04, the object-level access tests |
| Q-007 | Should the create form expose the full user list (`GET /api/users`) to any signed-in user, or only to admins? | Security test set |
| Q-008 | What should a malformed entity URL show? Today it is a blank page with a 401 and no message. | Error-handling tests |

## Change log
| CR | Date | Change |
|---|---|---|
| — | 2026-10-19 | First walk. |
