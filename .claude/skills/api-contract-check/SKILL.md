---
name: api-contract-check
description: Check that the platform's auto-generated Swagger/OpenAPI docs are valid, match what the customer created, and match how the endpoint really behaves. Use when testing or automating Swagger docs, schema validation, or API contract checks.
---

# API Contract Check

**Why this matters:** our product WRITES the Swagger docs itself. If the
generator has a bug, the docs and the endpoint can both be wrong in the
same way — and a test that trusts the docs will still pass. So we check
three things against each other:

```
  What the test case expects   ==   What the docs say   ==   What the API does
        (the truth)                 (generated — tested)     (runtime — tested)
```

The **test case** is the truth. The docs and the API are both under test.

## Step 1 — Is the spec valid?

Download the spec (JSON/YAML) and lint it:

```bash
npx @stoplight/spectral-cli lint openapi.json
```

- Errors = bug (the spec is broken for every customer's tools).
- Warnings = note them in the report; raise a bug only if they affect
  customers (e.g. missing response schema).

## Step 2 — Do the docs match what was created?

For the endpoint the test created, check the spec has:

| Check | Expected (from the test case) |
|---|---|
| Path and HTTP method | Exactly what was entered in the UI |
| Auth | Security scheme declared (API key header name) |
| Request parameters/body | Match what the endpoint accepts |
| Responses | Success + error responses (401, 404, ...) with schemas |
| Examples | Present and valid against their own schema |

## Step 3 — Does the API behave as documented?

Call the endpoint and check:

- Status code is one the docs list for this case
- Response body passes **JSON schema validation** against the documented schema
- `Content-Type` header matches the docs
- Required fields present; types correct; no undocumented fields leaking
  internal data (ids, stack traces)

## Step 4 (optional, recommended) — Automatic fuzzing

[Schemathesis](https://schemathesis.readthedocs.io) reads the spec and
sends hundreds of valid and invalid requests automatically:

```bash
# Create a throwaway qa- key first (via the Platform API, same as a test
# fixture would) — there's no static API key in .env; keys are always
# created at runtime, never stored as a secret.
st run openapi.json --url "$TEST_ENV_API_URL" -H "x-api-key: <qa- key created above>" --checks all
```

Any 5xx or response that doesn't match the spec = a finding.
Test environment only — it sends a lot of traffic.

## Step 5 — The docs page itself (UI)

- Docs page opens for the right users only (per requirement)
- "Try it out" with a valid key returns the same result as Step 3
- After the endpoint is deleted, it disappears from the docs

## Reporting

| Mismatch | What it means | Action |
|---|---|---|
| Test case ≠ docs | Doc generator bug | Raise BUG |
| Docs ≠ API | Docs or runtime bug | Raise BUG, note which side is wrong per test case |
| Test case ≠ docs ≠ API | Possibly unclear requirement | Raise a Q- question first |

Never "fix" a test by copying what the API returned into the expected
result.
