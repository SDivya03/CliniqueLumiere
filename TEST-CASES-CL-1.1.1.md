# Test Cases — CL-1.1.1 Patient Registration Form

**Story:** As a receptionist, I want to register a new patient with personal details, so the
clinic has a complete record before their first appointment.
**Acceptance:** Form cannot submit with missing required fields; duplicate email shows inline error.
**Under test:** `registration-form.component` (`/patients`) + `POST /api/patients`.

---

## A. How to open the feature and test it

### Option 1 — Run the full app (manual / E2E testing)

You need **two terminals**: one for the API, one for the Angular app.

**Terminal 1 — backend (API on http://localhost:5050):**
```powershell
cd c:\CliniqueLumiere-master\CliniqueLumiere\backend\src\CliniqueLumiere.Api
dotnet restore
dotnet run
```
- Swagger UI opens at http://localhost:5050/swagger
- On first run, `clinique.db` (SQLite) is created and seeded with 3 demo patients.
- To reset to a clean state, stop the API and delete `clinique.db`, then `dotnet run` again.

**Terminal 2 — frontend (app on http://localhost:4200):**
```powershell
cd c:\CliniqueLumiere-master\CliniqueLumiere
npm install
npm start
```
- Open **http://localhost:4200** → it redirects to **`/patients`** → the registration form.

> The form calls the API at `http://localhost:5050/api`. **Start the backend first**, or
> submissions will fail with the generic error banner.

### Option 2 — Run the automated tests (no UI needed)
```powershell
# Frontend unit tests (Jest)
cd c:\CliniqueLumiere-master\CliniqueLumiere
npm test

# Backend unit tests (xUnit)
dotnet test c:\CliniqueLumiere-master\CliniqueLumiere\backend\tests\CliniqueLumiere.Api.Tests
```

### Option 3 — Test the API directly (Swagger / curl)
With the backend running, open http://localhost:5050/swagger and use **POST /api/patients**, or:
```powershell
curl -X POST http://localhost:5050/api/patients `
  -H "Content-Type: application/json" `
  -d '{"firstName":"Marie","lastName":"Dubois","email":"marie@example.com","phone":"+33 6 11 22 33 44","dateOfBirth":"1990-02-20","gender":"Female","emergencyContact":null}'
```

### How to track this as a GitHub issue
If "open this issue" means logging it for QA on GitHub:
1. Go to the repo → **Issues → New issue**, title `[CL-1.1.1] Registration Form — QA`.
2. Paste the acceptance criteria and link this file.
3. Create a checklist from the **Test ID** column below; tick each as you execute.
4. (Optional, with `gh` CLI):
   ```powershell
   gh issue create --repo SDivya03/CliniqueLumiere --title "[CL-1.1.1] Registration Form — QA" --body-file TEST-CASES-CL-1.1.1.md
   ```

---

## B. Test data

| Label | Value |
|-------|-------|
| Valid patient | First `Marie`, Last `Dubois`, Email `marie.dubois@example.com` |
| Seeded (duplicate) emails | `sophie.bernard@example.com`, `lucas.moreau@example.com`, `amira.haddad@example.com` |
| Valid phone | `+33 6 12 34 56 78` |
| Invalid phone | `12` (too few digits) |
| Genders | Female, Male, Other, Prefer not to say |

---

## C. Test cases — complete coverage

Legend: **P** = positive, **N** = negative, **B** = boundary, **UI** = presentation/UX.
"Layer": M = manual/E2E, J = Jest unit, X = xUnit/API.

### C.1 Required-field validation (Acceptance: cannot submit with missing required fields)

| ID | Type | Layer | Steps | Expected result |
|----|------|-------|-------|-----------------|
| TC-01 | N | M/J | Submit with all fields empty | Form blocked; inline errors "First name is required", "Last name is required", "Email is required"; **no** API call; all fields marked touched |
| TC-02 | N | M | Fill Last + Email, leave First empty, submit | Blocked; only "First name is required" shown |
| TC-03 | N | M | Fill First + Email, leave Last empty, submit | Blocked; only "Last name is required" shown |
| TC-04 | N | M | Fill First + Last, leave Email empty, submit | Blocked; only "Email is required" shown |
| TC-05 | N | B | Set First name to whitespace `"   "`, fill rest, submit | Blocked (required treats spaces-only as empty) **— verify behaviour; log if it submits** |
| TC-06 | P | M/J | Fill First, Last, Email only (no optional fields) | Form **valid**; submits successfully |

### C.2 Email format validation

| ID | Type | Layer | Steps | Expected result |
|----|------|-------|-------|-----------------|
| TC-07 | N | M/J | Email = `user@` | Inline "Enter a valid email address"; submit blocked |
| TC-08 | N | M | Email = `user.example.com` (no @) | Inline email error |
| TC-09 | N | M | Email = `@example.com` | Inline email error |
| TC-10 | P | M | Email = `a.b+tag@sub.example.co` | Accepted |
| TC-11 | P/B | X | API: 200-char email at limit | 201 created; over 200 → 400 (`StringLength(200)`) |

### C.3 Phone format validation (optional field)

| ID | Type | Layer | Steps | Expected result |
|----|------|-------|-------|-----------------|
| TC-12 | P | M/J | Phone empty | Valid (optional) |
| TC-13 | P | M | Phone `+33 6 12 34 56 78` | Valid |
| TC-14 | P | M | Phone `(033) 123.45-67` | Valid (allowed separators, ≥7 digits) |
| TC-15 | N | M/J | Phone `12` | Inline "Enter a valid phone number" (min 7 digits) |
| TC-16 | N | B | Phone with 16 digits | Invalid (max 15) |
| TC-17 | N | M | Phone `++3312345678` (two `+`) | Invalid |
| TC-18 | N | M | Phone `33+12345678` (`+` not leading) | Invalid |
| TC-19 | N | M | Phone `12a45678` (letter) | Invalid |
| TC-20 | P/B | B | Phone with exactly 7 digits / exactly 15 digits | Both valid |

### C.4 Optional fields — DOB, Gender, Emergency contact

| ID | Type | Layer | Steps | Expected result |
|----|------|-------|-------|-----------------|
| TC-21 | P | M | Pick a past DOB | Accepted; sent as `yyyy-MM-dd` |
| TC-22 | N | M | Try to pick a future DOB | Datepicker blocks dates after today (`[max]="maxDob"`) |
| TC-23 | B | J | DOB near month boundary (e.g. 1st/31st) | Payload date = local Y-M-D, no timezone drift |
| TC-24 | P | M | Select each Gender option | Selected value sent in payload |
| TC-25 | P | M/J | Leave both emergency-contact fields blank | Payload `emergencyContact: null` |
| TC-26 | P | M/J | Fill EC name only | Payload `emergencyContact` present with that name |
| TC-27 | N | M | EC phone = `12` (invalid) | Inline "Enter a valid phone number" on EC phone |
| TC-28 | P | X | API: submit with full EC | 201; response nests `emergencyContact {name, phone}` |

### C.5 Payload normalisation

| ID | Type | Layer | Steps | Expected result |
|----|------|-------|-------|-----------------|
| TC-29 | P | J | First = `"  Marie  "`, Email = `Marie@Example.com`, submit | Payload `firstName:"Marie"`, `email:"marie@example.com"` (trimmed + lowercased) |
| TC-30 | P | X | API: names with surrounding spaces, mixed-case email | Persisted trimmed; email stored lower-cased |
| TC-31 | P | M | Phone with leading/trailing spaces | Trimmed before send; empty-after-trim → `null` |

### C.6 Submit flow & success state

| ID | Type | Layer | Steps | Expected result |
|----|------|-------|-------|-----------------|
| TC-32 | P | M/X | Submit valid form, backend up | 201 from API; green banner "Patient registered successfully" |
| TC-33 | P | J | On success | `registered()` true; form fields reset to empty |
| TC-34 | UI | M | During request | Button disabled, label shows "Registering…" |
| TC-35 | N | M | Double-click Register quickly | Only one POST (button disabled while `submitting`) |
| TC-36 | N | M | Submit with backend stopped | Red banner "Could not register the patient. Please try again."; form **not** cleared |

### C.7 Duplicate email (Acceptance: duplicate email shows inline error)

> ⚠️ **Known defect (see TEST-PLAN.md §4.1):** the API does **not** return 409 for a duplicate;
> the unique index throws → 500. So the PRD's inline message is **not** shown today.
> Record actual vs expected.

| ID | Type | Layer | Steps | Expected (PRD) | Predicted actual |
|----|------|-------|-------|----------------|------------------|
| TC-37 | N | M | Register `sophie.bernard@example.com` (seeded) | Inline "A patient with this email already exists", no reload | Generic red error banner (500) — **FAIL/defect** |
| TC-38 | N | X | API POST seeded email | 409 Conflict | 500 Internal Server Error — **defect** |
| TC-39 | N | M | After the duplicate error, edit the email field | Duplicate banner clears on first keystroke | (Only relevant once 409 path works) |
| TC-40 | N | X | API POST `SOPHIE.BERNARD@...` (mixed case) | 409 (mapping lowercases → collision) | 500 — same defect |

### C.8 Server-side validation parity (API)

| ID | Type | Layer | Steps | Expected result |
|----|------|-------|-------|-----------------|
| TC-41 | N | X | POST missing `firstName` | 400 validation error |
| TC-42 | N | X | POST bad email `user@` | 400 (`[EmailAddress]`) |
| TC-43 | N | B | POST `firstName` 81 chars | 400 (`StringLength(80)`) |
| TC-44 | P | X | GET `/api/patients` after a create | New patient present; list ordered by last name then first |

### C.9 UI / accessibility / non-functional

| ID | Type | Layer | Steps | Expected result |
|----|------|-------|-------|-----------------|
| TC-45 | UI | M | Inspect required fields | First/Last/Email marked `required`; labels visible |
| TC-46 | UI | M | Error containers | Errors render inline beneath each field (not toasts); banner has `role="alert"`/`role="status"` |
| TC-47 | UI | M | Keyboard only | Tab order reaches all fields and the Register button; Enter submits |
| TC-48 | NFR | M | Time a full valid intake (TC-06 data) | Completed in < 2 minutes (PRD success metric) |
| TC-49 | UI | M | No console errors | Browser console clean during the flow (CLAUDE.md: no `console.log`) |

---

## D. Coverage map vs. acceptance criteria

| Acceptance criterion | Covered by |
|----------------------|-----------|
| Fields present (name, email, phone, DOB, gender, EC) | TC-06, TC-21..28, TC-45 |
| Required-field validation | TC-01..06, TC-41 |
| Email format validation | TC-07..11, TC-42 |
| Phone format validation | TC-12..20, TC-27 |
| Cannot submit with missing required fields | TC-01..05, TC-34..36 |
| Duplicate email shows inline error | TC-37..40 (⚠️ expected FAIL — defect logged) |

---

## E. Suggested execution order
1. Automated first: `npm test` + `dotnet test` (baseline green).
2. API cases via Swagger: TC-11, TC-28, TC-38, TC-40..44.
3. Manual UI: TC-01..10, TC-12..27, TC-32..37, TC-45..49.
4. Log TC-37/TC-38 as a defect against CL-1.1.2 if they fail as predicted.
</content>
