# Clinique Lumière — Clinic Management System

Replacing spreadsheet-based back-office operations with a web application that
manages patients, appointments and staff schedules for a private wellness clinic.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 18 (standalone components + signals), Angular Material |
| Backend | ASP.NET Core 8 (C#) REST API, Swagger/OpenAPI |
| Database | SQLite via Entity Framework Core |
| Tests | Jest (frontend) · xUnit (backend) |

## Project layout

```
/                       Angular frontend (src/)
  src/app/core/         Models + ApiService (HttpClient wrapper)
  src/app/features/     Feature modules (patient-intake, ...)
  src/app/shared/       Reusable validators, components
backend/
  src/CliniqueLumiere.Api/    ASP.NET Core Web API
  tests/CliniqueLumiere.Api.Tests/  xUnit tests
```

## Prerequisites

- Node.js 20+ and npm
- .NET SDK 8.0 — https://dotnet.microsoft.com/download

## Run the backend (API on http://localhost:5050)

```bash
cd backend/src/CliniqueLumiere.Api
dotnet restore
dotnet run
```

Swagger UI: http://localhost:5050/swagger — the SQLite database
(`clinique.db`) is created and seeded with demo patients on first run.

## Run the frontend (app on http://localhost:4200)

```bash
npm install
npm start
```

## Tests

```bash
npm test                                    # frontend (Jest)
dotnet test backend/tests/CliniqueLumiere.Api.Tests   # backend (xUnit)
```
