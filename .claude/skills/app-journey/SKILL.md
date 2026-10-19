---
name: app-journey
description: The end-to-end journey of the JHipster sample application — log in, create a bank account, record operations against it with labels, edit and delete — with the checkpoints to verify at each step and the standard E2E scenarios. Use when designing, automating, or reviewing E2E tests for this application.
---

# App Journey — JHipster sample application

**Goal:** prove a signed-in user can create a bank account, record
operations against it, and remove them again — and that the data is
stored, shown and deleted correctly at every step.

This is the **trial** product: an open-source sample app we run locally
to exercise the QA framework itself. See CLAUDE.md section 1.

## The journey and what to check at each step

| # | Step | UI check | API check | DB check |
|---|---|---|---|---|
| 1 | Log in as `admin` | Home page shows the signed-in menu | `POST /api/authenticate` returns a token | — |
| 2 | Create a bank account `qa-...` | Success toast; the account appears in the list | `POST /api/bank-accounts` → 201 with the saved fields | Row in `bank_account`, `user_id` set to the signed-in user |
| 3 | Open the account list | The new account is listed with its balance | `GET /api/bank-accounts` includes it | — |
| 4 | Create a label `qa-...` | Label appears in the label list | `POST /api/labels` → 201 | Row in `jhi_label` |
| 5 | Record an operation on the account, with that label | Operation listed under the account | `POST /api/operations` → 201 | Row in `operation` with `bank_account_id`; a row in the `operation_label` join table |
| 6 | Edit the operation's amount | The new amount shows in the list | `PUT /api/operations/{id}` → 200 | `operation.amount` updated |
| 7 | Delete the operation, then the account | Both disappear from their lists | `DELETE` → 204; a follow-up `GET /{id}` → 404 | Rows gone; **no orphan rows left in `operation_label`** |

**Order matters:** delete the operation before the account. Deleting the
account first may cascade, which would hide whether the operation delete
works on its own.

## Standard E2E scenarios

| ID | Scenario | Priority | Key expected result |
|---|---|---|---|
| E2E-01 | Happy path: steps 1 → 7 in order | P0 | Every checkpoint above passes |
| E2E-02 | Create an account with the required fields empty | P0 | Rejected with the form's own message; nothing written |
| E2E-03 | Call the API without a token / with a bad token | P0 | 401, no data in the response |
| E2E-04 | Sign in as `user` and read another user's bank account | P1 | Rejected or not listed — record what actually happens, it is a finding either way |
| E2E-05 | Delete an account that still has operations | P1 | Record the real behaviour: blocked, cascaded, or orphaned |
| E2E-06 | Send a value the form blocks straight to the API | P0 | Should be rejected. If accepted, that is the defect this framework exists to find |
| E2E-07 | Operation with two labels, remove one | P2 | One join row removed, the other stays |

## How to automate it

Everything is TypeScript + Playwright, following the `ts-pom-standards` skill.

- **UI steps** (forms, lists) → page objects in `ui/pages/`.
- **API steps** → API clients in `api/clients/`, in the same test.
- **Setup and cleanup through the API**, not the UI. Only the step under
  test goes through the UI.
- **Cleanup always runs**, even if the test fails: delete the operation,
  then the label, then the account.
- Sign in as `admin` for the main flow and `user` for E2E-04.
- JWT: sign in once per worker, reuse the token; never hard-code one.

## Why this journey

It was chosen to exercise the parts of the framework that have no proof
behind them yet:

| Framework feature | What this journey tests it with |
|---|---|
| Validation enforcement (`client` / `server` / `both`) | `name` and `balance` carry `@NotNull` **and** `Validators.required` — the answer should be `both` |
| The tracer finding a table and column | `bank_account.name` holds a `qa-` value we control |
| The foreign-key walk | `operation.bank_account_id` → one level |
| The walk through a **join table** | `operation_label` — the hard case |
| Orphan detection | Join rows left behind after a delete |
