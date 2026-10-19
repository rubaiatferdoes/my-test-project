---
id: TC-016
title: Anonymous home page should not advertise working credentials
module: auth
flow: [1]
e2e: none
requirements: [SEQ-001]
priority: P2
type: Security
layer: [UI]
data: [DAT-042]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-016: Anonymous home page should not advertise working credentials

Preconditions: Browser is signed out.

Steps:
1. Go to the URL: http://localhost:8080, without signing in
2. Read the text on the page

Expected Result (target behaviour): the page does not show either
account's real password in plain text.

Notes:
- **This currently fails** — the page prints both shipped logins
  verbatim (`admin`/`admin`, `user`/`user`). This case records the
  target behaviour so the gap stays visible; it's not claiming today's
  page is correct. Whether this is acceptable for a public demo
  deployment is a product decision — see Q-001.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft — gives Q-001 a case instead of leaving it undocumented. |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
