using System.ComponentModel.DataAnnotations;

namespace CliniqueLumiere.Api.Dtos;

/// <summary>
/// Payload for booking a new appointment (Story CL-2.1.1).
/// Start time must be in the future; end time is derived server-side from service duration.
/// </summary>
public class CreateAppointmentRequest
{
    [Required]
    public int PatientId { get; set; }

    [Required]
    public int PractitionerId { get; set; }

    [Required]
    public int ServiceId { get; set; }

    /// <summary>ISO 8601 UTC date-time for the appointment start.</summary>
    [Required]
    public DateTimeOffset StartTime { get; set; }
}
