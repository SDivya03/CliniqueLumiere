using CliniqueLumiere.Api.Dtos;
using CliniqueLumiere.Api.Models;

namespace CliniqueLumiere.Api.Mapping;

/// <summary>Maps between <see cref="Patient"/> entities and API DTOs.</summary>
public static class PatientMapping
{
    /// <summary>Build a new entity from a create request, normalising whitespace and email casing.</summary>
    public static Patient ToEntity(this CreatePatientRequest request, DateTimeOffset createdAt)
    {
        return new Patient
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = Normalise(request.Phone),
            DateOfBirth = Normalise(request.DateOfBirth),
            Gender = Normalise(request.Gender),
            EmergencyContactName = Normalise(request.EmergencyContact?.Name),
            EmergencyContactPhone = Normalise(request.EmergencyContact?.Phone),
            CreatedAt = createdAt,
        };
    }

    /// <summary>Project an entity into its API response shape.</summary>
    public static PatientResponse ToResponse(this Patient patient)
    {
        var hasEmergencyContact =
            patient.EmergencyContactName is not null || patient.EmergencyContactPhone is not null;

        return new PatientResponse
        {
            Id = patient.Id,
            FirstName = patient.FirstName,
            LastName = patient.LastName,
            Email = patient.Email,
            Phone = patient.Phone,
            DateOfBirth = patient.DateOfBirth,
            Gender = patient.Gender,
            EmergencyContact = hasEmergencyContact
                ? new EmergencyContactDto
                {
                    Name = patient.EmergencyContactName,
                    Phone = patient.EmergencyContactPhone,
                }
                : null,
            CreatedAt = patient.CreatedAt,
        };
    }

    private static string? Normalise(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
