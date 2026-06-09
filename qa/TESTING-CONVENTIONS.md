# Testing Conventions — Clinique Lumière

How we test, so every test reads the same way regardless of who wrote it. These
conventions are **derived from the tests already in the repo** (Jest + xUnit) and the code
standards in `CLAUDE.md §5`. Developers and testers both follow them.

> Scope note: developers own unit tests (they ship with the feature, part of the DoD).
> Testers (Arjen, Krithi) own end-to-end + manual validation and the traceability back to
> acceptance criteria. This document covers all levels so the seams line up.

---

## 1. Test levels & ownership

| Level | Tool | Lives in | Owner | Purpose |
|-------|------|----------|-------|---------|
| Unit (frontend) | Jest | `src/**/*.spec.ts` (co-located) | Developer | Component/service/pipe/validator logic in isolation |
| Unit / integration (backend) | xUnit | `backend/tests/CliniqueLumiere.Api.Tests/` | Developer | Controller + EF behaviour against an in-memory DB |
| End-to-end | Playwright | `e2e/*.spec.ts` | Tester | Acceptance criteria through the real UI + API |
| Manual / exploratory | Test plan | `qa/testplans/` | Tester | Cases an automated test cannot (yet) cover |

A feature is not done until its unit tests pass (DoD, `CLAUDE.md §5`). Testers validate on
`master` after merge, before the sprint release tag.

---

## 2. Naming

**Frontend (Jest)** — `describe` names the unit, `it` describes behaviour in lowercase,
present tense, no "should":

```ts
describe('RegistrationFormComponent', () => {
  it('is invalid when required fields are empty', () => { /* ... */ });
  it('rejects an invalid email format', () => { /* ... */ });
});
```

**Backend (xUnit)** — `Method_Scenario_ExpectedResult`:

```csharp
[Fact]
public async Task Create_PersistsPatient_AndReturnsCreated() { /* ... */ }

[Fact]
public async Task Create_NormalisesEmailToLowercase_AndTrimsNames() { /* ... */ }
```

**End-to-end (Playwright)** — one `test()` per acceptance criterion, named so a failure
points straight back to the AC, and tagged with the ticket id:

```ts
test('CL-1.1.2: duplicate email shows an inline error without reload', async ({ page }) => { /* ... */ });
```

---

## 3. Traceability to acceptance criteria

- Every acceptance criterion in `tickets.md` maps to at least one test (any level).
- E2E and manual cases reference the ticket id (`CL-x.x.x`) in the test/case title.
- `/coverage-check` is the gate before sign-off: it lists ACs with no test behind them.
- A bug is always phrased as "acceptance criterion not met" — see `/bug-report`.

---

## 4. Test data

- **Fictional data only.** Never real or production patient data — this is health data.
- Use the established fixtures: names like `Marie Dubois` / `Paul Dubois`, emails on
  `@example.com`, phone numbers in the `+33 6 ..` style already used in the suite.
- Email is stored normalised (trimmed + lowercased); assert against the normalised value.
- No secrets, tokens, connection strings, or real endpoints in test files or fixtures.

---

## 5. Structure & isolation

**Frontend (Jest):**
- Configure a standalone component via `TestBed` by importing the component itself.
- Provide test doubles for I/O: `provideHttpClient()` + `provideHttpClientTesting()`, and
  `provideNoopAnimations()` for Material components.
- Mock services with `jest.spyOn(service, 'method').mockResolvedValue(...)` — do not hit
  the real API in a unit test.
- Factor repeated setup into small helpers (`fillValid()`, a `fakePatient` fixture).
- Assert signal-driven state directly (e.g. `component.registered()`), not the DOM, when
  the AC is about reactivity.

**Backend (xUnit):**
- One fresh in-memory `ClinicDbContext` per test, keyed by `Guid.NewGuid()`, via a
  `NewContext()` helper — tests must not share state.
- Build inputs through a `ValidRequest()` factory and override only the field under test.
- Assert the result shape with `Assert.IsType<CreatedAtActionResult>(...)` etc., then the
  persisted state via the context.
- XML `/// <summary>` doc on the test class (matches `CLAUDE.md` JSDoc/XML-doc rule).

---

## 6. Selector & test-hook policy (e2e)

Agreement between developers and testers — **hybrid**. The goal: stable e2e tests that do
not break on restyling or reworded copy, with minimal extra markup.

1. **Prefer accessible selectors**, in this order: `getByRole`, `getByLabel`,
   `getByPlaceholder`, `getByText`. They work on existing markup and double as an
   accessibility check.
2. **Add a `data-testid` only when an accessible selector is ambiguous or impossible:**
   - repeated elements (a row in the patient/appointment list, one of several "Cancel" buttons)
   - elements with no stable text (status badges, icon-only buttons, the success banner)
   - content whose text changes (the "Upcoming: … at …" alert)
3. **Naming:** `data-testid="<feature>-<element>"` in kebab-case —
   e.g. `patient-row`, `appointment-cancel-btn`, `conflict-error`, `upcoming-alert`.
4. **Who adds it:** the tester records the needed hook (a comment in the e2e spec, or in
   the bug report / PR), the **developer** adds it to `src/`. Testers never edit `src/`.
5. **A `data-testid` is a test contract:** don't rename, repurpose, or remove one without
   checking the e2e suite first.

---

## 7. Determinism

- No test depends on wall-clock time. For the "within 30 minutes" alert (CL-3.2.1),
  control the clock (fixed/injected time) rather than asserting against `now`.
- No ordering dependency between tests; each sets up its own data.
- E2E waits on conditions (visible element, response), never fixed `sleep`/timeouts.
- No `console.log` in test code — ever (`CLAUDE.md §5`). TypeScript stays `strict`, no `any`.

---

## 8. Running the suites

```
# frontend unit (Jest)
npm test

# backend unit (xUnit)
cd backend/src/CliniqueLumiere.Api && dotnet test ../../tests/CliniqueLumiere.Api.Tests

# e2e (Playwright) — app must be running on :4200 and :5050
npx playwright test
```

---

## 9. Definition of Done (testing slice)

Before a ticket is signed off:

- [ ] Every acceptance criterion has a test (`/coverage-check` shows no gap)
- [ ] Unit tests written and passing (developer, part of the PR)
- [ ] E2E spec added for the user-visible criteria (tester)
- [ ] No `console.log`, no `any`, no skipped/`.only` tests committed
- [ ] Failures filed via `/bug-report`, each tied to the violated AC
