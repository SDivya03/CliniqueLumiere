namespace CliniqueLumiere.Api.Models;

/// <summary>
/// A registered clinic patient. Emergency-contact fields are stored flat and
/// projected into a nested object at the API boundary.
/// </summary>
public class Patient
{
    /// <summary>Server-assigned identifier.</summary>
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    /// <summary>Stored lower-cased; unique across patients.</summary>
    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    /// <summary>ISO date string (yyyy-MM-dd); kept as text to match the client.</summary>
    public string? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? EmergencyContactName { get; set; }

    public string? EmergencyContactPhone { get; set; }

    /// <summary>UTC timestamp set when the record is created.</summary>
    public DateTimeOffset CreatedAt { get; set; }
}
