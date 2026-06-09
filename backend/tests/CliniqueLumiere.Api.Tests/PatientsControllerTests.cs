using CliniqueLumiere.Api.Controllers;
using CliniqueLumiere.Api.Data;
using CliniqueLumiere.Api.Dtos;
using CliniqueLumiere.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CliniqueLumiere.Api.Tests;

/// <summary>Unit tests for <see cref="PatientsController"/> backed by an in-memory database.</summary>
public class PatientsControllerTests
{
    private static ClinicDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<ClinicDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ClinicDbContext(options);
    }

    private static CreatePatientRequest ValidRequest() => new()
    {
        FirstName = "Marie",
        LastName = "Dubois",
        Email = "Marie.Dubois@Example.com",
        Phone = "+33 6 11 22 33 44",
        DateOfBirth = "1990-02-20",
        Gender = "Female",
    };

    [Fact]
    public async Task Create_PersistsPatient_AndReturnsCreated()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);

        var result = await controller.Create(ValidRequest());

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var body = Assert.IsType<PatientResponse>(created.Value);
        Assert.True(body.Id > 0);
        Assert.Equal(1, await db.Patients.CountAsync());
    }

    [Fact]
    public async Task Create_NormalisesEmailToLowercase_AndTrimsNames()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);
        var request = ValidRequest();
        request.FirstName = "  Marie  ";
        request.Email = "Marie.Dubois@Example.com";

        await controller.Create(request);

        var saved = await db.Patients.SingleAsync();
        Assert.Equal("Marie", saved.FirstName);
        Assert.Equal("marie.dubois@example.com", saved.Email);
    }

    [Fact]
    public async Task Create_WithoutEmergencyContact_ReturnsNullContact()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);

        var result = await controller.Create(ValidRequest());

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var body = Assert.IsType<PatientResponse>(created.Value);
        Assert.Null(body.EmergencyContact);
    }

    [Fact]
    public async Task Create_WithEmergencyContact_RoundTripsContact()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);
        var request = ValidRequest();
        request.EmergencyContact = new EmergencyContactDto { Name = "Paul Dubois", Phone = "+33 6 55 66 77 88" };

        var result = await controller.Create(request);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var body = Assert.IsType<PatientResponse>(created.Value);
        Assert.NotNull(body.EmergencyContact);
        Assert.Equal("Paul Dubois", body.EmergencyContact!.Name);
    }

    [Fact]
    public async Task Create_WithDuplicateEmail_ReturnsConflict()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);
        await controller.Create(ValidRequest());

        // Same person re-entered with different email casing — must still be detected (CL-1.1.2).
        var duplicate = ValidRequest();
        duplicate.Email = "MARIE.dubois@EXAMPLE.com";
        var result = await controller.Create(duplicate);

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        // The duplicate must not have been persisted.
        Assert.Equal(1, await db.Patients.CountAsync());
    }

    [Fact]
    public async Task Create_WithMedicalHistory_RoundTripsHistory()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);
        var request = ValidRequest();
        request.MedicalHistory = new MedicalHistoryDto
        {
            Allergies = "Penicillin",
            Medications = "Ibuprofen",
            Conditions = "Asthma",
            Notes = "Reviewed at intake",
        };

        var result = await controller.Create(request);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var body = Assert.IsType<PatientResponse>(created.Value);
        Assert.NotNull(body.MedicalHistory);
        Assert.Equal("Penicillin", body.MedicalHistory!.Allergies);
        Assert.Equal("Asthma", body.MedicalHistory.Conditions);

        var saved = await db.Patients.SingleAsync();
        Assert.Equal("Ibuprofen", saved.MedicalMedications);
    }

    [Fact]
    public async Task Create_WithoutMedicalHistory_ReturnsNullHistory()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);

        var result = await controller.Create(ValidRequest());

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var body = Assert.IsType<PatientResponse>(created.Value);
        Assert.Null(body.MedicalHistory);
    }

    [Fact]
    public async Task GetAll_OrdersByLastNameThenFirstName()
    {
        await using var db = NewContext();
        db.Patients.AddRange(
            new Patient { FirstName = "Zoe", LastName = "Adam", Email = "zoe@example.com", CreatedAt = DateTimeOffset.UtcNow },
            new Patient { FirstName = "Anna", LastName = "Zola", Email = "anna@example.com", CreatedAt = DateTimeOffset.UtcNow },
            new Patient { FirstName = "Bea", LastName = "Adam", Email = "bea@example.com", CreatedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync();
        var controller = new PatientsController(db);

        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var patients = Assert.IsAssignableFrom<IEnumerable<PatientResponse>>(ok.Value);
        var ordered = patients.ToList();
        Assert.Equal("Adam", ordered[0].LastName);
        Assert.Equal("Bea", ordered[0].FirstName);
        Assert.Equal("Adam", ordered[1].LastName);
        Assert.Equal("Zola", ordered[2].LastName);
    }

    [Fact]
    public async Task Update_PersistsChanges_AndReturnsOk()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);
        var create = Assert.IsType<CreatedAtActionResult>((await controller.Create(ValidRequest())).Result);
        var id = ((PatientResponse)create.Value!).Id;

        var update = new UpdatePatientRequest
        {
            FirstName = "Marie",
            LastName = "Durand",
            Email = "marie.dubois@example.com",
            Gender = "Female",
            MedicalHistory = new MedicalHistoryDto { Allergies = "Latex" },
        };

        var result = await controller.Update(id, update);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<PatientResponse>(ok.Value);
        Assert.Equal("Durand", body.LastName);
        Assert.Equal("Latex", body.MedicalHistory!.Allergies);

        var saved = await db.Patients.SingleAsync();
        Assert.Equal("Durand", saved.LastName);
        Assert.Equal("Latex", saved.MedicalAllergies);
    }

    [Fact]
    public async Task Update_NonExistentPatient_ReturnsNotFound()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);

        var result = await controller.Update(999, new UpdatePatientRequest
        {
            FirstName = "Ghost",
            LastName = "User",
            Email = "ghost@example.com",
        });

        var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
    }

    [Fact]
    public async Task Update_KeepingOwnEmail_Succeeds()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);
        var create = Assert.IsType<CreatedAtActionResult>((await controller.Create(ValidRequest())).Result);
        var id = ((PatientResponse)create.Value!).Id;

        // Re-submitting the same email (different casing) for the same patient is not a conflict.
        var result = await controller.Update(id, new UpdatePatientRequest
        {
            FirstName = "Marie",
            LastName = "Dubois",
            Email = "MARIE.DUBOIS@example.com",
        });

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task Update_EmailTakenByAnotherPatient_ReturnsConflict()
    {
        await using var db = NewContext();
        var controller = new PatientsController(db);
        await controller.Create(ValidRequest()); // marie.dubois@example.com
        var second = ValidRequest();
        second.Email = "lucas@example.com";
        var created = Assert.IsType<CreatedAtActionResult>((await controller.Create(second)).Result);
        var secondId = ((PatientResponse)created.Value!).Id;

        // Try to change the second patient's email to the first patient's email.
        var result = await controller.Update(secondId, new UpdatePatientRequest
        {
            FirstName = "Lucas",
            LastName = "Moreau",
            Email = "marie.dubois@example.com",
        });

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
    }
}
