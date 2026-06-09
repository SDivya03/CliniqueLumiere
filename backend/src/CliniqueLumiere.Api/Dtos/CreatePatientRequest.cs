using System.ComponentModel.DataAnnotations;

namespace CliniqueLumiere.Api.Dtos;

/// <summary>
/// Payload for registering a patient. Mirrors the client-side validation in the
/// Angular form so the rules are enforced on both ends (Story CL-1.1.1).
/// </summary>
public class CreatePatientRequest
{
    [Required]
    [StringLength(80)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(80)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [StringLength(40)]
    public string? Phone { get; set; }

    /// <summary>ISO date string (yyyy-MM-dd).</summary>
    public string? DateOfBirth { get; set; }

    [StringLength(40)]
    public string? Gender { get; set; }

    public EmergencyContactDto? EmergencyContact { get; set; }
}
