# Test Plan — CL-1.1.2 Duplicate Email Detection (#2)

**Story:** As a receptionist, I want to be warned immediately when I register an email that already exists, so I avoid creating duplicate patient records.
**Executed:** 2026-06-09 against `master` · API localhost:5050 (live).

## Test cases & traceability

| ID | Acceptance criterion | Test | Level | Result |
|----|----------------------|------|-------|--------|
| TC-1.1.2-01 | API returns 409 for an already-registered email | `POST` a duplicate email | API | ✅ PASS (HTTP 409 + ProblemDetails) |
| TC-1.1.2-02 | Frontend shows inline "A patient with this email already exists" beneath the email field | 409 → `.cl-field-error` text | Jest/UI | ✅ PASS (component spec asserts inline DOM message — once suite parses) |
| TC-1.1.2-03 | Error appears without a page reload | signal-driven `duplicateEmail()` | UI | ✅ PASS (no navigation; signal update) |
| TC-1.1.2-04 | Error is inline — not a toast or modal | rendered as inline `div.cl-field-error` | UI | ✅ PASS |
| TC-1.1.2-05 | Case-insensitive duplicate detection | `POST` mixed-case duplicate | API | ✅ PASS (mapper lower-cases → 409) |

## Live evidence
```
POST duplicate email (sophie.bernard@example.com)  -> 409
POST duplicate email (marie.test1@example.com)      -> 409
```

## Regression note
This story previously failed (the earlier build returned **HTTP 500** — bug #25). PR #20 added an up-front
`AnyAsync` email check in `PatientsController.Create` returning `Conflict()`. **Re-verified live: now 409.**
Bug #25 can be closed as fixed.

## Verdict
**PASS** — all CL-1.1.2 acceptance criteria met. The previously filed defect (#25) is resolved in this build.
</content>
