---
name: testplan
description: Generate a structured test plan and traceability matrix from a ticket's acceptance criteria (reads PRD 1.md + tickets.md). Use when a tester needs test cases for a CL-x.x.x ticket or a whole epic, or asks to "write a test plan", "make test cases", or "cover ticket CL-...".
---

# Test Plan Generator

Turns the team's acceptance criteria into reviewable test cases plus a traceability
matrix, so every acceptance criterion (AC) maps to at least one test case.

This is a **tester** skill (Arjen / Krithi own it). It produces documentation only —
it never edits application code and never opens issues or PRs.

## Inputs

- `tickets.md` (repo root) — the source of truth for acceptance criteria.
- `PRD 1.md` (repo root) — context: user stories, success metrics, scope.
- Argument: a ticket id (`CL-1.1.2`), an epic (`EPIC 1`), or `all`. If none given, ask which.

## Steps

1. Read `tickets.md` and `PRD 1.md`. Locate the requested ticket(s). If the id is not
   found, list the available ids and stop.
2. For each ticket, extract every acceptance criterion verbatim.
3. For each AC, derive at least one **positive** test case. Add **negative / edge** cases
   where the AC implies them, for example:
   - validation rules -> invalid input cases (bad email, missing required field, bad phone)
   - "duplicate email" / "409 conflict" -> the collision case AND the non-colliding case
   - "within 300 ms / 500 ms" -> a timing assertion case
   - "no page reload" / "via signal" -> a reactivity case
   - boundaries (page size 10, 30-minute alert window, past-date blocking)
4. Mark each test case as `manual` or `automatable` (and note whether it is a good
   candidate for the `/e2e-test` skill).
5. Write the plan to `qa/testplans/<TICKET-ID>.md` (create folders if missing).
   For an epic or `all`, write one file per ticket.

## Output format

Each test plan file must contain:

```markdown
# Test Plan — <TICKET-ID> <Title>

**Source:** tickets.md (#<issue>) · PRD 1.md
**Feature:** <Feature> · **Epic:** <Epic>
**Environment:** frontend http://localhost:4200 · API http://localhost:5050 (Swagger at /swagger) · branch `master`

## Test Cases

| TC ID | Title | Type | Priority | Preconditions | Steps | Test data | Expected result | AC ref |
|-------|-------|------|----------|---------------|-------|-----------|-----------------|--------|
| <ID>-01 | ... | manual/automatable | High/Med/Low | ... | 1. ... 2. ... | ... | ... | AC 1 |

## Traceability Matrix

| Acceptance criterion | Covered by | Status |
|----------------------|------------|--------|
| AC 1: <verbatim text> | <ID>-01, <ID>-02 | covered |
| AC 2: <verbatim text> | (none) | GAP |
```

## Rules

- TC IDs: `<TICKET-ID>-NN`, e.g. `CL-1.1.2-01`.
- Every AC must appear in the traceability matrix. Flag any AC with no test case as `GAP`
  and call it out explicitly at the end — never silently skip one.
- Quote acceptance criteria verbatim; do not reword the requirement.
- Documentation only. Do not touch `src/`, `backend/`, or git state.
