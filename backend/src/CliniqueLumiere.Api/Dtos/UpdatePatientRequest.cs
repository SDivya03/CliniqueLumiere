using System.ComponentModel.DataAnnotations;

namespace CliniqueLumiere.Api.Dtos;

/// <summary>
/// Payload for updating an existing patient (Story CL-1.2.2). Mirrors the create
/// contract — required First/Last name and Email, everything else optional — so
/// the edit form can submit the full record back.
/// </summary>
public class UpdatePatientRequest
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

    public MedicalHistoryDto? MedicalHistory { get; set; }
}
