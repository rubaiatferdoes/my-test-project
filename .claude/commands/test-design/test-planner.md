---
description: Step 4 — Test Planner agent — decide the test scope from the approved discovery, compare it against requirements, write the test plan (scope matrix, coverage, risks)
argument-hint: [all | SEQ-002 | module:keys | flow:3 | E2E-03 | VAL-008 | path to the discovery folder]
context: fork
agent: test-planner
background: false
---

Decide the test scope and write the test plan for: $ARGUMENTS

If nothing was given, use everything approved in `docs/discovery/` —
sequences, events, and validations — plus
`docs/analysis/requirement-analysis.md` if requirement documents exist.

Write `docs/test-plan.md` only: the scope matrix (E2E flow step × layer,
each cell In / Out / Later with a reason and a priority), coverage
targets, entry and exit criteria, and risks.

Where discovery and the requirements disagree, list the conflict and
raise a `Q-` — do not choose a side. Where nothing documents a behaviour
at all, say so: the plan must be honest that the expected results rest
on approved observation.

Test cases come next, as a separate step.

Show me the scope decisions, the conflicts, and the open questions.
