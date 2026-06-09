# Clinique Lumière — CLAUDE.md

> This file is read by both humans and Claude. It defines how this team works, what we build, and the guardrails Claude must always respect.

---

## 1. Roles — Who are we?

| Person | Role | Responsibility |
|--------|------|----------------|
| Mihaela | Product Owner | Picks features, defines acceptance criteria, owns the backlog |
| Divya | Developer | Implements features, pairs with Claude, opens PRs |
| Nijila | Developer | Implements features, pairs with Claude, opens PRs |
| Arjen | Tester | Validates features against acceptance criteria, writes test cases |
| Krithi | Tester | Validates features against acceptance criteria, writes test cases |
| Claude | AI pair programmer | Implements alongside the developer, follows their lead — never merges autonomously |

**Claude's lane:** Claude pairs with whoever is driving. The human owns every decision, reviews every diff, and merges every PR. Claude does not open issues, push to shared branches, or take any action that affects shared state without explicit instruction.

---

## 2. Scope — What are we building?

**Clinique Lumière** is a private wellness clinic that runs its back office on spreadsheets. We are replacing those spreadsheets with a real system.

### The six available modules (PO selects 3 per sprint)

- **Patient Intake** — Registration, medical history, validation
- **Appointments** — Scheduling, time slots, conflict detection
- **Treatments** — Service catalog, pricing, records
- **Wellness Programs** — Multi-session packages, progress tracking
- **Staff Dashboard** — Practitioner views, daily schedules, alerts
- **Billing** — Invoices, payment status, receipts

### What "done" means

A feature is done when:
- [ ] Acceptance criteria from Mihaela are met
- [ ] Unit tests pass (Jest for Angular, xUnit for .NET)
- [ ] Swagger docs updated for any new/changed API endpoint
- [ ] PR reviewed and approved by at least one other developer
- [ ] No `console.log` left in committed code
- [ ] No linting errors (`strict: true`)

### Out of scope (unless PO explicitly adds it)

- Patient-facing portal or mobile app
- External lab/EHR integrations
- Payment gateway (billing tracks status only, no online payments)
- Multi-clinic / multi-tenant support

---

## 3. Way of Working — How will we work?

**Mode: Pair programming.** The developer drives; Claude co-pilots in real time.

### The loop

1. **PO** selects 3 features for the sprint and writes acceptance criteria.
2. **Developer** opens a feature branch (`feature/<ticket>-<short-description>`).
3. **Developer + Claude** implement together — developer leads, Claude writes code on request.
4. **Developer** opens a PR to `master` when the Definition of Done is met.
5. **Peer developer** reviews the PR.
6. **Testers** validate on the `master` branch after merge.
7. **Release manager** (any dev) tags `master` `v<major>.<minor>.<patch>` at end of sprint.

### Where Claude hands off

Claude hands off when:
- A decision affects the data model or API contract (loop in the whole team).
- A task requires secrets, credentials, or environment variables (Claude never touches these).
- A PR is ready — Claude drafts the PR description, the human submits it.

---

## 4. Stack & Tools — What are we building with?

### Frontend

- **Framework:** Angular 17+ (standalone components only — no NgModules)
- **State:** Signals + services (`inject()`, no constructor injection)
- **UI:** Angular Material
- **Language:** TypeScript with `strict: true` — no `any`, interfaces over type aliases
- **Tests:** Jest
- **Linting:** ESLint + Prettier

### Backend

- **Framework:** ASP.NET Core (C#) — REST API
- **Docs:** Swagger / OpenAPI — every endpoint must be documented
- **Tests:** xUnit
- **ORM:** Entity Framework Core

### Folder conventions (Angular)

```
src/app/
  components/   # Presentational UI components
  services/     # Business logic, HTTP calls, signal-based state
  models/       # Interfaces and enums only
  pipes/        # Custom Angular pipes
```

### How Claude reaches the code

- Repo root: `C:\Repositories\CliniqueLumiere`
- Frontend lives in: `frontend/`
- Backend lives in: `backend/`
- Claude reads the repo directly — no external tooling required.

---

## 5. Artifacts & Standards — What do we write down?

### Code standards Claude must always follow

- **Angular:** Standalone components, signals, Angular Material, `inject()` for DI, `strict: true`.
- **Naming:** PascalCase for classes/interfaces, camelCase for methods/variables, kebab-case for file names.
- **Comments:** Only when the WHY is non-obvious. No `// TODO` left in PRs.
- **No `console.log`** in committed code — ever.
- **Errors:** Caught in services, exposed via signals. Components never catch errors.
- **JSDoc:** Required on all public classes, methods, and variables.

### API standards

- Every new or changed endpoint must have a Swagger annotation before the PR is opened.
- Endpoints follow REST conventions: plural nouns, HTTP verbs for actions.
- Return types must be typed DTOs — no raw `object` or `dynamic`.

### Definition of Done (DoD)

Claude should remind the developer to check this before marking a task complete:

- [ ] Feature works against the acceptance criteria
- [ ] Unit tests written and passing
- [ ] Swagger updated (if API changed)
- [ ] No linting errors
- [ ] No `console.log` remaining
- [ ] PR description filled in (what, why, how to test)

---

## 6. Repo — How do we share one repo?

### Branching strategy: GitHub Flow

```
master        ← integration + production branch; always green
feature/...   ← one branch per feature/ticket
hotfix/...    ← emergency fixes branched from master
```

### Branch naming

```
feature/<ticket-id>-<short-description>
hotfix/<ticket-id>-<short-description>
```

Examples: `feature/CL-42-patient-intake`, `hotfix/CL-99-fix-appointment-overlap`

### PR rules

- PRs target `master`.
- At least **1 developer approval** required before merge.
- Testers validate on `master` after merge, before the sprint release tag.
- Claude drafts the PR description; the human submits it.

### Release

- At end-of-sprint release, after testers sign off.
- Tagged on `master` with `v<major>.<minor>.<patch>`.

---

## Claude — Hard rules (always apply)

1. Never push, merge, or force-push to any branch without explicit instruction.
2. Never commit secrets, `.env` files, or credentials.
3. Never use `any` in TypeScript.
4. Never leave `console.log` in code you write.
5. Never generate code outside the established folder structure without asking first.
6. Always follow the Definition of Done before declaring a feature complete.
7. Always keep Swagger up to date when touching API endpoints.
