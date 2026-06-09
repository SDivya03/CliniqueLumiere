---
name: bug-report
description: Turn a failed test or a manual observation into a structured bug report / GitHub issue draft following the team conventions. Use when a tester says "log this bug", "write a bug report", "this failed, file it", or finishes an /e2e-test run with failures.
---

# Bug Report Drafter

Produces a clean, reproducible bug report mapped back to the acceptance criterion it
violates. Per the team CLAUDE.md, **Claude never opens issues** — this skill drafts the
report and the human submits it on GitHub.

## Inputs

- The observation: what was seen (from the human, or from a `/e2e-test` failure).
- The related ticket id (`CL-x.x.x`) so the bug links to the violated AC. If unknown,
  search `tickets.md` for the matching feature and confirm with the human.

## Steps

1. Gather: ticket id + the specific AC that fails, the environment, exact reproduction
   steps, expected vs actual, and any artefacts (Playwright trace, screenshot, API
   response, console output).
2. Classify severity:
   - **Blocker** — feature unusable / data loss / double-booking gets through
   - **Major** — AC not met, no workaround
   - **Minor** — AC not met, workaround exists
   - **Trivial** — cosmetic
3. Write the draft to `qa/bugs/<TICKET-ID>-<slug>.md`.
4. Print the body ready to paste into a new GitHub issue, and remind the human that they
   submit it (Claude does not open issues).

## Output format

```markdown
# [BUG] <short summary>

**Ticket:** CL-x.x.x (#<issue>) · **Violated AC:** "<verbatim AC text>"
**Severity:** Blocker / Major / Minor / Trivial
**Environment:** branch `master` · frontend localhost:4200 · API localhost:5050 · <browser>

## Steps to reproduce
1. ...
2. ...

## Expected
<what the AC requires>

## Actual
<what happened>

## Evidence
- Playwright trace: <path>
- Screenshot: <path>
- API/console: <snippet>

## Notes
<scope, frequency (always/intermittent), suspected area if known>
```

## Rules

- Always tie the bug to a verbatim acceptance criterion — a bug is "AC not met", not an opinion.
- Reproduction steps must be concrete enough for a developer to follow without asking.
- Never paste secrets, tokens, or real patient data into a report; use placeholders.
- Documentation only — do not edit code, do not open the issue yourself.
