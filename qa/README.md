# QA — Testing Clinique Lumière

How the testers (Arjen, Krithi) validate features against acceptance criteria. Backed by
four Claude Code skills under `.claude/skills/`.

> **Testing conventions** (naming, structure, test data, determinism) live in
> [TESTING-CONVENTIONS.md](./TESTING-CONVENTIONS.md) — read that first.

## The testing loop

Testers validate on `master` after a PR is reviewed and merged (GitHub Flow — see CLAUDE.md §6).

1. **Plan** — `/testplan CL-x.x.x`
   Turns a ticket's acceptance criteria into test cases + a traceability matrix.
   Output: `qa/testplans/CL-x.x.x.md`.
2. **Automate & run** — `/e2e-test CL-x.x.x`
   Writes and runs Playwright end-to-end tests against the running app, mapping each
   acceptance criterion to a PASS/FAIL. Output: `e2e/CL-x.x.x.spec.ts`.
3. **Report** — `/bug-report`
   Turns a failure or manual observation into a GitHub issue draft tied to the violated
   AC. Output: `qa/bugs/<ticket>-<slug>.md`. The tester submits the issue — Claude does not.
4. **Sign off** — `/coverage-check EPIC n`
   Before the sprint release tag on `master`, confirms every AC has a test behind it
   (including the Jest/xUnit tests the developers write) and lists the gaps.
   Output: `qa/coverage/<scope>-coverage.md`.

## Running the app under test

```
# backend (ASP.NET Core 8 API)
cd backend/src/CliniqueLumiere.Api && dotnet run   # Swagger UI -> http://localhost:5050/swagger

# frontend (Angular 17+)
ng serve                                            # http://localhost:4200
```

> Stack (confirmed, PRD aligned with CLAUDE.md): backend = ASP.NET Core 8 + EF Core +
> SQLite, tested with **xUnit** (`backend/tests/CliniqueLumiere.Api.Tests`); frontend =
> Angular 17+ with **Jest** (`src/**/*.spec.ts`). `/e2e-test` adds Playwright on top,
> driving the UI at :4200 and the API contract at :5050.

## Folder layout this QA flow creates

```
qa/
  testplans/   # /testplan output — one file per ticket
  bugs/        # /bug-report drafts
  coverage/    # /coverage-check reports
e2e/           # /e2e-test Playwright specs
```

## Guardrails (same as the team CLAUDE.md)

- Testers and these skills **never edit `src/` or `backend/`**. If a test needs a
  `data-testid` hook the app lacks, it is recorded as a request for the developer.
- **Claude never opens issues, pushes, or merges.** It drafts; the human submits.
- No secrets, tokens, or real patient data in test data, reports, or specs.
