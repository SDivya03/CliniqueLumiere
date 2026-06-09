using System.ComponentModel.DataAnnotations;

namespace CliniqueLumiere.Api.Dtos;

/// <summary>Optional next-of-kin contact carried on patient requests and responses.</summary>
public class EmergencyContactDto
{
    [StringLength(120)]
    public string? Name { get; set; }

    [StringLength(40)]
    public string? Phone { get; set; }
}
