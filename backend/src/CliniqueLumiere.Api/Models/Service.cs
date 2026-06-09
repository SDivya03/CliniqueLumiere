namespace CliniqueLumiere.Api.Models;

/// <summary>A treatment service offered by the clinic, with a fixed duration.</summary>
public class Service
{
    /// <summary>Server-assigned identifier.</summary>
    public int Id { get; set; }

    /// <summary>Display name shown to reception staff.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Duration of the service in minutes; used to auto-calculate appointment end time.</summary>
    public int DurationMinutes { get; set; }

    /// <summary>Price in EUR (informational only; billing handled separately).</summary>
    public decimal Price { get; set; }
}
