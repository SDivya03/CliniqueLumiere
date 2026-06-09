using CliniqueLumiere.Api.Models;

namespace CliniqueLumiere.Api.Data;

/// <summary>Seeds demo patients so the app is usable on a fresh database.</summary>
public static class DbSeeder
{
    public static void Seed(ClinicDbContext db)
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
}
