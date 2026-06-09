using System.ComponentModel.DataAnnotations;

namespace CliniqueLumiere.Api.Dtos;

/// <summary>
/// Optional medical history captured during intake (Story CL-1.2.1). Every field
/// is free-text and optional; carried on both patient requests and responses.
/// </summary>
public class MedicalHistoryDto
{
    [StringLength(2000)]
    public string? Allergies { get; set; }

    [StringLength(2000)]
    public string? Medications { get; set; }

    [StringLength(2000)]
    public string? Conditions { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}
