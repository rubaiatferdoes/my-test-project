# BUG-<nnn>: [Area] <what goes wrong> when <condition>

| Field | Value |
|---|---|
| Severity | Sev-1 / Sev-2 / Sev-3 / Sev-4 |
| Priority | P0 / P1 / P2 / P3 (proposed — lead confirms) |
| Status | PROPOSED — reported to the lead, who decides whether to file it |
| Found by | <name / agent> on YYYY-MM-DD |
| Environment | Test environment — <URL name, not the full URL> · build <version> |
| Browser / client | Chromium <ver> / Playwright API test / curl |
| Test case | TC-<nnn> |
| Violates | SEQ-<nnn> / VAL-<nnn> / EVT-<nnn> (and F-/BR- where documents exist) |
| Reproducible | Always / Intermittent (<x> of <y> runs) |

## Steps to reproduce
1. Log in as `qa-tenant-a`
2. ...

## Expected result
<quote the TC- step, and the SEQ-/VAL- (or BR-) it rests on>

## Actual result
<exact message / status code / response>

## Evidence
- Screenshot: `reports/artifacts/...`
- Video: `reports/artifacts/...`
- Trace: `reports/artifacts/...` (open with `npx playwright show-trace`)
- Request / response (keys masked):
```http
GET /qa-tc014-lz3k9a-w2-x7f1 HTTP/1.1
x-api-key: sk_...a1b2

HTTP/1.1 200 OK
```

## Notes (optional)
Suspected cause, related bugs, workaround.
