namespace CliniqueLumiere.Api.Dtos;

/// <summary>
/// Returned as the body of a 409 Conflict response when a booking overlaps an
/// existing appointment for the same practitioner (Story CL-2.1.2).
/// </summary>
public class AppointmentConflictResponse
{
    /// <summary>Full name of the practitioner who is already booked.</summary>
    public string PractitionerName { get; set; } = string.Empty;

    /// <summary>Start of the conflicting appointment (UTC).</summary>
    public DateTimeOffset ConflictStart { get; set; }

    /// <summary>End of the conflicting appointment (UTC).</summary>
    public DateTimeOffset ConflictEnd { get; set; }
}
