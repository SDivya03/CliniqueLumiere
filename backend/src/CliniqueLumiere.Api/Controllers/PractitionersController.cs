using CliniqueLumiere.Api.Data;
using CliniqueLumiere.Api.Dtos;
using CliniqueLumiere.Api.Mapping;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CliniqueLumiere.Api.Controllers;

/// <summary>Practitioner listing endpoints (Epic 2 — Appointments).</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PractitionersController : ControllerBase
{
    private readonly ClinicDbContext _db;

    public PractitionersController(ClinicDbContext db)
    {
        _db = db;
    }

    /// <summary>List all practitioners, ordered by last name then first name.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PractitionerResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PractitionerResponse>>> GetAll()
    {
        var practitioners = await _db.Practitioners
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .ToListAsync();

        return Ok(practitioners.Select(p => p.ToResponse()));
    }
}
