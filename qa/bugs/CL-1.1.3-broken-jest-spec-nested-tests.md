# [BUG] Jest suite fails on `master` — `registration-form.component.spec.ts` has a missing `});` (nested tests)

**Ticket:** CL-1.1.3 (#3) / CL-1.2.1 (#4)
**Violated AC:** "A brief success indicator is shown after submission" (CL-1.1.3) and "Collapsing the section does not clear entered values" (CL-1.2.1) — their unit tests exist but **cannot execute**, so the criteria are unverified by the suite. Also breaks the team DoD ("Unit tests written and passing").
**Severity:** Major — `npm test` fails (2 of 4 suites), CI/DoD gate is red, no workaround.
**Environment:** branch `master` (commit `1de9a24`) · Node 22 · Jest 29 · `npm test`

## Steps to reproduce
1. `git checkout master && npm ci`
2. `npm test`
3. Observe the run.

## Expected
All Jest suites pass (per DoD), including the CL-1.1.3 / CL-1.2.1 tests.

## Actual
2 suites fail:
- `src/app/features/patient-intake/registration-form/registration-form.component.spec.ts` — the test `auto-dismisses the success banner after a few seconds (CL-1.1.3)` (~line 109) is **missing its closing `});`**. The `try/finally` closes at ~line 120, then the next `it('renders the inline duplicate-email message…')` opens **inside** the still-open test → Jest aborts: *"Tests cannot be nested."* All following `it()` blocks (the CL-1.2.1 medical-history tests) are swallowed.
- `src/app/features/patient-intake/services/patient.service.spec.ts` — contains **two concatenated `describe('PatientService', …)` blocks** (a merge of two independently-authored versions: an `HttpTestingController` version and an `ApiService`-mock version). The file does not parse cleanly as one suite.

## Evidence
```
● RegistrationFormComponent › auto-dismisses the success banner after a few seconds (CL-1.1.3)
  Tests cannot be nested. Test "keeps entered medical history when the section is collapsed (CL-1.2.1)"
  cannot run because it is nested within "auto-dismisses the success banner after a few seconds (CL-1.1.3)".

Test Suites: 2 failed, 2 passed, 4 total
Tests:       1 failed, 17 passed, 18 total
```

## Notes
- **Frequency:** always (deterministic).
- **Root cause:** merge conflict resolution across the CL-1.1.3 and CL-1.2.1 feature branches (and the CL-1.1.1 QA branch for the service spec) dropped/duplicated structural braces. Not a product-code defect — the features themselves work (verified live: success banner, medical-history round-trip, 409 duplicate).
- **Fix direction (developer — testers don't edit `src/`):**
  1. In `registration-form.component.spec.ts`, add the missing `});` to close the auto-dismiss `it()` before the next `it(`.
  2. In `patient.service.spec.ts`, keep a single `describe` block (the `HttpTestingController` version covers the 409/500/network paths) and delete the duplicate.
- After the fix, re-run `npm test` — expect all 4 suites green, which unblocks TC-1.1.3-04 and TC-1.2.1-04.
</content>
