---
name: failure-healing
description: Investigate a failed automated test from its log, video, screenshot, and trace — decide whether the test is broken or the application is, propose an exact fix for a broken test, and draft a bug report for the lead to approve when the application is at fault. Use when tests fail, when a failure needs diagnosis, or when self-healing or test repair is requested.
---

# Failure Healing — broken test, or broken product?

**Goal:** every failure leaves with an answer and an owner. No failure is
re-run until it goes green and forgotten.

**Input:** the latest `docs/reports/execution-*.md`, the Playwright
artifacts (`automation/reports/artifacts/`: trace, video, screenshot,
console log), the test case, and the discovery definitions it came from.
**Output:** `docs/reports/investigation-<YYYY-MM-DD>.md` (template:
[templates/investigation-template.md](templates/investigation-template.md)),
plus `BUG-` reports and `FIX-` proposals.

## The one rule

> A healer may fix a broken **test**. It may never fix a failing
> **expectation**.

Changing a selector so the test can find the button again is healing.
Changing `expect(status).toBe(401)` to `toBe(200)` because the app
returns 200 is deleting a bug report. If a fix makes an assertion weaker,
broader, or conditional, it is not a fix — it is a finding.

Self-healing suites fail their teams in exactly one way: they quietly
repair themselves around a real regression. Everything below exists to
stop that.

## 1. Before diagnosing — reproduce

1. Re-run the single test twice: `npx playwright test --grep "TC-014" --repeat-each=2`.
2. Both fail → real failure, continue.
3. Mixed → **flaky**. Do not heal it into silence: find the timing cause
   (a `background` event in the event definition, a race between two
   calls, a missing wait) and propose the wait that removes the race.
4. Both pass → the failure was environmental or order-dependent. Re-run
   the whole file; a test that only fails alongside others is leaking
   state, which is its own finding.

## 2. Triage — the decision tree

Start from the error class, then confirm against the evidence. Never
decide from the error message alone.

| Symptom | Check | Verdict |
|---|---|---|
| Locator not found / timed out waiting for element | Open the live screen. Is an equivalent control there under a different selector? | Yes → **broken test** (selector drift). No → **application issue** |
| Timed out waiting for a response | Did the call fire in the trace? What status? | 5xx → **application issue** (always). No call → **broken test** (wrong wait). 2xx but test waited elsewhere → **broken test** |
| Assertion failed on a value | Does the test case/definition still say that value? | Yes → **application issue**. The definition changed → **stale expectation**, see §4 |
| Navigation/timeout on login or setup | Does readiness pass? | No → **environment** |
| Duplicate/conflicting data, leftover `qa-` rows | Is cleanup running? | **data issue** |
| Passes alone, fails in the suite | Shared state between tests | **broken test** (isolation) |

The note's two outcomes are the two that matter — **flow broken (fix it)**
and **application issue (bug)**. The other three exist so neither of those
gets misfiled: an environment outage filed as a bug wastes a developer's
day, and a real bug filed as a selector fix hides a regression.

## 3. Proposing a fix (broken test)

One `FIX-` per broken test. Default behaviour is **propose only — never
apply**. The proposal must contain:

1. **Diagnosis** in one sentence, with the evidence that proves it
   (trace step, screenshot, the live DOM you checked).
2. **The exact diff** — file, old lines, new lines. No "update the
   selector" hand-waving.
3. **Blast radius** — every other test touching the same page object,
   locator, or client method.
4. **The bug guard**, answered explicitly:

   - [ ] Does the fix change what is asserted? → if yes, STOP: it is a bug or a stale expectation
   - [ ] Does the app still do what the test case says? (quote the step)
   - [ ] If a selector moved, is the control the same control, or a different one that merely looks right?
   - [ ] Does the new selector follow the priority order (`data-testid` → id → role/label)?
   - [ ] Does the event definition need updating too, because the real route or timing changed?

5. **Recommended follow-up** — the exact re-run command.

If the lead's arguments include `verify`, you may apply the diff in the
working tree, run that test, report the result, and then **revert it** if
the lead does not approve. Nothing is committed by a healer, ever.

A selector that moved is also a signal about the product: record it in
the event/sequence definition so the next generator writes it correctly,
rather than fixing the same drift every week.

## 4. Stale expectation — the third answer

Sometimes nothing is broken: the product changed on purpose, the test
still encodes the old behaviour, and discovery has not caught up. Signs:
the change is deliberate-looking, consistent across screens, and matches
a recent CR.

Do not heal this and do not file a bug. Route it:

```
/discovery:explore-app seq:<affected>   → approve → /change:impact-analysis
```

Say so plainly in the investigation report. Guessing between "regression"
and "intended change" is the one judgement a healer must hand back.

## 5. Filing an application issue

Use the `defect-report` skill. Attach what automation already has and a
manual report never does: the trace file, the video, the screenshot at
the moment of failure, the exact request and response (masked), and the
TC/SEQ/EVT/VAL IDs it violates. Reproduced twice (§1) is a precondition.

## 6. Patterns worth escalating

Several failures at once usually share one cause. Before writing five
reports, check for:

| Pattern | Likely cause |
|---|---|
| Everything fails at login | Environment or expired test credentials |
| All tests on one screen fail | That screen shipped a change — re-run discovery for it |
| Only `@slow` key-dead tests fail | Revocation delay changed, or the product got slower |
| Failures started with one commit | Ask for that build; it is a regression, not five bugs |
| Every failure is a different selector on the same page | The page was rewritten — one discovery run, not many fixes |

One root cause gets one report, listing the tests it explains.

## Rules

- Every failure in the run gets a verdict. "Unknown" is allowed, with
  what you tried and what you would need.
- Never commit, never push, never approve your own fix.
- Never raise a bug without reproducing it twice.
- Never heal a test by adding a wait on time (`waitForTimeout`), a retry,
  a `try/catch`, or a `test.skip`. Those hide failures rather than fix
  them; a skip needs the lead's decision and a reason recorded.
- Finish with the verdict table: broken tests (with `FIX-` IDs),
  application issues (with `BUG-` IDs), stale expectations, environment
  and data problems, and the exact commands to run next.
