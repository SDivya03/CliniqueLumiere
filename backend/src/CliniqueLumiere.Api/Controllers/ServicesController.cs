using CliniqueLumiere.Api.Data;
using CliniqueLumiere.Api.Dtos;
using CliniqueLumiere.Api.Mapping;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CliniqueLumiere.Api.Controllers;

/// <summary>Service catalogue endpoints (Epic 2 — Appointments).</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ServicesController : ControllerBase
{
    private readonly ClinicDbContext _db;

    public ServicesController(ClinicDbContext db)
    {
        _db = db;
    }

    /// <summary>List all available services, ordered by name.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ServiceResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ServiceResponse>>> GetAll()
    {
        var services = await _db.Services
            .OrderBy(s => s.Name)
            .ToListAsync();

        return Ok(services.Select(s => s.ToResponse()));
    }
}
