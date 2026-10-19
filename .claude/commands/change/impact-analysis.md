---
description: Product sent an update? Find exactly which requirements, test cases, data, and automated tests it affects — and update only those (skill, in this conversation)
argument-hint: [change file, e.g. docs/requirements/changes/CR-001-key-expiry.md | answers | new document path]
skill: change-impact
---

Use the change-impact skill for: $ARGUMENTS

If no argument was given, look for new or changed files in
docs/requirements/changes/ and new rows in docs/requirements/answers.md.

Phase 1: show me the impact report and wait for my approval.
Phase 2 (only after I approve): apply the edits and give me the
follow-up commands for the affected IDs only.
