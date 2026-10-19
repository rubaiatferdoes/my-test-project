---
name: event-definition
description: Turn a recorded UI walk into event definitions — every click, page load, and navigation, the API calls it fires with request/response detail, and the database tables it touches. Use when mapping UI events to API calls or database tables, or when an event definition is requested.
---

# Event Definition — what each UI action actually does

**Goal:** for every event a user can trigger, write down exactly what the
system does behind the screen, so a test can assert on it and a failure
can be traced to a layer.

**Input:** approved `docs/discovery/sequences/SEQ-*.md` and the raw
recordings in `automation/discovery/artifacts/`.
**Output:** `docs/discovery/events/<module>.events.md`, one file per
module (template:
[templates/events-template.md](templates/events-template.md)).

## 1. Two tiers — know which one you are writing

| Tier | Content | Certainty | Where it comes from |
|---|---|---|---|
| **1 — Event + API** | Trigger, element, API calls with method, route, payload, status, response, timing | **Observed fact** | The network recording. Available now |
| **2 — DB effect** | Tables touched, insert/update/delete, which columns | **Claim — needs a source** | Read-only DB diff. `PENDING` until `DB_TYPE` and credentials exist |

Never write a Tier 2 row you cannot evidence. `PENDING` is a correct,
useful answer; a guessed table name is worse than nothing because the
next person will trust it.

## 2. Event types

| Type | Trigger | Typical evidence |
|---|---|---|
| `onload` | A screen or panel renders | GET calls fired without a user action |
| `click` | Button, link, menu item, row | The calls between the click and the next stable screen |
| `submit` | A form is sent | Usually one POST/PUT/PATCH plus a reload GET |
| `traverse` | Navigation between screens, tabs, pagination, back | Route change, often with a new GET |
| `background` | Polling, websockets, retries with no user action | Repeating calls on a timer |

`background` matters more than it looks: a screen that polls every 2 s is
a future source of flaky tests and a reason to use condition-based waits.

## 3. Tier 1 — from the recording to the definition

For each step in the sequence:

1. Take the network slice between this step and the next.
2. Drop noise: static assets, fonts, analytics, source maps. Keep every
   call to the application's own API host.
3. For each remaining call record: method, route **with path parameters
   generalised** (`/endpoints/{id}/keys`, not the literal UUID), request
   body shape, status, response shape, duration.
4. Mask secrets in both directions before writing anything down.
5. Note the ORDER. "POST then GET" versus "GET then POST" is the
   difference between a correct test and a flaky one.

Record the response **shape**, not a dump: field names and types, and
anything unexpected. A response holding fields the screen never shows is
a finding (possible data leak — see `auth-security` API3).

## 4. Tier 2 — the database effect

Until `DB_TYPE` is set, every event's DB block reads:

```
> PENDING — no read-only DB access yet. Raised as Q-0xx.
```

When read-only access arrives, `db-validator` fills these blocks in —
and only it may edit an approved event file's `db:` block (CLAUDE.md
section 9).

**A read-only `SELECT` user is enough.** Nothing else is needed from
backend or DevOps, and no quiet environment is needed either, because
the method never counts rows globally — it follows one marked record.

### The tracer

Every record discovery creates carries a unique name:
`qa-seq002-lz3k9a-x7f1`. That string exists nowhere else in the
database, so it works as a tracer dye: instead of diffing the whole
schema, go looking for your own value.

### The method

**1. Read the catalog once per run** — this also replaces needing a
schema export:

```sql
SELECT table_name, column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = :schema;
```

Plus `table_constraints` and `key_column_usage` for primary and foreign
keys. Cache it; every later step reads from this map.

**2. Baseline, for events that change or remove something.** If a
previous event already located the row, re-read it by primary key before
the action. For a create event there is nothing to baseline.

**3. Act** — trigger the event through the platform API with the tracer
record. Never write to the database to set up a check.

**4. Locate — this answers "which table, which column".** Query the text
columns from the catalog for the literal tracer value, name-like columns
first (`name`, `title`, `slug`, `label`, `key`):

```sql
SELECT 'api_keys' AS tbl, 'name' AS col, id FROM api_keys WHERE name = :tracer
UNION ALL
SELECT 'endpoints', 'name', id FROM endpoints WHERE name = :tracer;
```

Whatever returns is the table and column the action wrote to.

**5. Walk the foreign keys outward.** Child rows do not hold the tracer
— `api_keys` holds an `endpoint_id`, not the name. Using the FK map from
step 1, query every table referencing the located row's primary key.
Two levels is almost always enough.

**6. Re-read by primary key and diff the columns.** Now that the row is
identified, `SELECT` it before and after the action and compare field by
field. This is what answers **"where is it updated"**:

| Observed | Verdict |
|---|---|
| Row exists where it did not | INSERT — list the columns it filled |
| Same key, some columns differ | UPDATE — list each column `before → after` |
| Row gone | DELETE (hard) |
| Row present, `deleted_at`/`status` now set | Soft delete — record it as an UPDATE, and raise it: hard versus soft delete is usually an open question |

Because every query is scoped to one primary key, other traffic on a
shared test environment cannot affect the result.

### Confidence and source — always recorded

| Confidence | When |
|---|---|
| `confirmed` | The tracer or a known primary key located the row, and the before/after diff is deterministic |
| `likely` | Inferred from a table-level count change without isolating a row |
| `PENDING` | No DB access yet |

Also record **how** it was established (`tracer`, `FK walk from
endpoints.id`, `row diff by PK`, `app SQL log`). In six months "how do we
know this?" is the question someone will ask.

### Be honest about what the tracer cannot reach

Some writes leave nothing linked to your row: counters, cache tables,
cross-tenant aggregates, audit rows with no foreign key. List them once
per module as **"not reachable by tracer"** rather than concluding the
action wrote nothing. Absence of evidence is not evidence of absence, and
writing "no DB effect" when you simply could not see it is worse than
writing nothing.

Also still invisible to `SELECT` alone: the SQL statements themselves,
their order inside a transaction, asynchronous writes that land after
the check, and whether a column was set by this action or by a column
default.

### Query safety

- Parameterised SELECTs only, inside a read-only transaction.
- Only the application schema (`DB_SCHEMA`), only your own tracer and
  the ids it leads to. Never read a row that is not yours.
- Never `SELECT *` an unbounded table. Search name-like columns first and
  widen only if the tracer is not found.

## 5. What to flag while mapping

| Observation | Why it matters |
|---|---|
| One click fires the same GET several times | Performance; often a React double-render bug |
| A call returns 4xx/5xx but the UI shows success | Silent failure — the worst class of bug |
| A 5xx anywhere | Always a bug (CLAUDE.md section 6) |
| An id, email, or key in a query string | Leaks into logs and browser history |
| A call with no auth header on an authenticated screen | Possible missing authorisation |
| The screen works but the call was never made (cached) | The test needs a different wait |
| A response field never shown on screen | Possible over-exposure of data |

## 6. How the automation uses this

Event definitions are what let the generators write tests that wait on
the right thing instead of sleeping:

- `waitForResponse('**/endpoints/*/keys')` comes straight from the event.
- An API test for the same route reuses the recorded request/response
  shape as its starting schema (the **test case** still owns the expected
  values — CLAUDE.md section 6).
- A DB check inside a UI test asserts on the Tier 2 table and columns.

So write routes precisely. A vague route is a vague wait, and a vague
wait is a flaky test.

## Rules

- `status: draft` until approved. One file per module; IDs are global and
  permanent.
- Group by event, not by request — one click that fires four calls is ONE
  `EVT-`, with four rows in its API table.
- Every `EVT-` names the sequence and step it came from, so a reader can
  find the screenshot.
- Re-running updates the existing file in place; existing `EVT-` IDs keep
  their numbers.
- Finish with: counts per event type, how many events have a DB mapping
  versus `PENDING`, findings raised, and "Ready for review."
