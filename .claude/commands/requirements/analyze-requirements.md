---
description: Optional — analyze PRD/FRD/mockups/client notes, when documents exist, so discovery can be checked against what was intended
argument-hint: [all | module:keys | "API keys" | flow:3 | path, default docs/requirements/]
skill: requirement-analysis
---

Use the requirement-analysis skill on: $ARGUMENTS

If nothing was given, analyze everything under `docs/requirements/`.
If that folder holds no requirement documents, say so and stop — this
step is optional, and discovery plus my confirmation is then the only
source of expected results.

This runs alongside discovery, not instead of it. Discovery records what
the application **does**; this records what it was supposed to do. The
test planner compares the two, and every disagreement becomes a question
or a suspected bug.

If a module, flow step, or folder was given, analyze only that part and
add it to the existing analysis without touching other modules.

After the analysis:
1. Show me the top gaps and the questions, most important first.
2. Point out anything that discovery has already contradicted.
