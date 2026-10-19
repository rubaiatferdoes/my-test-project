> Status: APPROVED — rubaiat.ferdoes@leads-bd.com, 2026-10-19 (trial run).
> The `ASSUMPTION — verify` records (DAT-031..034, DAT-042, DAT-045) and
> the two runtime-built tokens (DAT-039, DAT-041) are carried as-is, not
> resolved by this approval.

# Test data

Dummy datasets for the 16 approved test cases in `docs/test-cases/`
(modules `auth`, `accounts`). Every limit used here comes from an
approved rule in `docs/discovery/validations/*.validations.md` — cited
in each record's `rule` field. Where a rule is unresolved
(`UNKNOWN — probe inconclusive`), the record's `expected` is
`ASSUMPTION — verify (Q-xxx)` and never a made-up number.

Patterns such as `{qa-name}`, `{repeat:k:41}` and `{faker:...}` are
filled in at test run time by `automation/utils/testData.ts` (see
`ts-pom-standards`). Values that ARE the test — boundaries, bad formats,
attack strings — are written out literally, or with `{repeat}`, so every
run sends exactly the same input.

## `valid-data.json` — 9 records (DAT-001..DAT-009)

Realistic values the app is expected to accept:
- A sign-in pair for `admin` (TC-001) — the username is the sample
  app's own public demo login, the password is never stored here; it
  comes from `.env` at run time.
- A unique bank-account Name (`{qa-name}`) and a valid Balance
  (`250.75`), reused across every case that just needs "a normal
  account" to set up its real check (TC-006, 008, 009, 010, 012, 014,
  015).
- A second unique Name for the 25-in-a-row quota probe (TC-013).
- `user: null` showing the User field is optional (TC-006).
- The three Save-button-enablement combinations: Name alone, Balance
  `0` alone, and both together (TC-011).
- `id: null` on create, showing the server assigns its own id (TC-010).

## `negative-data.json` — 25 records (DAT-010..DAT-034)

Empty/null values, boundary ±1 around every known length limit, and
wrong-format input:
- Sign-in username boundary from VAL-010/VAL-011: empty, 1 char, 254,
  255, 256 (TC-002).
- Sign-in password boundary from VAL-012/VAL-013: empty, 3 chars
  (min-1), 4 chars (min), 100 chars (max), 101 chars (max+1) (TC-003).
- A real username with a wrong password, and a username that doesn't
  exist, both for the "same on-screen message, different API body"
  check (TC-004, VAL-014).
- Bank-account Name: empty on the form vs. empty sent straight to the
  API — the same value, two different rule IDs (VAL-001 vs VAL-002,
  TC-007) because the UI blocks it and the API doesn't.
- Bank-account Balance: `null`, empty string, `12abc`, `1e999` for the
  required/format rules (TC-008, TC-009, VAL-003/004/005).
- A client-supplied `id` (TC-010, VAL-006).
- Four records marked `ASSUMPTION — verify` for TC-015 (oversized Name,
  `1e20`/`1e999` Balance, an unknown owner id): the app currently
  returns a server error (HTTP 500, leaking SQL/FK details) for all
  four, which is a bug — these records state the **target** clean-400
  behaviour the case checks for, with the open question it traces to
  (Q-010, Q-012, Q-007). Never loosen these to accept the 500.

## `security-data.json` — 11 records (DAT-035..DAT-045)

Authentication attack inputs from the `auth-security` skill, plus the
object-level-access findings already on record:
- Seven `Authorization` header variants for TC-005: missing, empty,
  random, malformed (wrong segment count), expired, wrong-signing-key,
  and token-in-the-URL. The last two kinds of token (genuinely expired,
  genuinely re-signed) cannot be precomputed without a live sign-in, so
  their `value` is a runtime instruction, not a literal secret — the
  test fixture builds the real token at run time and never commits it.
  No working token appears anywhere in this file.
- The home page's plaintext demo credentials, marked
  `ASSUMPTION — verify (Q-001)` since whether this is acceptable is a
  product decision (TC-016). `admin`/`admin` and `user`/`user` are the
  sample app's own shipped demo logins, not secrets this project
  generated.
- Tenant-B's cross-tenant list reads and the forged-owner create
  (`user.id: 2`) for TC-014 — OWASP API1/API3 findings already approved
  in `accounts.validations.md`, recorded as current behaviour, not an
  endorsement.

SQL-injection, XSS, and path-traversal strings against the bank-account
Name field, and injection strings against the login form, were already
probed clean during discovery (`accounts.validations.md`,
`auth.validations.md` probe logs) and none of the 16 approved test
cases re-asserts them — `docs/test-cases/accounts/README.md` lists this
as a parked regression candidate, not a silent gap. No records were
invented for it; add them here once a test case exists to consume them.

## Schema check

`bank_account.name` is `varchar(255)` and `balance` is `decimal(21,2)`
(`docs/requirements/db/liquibase/20150805124838_added_entity_BankAccount.xml`).
No approved `VAL-` rule states a different number, so there is no
mismatch to report — the only length "limit" on Name is the column
itself, already captured as Finding 1 / Q-010 (hitting it causes a
server error, not a clean rejection).

## Record counts
| File | Records |
|---|---|
| `valid-data.json` | 9 |
| `negative-data.json` | 25 |
| `security-data.json` | 11 |
| **Total** | **45** |

## Test cases covered
All 16 approved cases: TC-001..TC-016 (modules `auth`, `accounts`).
Every case now has a `data:` list in its front matter and, where it has
a "Test data" table, a DAT id in every row.

## Open assumptions
| Record(s) | Assumption | Linked question |
|---|---|---|
| DAT-031 | Intended max length for bank-account Name | Q-010 |
| DAT-032, DAT-033 | Intended upper bound for Balance | Q-012 |
| DAT-034, DAT-045 | Whether a forged/unknown owner id should be rejected | Q-007 |
| DAT-042 | Whether printing the shipped demo credentials is acceptable | Q-001 |
| DAT-039, DAT-041 | True expiry/wrong-signature token testing needs a live sign-in built by the test fixture; no literal value is stored | — |

No test case was left without data.

Ready for review. After approval, run `/automation-api:api-test-generator`
and `/automation-ui:playwright-generator`.
