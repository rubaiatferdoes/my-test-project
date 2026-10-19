# QA Framework — trial run

A copy of the QA framework, pointed at an open-source sample app running
on this machine. Nothing here touches a shared environment.

```
qa-trial\
├── framework\     ← this repo; run `claude` from here
└── sample-app\    ← jhipster-sample-app (cloned, do not edit)
```

**The sample app is the subject. The framework is the experiment.** We
are not testing JHipster for its maintainers — we are finding out
whether our pipeline works, and how accurately, somewhere the cost of
being wrong is zero.

## Why this app

Because the source is open, every claim discovery makes can be checked
against the code. That turns the run from "does the pipeline work" into
"how often is it right", which is the question that actually matters.

It also exercises the three things in the framework with no proof behind
them yet:

| Untested feature | What the app provides |
|---|---|
| The `client` / `server` / `both` enforcement verdict | `@NotNull` **and** `Validators.required` on the same fields |
| The tracer finding a table and column | `bank_account.name` takes a `qa-` value we control |
| The foreign-key walk, including join tables | `@ManyToOne` to BankAccount, `@ManyToMany` to Label |

## Start here

1. [SETUP.md](SETUP.md) — install Java and Postgres, run the app, fill in `.env`
2. [CLAUDE.md](CLAUDE.md) — the rules, and section 13: what we are measuring
3. [docs/trial/README.md](docs/trial/README.md) — the score card to fill in

Then, from this folder:

```powershell
python scripts\verify-setup.py
claude
```

and inside Claude Code, `/setup:env-readiness` before anything else.

## What changed from the real framework

Only the product-specific parts. Everything generic was copied as-is:

| Real framework | Here |
|---|---|
| `e2e-endpoint-flow` (create endpoint → Swagger → key → revoke) | `app-journey` (log in → account → label → operation → delete) |
| `api-key-security` (API keys, tenant isolation) | `auth-security` (JWT, admin vs user roles) |
| `CLAUDE.md` §1 and §3 | Rewritten for this app |
| — | `CLAUDE.md` §13 and `docs/trial/` — the experiment itself |

All 18 commands, 14 agents and the other 11 skills are unchanged. That
retarget took one session, which is itself a useful answer: pointing
this framework at a different product is an afternoon, not a rewrite.
