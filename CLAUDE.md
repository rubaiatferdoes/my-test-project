# QA Framework — Shared Rules (TRIAL)

These rules apply to EVERY agent, skill, and command in this project.
Agents and skills do not repeat them — they rely on this file.

> **This is a trial run of the QA framework itself.** The product under
> test is an open-source sample app we run locally. We are not testing it
> for its maintainers; we are using it to find out whether our framework
> works, and how accurately. See section 13.

## 1. Product under test

The [JHipster sample application](https://github.com/jhipster/jhipster-sample-app)
— Spring Boot 4 + Angular 22, running on this machine. A signed-in user
keeps **bank accounts**, records **operations** against them, and tags
those operations with **labels**.

Checked out at `../sample-app`. **The source is open**, which is the
whole point: whatever discovery claims, we can check against the code.

The journey we own:

```
1. Log in → 2. Create a bank account → 3. Create a label
→ 4. Record an operation with that label → 5. Edit it
→ 6. Delete the operation → 7. Delete the account → nothing is left behind
```

Two accounts ship with the app: `admin` / `admin` and `user` / `user`.
They stand in for two tenants.

## 2. How we learn the product — and what counts as "correct"

Three sources, and they are not equal:

| Source | What it gives us | Status |
|---|---|---|
| **Discovery** — walking the live app (`docs/discovery/`) | What the product **does**: sequences, events, API calls, field validations | **Observation.** Never automatically correct |
| **Schema export** (`docs/requirements/db/`) | The tables, columns and constraints | Fact, but only about storage |
| **The source code** (`../sample-app`) | What the developers wrote | **Ground truth — but see section 13** |

**Observation is not truth.** This is the most important rule in this
file. An agent that walks the app records what it saw; it never promotes
that recording into an expected result on its own. An observation becomes
an expected result only when a human approves it at the discovery gate
(section 9).

Agents must actively look for what is wrong instead of recording it as
normal. Always report, never bless:

- a required field with no validation, or a validation with no message
- a 5xx response (always a bug — see section 6)
- an error message that leaks internals (stack trace, SQL, file path)
- an action whose API call fails but whose UI shows success
- two screens that word the same rule differently
- a field that appears to write nothing anywhere

## 3. Current scope decisions (update when they change)

| Topic | Decision | Status |
|---|---|---|
| Database | PostgreSQL 17, local, ours | Schema export in `docs/requirements/db/`, read-only `SELECT` user in `.env`. DB checks are IN scope from step 0 |
| Object-level access (can `user` read `admin`'s account?) | Unknown | **Record what happens. Do not assume.** There is no product owner here — the finding is the output |
| Delete behaviour (account with operations: blocked, cascade, or orphan?) | Unknown | Record it. Orphan rows in `operation_label` are a real defect class |
| Rate limiting / quotas | Assume none | Confirm; a burst that returns 5xx is a finding |
| Monitoring, admin and Swagger screens | OUT of scope | Only the journey in section 1 |
| Automation language and design | **TypeScript + Playwright** for discovery, UI, API, and E2E in one project (`automation/`); **Page Object Model** for UI, **API Object Model** for API — see the `ts-pom-standards` skill | Team standard |

## 4. Safety rules (never break these)

- Test ONLY against the local sample app (`localhost`). Nothing else.
- Use ONLY dummy data. The sample ships demo rows — leave them alone.
- Every test and every discovery walk creates its own data with the `qa-`
  prefix (e.g. `qa-tc014-lz3k9a-w2-x7f1` — test case, time, worker, random)
  and deletes it afterwards.
- **Discovery may write.** To learn a validation rule you have to trigger
  it, so discovery agents may fill forms, submit, and create records —
  under the `qa-` prefix, with cleanup, within the limits in section 5.
- Database access is READ-ONLY. Only the application writes.
- Secrets and URLs come from environment variables (see `.env.example`).
  Never write a token, password, or URL into code or docs.
- JWT tokens are secrets: mask them in evidence (`eyJ...a1b2`).
- **Never edit `../sample-app`** except through the deliberate,
  documented experiments in section 13. It is the thing under test.

## 5. Discovery rules (walking a live application)

- **Never leave localhost.** Check the host of every URL before
  navigating; an external link ends the walk.
- **Destructive actions need permission.** Create and update freely under
  `qa-`. Before the first delete, bulk action or reset, stop and ask —
  then record the answer so you only ask once per action type.
- **Only touch your own data.** Never edit or delete a row that does not
  start with `qa-`, including the sample's demo rows.
- **Stay inside the given workflow.** A screen you reach by accident is
  recorded as "seen, not explored".
- **Clean up at the end of every walk**, even a failed one, and report
  anything you could not delete.
- **Record, don't correct.** If a screen behaves oddly, screenshot it and
  raise it. Never retry quietly until it looks right.

## 6. Testing rules (what "correct" means)

- **Expected results come from approved discovery — never from a response
  captured during the test run.**
- A 5xx response is **always a bug**. Never write a test that expects 500.
- Never weaken an assertion to make a test pass. Report it instead.
- A test that passes on retry is FLAKY — report it, but still investigate.
- A healer may fix a broken **test**; it may never fix a failing
  **expectation**. See the `failure-healing` skill.

## 7. ID conventions (traceability chain)

| Prefix | Meaning | Created by |
|---|---|---|
| `SEQ-001` | Sequence — one user workflow through the UI | app-explorer |
| `EVT-001` | Event — a click/onload/traverse, its API calls and DB effect | event-mapper |
| `VAL-001` | Validation — one rule on one field | validation-mapper |
| `Q-001` | Open question | any agent |
| `TC-001` | Test case | test-case-designer |
| `DAT-001` | Test data record | data-factory |
| `BUG-001` | Defect (proposed) | defect-report |
| `FIX-001` | A healer's proposed change to a test script | test-healer |

The chain runs `SEQ-/EVT-/VAL- → TC- → test script → run result → BUG-/FIX-`.

IDs are permanent: never renumbered, never reused. A removed item is
marked `DEPRECATED`, never deleted.

Every automated test name includes its TC ID, e.g.
`[TC-014] create bank account with empty name is rejected`.

## 8. Working on a subset (any step, any time)

| Select by | Example argument |
|---|---|
| Sequence | `SEQ-002` or `seq:create-bank-account` |
| Screen | `screen:bank-account-form` |
| Module | `module:accounts`, `module:operations`, `module:labels` |
| Journey step | `flow:4` (1–7, see section 1) |
| Definition IDs | `EVT-012` `VAL-007` |
| E2E scenario | `E2E-03` |
| Test case IDs / range | `TC-014 TC-020` · `TC-010..TC-015` |
| Priority · Type / layer | `P0` · `E2E` `Security` `API` `UI` `DB` |
| Folder | `docs/test-cases/accounts/` |

Selections combine with AND. Agents print the resolved list of IDs first,
then work ONLY on those. Items with `status: deprecated` are skipped.

## 9. Draft, revise, approve

Documents start with `> Status: DRAFT` → after review →
`> Status: APPROVED — <name>, YYYY-MM-DD`.

Files with front matter — sequences, event files, validation files, test
cases — carry it in their `status:` field: `draft` → `approved` →
`deprecated`.

**Revising a DRAFT.** Re-run the command with feedback in the arguments;
revise the file IN PLACE, keep the IDs that stay, never append
duplicates. End with a short "Changed in this revision" list.

**APPROVED is locked.** Two narrow exceptions: the data factory fills
`data:` and the DAT column of approved test cases; the db-validator fills
the `db:` block of approved event files.

**Bug reports are proposals too.** A `BUG-` file is written with
`Status: PROPOSED` and handed over with its evidence. No agent files a
bug on its own initiative, and no agent closes one.

**Inputs must be approved.** DRAFT input → stop and say which file needs
approval first, unless the arguments say `allow-draft`.

## 10. Folder contract (who writes what)

| Folder / file | Written by |
|---|---|
| `docs/discovery/sequences/SEQ-*.md` | app-explorer |
| `docs/discovery/events/*.events.md` | event-mapper (db-validator fills the `db:` block) |
| `docs/discovery/validations/*.validations.md` | validation-mapper |
| `docs/discovery/screens/` | app-explorer, validation-mapper |
| `docs/discovery/README.md` | whichever discovery agent runs first |
| `docs/requirements/db/` | Humans — the schema export |
| `docs/test-plan.md` | test-planner |
| `docs/test-cases/` | test-case-designer |
| `test-data/` | data-factory |
| `automation/` (shared config, types, fixtures, utils) | whichever generator runs first |
| `automation/discovery/` | app-explorer (the walk harness) |
| `automation/ui/`, `automation/tests/ui/`, `automation/tests/e2e/` | playwright-generator / playwright-reviewer |
| `automation/api/`, `automation/tests/api/` | api-test-generator / api-test-reviewer |
| `automation/db/`, `automation/tests/db/`, `docs/analysis/schema-check.md` | db-validator |
| `docs/reports/` | test-executor, quality-reporter, test-healer |
| `docs/bugs/` | defect-report, test-healer |
| `docs/trial/` | Humans — what we learned about the FRAMEWORK (section 13) |

## 11. Pipeline (a human approves each step before the next)

```
0. /setup:env-readiness             is the app up and are the logins good?

   ── Discovery ──
1. /discovery:explore-app           a workflow → sequences + screenshots
2. /discovery:event-definition      events → API calls → DB tables
3. /discovery:validation-definition probe every field → rules and messages

   ── Design ──
4. /test-design:test-planner        scope, coverage, risk
5. /test-design:test-case-designer  manual test cases
6. /test-data:data-factory          dummy datasets

   ── Automation ──
7. /automation-api:api-test-generator  → api-test-reviewer
   /automation-ui:playwright-generator → playwright-reviewer
8. /database:db-validator           schema check + fill the DB mappings

   ── Run and react ──
9.  /execution:test-executor        run suites → report with evidence
10. /healing:investigate-failures   broken test, or a drafted bug
11. /reporting:quality-reporter     verdict
```

`/requirements:analyze-requirements` is not used here: this app ships no
PRD. Discovery plus human confirmation is the only oracle, and the test
plan must say so.

## 12. Writing style

Write so a junior QA can follow without asking: short sentences, tables
and checklists, explain jargon the first time. Unknowns are marked
`ASSUMPTION — verify` or raised as a `Q-` question. Never guess silently.

## 13. What we are actually measuring

The sample app is the subject; **the framework is the experiment.** After
each step, record in `docs/trial/` what the framework got right, got
wrong, or could not do.

**Check discovery against the source — but only after it is approved.**
Reading `../sample-app` first would contaminate the run: an agent that
has seen `@NotNull` is no longer discovering anything. So:

1. Run the step. Approve its output.
2. *Then* open the source and compare.
3. Record the score in `docs/trial/`, with the misses.

| Framework feature | Ground truth to compare against | What a pass looks like |
|---|---|---|
| Validation enforcement verdict | `@NotNull` in `domain/*.java` vs `Validators.*` in the Angular form services | `name` and `balance` report `both` |
| Event → API route mapping | `web/rest/*Resource.java` | Every route found, none invented |
| Event → DB table mapping | `@Entity`, `@Table`, `@Column` | Right table, right columns |
| The foreign-key walk | `@ManyToOne` on `Operation` | `operation` → `bank_account` found |
| The join-table walk | `@ManyToMany` + `@JoinTable` on `Operation` | `operation_label` found |
| Sequence accuracy | The Angular routes | Steps match a path a user can really take |

### The deliberate experiment

Once the baseline is approved and scored, change the app on purpose and
re-run **only** the affected step:

| Change to `../sample-app` | Expected framework response |
|---|---|
| Remove `@NotNull` from `BankAccount.balance`, rebuild | The rule flips `both` → `client`, and is raised as a defect |
| Rename a `data-testid` in an Angular template | UI tests fail; the healer proposes a selector fix, nothing else |
| Make an endpoint return 500 on bad input | Reported as a bug, never recorded as expected behaviour |
| Change a field's max length | Impact analysis names exactly the cases and data to redo |

Revert each change afterwards and note it in `docs/trial/`. These are the
only edits permitted to the sample app.
