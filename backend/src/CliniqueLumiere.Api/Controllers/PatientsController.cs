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

    /// <summary>List all registered patients, ordered by last name then first name.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PatientResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PatientResponse>>> GetAll()
    {
        var patients = await _db.Patients
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .ToListAsync();

        return Ok(patients.Select(p => p.ToResponse()));
    }

    /// <summary>Register a new patient (Story CL-1.1.1).</summary>
    /// <response code="201">Patient created.</response>
    /// <response code="400">Validation failed (missing required field or bad email/phone).</response>
    /// <response code="409">A patient with the same email already exists (Story CL-1.1.2).</response>
    [HttpPost]
    [ProducesResponseType(typeof(PatientResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PatientResponse>> Create([FromBody] CreatePatientRequest request)
    {
        var patient = request.ToEntity(DateTimeOffset.UtcNow);

        // Reject duplicate emails up front (Story CL-1.1.2). ToEntity lower-cases the email,
        // so an equality check is effectively case-insensitive and the unique-email index
        // never trips an unhandled 500.
        var emailTaken = await _db.Patients.AnyAsync(p => p.Email == patient.Email);
        if (emailTaken)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Email already registered",
                Detail = "A patient with this email already exists.",
            });
        }

        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();

        var response = patient.ToResponse();
        return CreatedAtAction(nameof(GetAll), new { id = patient.Id }, response);
    }
}
