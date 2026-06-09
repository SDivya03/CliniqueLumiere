using CliniqueLumiere.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CliniqueLumiere.Api.Data;

/// <summary>EF Core context backing the clinic SQLite database.</summary>
public class ClinicDbContext : DbContext
{
    public ClinicDbContext(DbContextOptions<ClinicDbContext> options)
        : base(options)
    {
    }

    public DbSet<Patient> Patients => Set<Patient>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var patient = modelBuilder.Entity<Patient>();
        patient.HasKey(p => p.Id);
        patient.Property(p => p.FirstName).IsRequired().HasMaxLength(80);
        patient.Property(p => p.LastName).IsRequired().HasMaxLength(80);
        patient.Property(p => p.Email).IsRequired().HasMaxLength(200);
        patient.HasIndex(p => p.Email).IsUnique();
        patient.Property(p => p.Phone).HasMaxLength(40);
        patient.Property(p => p.Gender).HasMaxLength(40);
        patient.Property(p => p.EmergencyContactName).HasMaxLength(120);
        patient.Property(p => p.EmergencyContactPhone).HasMaxLength(40);
    }
}
