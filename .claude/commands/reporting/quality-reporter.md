---
description: Step 11 — Quality Reporter agent — release verdict, coverage traceability, defect status, risks
argument-hint: [path to results, e.g. docs/ + latest execution results]
context: fork
agent: quality-reporter
background: false
---

Produce the quality report from: $ARGUMENTS

If no path was given, use docs/test-cases/, the latest
docs/reports/execution-*.md, and docs/bugs/.
Use only real numbers from those files — never estimate.
