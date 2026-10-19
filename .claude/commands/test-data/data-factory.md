---
description: Step 6 — Data Factory agent — valid, negative, and security dummy datasets mapped to TC IDs
argument-hint: [all | TC-014 TC-020 | TC-010..TC-015 | module:keys | flow:3 | F-003 | P0 | E2E | path to test cases]
context: fork
agent: data-factory
background: false
---

Generate dummy test data using: $ARGUMENTS

If no path was given, take the field rules from the approved
docs/discovery/validations/ and the cases in docs/test-cases/. Every
limit must come from a VAL- rule — an unresolved one stays an
ASSUMPTION with its Q- ID, never a plausible-looking number.
Save datasets to test-data/ (valid-data.json, negative-data.json,
security-data.json, README.md).
