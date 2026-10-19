---
name: auth-security
description: Security test checklist for the JHipster sample app — JWT authentication failures, role-based access between admin and user, object-level authorisation on another user's records, injection inputs, and safe error messages, mapped to the OWASP API Security Top 10 (2023). Use when designing, automating, or reviewing security tests for this application.
---

# Authentication & Access Security

**Goal:** a signed-in user reaches only what they are entitled to, and
an unauthenticated caller reaches nothing.

Local trial environment only. Attack-style inputs (injection strings,
oversized payloads) go only against `qa-` data you created.

## 1. Authentication — all must return 401 and no data

| Input | Example |
|---|---|
| No token | `Authorization` header missing |
| Empty token | `Authorization: Bearer ` |
| Wrong token | A random string of the right shape |
| Malformed token | Two segments instead of three, unicode, spaces |
| Expired token | Sign in, wait past expiry, call again |
| Token signed with another secret | A JWT built with a different key |
| Token in the wrong place | In a query string instead of the header |

Record the exact status and body. A 500 on a malformed token is a bug,
not an authentication result.

## 2. Roles — `admin` versus `user`

The sample ships two accounts. Record what each can actually reach
rather than assuming:

| Check | Expected |
|---|---|
| `user` opens an admin-only screen (user management, metrics, logs) | Blocked, and the UI does not offer it |
| `user` calls an admin API route directly (`/api/admin/users`) | 403 |
| `admin` performs the normal journey | Works |
| A role change takes effect | Record whether a new token is needed |

## 3. OWASP API Security Top 10 (2023) — what applies here

| OWASP | Risk in this app | Test |
|---|---|---|
| API1 Broken Object Level Authorization | `user` reads or edits a bank account owned by `admin` | Call `GET /api/bank-accounts/{id}` for someone else's row → record the real response |
| API2 Broken Authentication | Weak token handling | Section 1 |
| API3 Broken Object Property Level Authorization | Response leaks internal fields; a request sets `user` or `id` it should not | Send another user's id in a create request → ignored or rejected |
| API4 Unrestricted Resource Consumption | No rate limit, oversized payloads | A very long `description`; a burst of calls → never a 5xx |
| API5 Broken Function Level Authorization | `user` on admin routes | Section 2 |
| API8 Security Misconfiguration | Verbose errors, open CORS, the H2 console exposed | No stack traces or SQL in errors; check `/h2-console` is unreachable |
| API9 Improper Inventory Management | Deleted records still reachable | Deleted id → 404, gone from lists |

## 4. Injection inputs

Use the negative data from `test-data/negative-data.json`. Expected for
every one: rejected with a clear 4xx, **or** stored safely as plain text
and rendered escaped — never a 5xx, never executed.

- SQL: `' OR '1'='1`, `'; DROP TABLE x; --`
- XSS: `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>`
- Path: `../../etc/passwd`

The sample uses JPA with bound parameters, so SQL injection *should* be
inert. Confirm it rather than assuming it, and check what the value looks
like when rendered back into the list.

## Rules

- Object-level access (does `user` get 403, 404 or the record?) is a
  **finding to record, not a rule to assume**. Write down what happened
  and raise it; there is no product owner here to decide.
- A security failure is at least P1 / Sev-2.
- Never commit a real token. Mask them in evidence (`eyJ...a1b2`).
