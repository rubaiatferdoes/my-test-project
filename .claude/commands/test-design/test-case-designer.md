---
description: Step 5 — Test Case Designer agent — manual test cases (positive/negative/boundary/security/E2E) from the approved sequences and validations
argument-hint: [all | SEQ-002 | module:keys | flow:3 | E2E-03 | VAL-008 | TC-014 TC-020 | TC-010..TC-015 | P0]
context: fork
agent: test-case-designer
background: false
---

Write the manual test cases for: $ARGUMENTS

If nothing was given, cover everything marked In in the approved
`docs/test-plan.md`.

Input is the approved test plan, the sequences
(`docs/discovery/sequences/`), and the validations
(`docs/discovery/validations/`). Use the product's real screen names,
field labels, and error messages — never invented ones.

Write one file per case in `docs/test-cases/<module>/`, plus the module
and overall README indexes. Each case cites the SEQ-/VAL- (and F-/BR-
where they exist) it came from.

Keep it lean: merge similar checks into data-driven cases.
