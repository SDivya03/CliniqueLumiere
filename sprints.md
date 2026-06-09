# Clinique Lumière — Sprint Board

> Workflow: GitHub Flow · Branch: `feature/<ticket-id>-<short-description>` → PR → `master`
> Columns: **Todo** → **In Progress** → **Test** → merged to `master` → release tag

---

## Sprint 1 — Patient Intake

**Goal:** Enable patient registration, medical history capture, and patient search.
**Scope:** EPIC 1 — all 7 tickets (CL-1.1.1 → CL-1.3.2)
**Team:** Divya + Nijila (dev) · Arjen + Krithi (test) · Mihaela (PO sign-off)

| Todo | In Progress | Test |
|------|-------------|------|
| [CL-1.1.1 Registration Form #1](https://github.com/SDivya03/CliniqueLumiere/issues/1) | | |
| [CL-1.1.2 Duplicate Email Detection #2](https://github.com/SDivya03/CliniqueLumiere/issues/2) | | |
| [CL-1.1.3 Registration Success State #3](https://github.com/SDivya03/CliniqueLumiere/issues/3) | | |
| [CL-1.2.1 Medical History Fields #4](https://github.com/SDivya03/CliniqueLumiere/issues/4) | | |
| [CL-1.2.2 View / Edit Patient Record #5](https://github.com/SDivya03/CliniqueLumiere/issues/5) | | |
| [CL-1.3.1 Patient List #6](https://github.com/SDivya03/CliniqueLumiere/issues/6) | | |
| [CL-1.3.2 Live Search #7](https://github.com/SDivya03/CliniqueLumiere/issues/7) | | |

### Sprint 1 — Dependency order

```
CL-1.3.1 Patient List           ← must exist before Search can filter it
  └── CL-1.1.1 Registration Form
        ├── CL-1.1.2 Duplicate Email Detection   (needs the POST /patients endpoint)
        └── CL-1.1.3 Registration Success State  (needs the list signal)
  └── CL-1.2.1 Medical History Fields            (extends the same intake form)
        └── CL-1.2.2 View / Edit Patient Record  (needs a patient to exist)
CL-1.3.2 Live Search            ← needs CL-1.3.1 list to be in place
```

---

## Sprint 2 — Appointments & Staff Dashboard

**Goal:** Enable appointment booking, list management, and daily practitioner view with alerts.
**Scope:** EPIC 2 (6 tickets) + EPIC 3 (5 tickets) = 11 tickets total
**Prerequisite:** Sprint 1 merged to `master` (patients must exist to book appointments)
**Team:** Divya + Nijila (dev) · Arjen + Krithi (test) · Mihaela (PO sign-off)

| Todo | In Progress | Test |
|------|-------------|------|
| [CL-2.1.1 Booking Form #8](https://github.com/SDivya03/CliniqueLumiere/issues/8) | | |
| [CL-2.1.2 Conflict Detection #9](https://github.com/SDivya03/CliniqueLumiere/issues/9) | | |
| [CL-2.1.3 Appointment Confirmation #10](https://github.com/SDivya03/CliniqueLumiere/issues/10) | | |
| [CL-2.2.1 Appointment List #11](https://github.com/SDivya03/CliniqueLumiere/issues/11) | | |
| [CL-2.2.2 Date Filter #12](https://github.com/SDivya03/CliniqueLumiere/issues/12) | | |
| [CL-2.2.3 Cancel Appointment #13](https://github.com/SDivya03/CliniqueLumiere/issues/13) | | |
| [CL-3.1.1 Per-Practitioner Schedule Cards #14](https://github.com/SDivya03/CliniqueLumiere/issues/14) | | |
| [CL-3.1.2 Date Navigation #15](https://github.com/SDivya03/CliniqueLumiere/issues/15) | | |
| [CL-3.1.3 Daily Stats #16](https://github.com/SDivya03/CliniqueLumiere/issues/16) | | |
| [CL-3.2.1 Upcoming Appointment Alerts #17](https://github.com/SDivya03/CliniqueLumiere/issues/17) | | |
| [CL-3.2.2 Alert Dismissal #18](https://github.com/SDivya03/CliniqueLumiere/issues/18) | | |

### Sprint 2 — Dependency order

```
CL-2.2.1 Appointment List       ← foundation for all appointment views
  └── CL-2.1.1 Booking Form
        ├── CL-2.1.2 Conflict Detection          (needs the POST /appointments endpoint)
        └── CL-2.1.3 Appointment Confirmation    (needs the list signal)
  └── CL-2.2.2 Date Filter                       (filters the list)
  └── CL-2.2.3 Cancel Appointment                (mutates a row in the list)

CL-3.1.1 Per-Practitioner Schedule Cards  ← reads from appointments (needs CL-2.2.1)
  └── CL-3.1.2 Date Navigation            (drives the card reload)
  └── CL-3.1.3 Daily Stats                (computed from the card's appointment signal)
        └── CL-3.2.1 Upcoming Alerts      (reads today's appointments per card)
              └── CL-3.2.2 Alert Dismissal
```

---

## Workflow — How a ticket moves across columns

```
Backlog (sprints.md Todo)
    │
    ▼  Developer picks ticket, opens branch:
    │  git checkout -b feature/<ticket-id>-<short-description>
    │
In Progress
    │
    ▼  Definition of Done met (see CLAUDE.md §5):
    │  ✔ Acceptance criteria pass
    │  ✔ Jest / xUnit tests green
    │  ✔ Swagger updated (if API touched)
    │  ✔ No console.log · no linting errors
    │  ✔ PR description filled in
    │
    │  Developer opens PR → master
    │  Claude drafts PR description · human submits
    │
Test  (PR open, awaiting peer review + QA)
    │
    ▼  Peer developer approves PR
    │  Testers (Arjen / Krithi) validate on the PR branch
    │
    ▼  Merge PR to master
    │
Done  (ticket closed in GitHub)
```

### End-of-sprint release

After all sprint tickets are merged and testers sign off on `master`:

```
git tag v<major>.<minor>.<patch>
git push origin v<major>.<minor>.<patch>
```

Suggested tags: `v0.1.0` after Sprint 1 · `v0.2.0` after Sprint 2

---

## Ticket summary

| Sprint | Epic | Tickets | Count |
|--------|------|---------|-------|
| Sprint 1 | Patient Intake | CL-1.1.1 → CL-1.3.2 | 7 |
| Sprint 2 | Appointments | CL-2.1.1 → CL-2.2.3 | 6 |
| Sprint 2 | Staff Dashboard | CL-3.1.1 → CL-3.2.2 | 5 |
| **Total** | | | **18** |
