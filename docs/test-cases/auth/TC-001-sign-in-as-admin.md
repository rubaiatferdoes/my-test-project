---
id: TC-001
title: Sign in as admin reaches the signed-in home page
module: auth
flow: [1]
e2e: E2E-01
requirements: [SEQ-001]
priority: P0
type: E2E
layer: [UI, API]
data: [DAT-001]
status: approved
approved_by: rubaiat.ferdoes@leads-bd.com
approved_on: 2026-10-19
---

# TC-001: Sign in as admin reaches the signed-in home page

Preconditions: Browser is signed out; tenant-a credentials (`admin`) are available.

Steps:
1. Go to the URL: http://localhost:8080
2. Click "Sign in" in the top menu
3. On the Sign in page, enter the tenant-a username and password, then click the "Sign in" button
4. Click the "Entities" menu

Expected Result: After signing in, the home page shows "You are logged
in as user \"admin\"." and the top menu gains "Entities" and
"Administration". Clicking "Entities" opens a dropdown listing Bank
Account, Label, and Operation.

Notes:
- Where the sign-in token is stored (sessionStorage vs localStorage) is
  an open question — see Q-002.
- Covers journey step 1 only. Steps 3–7 of the full journey aren't
  tested yet (not discovered). TC-006 covers step 2.

## Change log
| Date | Change |
|---|---|
| 2026-10-19 | First draft, from SEQ-001. |
| 2026-10-19 | Rewritten in plain manual-tester language — one overall Expected Result, no selectors/API detail (those live in SEQ-001). |
| 2026-10-19 | Approved — rubaiat.ferdoes@leads-bd.com |
