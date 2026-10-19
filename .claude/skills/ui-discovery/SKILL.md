---
name: ui-discovery
description: Travel a running web application from a URL and login, record the path a user takes as a numbered sequence with a screenshot per screen, and capture the raw network, console, and DOM evidence the other discovery steps need. Use when exploring an app, mapping a user workflow, recording screens, or producing a sequence definition.
---

# UI Discovery — travel the app, record the path

**Goal:** turn "here is a URL, a login, and a workflow" into a written,
replayable **sequence** (`SEQ-`) with a screenshot of every screen and a
raw recording the event and validation steps can mine later.

**Input:** `TEST_ENV_BASE_URL` + tenant logins from `.env`, plus either a
starting URL or a workflow described in words ("generate an API key and
copy it").
**Output:** `docs/discovery/sequences/SEQ-<nnn>-<name>.md` (template:
[templates/sequence-template.md](templates/sequence-template.md)),
screenshots in `docs/discovery/screens/`, and raw artifacts under
`automation/discovery/artifacts/`.

Read CLAUDE.md section 5 (discovery rules) before the first click. The
two that get broken most: **never leave the test environment**, and
**ask before the first destructive action**.

## 1. One walk, three recorders

You travel the app ONCE and record everything at the same time, because
network traffic only exists while you are clicking. Later steps mine the
same recording instead of walking again.

| Recorder | Captures | Feeds |
|---|---|---|
| Screens | Full-page screenshot, URL, title, visible headings, every form field with its DOM attributes | this skill, `validation-definition` |
| Network | Every request/response: method, route, request body, status, response body, duration | `event-definition` |
| Console | Console errors, page errors, failed requests | findings |

## 2. The harness — `automation/discovery/`

Build it on the first run; reuse it afterwards. It is part of the same
`automation/` project as the tests (see `ts-pom-standards`), so it shares
`config/env.ts`, types, and the login helper.

```
automation/discovery/
├── explore.ts            CLI entry: runs one walk file and writes artifacts
├── session.ts            login per tenant, reusable storageState
├── recorders/network.ts  page.on('request'|'response'|'requestfailed')
├── recorders/screens.ts  screenshot + field/attribute dump per screen
├── recorders/console.ts  page.on('console'|'pageerror')
├── recorders/dbTrace.ts  read-only tracer lookup — skipped when DB_TYPE is empty
├── walks/<name>.walk.ts  one replayable walk per sequence
└── artifacts/<walk>/     raw output (gitignored)
```

Run it with `npm run discover -- walks/<name>.walk.ts`.

A walk file is a plain list of steps — it is the sequence as code, and
the UI generator reuses it later:

```ts
export const walk: Walk = {
  id: 'SEQ-002',
  title: 'Generate an API key for an endpoint',
  tenant: 'a',
  steps: [
    { screen: 'endpoint-list',   do: (p) => p.goto('/endpoints') },
    { screen: 'endpoint-detail', do: (p) => p.getByRole('link', { name: qaEndpoint }).click() },
    { screen: 'generate-key',    do: (p) => p.getByRole('button', { name: /generate key/i }).click() },
  ],
};
```

Every step records a screenshot named `<SEQ>-<step>-<screen>.png` and
flushes the network buffer, so a request can always be traced to the step
that caused it.

## 3. Travelling an unknown app

When you are given a workflow in words rather than a click path, work it
out one screen at a time — never guess two steps ahead.

1. Log in as `qa-tenant-a`. Screenshot the landing screen.
2. **Read the screen before acting:** list the headings, the navigation,
   every button, link, and form field, with their `data-testid`/id/role.
3. Pick the single control that most plausibly advances the workflow.
   Write down why in one line — that line becomes the step's "Action".
4. Act. Screenshot. Compare the new screen with the previous one: a new
   URL, a dialog, a toast, a changed list.
5. If nothing changed, record it as a finding (`clicked X, nothing
   happened`) and try the next candidate — do not click the same control
   repeatedly hoping for a different result.
6. Stop when the workflow's goal is visible on screen, or when you are
   blocked. Being blocked is a result: record where and why.

**Dead ends are data.** A workflow that cannot be completed is the most
valuable thing a first walk can find. Record the step it died on, with
the screenshot and the failing request, and raise it.

## 4. Naming the data you create

Every record you create gets the `qa-` prefix and the sequence ID:
`qa-seq002-<time>-<random>`. Track everything created during the walk and
delete it at the end, even if the walk failed. Anything you could not
delete goes in the report by name.

## 5. Write the sequence file

One file per workflow, from the template. The `Path` table is the heart
of it — one row per step:

| # | Screen | Action | What happened (observed) | Event | Screenshot |
|---|---|---|---|---|---|
| 1 | Endpoint detail | Open the endpoint from the list | Key panel shows, empty state "No keys yet" | EVT-010 | [png](../screens/SEQ-002-01-endpoint-detail.png) |

Rules for the table:

- "What happened" is **observed fact**, in plain words. Not "key list
  loads correctly" — that is a judgement. Write what was on screen.
- Event IDs are filled by `event-definition`; leave the column empty on
  the first pass.
- A step the user can take but you did not take is listed under
  "Seen, not explored", not silently dropped.

## 6. Findings and questions — the part that earns the fee

Every sequence file ends with findings and questions. A walk that
produces none is a walk that was not paying attention. Look for:

| Look for | Why it matters |
|---|---|
| A step that needed knowledge the UI never gave (a format, an ID) | Real users will fail here too |
| A control that does nothing, or a dead link | Broken feature |
| An error message that is blank, generic, or leaks internals | Bug or security finding |
| A success message with a failed request behind it | The worst kind: silent data loss |
| Two routes to the same screen that behave differently | Inconsistency |
| A screen with no way back | Navigation trap |
| Anything slower than ~5 s | Performance risk, and a future flaky test |

Each becomes a numbered finding with its screenshot, or a `Q-` question
when it needs a product decision rather than a fix.

## Rules

- `status: draft` until a human approves it. Nothing downstream may use a
  draft sequence (CLAUDE.md section 9).
- Never write an expected result in a sequence file. You record what the
  app did; the test plan decides what it should do.
- Mask keys, tokens, and passwords in screenshots and in any pasted
  response (`sk_...a1b2`).
- Re-running on an existing `SEQ-` updates that file in place and keeps
  its ID — never create a second file for the same workflow.
- Finish with: "Ready for review. After approval, run
  `/discovery:event-definition` and `/discovery:validation-definition`."
