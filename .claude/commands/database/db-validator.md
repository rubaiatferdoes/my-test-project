---
description: Step 8 — DB Validator agent — compare the schema with the validations, fill the PENDING table mappings in the event definitions, add read-only DB checks (needs a read-only DB user)
argument-hint: [all | module:keys | flow:1 | TC IDs]
context: fork
agent: db-validator
background: false
---

Add database checks for: $ARGUMENTS

If nothing was given, cover all approved test cases with a DB layer.

Needs only the read-only database settings in .env (DB_TYPE, DB_URL,
DB_READONLY_USER, DB_READONLY_PASSWORD) — if any is missing, stop and
say what to add. The schema is read from information_schema; a schema
export in docs/requirements/db/ is optional.

First write docs/analysis/schema-check.md (schema vs the validation
rules), then fill the PENDING table mappings in the event definitions by
tracing the qa- record, then build automation/db/ and the @db checks,
and run them read-only.
