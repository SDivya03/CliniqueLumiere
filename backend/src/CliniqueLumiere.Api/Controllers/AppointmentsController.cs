using CliniqueLumiere.Api.Data;
using CliniqueLumiere.Api.Dtos;
using CliniqueLumiere.Api.Mapping;
using CliniqueLumiere.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CliniqueLumiere.Api.Controllers;

/// <summary>Appointment booking endpoints (Story CL-2.1.1 — Booking Form).</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AppointmentsController : ControllerBase
{
    private readonly ClinicDbContext _db;

    public AppointmentsController(ClinicDbContext db)
    {
        _db = db;
    }

    /// <summary>List all booked appointments, ordered by start time descending.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AppointmentResponse>>> GetAll()
    {
        var appointments = await _db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Practitioner)
            .Include(a => a.Service)
            .OrderByDescending(a => a.StartTime)
            .ToListAsync();

        return Ok(appointments.Select(a => a.ToResponse()));
    }

    /// <summary>Book a new appointment (Stories CL-2.1.1, CL-2.1.2).</summary>
    /// <remarks>
    /// End time is derived server-side from the service's <c>DurationMinutes</c>.
    /// Start time must be in the future.
    /// Returns 409 when the requested time slot overlaps an existing appointment
    /// for the same practitioner (overlap: newStart &lt; existing.End AND newEnd &gt; existing.Start).
    /// </remarks>
    /// <response code="201">Appointment created.</response>
    /// <response code="400">Validation failed or start time is not in the future.</response>
    /// <response code="404">Patient, practitioner, or service not found.</response>
    /// <response code="409">Practitioner already has an overlapping appointment.</response>
    [HttpPost]
    [ProducesResponseType(typeof(AppointmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(AppointmentConflictResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppointmentResponse>> Create([FromBody] CreateAppointmentRequest request)
    {
        if (request.StartTime <= DateTimeOffset.UtcNow)
        {
            return BadRequest("Start time must be in the future.");
        }

        var patient = await _db.Patients.FindAsync(request.PatientId);
        if (patient is null)
        {
            return NotFound($"Patient {request.PatientId} not found.");
        }

        var practitioner = await _db.Practitioners.FindAsync(request.PractitionerId);
        if (practitioner is null)
        {
            return NotFound($"Practitioner {request.PractitionerId} not found.");
        }

        var service = await _db.Services.FindAsync(request.ServiceId);
        if (service is null)
        {
            return NotFound($"Service {request.ServiceId} not found.");
        }

        var newStart = request.StartTime;
        var newEnd = newStart.AddMinutes(service.DurationMinutes);

        var conflict = await _db.Appointments
            .Where(a =>
                a.PractitionerId == request.PractitionerId &&
                a.StartTime < newEnd &&
                a.EndTime > newStart)
            .FirstOrDefaultAsync();

        if (conflict is not null)
        {
            return Conflict(new AppointmentConflictResponse
            {
                PractitionerName = $"{practitioner.FirstName} {practitioner.LastName}",
                ConflictStart = conflict.StartTime,
                ConflictEnd = conflict.EndTime,
            });
        }

        var appointment = new Appointment
        {
            PatientId = request.PatientId,
            Patient = patient,
            PractitionerId = request.PractitionerId,
            Practitioner = practitioner,
            ServiceId = request.ServiceId,
            Service = service,
            StartTime = newStart,
            EndTime = newEnd,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = appointment.Id }, appointment.ToResponse());
    }
}
