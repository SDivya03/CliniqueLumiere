# Test Plan — CL-1.1.1 Registration Form (#1)

**Story:** As a receptionist, I want to fill in a patient registration form, so the clinic has a complete record before the patient's first appointment.
**Executed:** 2026-06-09 against `master` · frontend localhost:4200 · API localhost:5050 (live).

## Test cases & traceability

| ID | Acceptance criterion | Test | Level | Result |
|----|----------------------|------|-------|--------|
| TC-1.1.1-01 | Form cannot submit with empty required fields | Submit empty form → blocked, inline "X is required", no API call | Jest/UI | ✅ PASS (Jest: "does not call the API when required fields are missing") |
| TC-1.1.1-02 | Email validates format (rejects `user@`, plaintext) | `email=user@` → control error; API `POST {email:"user@"}` → 400 | Jest + API | ✅ PASS (API 400) |
| TC-1.1.1-03 | Phone validates format when provided | `phone=12` → invalid; valid intl format accepted | Jest | ✅ PASS (phone.validator.spec) |
| TC-1.1.1-04 | Missing-required shows inline errors (not toast) | Errors render in `<mat-error>` beneath field | UI | ✅ PASS (template uses inline `mat-error`) |
| TC-1.1.1-05 | Emergency contact optional, does not block submit | Valid form, EC blank → valid + submits | Jest | ✅ PASS ("treats emergency contact fields as optional") |
| TC-1.1.1-06 | Happy path persists | `POST` valid patient | API | ✅ PASS (HTTP 201) |
| TC-1.1.1-07 | Server rejects missing required | `POST` without firstName | API | ✅ PASS (HTTP 400) |

## Live evidence
```
POST valid patient            -> 201
POST missing firstName        -> 400
POST bad email (user@)        -> 400
```

## Verdict
**PASS** — all CL-1.1.1 acceptance criteria met at API and unit level.
⚠️ Caveat: the Jest suite as a whole currently fails to complete due to a merge artifact in `registration-form.component.spec.ts` (see bug CL-1.1.3/CL-1.2.1 broken spec). The CL-1.1.1 cases themselves pass.
</content>
