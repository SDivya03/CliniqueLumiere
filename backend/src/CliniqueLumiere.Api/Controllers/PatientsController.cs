using CliniqueLumiere.Api.Data;
using CliniqueLumiere.Api.Dtos;
using CliniqueLumiere.Api.Mapping;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CliniqueLumiere.Api.Controllers;

/// <summary>Patient registration and listing endpoints (Epic 1 — Patient Intake).</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PatientsController : ControllerBase
{
    private readonly ClinicDbContext _db;

    public PatientsController(ClinicDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// List registered patients, with optional full-text search across name and email.
    /// Used by the booking form autocomplete (Story CL-2.1.1).
    /// </summary>
    /// <param name="search">Optional search term; matches first name, last name, or email (case-insensitive).</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PatientResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PatientResponse>>> GetAll([FromQuery] string? search)
    {
        var query = _db.Patients.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(p =>
                p.FirstName.ToLower().Contains(term) ||
                p.LastName.ToLower().Contains(term) ||
                p.Email.Contains(term));
        }

        var patients = await query
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .ToListAsync();

        return Ok(patients.Select(p => p.ToResponse()));
    }

    /// <summary>Register a new patient (Story CL-1.1.1).</summary>
    /// <response code="201">Patient created.</response>
    /// <response code="400">Validation failed (missing required field or bad email/phone).</response>
    [HttpPost]
    [ProducesResponseType(typeof(PatientResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PatientResponse>> Create([FromBody] CreatePatientRequest request)
    {
        var patient = request.ToEntity(DateTimeOffset.UtcNow);

        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();

        var response = patient.ToResponse();
        return CreatedAtAction(nameof(GetAll), new { id = patient.Id }, response);
    }
}
