---
name: defect-report
description: Draft a clear, reproducible bug report (BUG-) for the lead to approve — severity, priority, steps, expected vs actual, evidence, and a link to the test case and requirement. Use when a test finds an application bug, or when asked to log, write, or file a defect.
---

# Defect Report

**Goal:** a developer can reproduce the bug from the report alone, on
the first try, without asking QA anything.

**Output:** one file per bug: `docs/bugs/BUG-<nnn>-<short-name>.md`
(next free number), using [templates/bug-template.md](templates/bug-template.md).

**The report is a proposal.** It is written with `Status: PROPOSED` and
handed to the lead with its evidence; the lead decides whether it is
filed. Never announce a bug as filed, and never close one.

## Before writing

- [ ] Reproduced at least twice on the test environment
- [ ] It's an **application bug** — not a script, data, or environment
      problem, and not a stale expectation (see the triage tree in
      `failure-healing`)
- [ ] Searched `docs/bugs/` — not already reported
- [ ] If it came from an automated run, the trace, video, and screenshot
      are attached. Automation's advantage over a manual report is the
      evidence — don't throw it away

## Severity vs priority (they are different)

**Severity = how bad the impact is** (QA sets it):

| Severity | Meaning | Example |
|---|---|---|
| Sev-1 Critical | Security breach, data loss, core flow blocked for everyone | Tenant B can call tenant A's endpoint |
| Sev-2 Major | Main feature broken, no workaround | Revoked key still works |
| Sev-3 Minor | Feature works wrong but has a workaround | Docs missing an error response |
| Sev-4 Trivial | Cosmetic | Typo in success message |

**Priority = how soon to fix** (product/lead confirms it): P0 now → P3 later.

## Writing rules

- **Title:** `[Area] <what goes wrong> when <condition>`
  e.g. `[API Key] Revoked key still returns 200 after 5 minutes`
- **Steps:** numbered, one action each, starting from a known state.
  Include the exact data used (dummy `qa-` data only).
- **Expected:** quote the requirement or test case (BR-/TC- ID).
- **Actual:** what happened — exact message, status code, response.
- **Evidence:** screenshot, trace, request/response (with keys masked:
  `sk_...a1b2`), timestamp, environment build/version.
- Facts only. No blame, no guessing at the cause in the main sections —
  put suspicions under "Notes".
