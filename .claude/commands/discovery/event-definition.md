---
description: Step 2 — Event Mapper agent — every click, page load and navigation, the API calls it fires, and the database tables it touches
argument-hint: [all | SEQ-002 | module:keys | flow:3 | screen:key-list | EVT-012]
context: fork
agent: event-mapper
background: false
---

Map the events for: $ARGUMENTS

If nothing was given, map every approved sequence in
`docs/discovery/sequences/`.

Use the recordings in `automation/discovery/artifacts/` — re-run a walk
only if its artifacts are missing. Write
`docs/discovery/events/<module>.events.md` and fill the Event column
back into the sequence files.

Tier 1 (API calls) is observed fact: method, route with path parameters
generalised, request and response shapes, status, timing, and the order
calls fired in. Tier 2 (database tables) stays `PENDING` until read-only
DB access exists — never guess a table name.

Show me the events per type, the routes you found, and any findings.
