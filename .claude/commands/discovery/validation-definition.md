---
description: Step 3 — Validation Mapper agent — probe every field, record its rules and exact error messages, and check whether the server enforces them or only the browser does
argument-hint: [all | SEQ-002 | module:keys | screen:generate-key-dialog | VAL-008]
context: fork
agent: validation-mapper
background: false
---

Find and record the field validations for: $ARGUMENTS

If nothing was given, cover every form in every approved sequence.

Read the DOM attributes first, then probe each field: empty, one
character, too long, wrong format, spaces, duplicate, unicode, and one
injection string. Quote every message exactly and screenshot it firing.

Then check enforcement — send the same bad value straight to the API
route from the event definition. A rule the browser blocks but the API
accepts is a finding, not a validation; raise it.

Also probe the count and quota limits: for each collection, create
through the API one at a time until rejected, stopping at
DISCOVERY_QUOTA_PROBE_CAP. Reaching the cap with no rejection is
UNKNOWN plus a question, never "unlimited".

Write `docs/discovery/validations/<module>.validations.md`.

Probing creates data: use `qa-` names and delete everything afterwards.

Show me the rules per field, the `client`-only and `none` list, and the
unresolved limits.
