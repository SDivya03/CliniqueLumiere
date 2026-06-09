# Clinique Lumière — Ticket Index

> All tickets are tracked in GitHub: https://github.com/SDivya03/CliniqueLumiere/issues
> Epics are GitHub Milestones. Each ticket below links to its GitHub issue.

---

## EPIC 1 — Patient Intake
**Milestone:** [EPIC 1 — Patient Intake](https://github.com/SDivya03/CliniqueLumiere/milestone/1)
> Registration, medical history capture, and search/validation for clinic patients.

---

### Feature 1.1 — Patient Registration

| Ticket | Title | GitHub Issue |
|--------|-------|-------------|
| CL-1.1.1 | Registration Form | [#1](https://github.com/SDivya03/CliniqueLumiere/issues/1) |
| CL-1.1.2 | Duplicate Email Detection | [#2](https://github.com/SDivya03/CliniqueLumiere/issues/2) |
| CL-1.1.3 | Registration Success State | [#3](https://github.com/SDivya03/CliniqueLumiere/issues/3) |

#### CL-1.1.1 — Registration Form [#1](https://github.com/SDivya03/CliniqueLumiere/issues/1)

**User Story**
As a receptionist, I want to fill in a patient registration form, so that the clinic has a complete record before the patient's first appointment.

**Acceptance Criteria**
- [ ] Form cannot be submitted when any required field (First name, Last name, Email) is empty
- [ ] Email field validates correct format (rejects `user@` or plaintext)
- [ ] Phone field validates format when provided
- [ ] Submitting with missing required fields shows inline validation errors (not a toast)
- [ ] Emergency contact fields are optional and do not block submission

---

#### CL-1.1.2 — Duplicate Email Detection [#2](https://github.com/SDivya03/CliniqueLumiere/issues/2)

**User Story**
As a receptionist, I want to be warned immediately when I register an email that already exists, so that I avoid creating duplicate patient records.

**Acceptance Criteria**
- [ ] API returns HTTP 409 when a registration request contains an already-registered email
- [ ] Frontend displays inline message: *"A patient with this email already exists"* beneath the email field
- [ ] Error appears without a page reload
- [ ] Error message is inline — not a toast or modal

---

#### CL-1.1.3 — Registration Success State [#3](https://github.com/SDivya03/CliniqueLumiere/issues/3)

**User Story**
As a receptionist, I want the form to reset and show the new patient immediately after registration, so that I have instant confirmation without reloading.

**Acceptance Criteria**
- [ ] After successful save, the registration form clears all fields
- [ ] The newly registered patient appears at the top of the patient list immediately
- [ ] No full page reload — list updates via Angular signal
- [ ] A brief success indicator is shown after submission

---

### Feature 1.2 — Medical History

| Ticket | Title | GitHub Issue |
|--------|-------|-------------|
| CL-1.2.1 | Medical History Fields | [#4](https://github.com/SDivya03/CliniqueLumiere/issues/4) |
| CL-1.2.2 | View / Edit Patient Record | [#5](https://github.com/SDivya03/CliniqueLumiere/issues/5) |

#### CL-1.2.1 — Medical History Fields [#4](https://github.com/SDivya03/CliniqueLumiere/issues/4)

**User Story**
As a practitioner, I want to record a patient's medical history during intake, so that I can plan safe and effective treatments.

**Acceptance Criteria**
- [ ] Medical history section appears on the same intake form below personal details
- [ ] Section is collapsible/expandable via a toggle
- [ ] All four fields (Allergies, Medications, Conditions, Notes) are optional
- [ ] Collapsing the section does not clear entered values

---

#### CL-1.2.2 — View / Edit Patient Record [#5](https://github.com/SDivya03/CliniqueLumiere/issues/5)

**User Story**
As a receptionist, I want to click a patient row and edit all their details inline, so that I can keep patient records up to date without navigating away.

**Acceptance Criteria**
- [ ] Clicking a patient row opens a detail/edit panel
- [ ] All personal and medical history fields are editable in the panel
- [ ] A Save button commits changes via `PUT /api/patients/:id`
- [ ] After save, changes persist on page reload
- [ ] Unsaved changes prompt a discard warning if the user navigates away

---

### Feature 1.3 — Patient Search & List

| Ticket | Title | GitHub Issue |
|--------|-------|-------------|
| CL-1.3.1 | Patient List | [#6](https://github.com/SDivya03/CliniqueLumiere/issues/6) |
| CL-1.3.2 | Live Search | [#7](https://github.com/SDivya03/CliniqueLumiere/issues/7) |

#### CL-1.3.1 — Patient List [#6](https://github.com/SDivya03/CliniqueLumiere/issues/6)

**User Story**
As a receptionist, I want to see a paginated table of all registered patients, so that I can browse and select the right patient quickly.

**Acceptance Criteria**
- [ ] Table displays: Full Name, Email, Phone, Date of Birth
- [ ] List sorted by last name ascending by default
- [ ] 3 seeded demo patients visible on first load
- [ ] Table is paginated (page size: 10)

---

#### CL-1.3.2 — Live Search [#7](https://github.com/SDivya03/CliniqueLumiere/issues/7)

**User Story**
As a receptionist, I want to search patients by name or email with instant results, so that I can find a patient before booking without waiting.

**Acceptance Criteria**
- [ ] Search input displayed above the patient table
- [ ] Typing 2+ characters filters the list within 300 ms
- [ ] Search matches against full name and email (case-insensitive)
- [ ] Clearing the input restores the full list
- [ ] Debounced API call (300 ms) made in addition to client-side filter

---

## EPIC 2 — Appointments
**Milestone:** [EPIC 2 — Appointments](https://github.com/SDivya03/CliniqueLumiere/milestone/2)
> Scheduling, time slot management, and conflict detection.

---

### Feature 2.1 — Appointment Booking

| Ticket | Title | GitHub Issue |
|--------|-------|-------------|
| CL-2.1.1 | Booking Form | [#8](https://github.com/SDivya03/CliniqueLumiere/issues/8) |
| CL-2.1.2 | Conflict Detection | [#9](https://github.com/SDivya03/CliniqueLumiere/issues/9) |
| CL-2.1.3 | Appointment Confirmation | [#10](https://github.com/SDivya03/CliniqueLumiere/issues/10) |

#### CL-2.1.1 — Booking Form [#8](https://github.com/SDivya03/CliniqueLumiere/issues/8)

**User Story**
As a receptionist, I want to book an appointment for a patient with a specific practitioner and service, so that the patient is confirmed in the schedule.

**Acceptance Criteria**
- [ ] All fields required; form cannot submit when any is empty
- [ ] Patient field uses autocomplete search
- [ ] Selecting a service auto-calculates end time from service duration
- [ ] Form is disabled until a patient is selected
- [ ] Date picker does not allow past dates

---

#### CL-2.1.2 — Conflict Detection [#9](https://github.com/SDivya03/CliniqueLumiere/issues/9)

**User Story**
As a receptionist, I want to be blocked from double-booking a practitioner, so that the schedule never has overlapping appointments.

**Acceptance Criteria**
- [ ] API returns HTTP 409 when practitioner has an overlapping appointment
- [ ] Frontend shows inline error: *"Time slot conflict: [Practitioner] is already booked from [X] to [Y]"*
- [ ] Error is inline — not a toast or modal
- [ ] Booking form stays open so the receptionist can correct the time
- [ ] Booking the same practitioner at a non-overlapping time succeeds

---

#### CL-2.1.3 — Appointment Confirmation [#10](https://github.com/SDivya03/CliniqueLumiere/issues/10)

**User Story**
As a receptionist, I want to see the newly booked appointment in the list immediately, so that I have instant confirmation without reloading.

**Acceptance Criteria**
- [ ] New appointment appears in the list without a page reload
- [ ] List updates via Angular signal
- [ ] Success banner shown for 3 seconds, then auto-hides
- [ ] Booking form resets to empty state after success

---

### Feature 2.2 — Appointment List & Filters

| Ticket | Title | GitHub Issue |
|--------|-------|-------------|
| CL-2.2.1 | Appointment List | [#11](https://github.com/SDivya03/CliniqueLumiere/issues/11) |
| CL-2.2.2 | Date Filter | [#12](https://github.com/SDivya03/CliniqueLumiere/issues/12) |
| CL-2.2.3 | Cancel Appointment | [#13](https://github.com/SDivya03/CliniqueLumiere/issues/13) |

#### CL-2.2.1 — Appointment List [#11](https://github.com/SDivya03/CliniqueLumiere/issues/11)

**User Story**
As a receptionist, I want to view all appointments in a table with colour-coded statuses, so that I can manage the daily schedule at a glance.

**Acceptance Criteria**
- [ ] Table renders: Date, Time, Patient, Practitioner, Service, Status
- [ ] Colour-coded status badges: Scheduled (blue), Confirmed (green), Completed (grey), Cancelled (red)
- [ ] 3 seeded demo appointments visible on first load
- [ ] Table sorted by Date ascending by default

---

#### CL-2.2.2 — Date Filter [#12](https://github.com/SDivya03/CliniqueLumiere/issues/12)

**User Story**
As a receptionist, I want to filter the appointment list by date, so that I only see appointments relevant to a chosen day.

**Acceptance Criteria**
- [ ] Date picker defaults to today on page load
- [ ] Changing the date filters the list to that date only
- [ ] Filtered list updates within 500 ms
- [ ] Date with no appointments shows empty-state message

---

#### CL-2.2.3 — Cancel Appointment [#13](https://github.com/SDivya03/CliniqueLumiere/issues/13)

**User Story**
As a receptionist, I want to cancel an appointment from the list, so that the time slot is freed up for another booking.

**Acceptance Criteria**
- [ ] Each row has a "Cancel" action button
- [ ] Clicking Cancel shows a confirmation dialog before committing
- [ ] Status updates to `cancelled` (red badge) immediately — no page reload
- [ ] Cancelled appointments remain visible in the list (not deleted)

---

## EPIC 3 — Staff Dashboard
**Milestone:** [EPIC 3 — Staff Dashboard](https://github.com/SDivya03/CliniqueLumiere/milestone/3)
> Daily schedule and alert view for clinic practitioners.

---

### Feature 3.1 — Daily Schedule View

| Ticket | Title | GitHub Issue |
|--------|-------|-------------|
| CL-3.1.1 | Per-Practitioner Schedule Cards | [#14](https://github.com/SDivya03/CliniqueLumiere/issues/14) |
| CL-3.1.2 | Date Navigation | [#15](https://github.com/SDivya03/CliniqueLumiere/issues/15) |
| CL-3.1.3 | Daily Stats | [#16](https://github.com/SDivya03/CliniqueLumiere/issues/16) |

#### CL-3.1.1 — Per-Practitioner Schedule Cards [#14](https://github.com/SDivya03/CliniqueLumiere/issues/14)

**User Story**
As a practitioner, I want to see all of my appointments for the day on a dedicated card, so that I can prepare for each session.

**Acceptance Criteria**
- [ ] One card per active practitioner
- [ ] Appointments within each card displayed in ascending time order
- [ ] Each appointment shows: time range, patient name, service, status badge
- [ ] Cards reload when the date picker changes
- [ ] Practitioners with no appointments show their card with an empty-state message

---

#### CL-3.1.2 — Date Navigation [#15](https://github.com/SDivya03/CliniqueLumiere/issues/15)

**User Story**
As a practitioner, I want to navigate between dates on the dashboard, so that I can check tomorrow's schedule or review past days.

**Acceptance Criteria**
- [ ] Date picker defaults to today on page load
- [ ] Changing the date reloads all practitioner cards
- [ ] Navigating to a date with seeded appointments shows them correctly
- [ ] Previous/Next day navigation buttons are available

---

#### CL-3.1.3 — Daily Stats [#16](https://github.com/SDivya03/CliniqueLumiere/issues/16)

**User Story**
As a clinic manager, I want to see a summary of each practitioner's day, so that I can quickly gauge workload across the team.

**Acceptance Criteria**
- [ ] Each card shows: Total appointments, Scheduled + Confirmed count, Completed count
- [ ] Stats exactly match the appointment rows in that card
- [ ] Stats update reactively when the date changes (no stale values)
- [ ] Stats computed client-side from the appointment signal (no extra API call)

---

### Feature 3.2 — Alerts

| Ticket | Title | GitHub Issue |
|--------|-------|-------------|
| CL-3.2.1 | Upcoming Appointment Alerts | [#17](https://github.com/SDivya03/CliniqueLumiere/issues/17) |
| CL-3.2.2 | Alert Dismissal | [#18](https://github.com/SDivya03/CliniqueLumiere/issues/18) |

#### CL-3.2.1 — Upcoming Appointment Alerts [#17](https://github.com/SDivya03/CliniqueLumiere/issues/17)

**User Story**
As a clinic manager, I want to see a yellow alert when an appointment starts within 30 minutes, so that practitioners are warned before a patient arrives.

**Acceptance Criteria**
- [ ] Yellow alert banner shown on a practitioner card when today is selected and an appointment starts within 30 minutes
- [ ] Alert format: *"Upcoming: [Patient Name] at [HH:MM]"*
- [ ] Alert visible for today only — hidden for past or future dates
- [ ] Multiple alerts can appear on the same card
- [ ] No alert for appointments already started or completed

---

#### CL-3.2.2 — Alert Dismissal [#18](https://github.com/SDivya03/CliniqueLumiere/issues/18)

**User Story**
As a practitioner, I want to dismiss an alert after I have seen it, so that my card stays clean without being cluttered by acknowledged alerts.

**Acceptance Criteria**
- [ ] Each alert has an individual dismiss (✕) button
- [ ] Clicking dismiss removes that specific alert immediately
- [ ] Dismissing one alert does not affect other alerts on the same or other cards
- [ ] Dismissed state lives in component memory only — not persisted across reloads
- [ ] Refreshing the page restores all un-dismissed alerts

---

## Summary

| Epic | Milestone | Stories | GitHub |
|------|-----------|---------|--------|
| Patient Intake | #1 | 7 (CL-1.1.1 → CL-1.3.2) | [Issues](https://github.com/SDivya03/CliniqueLumiere/milestone/1) |
| Appointments | #2 | 6 (CL-2.1.1 → CL-2.2.3) | [Issues](https://github.com/SDivya03/CliniqueLumiere/milestone/2) |
| Staff Dashboard | #3 | 5 (CL-3.1.1 → CL-3.2.2) | [Issues](https://github.com/SDivya03/CliniqueLumiere/milestone/3) |
| **Total** | | **18** | [All issues](https://github.com/SDivya03/CliniqueLumiere/issues) |
