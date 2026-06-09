namespace CliniqueLumiere.Api.Models;

/// <summary>A clinic practitioner who delivers services to patients.</summary>
public class Practitioner
{
    /// <summary>Server-assigned identifier.</summary>
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    /// <summary>Clinical role shown to reception staff (e.g. "Physiotherapist").</summary>
    public string Specialty { get; set; } = string.Empty;
}
