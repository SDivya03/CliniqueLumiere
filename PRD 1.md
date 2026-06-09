# Clinique Lumière — Project Requirements Document (PRD)

## Overview

**Product:** Clinique Lumière Clinic Management System  
**Vision:** Replace spreadsheet-based back-office operations with a web application that manages patients, appointments, and staff schedules for a private wellness clinic.  
**Stack:** Angular 17+ (standalone components + signals, Angular Material) · ASP.NET Core 8 (C#) REST API · SQLite via Entity Framework Core  
**Scope:** 3 features — Patient Intake, Appointments, Staff Dashboard

---

## Goals & Success Criteria

| Goal | Success Metric |
|---|---|
| Eliminate double-bookings | Conflict detection blocks overlapping appointments for same practitioner |
| Fast patient registration | Full intake form submitted in < 2 minutes |
| Staff visibility | Dashboard shows each practitioner's full daily schedule at a glance |

---

## Out of Scope (for this sprint)

- Treatments catalog, Wellness Programs, Billing
- Authentication / access control
- Email/SMS reminders
- Mobile responsiveness (desktop-first)

---

# Epics, Features & Stories

---

## EPIC 1 — Patient Intake

> Registration, medical history capture, and search/validation for clinic patients.

### Feature 1.1 — Patient Registration

**As a** receptionist,  
**I want** to register a new patient with personal details,  
**so that** the clinic has a complete record before their first appointment.

#### Story 1.1.1 — Registration Form
- Fields: First name*, Last name*, Email*, Phone, Date of birth, Gender
- Emergency contact: name + phone
- Client-side validation: required fields, email format, phone format
- **Acceptance:** Form cannot submit with missing required fields; duplicate email shows inline error

#### Story 1.1.2 — Duplicate Email Detection
- API rejects registration if email already exists
- Frontend shows "A patient with this email already exists" inline (not a toast)
- **Acceptance:** Registering the same email twice shows the error without page reload

#### Story 1.1.3 — Registration Success State
- After successful save, form clears and patient appears at top of the patient list
- **Acceptance:** No page reload required; new row visible immediately via signal update

---

### Feature 1.2 — Medical History

**As a** practitioner,  
**I want** to record a patient's medical history during intake,  
**so that** I can plan safe and effective treatments.

#### Story 1.2.1 — Medical History Fields
- Fields: Allergies (text), Current medications (text), Medical conditions (text), Notes (free text)
- Appears on the same intake form below personal details (collapsible section)
- **Acceptance:** All fields are optional; section can be collapsed/expanded

#### Story 1.2.2 — View / Edit Patient Record
- Patient list row click opens a detail panel
- All fields editable inline with a Save button
- **Acceptance:** Changes persist after page reload

---

### Feature 1.3 — Patient Search & List

**As a** receptionist,  
**I want** to search for patients by name or email,  
**so that** I can quickly find a patient before booking an appointment.

#### Story 1.3.1 — Patient List
- Paginated table: full name, email, phone, date of birth
- Default sort: last name ascending
- **Acceptance:** 3 seeded demo patients visible on first load

#### Story 1.3.2 — Live Search
- Search input filters list client-side for immediate feedback, debounced API call for persistence
- **Acceptance:** Typing 2+ characters filters results within 300 ms

---

## EPIC 2 — Appointments

> Scheduling, time slot management, and conflict detection.

### Feature 2.1 — Appointment Booking

**As a** receptionist,  
**I want** to book an appointment for a patient with a specific practitioner,  
**so that** the patient is confirmed in the schedule.

#### Story 2.1.1 — Booking Form
- Fields: Patient (autocomplete search), Practitioner (dropdown), Service (dropdown), Date (date picker), Start time, End time
- End time auto-calculated from service duration when service is selected
- **Acceptance:** All fields required; form disabled until patient is selected

#### Story 2.1.2 — Conflict Detection
- On submit, API returns 409 if practitioner already has an overlapping appointment
- Frontend shows "Time slot conflict: [practitioner] is already booked from [X] to [Y]"
- **Acceptance:** Conflict message shown inline; form stays open for correction

#### Story 2.1.3 — Appointment Confirmation
- Saved appointment appears in the appointment list without page reload
- **Acceptance:** List updates via signal; success banner shown for 3 seconds

---

### Feature 2.2 — Appointment List & Filters

**As a** receptionist,  
**I want** to view all appointments and filter by date or practitioner,  
**so that** I can manage the daily schedule.

#### Story 2.2.1 — Appointment List
- Columns: Date, Time, Patient, Practitioner, Service, Status
- Colour-coded status badges: scheduled (blue), confirmed (green), completed (grey), cancelled (red)
- **Acceptance:** Seeded demo appointments visible on first load

#### Story 2.2.2 — Date Filter
- Date picker defaults to today; changing date reloads the list for that date
- **Acceptance:** Filter updates list within 500 ms

#### Story 2.2.3 — Cancel Appointment
- Each row has a "Cancel" action; status changes to `cancelled`
- **Acceptance:** Row badge updates immediately; no page reload

---

## EPIC 3 — Staff Dashboard

> Daily schedule and alert view for clinic practitioners.

### Feature 3.1 — Daily Schedule View

**As a** practitioner,  
**I want** to see all of my appointments for the day,  
**so that** I can prepare for each session.

#### Story 3.1.1 — Per-Practitioner Schedule Cards
- One card per active practitioner showing today's appointments in time order
- Each appointment shows: time range, patient name, service, status
- **Acceptance:** Cards update when date picker changes

#### Story 3.1.2 — Date Navigation
- Date picker defaults to today; changing date reloads all cards
- **Acceptance:** Navigating to tomorrow shows seeded appointments if any exist

#### Story 3.1.3 — Daily Stats
- Each card shows: total appointments, scheduled/confirmed count, completed count
- **Acceptance:** Stats match the appointment rows shown in the card

---

### Feature 3.2 — Alerts

**As a** clinic manager,  
**I want** to see alerts for upcoming appointments (within 30 minutes) on the dashboard,  
**so that** practitioners are warned before a patient arrives.

#### Story 3.2.1 — Upcoming Appointment Alerts
- Yellow alert banner per practitioner card when today is selected and an appointment starts within 30 minutes
- Alert text: "Upcoming: [Patient] at [time]"
- **Acceptance:** Alert only shows for today; hidden for past/future dates

#### Story 3.2.2 — Alert Dismissal
- Alerts can be dismissed per-card; dismissed state lives in component memory (not persisted)
- **Acceptance:** Dismissing one alert does not dismiss others

---

# Technical Architecture

## Backend (ASP.NET Core 8 + EF Core + SQLite)

- **ORM:** Entity Framework Core with the SQLite provider
- Schema: `patients`, `staff`, `services`, `appointments` entities (seeded with demo data)
- REST API on port 5050; CORS allowed for `localhost:4200`
- **Docs:** Swagger / OpenAPI — every endpoint documented (Swagger UI in development)
- **Tests:** xUnit
- Persistence: SQLite DB file (`clinique.db`) created via `EnsureCreated()` on startup

## Frontend (Angular 17+)

- Standalone components throughout (no NgModules); Angular Material
- Signals for reactive local state (`signal()`, `computed()`, `effect()`)
- `HttpClient` via `provideHttpClient()` in `app.config.ts`
- SCSS with CSS custom properties for the clinic theme (dark navy + gold)
- **Tests:** Jest
- Lazy-loaded routes: `/patients`, `/appointments`, `/staff`

## Folder Structure

```
CliniqueLumiere/
├── backend/
│   ├── src/CliniqueLumiere.Api/
│   │   ├── Controllers/         ← PatientsController, AppointmentsController, ...
│   │   ├── Data/                ← ClinicDbContext (EF Core), DbSeeder
│   │   ├── Models/              ← EF Core entities
│   │   ├── Dtos/                ← request/response DTOs
│   │   ├── Mapping/             ← entity ⇄ DTO mappers
│   │   └── Program.cs           ← host, DI, CORS, Swagger
│   └── tests/CliniqueLumiere.Api.Tests/   ← xUnit tests
└── src/
    └── app/
        ├── core/
        │   ├── models/          ← Patient, Appointment, Staff, Service interfaces
        │   └── services/        ← ApiService (HttpClient wrapper)
        ├── features/
        │   ├── patient-intake/  ← Epic 1
        │   ├── appointments/    ← Epic 2
        │   └── staff-dashboard/ ← Epic 3
        └── shared/              ← NavComponent, status-badge, etc.
```

---

# Verification Checklist

- [ ] `cd backend/src/CliniqueLumiere.Api && dotnet run` → Swagger UI loads at `http://localhost:5050/swagger`
- [ ] `ng serve` → app loads at `http://localhost:4200`
- [ ] Patient Intake: register a new patient → appears in list → edit medical history → saves
- [ ] Appointments: book appointment → conflict detection blocks double-booking → cancel appointment
- [ ] Staff Dashboard: today's cards show seeded appointments → alert visible for session starting soon

