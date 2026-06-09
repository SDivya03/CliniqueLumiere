# Test Plan — CL-1.2.1 Medical History Fields (#4)

**Story:** As a practitioner, I want to record a patient's medical history during intake, so I can plan safe and effective treatments.
**Executed:** 2026-06-09 against `master` · frontend localhost:4200 · API localhost:5050 (live).

## Test cases & traceability

| ID | Acceptance criterion | Test | Level | Result |
|----|----------------------|------|-------|--------|
| TC-1.2.1-01 | Medical history section appears below personal details on the intake form | `mat-expansion-panel` with Allergies/Medications/Conditions/Notes | UI | ✅ PASS (template + form controls present) |
| TC-1.2.1-02 | Section is collapsible/expandable via a toggle | `MatExpansionModule` panel header toggles | UI | ✅ PASS |
| TC-1.2.1-03 | All four fields optional | valid form with empty medical history submits | Jest + API | ✅ PASS (API 201 with `medicalHistory:null`) |
| TC-1.2.1-04 | Collapsing the section does not clear entered values | reactive-form controls independent of panel state | Jest/UI | ⚠️ BLOCKED — test exists ("keeps entered medical history when the section is collapsed") but suite can't run (nested-test error) |
| TC-1.2.1-05 | Medical history round-trips through the API | `POST` w/ medicalHistory → persisted + returned | API | ✅ PASS |

## Live evidence
```
POST patient with medicalHistory {allergies:'Penicillin', medications:'None', conditions:'Asthma', notes:'Test note'}
  -> 201; response.medicalHistory present: True; allergies = 'Penicillin'
```

## Finding
TC-1.2.1-04's unit test cannot execute — same broken-spec merge artifact as CL-1.1.3
(`registration-form.component.spec.ts` nested-test error). Behaviour is implemented; verification blocked. → filed as a bug.

## Verdict
**PASS with caveat** — fields work and round-trip through the API; one collapse-persistence unit test is blocked by the broken spec file.
</content>
