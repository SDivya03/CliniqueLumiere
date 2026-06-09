using CliniqueLumiere.Api.Controllers;
using CliniqueLumiere.Api.Data;
using CliniqueLumiere.Api.Dtos;
using CliniqueLumiere.Api.Models;
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
}
