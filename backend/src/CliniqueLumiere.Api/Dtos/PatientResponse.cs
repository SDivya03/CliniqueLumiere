namespace CliniqueLumiere.Api.Dtos;

/// <summary>Patient record returned by the API.</summary>
public class PatientResponse
{
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public EmergencyContactDto? EmergencyContact { get; set; }

    public MedicalHistoryDto? MedicalHistory { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
