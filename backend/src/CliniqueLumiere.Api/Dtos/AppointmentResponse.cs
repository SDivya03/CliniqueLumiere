namespace CliniqueLumiere.Api.Dtos;

/// <summary>Appointment record returned by the API, with denormalised patient and service names.</summary>
public class AppointmentResponse
{
    public int Id { get; set; }

    public int PatientId { get; set; }

    public string PatientName { get; set; } = string.Empty;

    public int PractitionerId { get; set; }

    public string PractitionerName { get; set; } = string.Empty;

    public int ServiceId { get; set; }

    public string ServiceName { get; set; } = string.Empty;

    public int ServiceDurationMinutes { get; set; }

    public DateTimeOffset StartTime { get; set; }

    public DateTimeOffset EndTime { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
