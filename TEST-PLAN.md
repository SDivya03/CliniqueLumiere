# Clinique Lumière — Test Plan

**Repo:** https://github.com/SDivya03/CliniqueLumiere
**Author:** QA (Krithi)
**Date:** 2026-06-09
**Branch under test:** `master`

---

## 1. Purpose & Scope

This plan covers verification of the **Clinique Lumière Clinic Management System** as it
currently exists on `master`. The PRD describes three epics (Patient Intake, Appointments,
Staff Dashboard), but **only a slice of Epic 1 is implemented in code.** This plan tests what
is actually built, and explicitly records the PRD features that cannot yet be tested.

### 1.1 Implemented vs. PRD (scope matrix)

| Story | Feature | Frontend | Backend | Testable now? |
|-------|---------|----------|---------|---------------|
| CL-1.1.1 | Registration form + validation | ✅ `registration-form.component` | ✅ `POST /api/patients` | **Yes** |
| CL-1.1.2 | Duplicate-email detection | ⚠️ UI ready (handles 409) | ❌ API never returns 409 | **Yes — expected to FAIL** (see §4.1) |
| CL-1.1.3 | Success state + list update | ⚠️ success banner only; no list UI | n/a | Partial |
| CL-1.2.x | Medical history capture/edit | ❌ not built | ❌ not built | No |
| CL-1.3.x | Patient list & live search | ❌ no list component | ✅ `GET /api/patients` exists, unused | No (API only) |
| EPIC 2 | Appointments | ❌ | ❌ | No |
| EPIC 3 | Staff Dashboard | ❌ | ❌ | No |

> **Note:** `app.routes.ts` only wires `/patients` → the registration form. There is no patient
> list, no medical-history section, and no appointments/staff routes. `ApiService.getPatients()`
> and `GET /api/patients` exist but are not surfaced in any UI.

### 1.2 In scope for this cycle
- Patient registration: client-side validation, payload normalisation, submit flow.
- Backend `POST /api/patients` and `GET /api/patients` behaviour.
- Duplicate-email handling (end-to-end) — to confirm/deny the defect in §4.1.

### 1.3 Out of scope
- Appointments and Staff Dashboard (not implemented).
- Authentication, mobile responsiveness, email/SMS — out of scope per PRD.

---

## 2. Test Environment

| Item | Value |
|------|-------|
| Frontend | Angular 18, run on http://localhost:4200 (`npm start`) |
| Backend | ASP.NET Core 8 on http://localhost:5050 (`dotnet run`) |
| DB | SQLite `clinique.db`, `EnsureCreated()` + seeded with 3 demo patients |
| Frontend tests | Jest (`npm test`) |
| Backend tests | xUnit (`dotnet test backend/tests/CliniqueLumiere.Api.Tests`) |
| API docs | Swagger UI at http://localhost:5050/swagger |
| Tools | Swagger UI / Postman / curl for API; browser for UI |

### Prerequisites
- Node 20+, npm; .NET SDK 8.0.
- Delete `clinique.db` between runs that depend on a clean seed/duplicate state.

### Test data
- Seeded emails: `sophie.bernard@example.com`, `lucas.moreau@example.com`, `amira.haddad@example.com`.
- Use these for duplicate-email tests.

---

## 3. Test Strategy

Four layers, run in this order. Lower layers gate the higher ones.

1. **Backend unit (xUnit)** — controller/mapping logic against in-memory EF.
2. **Backend API/integration** — real HTTP against a running SQLite-backed API (catches what in-memory EF hides — see §4.2).
3. **Frontend unit (Jest)** — component validation, service signal state, phone validator.
4. **End-to-end / manual UI** — browser flows against the running stack.

Exploratory and regression passes follow (§8, §9).

---

## 4. Defects & Risks Found by Inspection

These were identified by code review and must be confirmed by the test cases below.

### 4.1 🔴 DEFECT — Duplicate email is not detected (CL-1.1.2 acceptance fails)

`PatientsController.Create` adds and saves with **no duplicate-email check and no `try/catch`**:

```csharp
_db.Patients.Add(patient);
await _db.SaveChangesAsync();   // no 409 path
```

`ClinicDbContext` defines a **unique index** on `Email`. So a duplicate insert (against
SQLite) throws `DbUpdateException` → unhandled → **HTTP 500**, not **409**.

The frontend (`PatientService.handleError`) only maps **409** to the inline
"A patient with this email already exists" message; a 500 falls through to the generic
"Could not register the patient. Please try again." banner.

**Impact:** Acceptance criterion CL-1.1.2 ("Registering the same email twice shows the error
without page reload") **cannot pass** as built. Expect TC-API-05 and TC-E2E-03 to fail.

### 4.2 🟠 RISK — In-memory EF hides the unique-constraint behaviour

Existing xUnit tests use `UseInMemoryDatabase`, which **does not enforce unique indexes**.
A duplicate-email unit test against in-memory EF would not reproduce the production failure.
Duplicate-email verification must use a **real SQLite** provider or the running API (§6 TC-API-05).

### 4.3 🟡 RISK — Server-side validation parity unverified
`[ApiController]` auto-returns 400 on invalid `ModelState`, but there are **no tests** asserting
400 for missing required fields / bad email / over-length values at the API. Covered by TC-API-02/03/04.

### 4.4 🟡 RISK — `getPatients()` / `GET /api/patients` is dead code in the UI
The list endpoint works but no component consumes it, so CL-1.1.3 ("new row visible immediately")
and CL-1.3.x are not end-to-end testable. Test the API directly (TC-API-06) and log the UI gap.

---

## 5. Frontend Test Cases

### 5.1 Existing automated coverage (Jest) — verify green
`registration-form.component.spec.ts` already covers: component creation, invalid-when-empty,
no API call when invalid, bad email format, phone valid/invalid + empty allowed, optional
emergency contact, valid submit calls service once, email trim+lowercase, success state clears form.
**Action:** run `npm test`; all must pass. Treat any failure as a regression.

### 5.2 Phone validator (`phone.validator.spec.ts`) — verify green
Confirm existing spec passes. Add cases if missing:

| ID | Input | Expected |
|----|-------|----------|
| TC-FE-PV-01 | `""` (empty) | valid (optional) |
| TC-FE-PV-02 | `+33 6 12 34 56 78` | valid |
| TC-FE-PV-03 | `12` (too few digits) | invalid `{phone:true}` |
| TC-FE-PV-04 | 16 digits | invalid (max 15) |
| TC-FE-PV-05 | `++3312345678` (2 plus) | invalid |
| TC-FE-PV-06 | `33+12345678` (plus not leading) | invalid |
| TC-FE-PV-07 | `(033) 123.45-67` | valid (allowed separators, ≥7 digits) |
| TC-FE-PV-08 | `12a45678` (letter) | invalid |

### 5.3 Registration form — additional cases to add

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| TC-FE-01 | Submit button disabled while submitting | mock `submitting()=true` | button disabled, label "Registering…" |
| TC-FE-02 | Duplicate-email banner clears on edit | set `duplicateEmail()=true`, change email control | `clearErrors()` called, banner hidden |
| TC-FE-03 | Emergency contact omitted when both blank | fill valid, leave EC blank, submit | payload `emergencyContact: null` |
| TC-FE-04 | Emergency contact sent when one field filled | fill EC name only | payload `emergencyContact: {name, phone:''}` |
| TC-FE-05 | DOB formatted yyyy-MM-dd, no TZ drift | pick a date | payload `dateOfBirth` matches local Y-M-D |
| TC-FE-06 | maxLength on first/last name (80) | 81 chars | control invalid (`maxlength`) |
| TC-FE-07 | Generic error banner on non-409 failure | service `submitError` set, `duplicateEmail=false` | error banner shown, form NOT cleared |
| TC-FE-08 | Success banner shows + form resets on success | valid submit, service resolves patient | `registered()=true`, fields empty |

### 5.4 PatientService (signal state) — add a spec (`patient.service.spec.ts`, currently missing)

| ID | Scenario | Expected |
|----|----------|----------|
| TC-FE-SVC-01 | `register` success | adds patient to top of `patients()`, returns patient, `submitting` toggles false |
| TC-FE-SVC-02 | `register` 409 | `duplicateEmail()=true`, `submitError()="A patient with this email already exists"`, returns null |
| TC-FE-SVC-03 | `register` 500/network | `submitError()="Could not register the patient. Please try again."`, `duplicateEmail()=false` |
| TC-FE-SVC-04 | `clearErrors()` | both error signals reset |
| TC-FE-SVC-05 | `patientCount` computed | reflects list length |

---

## 6. Backend Test Cases

### 6.1 Existing xUnit coverage — verify green
`PatientsControllerTests`: persists + 201, lowercases email + trims names, null EC, EC round-trip,
GetAll ordering. **Action:** `dotnet test`; all must pass.

### 6.2 API / integration cases (run against the running API or SQLite-backed context)

| ID | Story | Request | Expected |
|----|-------|---------|----------|
| TC-API-01 | 1.1.1 | `POST` valid patient | 201 + body with `id>0`, `createdAt`, lowercased email |
| TC-API-02 | 1.1.1 | `POST` missing firstName | 400, validation error |
| TC-API-03 | 1.1.1 | `POST` malformed email `user@` | 400 (`[EmailAddress]`) |
| TC-API-04 | 1.1.1 | `POST` firstName 81 chars | 400 (`StringLength(80)`) |
| **TC-API-05** | **1.1.2** | `POST` an already-seeded email (e.g. `sophie.bernard@example.com`) | **Expected per PRD: 409.** **Actual (predicted): 500** — see §4.1. **Log as defect.** |
| TC-API-06 | 1.3.1 | `GET /api/patients` on fresh DB | 200, 3 seeded patients, ordered by last name then first name |
| TC-API-07 | 1.1.1 | `POST` with emergency contact | 201, response nests `emergencyContact` |
| TC-API-08 | edge | `POST` mixed-case duplicate (`SOPHIE.BERNARD@...`) | mapping lowercases → collides with seed → confirm same behaviour as TC-API-05 |
| TC-API-09 | docs | Open `/swagger` | both endpoints documented with response codes |

### 6.3 Backend gap to add (after defect fix)
- Add an xUnit test for the duplicate path using **SQLite** (not in-memory) asserting **409**.
  This both fixes §4.2 and locks in the CL-1.1.2 fix.

---

## 7. End-to-End / Manual UI Cases

Run with backend + frontend both up; start from a clean seeded DB.

| ID | Story | Steps | Expected |
|----|-------|-------|----------|
| TC-E2E-01 | 1.1.1 | Open `/patients`, submit empty form | Inline "X is required" under First name, Last name, Email; no network call |
| TC-E2E-02 | 1.1.1 | Fill valid details, Register | Green "Patient registered successfully" banner; form clears |
| **TC-E2E-03** | **1.1.2** | Register with a seeded email | **PRD expects** inline "A patient with this email already exists". **Predicted actual:** generic red error banner (500). **Log defect.** |
| TC-E2E-04 | 1.1.2 | After dup error, edit email | Duplicate banner disappears on first keystroke |
| TC-E2E-05 | 1.1.1 | Enter invalid phone `12` | Inline "Enter a valid phone number"; submit blocked |
| TC-E2E-06 | 1.1.1 | Leave phone empty, submit | Accepted (phone optional) |
| TC-E2E-07 | 1.1.1 | Pick DOB in future | Datepicker blocks dates after today (`[max]="maxDob"`) |
| TC-E2E-08 | perf | Time a full valid intake | < 2 min (PRD success metric) |
| TC-E2E-09 | 1.1.3 | After register, look for patient list | **GAP:** no list UI exists — log as not-implemented |

---

## 8. Exploratory Charters
- Whitespace-only required fields (e.g. first name = `"   "`) — does client/server trim reject it?
- Unicode names (accents, non-Latin) round-trip correctly.
- Very long valid email near 200 chars.
- Rapid double-click "Register" → no duplicate POST (button disabled while `submitting`).
- CORS: confirm only `localhost:4200` is allowed (check `Program.cs`).

## 9. Regression Set
On any change to patient intake: re-run `npm test` + `dotnet test`, plus TC-E2E-01/02/03/05.

---

## 10. Entry / Exit Criteria

**Entry:** code builds; `npm install` + `dotnet restore` succeed; both apps start; Swagger loads.

**Exit (for the implemented slice):**
- [ ] All existing Jest + xUnit tests pass.
- [ ] New cases in §5–§6 authored and passing (except the known defect).
- [ ] §4.1 duplicate-email defect logged with repro (TC-API-05 / TC-E2E-03).
- [ ] PRD-vs-build gaps (§1.1) reported to PO so backlog reflects reality.
- [ ] No `console.log` / lint errors (per CLAUDE.md DoD).

---

## 11. Traceability Summary

| Acceptance criterion | Covering tests | Status (predicted) |
|----------------------|----------------|--------------------|
| CL-1.1.1 cannot submit with missing required fields | TC-FE-01..08, TC-API-02, TC-E2E-01 | ✅ should pass |
| CL-1.1.1 email/phone format validation | TC-FE-PV-*, TC-API-03, TC-E2E-05 | ✅ should pass |
| CL-1.1.2 duplicate email inline error, no reload | TC-API-05, TC-E2E-03/04 | 🔴 expected FAIL (§4.1) |
| CL-1.1.3 new row visible immediately | TC-E2E-09 | ⚠️ N/A — list UI not built |
| CL-1.3.1 list ordered, 3 seeded | TC-API-06 | ✅ API only |
</content>
</invoke>
