---
name: e2e-test
description: Write and run automated end-to-end tests (Playwright) against the running Clinique Lumiere app, scoped to one ticket's acceptance criteria. Use when a tester says "automate this ticket", "write e2e tests", "run the e2e suite", or wants to validate CL-x.x.x against the live app.
---

# End-to-End Test Runner (Playwright)

Drives the real Angular app in a browser (and the API where useful) to validate a ticket
against its acceptance criteria. The app is exercised through the UI at
http://localhost:4200 and, where an AC is about the contract (status codes, 409 conflict),
directly against the ASP.NET Core API at http://localhost:5050.

This is a **tester** skill. It writes test code under `e2e/` only — it never modifies
application code in `src/` or `backend/`.

## Preconditions (ask the human to start these; never start servers silently)

- Backend running on `http://localhost:5050` (Swagger UI at `/swagger`).
  Start: `cd backend/src/CliniqueLumiere.Api && dotnet run`
- Frontend running on `http://localhost:4200` (`ng serve`).

If either is down, stop and tell the human exactly which command to run.

## First-run setup (only if Playwright is not yet present)

1. Check for `e2e/` and `playwright.config.ts`. If missing, scaffold:
   - `npm install --save-dev @playwright/test` and `npx playwright install chromium`
   - Create `playwright.config.ts` with `baseURL: 'http://localhost:4200'`,
     `use: { trace: 'on-first-retry', screenshot: 'only-on-failure' }`, and a Chromium project.
   - Create `e2e/` for specs.
2. Confirm the install step with the human before running it (it changes `package.json`).

## Steps

1. Read the ticket from `tickets.md` and, if it exists, the matching plan in
   `qa/testplans/<TICKET-ID>.md`. Use the test plan's cases as the spec checklist.
2. Write one spec file per ticket: `e2e/<ticket-id>.spec.ts`. One `test()` per acceptance
   criterion, named after the AC so failures map straight back to it.
3. Selector policy, in order of preference:
   - `getByRole` / `getByLabel` / `getByPlaceholder` (accessible, stable)
   - `getByTestId` — if elements lack hooks, note which `data-testid`s the devs should add
     (do NOT add them to `src/` yourself; record them as a request for the developer)
   - CSS selectors only as a last resort.
4. Assert the AC literally: inline error text, HTTP 409 on double-booking, no reload
   (assert via signal-driven DOM update, not navigation), timing windows, badge colours.
5. Run `npx playwright test e2e/<ticket-id>.spec.ts`.
6. Report a table mapping each AC -> test -> PASS/FAIL, with the failure reason and the
   trace/screenshot path for any failure. Offer to hand failures to `/bug-report`.

## Rules

- Never edit `src/` or `backend/`. If a test needs a hook the app lacks, record it as a
  developer request, do not add it.
- No `console.log` in spec files. TypeScript `strict` — no `any`.
- Deterministic tests: control the clock for the "within 30 minutes" alert cases rather
  than depending on wall-clock time.
- Never commit secrets or `.env`. Do not push or open PRs — hand the diff to the human.
- If you cap scope (e.g. skip a flaky case), say so explicitly in the report.
