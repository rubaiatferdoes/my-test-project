# Trial log — how well did the framework do?

> Status: DRAFT

The sample app is the subject. **The framework is the experiment.** This
folder holds what we learned about our own tooling, which is the only
output of this repo that we carry back.

## The rule that keeps the result honest

Score a step **after** its output is approved, never before. An agent
that has already read `@NotNull` in the source is not discovering
anything — it is copying. So:

1. Run the step.
2. Approve its output.
3. *Then* open `../sample-app` and compare.
4. Fill in the table below, misses included.

## Score card

Fill one row per step as it is run.

| Step | What it claimed | Ground truth | Verdict | Notes |
|---|---|---|---|---|
| 1 explore-app | | Angular routes | | |
| 2 event-definition — routes | | `web/rest/*Resource.java` | | |
| 2 event-definition — DB tables | | `@Entity` / `@Table` / `@Column` | | |
| 2 — foreign-key walk | | `@ManyToOne` on `Operation` | | |
| 2 — join-table walk | | `@ManyToMany` + `@JoinTable` | | |
| 3 validation-definition | | `@NotNull` vs `Validators.*` | | |
| 3 — quota probe | | No quotas exist in this app | | |
| 4 test-planner | | — (judgement) | | |
| 5 test-case-designer | | — (judgement) | | |
| 8 db-validator schema check | | Liquibase changelogs | | |
| 10 test-healer triage | | The break we introduced | | |

Verdicts: **Correct** · **Partly** (what it missed) · **Wrong** (what it
invented) · **Could not** (and why).

## Deliberate experiments

Only these edits to `../sample-app` are permitted. Revert each one after.

| # | Change | Expected response | What happened | Reverted? |
|---|---|---|---|---|
| 1 | Remove `@NotNull` from `BankAccount.balance` | The rule flips `both` → `client` and is raised as a defect | | |
| 2 | Rename a `data-testid` in a template | UI tests fail; the healer proposes a selector fix and nothing else | | |
| 3 | Make a route return 500 on bad input | Reported as a bug, never recorded as expected behaviour | | |
| 4 | Change a field's max length | Impact analysis names exactly the cases and data to redo | | |

## Setup edits (not experiments)

| Change | Why | Reverted? |
|---|---|---|
| Postgres driver moved out of the `prod` Maven profile | H2 in-memory admits only one process, so a read-only user cannot connect | No — needed for the whole trial |
| `application-dev.yml` datasource pointed at Postgres | Same | No |

## What the trial cannot tell us

Worth writing down now, so nobody over-reads a good result later:

- **Flakiness.** Localhost is fast and quiet. A shared test environment
  is neither, and that is where most flakiness comes from.
- **Scale.** Three entities and a handful of screens. The real product
  is larger, and discovery may not stay accurate as the surface grows.
- **The real product's screens.** Nothing here transfers directly.
- **A generated OpenAPI spec.** The sample publishes springdoc output,
  not a spec the product itself writes, so the contract check is only
  partly exercised.

## Conclusions

Filled in at the end: what to fix in the framework, what to keep, and
what to tell the team.

| # | Finding about the framework | Action |
|---|---|---|
