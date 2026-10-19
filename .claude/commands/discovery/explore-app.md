---
description: Step 1 — App Explorer agent — travel the running app from a URL or a described workflow, record the path as a sequence with a screenshot of every screen
argument-hint: [a URL | a workflow in words, e.g. "generate an API key" | seq:create-endpoint | SEQ-002 | module:keys | flow:3]
context: fork
agent: app-explorer
background: false
---

Explore the running application and record what you find: $ARGUMENTS

If nothing was given, start at `TEST_ENV_BASE_URL`, log in as
`qa-tenant-a`, and walk the six steps of the E2E flow in CLAUDE.md one
sequence at a time.

Build or reuse the discovery harness in `automation/discovery/`, record a
screenshot and the network traffic for every step, and write
`docs/discovery/sequences/SEQ-*.md` plus a replayable walk file.

Test environment only. Create data under the `qa-` prefix and delete it
afterwards. Ask me before the first delete, bulk action, or anything that
emails a person.

Show me the path you travelled, the findings, and the questions.
