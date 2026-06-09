using CliniqueLumiere.Api.Models;

namespace CliniqueLumiere.Api.Data;

/// <summary>Seeds demo data (patients, services, practitioners) so the app is usable on a fresh database.</summary>
public static class DbSeeder
{
    public static void Seed(ClinicDbContext db)
    {
        SeedPatients(db);
        SeedServices(db);
        SeedPractitioners(db);
    }

    private static void SeedPatients(ClinicDbContext db)
    {
        if (db.Patients.Any())
        {
            return;
        }

        db.Patients.AddRange(
            new Patient
            {
                FirstName = "Sophie",
                LastName = "Bernard",
                Email = "sophie.bernard@example.com",
                Phone = "+33 6 12 34 56 78",
                DateOfBirth = "1988-04-12",
                Gender = "Female",
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new Patient
            {
                FirstName = "Lucas",
                LastName = "Moreau",
                Email = "lucas.moreau@example.com",
                Phone = "+33 6 98 76 54 32",
                DateOfBirth = "1975-11-30",
                Gender = "Male",
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new Patient
            {
                FirstName = "Amira",
                LastName = "Haddad",
                Email = "amira.haddad@example.com",
                Phone = null,
                DateOfBirth = "1993-07-08",
                Gender = "Female",
                EmergencyContactName = "Karim Haddad",
                EmergencyContactPhone = "+33 7 01 02 03 04",
                CreatedAt = DateTimeOffset.UtcNow,
            });

        db.SaveChanges();
    }

    private static void SeedServices(ClinicDbContext db)
    {
        if (db.Services.Any())
        {
            return;
        }

        db.Services.AddRange(
            new Service { Name = "Initial Consultation", DurationMinutes = 60, Price = 120m },
            new Service { Name = "Follow-up Consultation", DurationMinutes = 30, Price = 70m },
            new Service { Name = "Physiotherapy Session", DurationMinutes = 45, Price = 90m },
            new Service { Name = "Nutritional Counselling", DurationMinutes = 50, Price = 85m },
            new Service { Name = "Relaxation Massage", DurationMinutes = 60, Price = 95m });

        db.SaveChanges();
    }

    private static void SeedPractitioners(ClinicDbContext db)
    {
        if (db.Practitioners.Any())
        {
            return;
        }

        db.Practitioners.AddRange(
            new Practitioner { FirstName = "Claire", LastName = "Dubois", Specialty = "General Practitioner" },
            new Practitioner { FirstName = "Marc", LastName = "Fontaine", Specialty = "Physiotherapist" },
            new Practitioner { FirstName = "Nadia", LastName = "Khalil", Specialty = "Nutritionist" });

        db.SaveChanges();
    }
}
