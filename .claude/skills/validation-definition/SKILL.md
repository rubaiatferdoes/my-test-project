---
name: validation-definition
description: Probe every input field in a discovered UI workflow and record its validation rules — required, length, format, uniqueness, allowed values — with the real error message, whether the rule is enforced on the client, the server, or neither. Use when mapping field validations, input rules, or producing a validation definition.
---

# Validation Definition — what each field accepts and rejects

**Goal:** know every rule on every field, in the product's own words, and
know which rules the server actually enforces. These become the negative
and boundary test cases, and the data factory's rules.

**Input:** approved `docs/discovery/sequences/SEQ-*.md` plus the field
dumps in `automation/discovery/artifacts/`.
**Output:** `docs/discovery/validations/<module>.validations.md`
(template: [templates/validations-template.md](templates/validations-template.md)).

**You have to submit bad data to learn a rule.** That is allowed
(CLAUDE.md section 4) under `qa-` naming, on the test environment, with
cleanup — and only on forms inside the workflow you were asked to cover.

## 1. Read the DOM first — it is free

Before typing anything, record what the page already declares for each
field. Half the rules are usually sitting there:

| Source | Gives you |
|---|---|
| `required`, `aria-required` | Required |
| `maxlength`, `minlength` | Length limits |
| `type` (`email`, `number`, `url`) | Format |
| `pattern` | Regex rule |
| `min`, `max`, `step` | Numeric range |
| `disabled`, `readonly` | Not editable — and a question if it should be |
| Placeholder, helper text, label | The rule as the product words it |

Declared is not enforced. A `maxlength` on the input only stops typing —
the API may still accept 500 characters when called directly. That gap is
exactly what step 3 is for.

## 2. Probe each field

For every field, in this order, submitting between each:

| # | Probe | Learns |
|---|---|---|
| 1 | Leave empty, submit | Required? What is the message? |
| 2 | One character | Minimum length |
| 3 | A long string (`{repeat:k:256}`) | Maximum length — and whether it truncates silently |
| 4 | Wrong format for the type | Format rule and its message |
| 5 | Leading/trailing spaces | Trimmed, rejected, or stored as-is |
| 6 | A value that already exists | Uniqueness, and the message |
| 7 | Unicode and emoji (`qa-日本-🔑`) | Encoding handling |
| 8 | One injection string from `auth-security` §4 | Rejected cleanly, stored as text — **never** executed, never 5xx |

Record the exact message, character for character, and where it appears
(under the field, in a toast, at the top). Tests assert on these strings,
so "Name is required." and "Name is required" are different answers.

Stop probing a field after two unhandled 5xx responses — you have found
the bug; keep going and you are just making noise.

## 3. Client, server, or neither — the check that matters

For each rule, decide where it lives:

1. Try it in the UI. Blocked before any request → **client**.
2. Send the same bad value straight to the API route from the event
   definition, with the same session. Rejected → **server**.
3. Accepted by the API → **client only**.

| Verdict | What it means | Action |
|---|---|---|
| `both` | Normal and good | Record it |
| `server` | Fine. UI could be friendlier | Note it |
| `client` | **Finding.** Anyone calling the API bypasses it | Raise a suspected bug — this is how bad data gets in |
| `none` | Field claims a rule and nothing enforces it | Raise a suspected bug |

This one column is the highest-value output of the whole step. A
`client`-only rule on a required or length-limited field is a real defect
that no amount of UI testing would ever find.

## 4. Cross-field and form-level rules

Fields are not independent. Also record:

- rules that only fire in combination ("end date must be after start date")
- a submit button that stays disabled until something is true — record
  **what** makes it enable
- rules that depend on state (a name unique per tenant, not globally)
- what happens on double submit — two records, or one?

## 5. Count and quota limits

Some rules are not about what a field accepts but about **how many
things you are allowed to have** — five keys per endpoint, twenty
endpoints per tenant, ten rows in a list. No amount of poking a single
field will find them, and they are exactly the limits a customer hits
first in production.

**Where to apply it.** Only to collections: an event from the event
definition that creates a child of a parent (`POST /endpoints/{id}/keys`
creates a key under an endpoint). One probe per collection, not per
field.

**How to probe**

1. Announce it before starting: the collection, the parent, and the cap.
2. Create through the **platform API**, not the UI — faster, and the API
   is where the limit either holds or doesn't.
3. Create one at a time, counting, until one is rejected.
4. Stop at `DISCOVERY_QUOTA_PROBE_CAP` (default 25) no matter what.
5. Record the count at which it was rejected, and the exact message.
6. Then check the UI: does the "Generate key" button disable at the
   limit, or does it let you try and fail? That is the same
   client/server/both verdict as every other rule.

**What to write**

| Outcome | Record |
|---|---|
| Rejected at n+1 | `max n per <parent>`, with the message and the enforcement verdict |
| Reached the cap with no rejection | `UNKNOWN — no limit found below <cap>` plus a `Q-`. Do **not** write "unlimited" |
| Rejected with a 5xx | A bug report, not a limit |
| Rejected but the message gives no number | A finding — a user cannot learn the limit from the product |

Note which tenant you measured on. A quota is often per plan, so "max 5"
may be true for `qa-tenant-a` and wrong for everyone else — say so
rather than stating it as a universal rule.

**Cleanup is not optional here.** This probe creates more data than all
the others combined. Delete every record, report anything left behind by
name, and never run it against a parent you did not create.

If each creation is slow (over ~2 s) the probe could take minutes — stop
and ask before continuing, rather than hammering a shared environment.

## 6. Write it down

One row per rule, not per field — a field with three rules gets three
`VAL-` IDs, because each becomes its own test case or data row.

| ID | Screen | Field | Rule | Trigger | Message (exact) | Enforced | Evidence |
|---|---|---|---|---|---|---|---|
| VAL-007 | generate-key-dialog | Key name | required | on submit | `Key name is required.` | both | [png](../screens/VAL-007.png) |
| VAL-008 | generate-key-dialog | Key name | max length 40 | on type (maxlength) | — (typing blocked) | client | [png](../screens/VAL-008.png) |

`Trigger` is `on type`, `on blur`, `on submit`, or `server response` —
the UI generator needs it to know when to assert.

An unknown limit is written `UNKNOWN — probe inconclusive` with a `Q-`,
never a guessed number.

## 7. Clean up

Probing creates records — especially the uniqueness probe. Delete every
`qa-` record you made, report anything left behind, and never touch a
record that is not yours.

## Rules

- `status: draft` until approved. `VAL-` IDs are global and permanent.
- The message is quoted exactly, including the full stop.
- Never record a rule you did not trigger. "Probably 50 characters" is a
  question, not a validation.
- A 5xx from any probe is a bug report, not a validation rule.
- Finish with: rules found per field, how many are `client`-only or
  `none` (list them — these are findings), unresolved limits, and
  "Ready for review."
