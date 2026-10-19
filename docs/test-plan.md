# Test Plan — JHipster Sample App (QA Framework Trial)

> Status: APPROVED — rubaiat.ferdoes@leads-bd.com, 2026-10-19 (trial run).
> The open conflicts (§1) and questions (§8) are carried forward as-is,
> not resolved by this approval — see §1's rule that no case may assert
> the "app does" column as correct.

Scope: all approved discovery as of 2026-10-19 — SEQ-001, SEQ-002,
EVT-001..008, VAL-001..014.

## 0. Oracle

No PRD exists for this app, so the only oracle is **approved discovery +
human confirmation** (CLAUDE.md §11). A discovery observation is never
promoted to an expected result on its own — see the conflicts in §1 and
the "findings that are not endorsements" list in `docs/discovery/README.md`.

**Q-021 resolved 2026-10-19 — `DB_ACCESS=none`.** Set in `.env` per
CLAUDE.md §13's blind-pass design: steps 4–7 (this plan, test cases, data
factory, automation) run on API/UI evidence and `@persistence` probes
alone, no DB reads. DB column below is **Out (no access)**, not `Later`.
`DB_ACCESS` flips to `readonly` only to run `db-validator` (step 8), which
then scores the blind probes against the real tracer — that comparison is
the point of the experiment, so don't flip it early.

## 1. Discovery vs. stated intent — conflicts

No case may assert the "app does" column below as correct.

| App does | Written intent | Verdict |
|---|---|---|
| New account stored with `user_id = NULL` | CLAUDE.md §1: account belongs to the signed-in user | Conflict → **Q-005** |
| `/api/bank-accounts` returns every account to every user; a forged `user.id` on create is honoured | CLAUDE.md §3: unknown, record it | Open by design → test as observed, **Q-006, Q-007, Q-011** |
| 3 separate 500s (name 256 chars, balance `1e20`/`1e999`, unknown owner id) | CLAUDE.md §6: a 5xx is always a bug | Conflict → assert the 4xx that should happen, never the 500 |
| 500 bodies leak raw SQL, FK name, Java signature; a short password is echoed in a 400 body | CLAUDE.md §2: never leak internals | Conflict → defect candidate, not an expected body |
| Login API body differs for unknown-user vs wrong-password; UI shows one message | `auth-security` skill: must not reveal whether the username exists | Conflict → **Q-016** |
| Empty-string `name`: blocked by UI, accepted (201) by API | CLAUDE.md §13 expects `name` to score `both` | Conflict → no case may assert 201 as correct |
| `/api/bank-accounts` is fully unbounded (33+ rows, no paging) | `event-definition` baseline: bounded list | Conflict → **Q-010**, test as a contract risk |
| Duplicate account names accepted | Nothing written | Undocumented → test as observed, **Q-009** |
| Journey steps 3–7 (label, operation, edit, delete ×2) | CLAUDE.md §1: all 7 steps owned | Not discovered yet — **BLOCKED**, see §2 |

## 2. Scope matrix

`DB_ACCESS=none` (Q-021, resolved). Both flow steps show DB as **Out**,
not because nothing is known about storage but because no step from here
to automation generation (4–7) may read the database directly — belief
about storage comes only from `@persistence` probes (round-trip, cascade,
exposure) run through the API, scored later.

| Step | UI | API | Docs | DB | Pri | Why |
|---|---|---|---|---|---|---|
| 1. Log in | In | In | In | Out (no access) | P0 | SEQ-001/EVT-001-4/VAL-010-14 approved. Docs: contract-check `POST /api/authenticate` (its body is unreadable from the UI, Q-003) |
| 2. Create bank account | In | In | In | Out (no access) | P0 | SEQ-002/EVT-005-8/VAL-001-9 approved, incl. §1 findings. `@persistence` round-trip/exposure probes stand in for a DB read; `db-validator` (step 8, `DB_ACCESS=readonly`) scores them later |
| 3. Create a label | Out | Out | Out | Out | — | **BLOCKED — not observed**. No SEQ/EVT/VAL for `/label` |
| 4. Record an operation + label | Out | Out | Out | Out | — | **BLOCKED — not observed** |
| 5. Edit the operation | Out | Out | Out | Out | — | **BLOCKED — not observed** |
| 6. Delete the operation | Out | Out | Out | Out | — | **BLOCKED**, also destructive — no delete permission sought for this entity (§5) |
| 7. Delete the account | Out | Out | Out | Out | — | **BLOCKED**; delete semantics are an open question (CLAUDE.md §3) |

**E2E-01** (full journey) is **partial**: only steps 1–2 in scope this
round; re-scoped once 3–7 are discovered.

## 3. Out of scope

| Item | Reason |
|---|---|
| Monitoring, Administration, Swagger screens | CLAUDE.md §3 |
| `/management/info` as a screen | Out per §3; its exposure (Q-012) stays a security question |
| Register / forgot-password | Not explored in SEQ-001; out of this workflow |
| Login lockout/throttling | Would mean hammering real accounts (Q-018); assumed none, not tested |
| Delete flows (steps 6–7) | Destructive, undiscovered, no permission sought |
| Label and Operation modules | Not discovered |
| Admin-only routes | Out per §3; only object-level access on in-scope endpoints is tested |
| Load/burst beyond one negative-path check | CLAUDE.md §3 assumes none; no dedicated load suite |

## 4. Coverage targets

- SEQ-001, SEQ-002 each get ≥1 P0 E2E/API case; steps 3–7 get none (blocked, not invented).
- Every `VAL-` gets a case or a stated reason not to:
  - VAL-001,003,006,010–013 → positive + negative case each.
  - **VAL-002 → an API-layer case** proving the server accepts what the UI blocks.
  - VAL-004,005 → one data-driven (malformed Balance) case.
  - VAL-007,008 → one UI case each (Save enablement, double-submit).
  - VAL-009 → one case recording "no rejection at 25", not "unlimited" (Q-014).
  - VAL-014 → one case per login-failure path, reusing the recorded messages.
- EVT-003, EVT-007 (writes) get an API case now, plus a `@persistence`
  probe (round-trip/exposure, no DB read) and, once `db-validator` runs
  under `readonly`, a DB case scoring that probe against the real row.
- Each "findings that are not endorsements" item gets a case asserting the
  documented 4xx/clean behaviour, paired with a `BUG-` reference — never a
  passing assertion of the bug itself.
- `auth-security` §1 (malformed tokens) and §3 (object-level access,
  admin vs user) get explicit P0/P1 cases even with no `VAL-`/`EVT-` yet.

## 5. Layers and tools

| Layer | Tool | Notes |
|---|---|---|
| UI | Playwright, POM | SEQ-001, SEQ-002 screens only |
| API | Playwright, API Object Model | Primary layer for `server`/`both`/gap verdicts and all security cases |
| E2E | TypeScript + Playwright | Steps 1–2 chained; 3–7 deferred |
| Docs | `api-contract-check` vs `/v3/api-docs` | Resolves `UNKNOWN` bodies (Q-003, Q-013, Q-014) |
| DB (blind) | `persistence/probes.ts` (`ts-pom-standards`) | `DB_ACCESS=none` — round-trip/cascade/exposure facts via API only, no `expect()` |
| DB (scored) | `db-validator`, step 8 | Runs once `DB_ACCESS=readonly`; scores the blind probes against the tracer |

## 6. Entry criteria

- SEQ-001, SEQ-002, EVT-001..008, VAL-001..014 all `status: approved`.
- `/setup:env-readiness` green.
- This plan approved before `test-case-designer` runs.

## 7. Exit criteria

- All P0/P1 cases pass.
- Zero open Sev-1/Sev-2 among the candidates this plan carries (the 5xxs,
  the SQL/stack leak, the credential echo, user-enumeration, forged-owner).
- Every in-scope SEQ-/VAL- traced to ≥1 test case.
- Steps 3–7 stay explicitly `BLOCKED` in the index, not silently absent.

## 8. Risks and open questions

**Carried forward (open):** Q-001, Q-002, Q-003, Q-005–Q-019.
(Q-004, Q-020 answered during discovery. **Q-021 answered above** —
`DB_ACCESS=none` through step 7, `readonly` only for step 8.)

**Flakiness risks to design around:**
- `GET /api/account` fires twice on one `/login` load.
- Entities → Bank Account navigates after a delay with no request behind
  it — needs a condition-based wait.
- Double-submit guard is unverified server-side for both login and create.
- Several response bodies are `UNKNOWN` (SPA navigation aborts the read) —
  Q-003, Q-013, Q-014. API-layer cases must capture these independently.

## 9. Summary

- 2 sequences, 8 events, 14 validations in scope (UI+API full, Docs
  partial, DB **Out — blind probes only** under `DB_ACCESS=none`). Steps
  3–7 out this round — `BLOCKED`.
- 8 conflicts found (§1), none resolved — all stay findings/`Q-`s.
- 18 open questions (Q-021 resolved this revision; Q-004, Q-020 resolved
  earlier).
- Test case design has **one convention decision resolved**, not a `Q-`:
  `docs/test-cases/` stays module-only (`accounts/`, `auth/`) per the
  `test-case-design` skill — no sub-module nesting, since neither module
  has more than one sequence yet.

Ready for review. After approval, run `/test-design:test-case-designer`.

---

**Changed in this revision:** tightened for length per feedback (CLAUDE.md
§12) — no content or IDs removed, prose cut to table rows/bullets,
repeated rationale collapsed to one mention each (189 → 131 lines).

**Changed in this revision (2):** resolved Q-021 — `DB_ACCESS=none` set in
`.env`; DB column flipped `Later` → `Out (no access)` for both steps;
layers/coverage/risks sections updated to route DB belief through
`@persistence` probes until `db-validator` runs under `readonly`.
