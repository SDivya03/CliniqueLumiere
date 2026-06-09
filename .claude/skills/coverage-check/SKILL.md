---
name: coverage-check
description: Compare existing tests against every acceptance criterion in tickets.md and report the gaps. Use when a tester asks "what is not tested yet", "coverage gaps", "are we done testing CL-...", or before signing off an epic for the sprint release.
---

# Coverage Check

Answers one question: which acceptance criteria have no test behind them yet? The tester
signs off an epic before the sprint release tag on `master`, so this is the pre-sign-off gate.

This is a **tester** skill. Read-only analysis — it writes a report, nothing else.

## Inputs

- `tickets.md` — the full set of acceptance criteria (the denominator).
- Existing tests, wherever they live:
  - `qa/testplans/*.md` (from `/testplan`)
  - `e2e/*.spec.ts` (from `/e2e-test`)
  - frontend unit tests: `src/**/*.spec.ts` (Jest)
  - backend unit tests: `backend/tests/CliniqueLumiere.Api.Tests/**/*.cs` (xUnit)
- Argument: a ticket id, an epic, or `all` (default `all`).

## Steps

1. Build the denominator: every AC from `tickets.md` in scope, keyed by ticket id.
2. Scan the test sources. Match a test to an AC by:
   - explicit AC reference in a test plan's traceability matrix
   - `test()` / `it()` titles in spec files that name the ticket id or quote the AC
   - unit test `describe`/`it` blocks naming the feature behaviour
   Matching is best-effort: when a link is plausible but not certain, mark it `weak` rather
   than claiming full coverage.
3. Produce a coverage report at `qa/coverage/<scope>-coverage.md`.

## Output format

```markdown
# Coverage Report — <scope>

**Generated against:** tickets.md · sources: qa/testplans, e2e, src unit specs
**Summary:** <covered>/<total> ACs covered · <gaps> gaps · <weak> weak links

## By ticket

| Ticket | AC | Covered by | Strength |
|--------|----|------------|----------|
| CL-1.1.1 | AC1 cannot submit empty required | CL-1.1.1-01, e2e | strong |
| CL-1.1.1 | AC2 email format | (none) | GAP |

## Gaps (act on these)
- CL-1.1.1 AC2: email format validation — no test found
- ...
```

## Rules

- Report the real number. Never round a "weak" or assumed link up to "covered".
- List every gap explicitly; do not summarise them away.
- If a test source is missing entirely (e.g. no `e2e/` yet), say so — absence of a folder
  is not the same as full coverage.
- Read-only. Do not modify tests, code, or git state.
