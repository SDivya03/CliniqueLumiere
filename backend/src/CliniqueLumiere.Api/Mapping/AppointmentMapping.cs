using CliniqueLumiere.Api.Dtos;
using CliniqueLumiere.Api.Models;

namespace CliniqueLumiere.Api.Mapping;

/// <summary>Maps between <see cref="Appointment"/>, <see cref="Service"/>, and <see cref="Practitioner"/> entities and their API DTOs.</summary>
public static class AppointmentMapping
{
    /// <summary>Project a service entity to its response shape.</summary>
    public static ServiceResponse ToResponse(this Service service) =>
        new()
        {
            Id = service.Id,
            Name = service.Name,
            DurationMinutes = service.DurationMinutes,
            Price = service.Price,
        };

    /// <summary>Project a practitioner entity to its response shape.</summary>
    public static PractitionerResponse ToResponse(this Practitioner practitioner) =>
        new()
        {
            Id = practitioner.Id,
            FirstName = practitioner.FirstName,
            LastName = practitioner.LastName,
            Specialty = practitioner.Specialty,
        };

    /// <summary>
    /// Project an appointment entity (with loaded navigation properties) to its response shape.
    /// </summary>
    public static AppointmentResponse ToResponse(this Appointment appointment) =>
        new()
        {
            Id = appointment.Id,
            PatientId = appointment.PatientId,
            PatientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}",
            PractitionerId = appointment.PractitionerId,
            PractitionerName = $"{appointment.Practitioner.FirstName} {appointment.Practitioner.LastName}",
            ServiceId = appointment.ServiceId,
            ServiceName = appointment.Service.Name,
            ServiceDurationMinutes = appointment.Service.DurationMinutes,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            CreatedAt = appointment.CreatedAt,
        };
}
