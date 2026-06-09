# [BUG] Duplicate email returns HTTP 500 instead of 409; inline "already exists" message never shows

**Ticket:** CL-1.1.2 (#2) · **Violated AC:** "API returns HTTP 409 when a registration request contains an already-registered email" and "Frontend displays inline message: *'A patient with this email already exists'* beneath the email field"
**Severity:** Major (AC not met, no workaround — duplicate detection is the entire feature)
**Environment:** branch `master` · frontend localhost:4200 · API localhost:5050 · SQLite (`clinique.db`, seeded)

## Steps to reproduce
1. Start the API in Development mode (`dotnet run`) on a freshly seeded database.
2. Send `POST /api/patients` with an email that already exists, e.g. the seeded `sophie.bernard@example.com`:
   ```json
   { "firstName": "Dupe", "lastName": "Person", "email": "sophie.bernard@example.com",
     "phone": null, "dateOfBirth": null, "gender": null, "emergencyContact": null }
   ```
3. Observe the HTTP status. (Or in the UI: register a patient using a seeded email.)

## Expected
- API returns **HTTP 409 Conflict**.
- Frontend shows the inline message **"A patient with this email already exists"** beneath the email field, without a page reload.

## Actual
- API returns **HTTP 500 Internal Server Error**.
- The unique index on `Patients.Email` throws an unhandled `DbUpdateException`.
- Frontend `PatientService.handleError` only maps **409** to the duplicate message, so a 500 falls through to the generic banner: **"Could not register the patient. Please try again."**
- Mixed-case duplicates (e.g. `SOPHIE.BERNARD@EXAMPLE.COM`) also 500 — the mapper lower-cases the email, so it collides on the unique index too.

## Evidence
- API/server log:
  ```
  Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'UNIQUE constraint failed: Patients.Email'.
   ---> Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes.
  ```
- Live API check results:
  | Request | Expected | Actual |
  |---------|----------|--------|
  | POST duplicate `sophie.bernard@example.com` | 409 | **500** |
  | POST mixed-case `SOPHIE.BERNARD@EXAMPLE.COM` | 409 | **500** |

## Notes
- **Frequency:** always (deterministic).
- **Suspected area / root cause:** `PatientsController.Create` adds and calls `SaveChangesAsync()` with **no duplicate pre-check and no try/catch**. The DB enforces uniqueness via `ClinicDbContext` (`HasIndex(p => p.Email).IsUnique()`), so the conflict surfaces as a raw 500 rather than a 409.
- **Why existing tests miss it:** `PatientsControllerTests` use `UseInMemoryDatabase`, which does **not** enforce unique indexes — a duplicate insert succeeds in-memory. A regression test must use the SQLite provider (or a running API) and assert 409.
- **Suggested fix direction (for the developer, not part of this report):** pre-check for an existing email (or catch the unique-constraint `DbUpdateException`) and return `Conflict()` / 409.
</content>
