# Test Plan — CL-1.1.3 Registration Success State (#3)

**Story:** As a receptionist, I want the form to reset and show the new patient immediately after registration, so I have instant confirmation without reloading.
**Executed:** 2026-06-09 against `master` · frontend localhost:4200.

## Test cases & traceability

| ID | Acceptance criterion | Test | Level | Result |
|----|----------------------|------|-------|--------|
| TC-1.1.3-01 | Form clears all fields after a successful save | submit valid → `form.reset()` | Jest | ✅ PASS ("clears the form and flags success") |
| TC-1.1.3-02 | New patient appears at top of the list immediately | service prepends to `patients` signal; `recently-registered` renders it | Jest/UI | ✅ PASS (service test: newest first) |
| TC-1.1.3-03 | No full page reload — list updates via signal | `RecentlyRegisteredComponent` bound to `patients` signal | UI | ✅ PASS |
| TC-1.1.3-04 | Brief success indicator shown after submission | success banner shows, auto-dismisses after 5 s | Jest | ⚠️ BLOCKED — test exists but the suite can't run it (see finding) |

## Finding (blocks automated verification of TC-1.1.3-04)
The unit test "auto-dismisses the success banner after a few seconds (CL-1.1.3)" in
`registration-form.component.spec.ts` is **missing its closing `});`** (~line 120). As a result the
following `it()` blocks nest inside it and Jest aborts the suite with
*"Tests cannot be nested."* The behaviour is implemented (`scheduleDismiss()` + 5000 ms timer), but
the suite cannot confirm it until the spec is fixed. → filed as a bug.

## Observation (not an AC failure, worth noting)
`RecentlyRegisteredComponent` is bound to the session `patients` signal, which **starts empty** — it
does not load the 3 seeded patients from `GET /api/patients` on init. This satisfies CL-1.1.3
(the *newly registered* patient appears), but the full seeded list belongs to CL-1.3.1 (not built),
so the "Recently registered" panel is empty on first page load. Flagging for the PO/CL-1.3.1.

## Verdict
**PASS with caveat** — ACs 01–03 met; AC-04 is implemented but its unit test cannot execute due to the broken spec file.
</content>
