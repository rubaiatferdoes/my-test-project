---
description: Step 7a — API Test Generator agent — TypeScript Playwright API tests (API Object Model): platform API, generated endpoints, key security, Swagger contract checks
argument-hint: [all | TC-014 TC-020 | TC-010..TC-015 | module:keys | flow:3 | F-003 | P0 | E2E | path to test cases]
context: fork
agent: api-test-generator
background: false
---

Generate API automation from approved test cases: $ARGUMENTS

If no path was given, use docs/test-cases/, test-data/, and the
Swagger URL from the environment. Write into automation/ (reuse what
exists), start with the API smoke test and make it pass, then generate
the rest and report results.
