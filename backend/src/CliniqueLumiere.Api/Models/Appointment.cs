namespace CliniqueLumiere.Api.Models;

/// <summary>A booked appointment linking a patient, practitioner, and service at a specific time.</summary>
public class Appointment
{
    /// <summary>Server-assigned identifier.</summary>
    public int Id { get; set; }

    public int PatientId { get; set; }

    public Patient Patient { get; set; } = null!;

    public int PractitionerId { get; set; }

    public Practitioner Practitioner { get; set; } = null!;

    public int ServiceId { get; set; }

    public Service Service { get; set; } = null!;

    /// <summary>UTC date and time the appointment starts.</summary>
    public DateTimeOffset StartTime { get; set; }

    /// <summary>UTC date and time the appointment ends (start + service duration).</summary>
    public DateTimeOffset EndTime { get; set; }

    /// <summary>UTC timestamp set when the record is created.</summary>
    public DateTimeOffset CreatedAt { get; set; }
}
