---
module: accounts
sequences: [SEQ-002]
screens: [bank-account-form]
validations: [VAL-001, VAL-002, VAL-003, VAL-004, VAL-005, VAL-006, VAL-007, VAL-008, VAL-009]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
discovered: 2026-10-19
---

# Validations — Bank accounts `[accounts]`

> A rule recorded here is what the application did when probed — not what
> it ought to do. The `## Standard comparison` section is the exception:
> a `Gap` there is a finding, never an expected result.
>
> **Status: APPROVED** — rubaiat.ferdoes@leads-bd.com, 2026-10-19 (trial
> run). Accurate record of what the product does — the 5xxs, the
> user-enumeration gap, the forged-owner acceptance and the leaked
> SQL/stack traces stay candidate defects, not expected results.

**Scope:** SEQ-002 (approved), screen `bank-account-form`
(`/bank-account/new`) — Name, Balance, User, form-level rules, bank
accounts collection. Enforcement route: `POST /api/bank-accounts`
(SEQ-002 #4 / EVT-007), tenant-a session.

**Evidence:** UI probes —
`automation/discovery/walks/val-bank-account-form{,-2}.walk.ts`. API
probes — `val-api-probe.ts` (`artifacts/val-api-probe/probes.json`).
Quota/owner/DB — `val-quota-probe.ts`. Cleanup — `val-cleanup.ts`.

## Fields covered
| Field | Selector | Declared in DOM | Rules |
|---|---|---|---|
| Name | `#field_name`, `data-cy="name"` | nothing — no `required`/`aria-required`/`maxlength`/`minlength`/`pattern`. Just `ng-invalid` + a red left bar | VAL-001, 002 |
| Balance | `#field_balance`, `data-cy="balance"` | nothing but `type="number"` + `ng-invalid` | VAL-003, 004, 005 |
| User | `#field_user` select | options `""`/`admin`/`user`, pre-selected `""`, not required | none — optional (Finding 5) |
| (form) | Save `data-cy="entityCreateSaveButton"` | starts disabled | VAL-007, 008 |
| id (API only) | — | not on screen | VAL-006 |

## Rules
| ID | Field | Rule | Trigger | Message | Enforced |
|---|---|---|---|---|---|
| VAL-001 | Name | required — missing/`null` rejected | blur (UI) · response (API) | UI: `This field is required.` · API 400 `must not be null` | **both** |
| VAL-002 | Name | empty string rejected | blur, no request sent | UI: `This field is required.` | **client** — API returns **201** for `{"name":""}`, stores `length(name)=0` (Finding 2) |
| VAL-003 | Balance | required — missing/`null`/`""` rejected | blur · response | UI: `This field is required.` · API 400 `must not be null` | **both** |
| VAL-004 | Balance | must be a number | blur · response | UI: `This field should be a number.` · API 400 `Failed to read request` | **both** |
| VAL-005 | Balance | non-digit chars discarded while typing (`12abc`→`12`) | on type | none — chars just don't appear | **client** — native `type="number"`; API never sees the text |
| VAL-006 | id (API) | a client-supplied `id` on create is rejected | response | API 400 `error.idexists` | **server** — UI always sends `id:null`, unreachable via UI |

**Not a rule:** a 256-char Name → **HTTP 500** (255 accepted) — a 5xx is
a bug, not a validation (Finding 1). Same for an overflowing Balance and
a forged owner id (Findings 4, 5).

## Form-level rules
| ID | Rule | Observed | Enforced |
|---|---|---|---|
| VAL-007 | Save disabled until Name **and** Balance both hold a value | Enabled only once both are filled; User not required; Balance of `0` keeps it enabled | client — nothing on the page states what's missing (Finding 8) |
| VAL-008 | Double-click Save creates one record | 2 clicks → 1 `POST` → 201 → 1 row | client — SPA navigates away after the first click; no server-side guard observed |

## Quota

Measured on tenant a (`admin`) only — may not generalize to other tenants.

| ID | Limit | Enforced |
|---|---|---|
| VAL-009 | `UNKNOWN — no limit found below 25` (Q-014) | — nothing rejected |

25 accounts created one at a time via API, all 201, slowest 8 ms,
`DISCOVERY_QUOTA_PROBE_CAP` (25) reached with no rejection, all 25
deleted after. **Not** "unlimited" — unknown below 25.

## Probe log
| Field | Probe | Value | Result |
|---|---|---|---|
| Name | empty (UI) | touched then cleared | Blocked, `This field is required.` → VAL-001 |
| Name | empty (API) | `{"name":""}` | **201**, id 1011, `length=0` → VAL-002, Finding 2 |
| Name | null/absent (API) | — | 400 `must not be null` → VAL-001 |
| Name | 1 char | `q` | 201 (id 1013) — no minimum → Finding 10 |
| Name | 256 chars (UI) | typed | No `maxlength` stops it; Save → **HTTP 500** → Finding 1 |
| Name | 255 chars (API) | — | 201 (id 1015) |
| Name | 256 chars (API) | — | **HTTP 500**, leaks full SQL insert → Findings 1, 6. *2nd 5xx — length probing stopped* |
| Name | whitespace-only | `"   "` (UI) | Accepted, no message → Finding 3 |
| Name | whitespace (API) | `"   "`, `"  qa-…-trim  "` | 201 both, stored untrimmed (`length=3`) → Finding 3 |
| Name | duplicate | same name posted twice (UI) | Both 201, same name, ids 1004/1005 → Finding 9 |
| Name | unicode | `qa-val-日本-🔑` | 201, round-trips unchanged ✅ |
| Name | XSS | `qa-val-<script>alert(1)</script>` | 201, no dialog, rendered escaped (`&lt;script&gt;`) ✅ |
| Name | SQLi | `' OR '1'='1`, `'; DROP TABLE bank_account; --` | 201 both, stored verbatim, table intact ✅ (JPA params) |
| Name | path traversal | `../../etc/passwd` | 201, stored verbatim — no char restriction → Finding 10 |
| Balance | empty | touched then cleared | Two messages at once → VAL-003, VAL-004 |
| Balance | null/absent/`""` (API) | — | 400 `must not be null` |
| Balance | wrong format (UI) | `12abc` | Input keeps `12` → VAL-005 |
| Balance | wrong format (API) | `"12abc"` | 400 `Failed to read request` → VAL-004 |
| Balance | absurd (UI) | `1e999` | Input empties, both messages shown |
| Balance | absurd (API) | `1e999` | **HTTP 500** → Finding 4 |
| Balance | absurd (API) | `1e20` | **HTTP 500**, `numeric field overflow, precision 21, scale 2` → Finding 4. *2nd 5xx — stopped* |
| Balance | negative | `-1` | Accepted both layers, stored `-1.00` → Finding 7 |
| Balance | precision | `1.555` | Response echoes `1.555`; **DB stores `1.56`** → Finding 11 |
| User | forged, real id | `{"user":{"id":2,"login":"user"}}` as tenant a | **201**, stored `user_id=2` (tenant b's id) → Finding 5 |
| User | forged, unknown id | `{"user":{"id":99999}}` | **HTTP 500**, leaks FK name `fk_bank_account__user_id` → Findings 5, 6. *2nd 5xx — stopped* |
| id | forged | `{"id":424242,...}` | 400 `error.idexists` → VAL-006 |
| (form) | double submit | 2 fast clicks | 1 POST, 1 row → VAL-008 |
| Name | reserved names | — | Skipped — not probed, see Q-016 |
| Name | case sensitivity | — | Skipped — same-case duplicates already accepted |

## Standard comparison
`Match` unless noted. Every `Gap` is also a Finding or `Q-`.

| Baseline item | Field | Verdict | Raised as |
|---|---|---|---|
| Required (id) | Name | `null` rejected both layers; **empty string accepted by API** | Finding 2 |
| Minimum length | Name | None — `q` accepted everywhere | Finding 10, Q-013 |
| Maximum length | Name | No `maxlength`; 255 stored, 256 → 500 | Finding 1, Q-010 |
| Trim whitespace | Name | Accepted/stored untrimmed by both layers | Finding 3, Q-011 |
| Allowed characters | Name | Path traversal, script, SQLi all stored verbatim | Finding 10, Q-013 |
| Unique per tenant | Name | Duplicates accepted, no scope stated | Finding 9, Q-009 |
| Reserved names | Name | Not probed | Q-016 |
| Case sensitivity | Name | N/A — uniqueness doesn't exist to collide | Q-009 |
| Sanitization | Name | Match — stored as text, rendered escaped | — |
| Required (number) | Balance | Match | — |
| Numeric only | Balance | `12abc` → clean 400, but `1e999`/`1e20` → **500** (a bug, not a rule) | Finding 4 |
| Min/max value | Balance | None — `-1` accepted; upper bound is the column, hit as a 500 | Findings 4, 7, Q-012 |
| Integer/step | Balance | N/A — money field, decimals intended | — |
| `decimal(21,2)` rounding stated, not silent (overlay) | Balance | `1.555` accepted, echoed `1.555`, **DB stores 1.56** | Finding 11, Q-015 |
| Must choose (select) | User | N/A — `""` is a valid, intended choice | — |
| Allowed values only (select) | User | Any `user` object honoured; real other-tenant id stored, unknown id → 500 | Finding 5 |
| Forged owner ignored/rejected (overlay) | User | Neither — honoured | Finding 5, Q-007 |
| Messages are user-safe | all | 500 bodies leak SQL, FK name, Java signature | Finding 6 |
| Any 5xx is always a bug | Name, Balance, User | 3 separate 5xx classes found | Findings 1, 4, 5 |
| Quota reaches cap, reports UNKNOWN | collection | Match — 25 created, none rejected | Q-014 (limit itself still unknown) |
| Secret field rules | — | N/A — no generated secret in this module | — |
| Email/URL/date/file rules | — | N/A — no such field | — |

## Findings
| # | What we saw | Severity | Raised as |
|---|---|---|---|
| 1 | 256-char Name → **HTTP 500** (255 accepted); no `maxlength`, user types into the crash | High | Q-010 |
| 2 | `{"name":""}` → **201**, stored empty, though the UI refuses it — VAL-002 is client-only | High | — |
| 3 | Whitespace-only Name (`"   "`) accepted by both layers, untrimmed | Medium | Q-011 |
| 4 | Balance `1e20`/`1e999` → **HTTP 500**, `numeric field overflow` | High | Q-012 |
| 5 | Tenant a posts `{"user":{"id":2}}` → **201**, owns an account as tenant b (API3). Unknown id → 500 leaking the FK name | High (security) | Q-007 |
| 6 | Every 500 body leaks the raw SQL insert, FK name, column precision, Java class/method signature | High (security) | — |
| 7 | Negative balance (`-1`) accepted, stored `-1.00`, no message | Low | Q-012 |
| 8 | Empty form: Save disabled with no asterisk/`required`/`aria-required`, only a red bar | Medium (a11y) | — (SEQ-002 #3) |
| 9 | Duplicate Name accepted (ids 1004, 1005) | Medium | Q-009 |
| 10 | Name has no minimum length or character restriction | Medium | Q-013 |
| 11 | `balance:1.555` → response says `1.555`, DB stores `1.56`, silently | Medium | Q-015 |
| 12 | No screenshot of the `Internal server error.` banner itself (3rd-5xx stop rule) — message text is in `val-bank-account-form-2/walk.json`, body in `val-api-probe/probes.json` | Low (evidence) | — |

## Questions
| ID | Question |
|---|---|
| Q-009 | Must Name be unique? Scope per-user or global? |
| Q-010 | Intended max length for Name? |
| Q-011 | Should Name be trimmed, or blank-after-trim rejected? |
| Q-012 | Is negative balance allowed? What's the intended upper bound? |
| Q-013 | Should Name have a minimum length and restricted character set? |
| Q-014 | Is there a cap on bank accounts per tenant? Unknown below 25. |
| Q-015 | Over-2-decimal balance is silently rounded while the response doesn't match. Round, reject, or echo stored value? |
| Q-016 | Should names like `admin`/`api`/`health` be reserved? Not probed. |

Q-020 (this run's cleanup vs. the SEQ-002 retention decision) is answered
in `docs/discovery/README.md` → "Data policy": cleanup is the default
(CLAUDE.md §5); only the two named SEQ-002 rows are a kept exception.
This run's cleanup, below, was correct.

## Data created and cleaned

41 probe rows created, all deleted via `DELETE /api/bank-accounts/{id}`
as tenant a; confirmed empty by a read-only `SELECT` over ids 1004–1060.

| Rows | Ids | Deleted? |
|---|---|---|
| Duplicate-name probe | 1004, 1005 | ✅ |
| Unicode/XSS/SQLi/double-submit probes | 1007–1010 | ✅ |
| API probes (empty/whitespace/short/long/negative/precision/SQLi/path) | 1011–1015, 1017, 1018, 1023, 1024 | ✅ |
| Forged-owner probe | 1025 | ✅ |
| Quota probe ×25 | 1026–1050 | ✅ |
| **Total: 41 rows, 41 deleted, 0 left behind** | | |

Not touched (SEQ-002's retained rows, Q-004): `qa-seq002-mveuqzsq-f7km`
(1002), `qa-seq002-mveut2zp-02u8` (1003).

No row outside `qa-` was created, edited or deleted.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First validation pass over SEQ-002. VAL-001..VAL-009 created. |
| 2026-10-19 | Tightened for length (CLAUDE.md §12); resolved Q-020 reference once README's data policy was corrected. No facts/IDs removed. |
