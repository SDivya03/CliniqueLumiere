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

    public DbSet<Service> Services => Set<Service>();

    public DbSet<Practitioner> Practitioners => Set<Practitioner>();

    public DbSet<Appointment> Appointments => Set<Appointment>();

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

        var service = modelBuilder.Entity<Service>();
        service.HasKey(s => s.Id);
        service.Property(s => s.Name).IsRequired().HasMaxLength(120);
        service.Property(s => s.Price).HasColumnType("decimal(10,2)");

        var practitioner = modelBuilder.Entity<Practitioner>();
        practitioner.HasKey(pr => pr.Id);
        practitioner.Property(pr => pr.FirstName).IsRequired().HasMaxLength(80);
        practitioner.Property(pr => pr.LastName).IsRequired().HasMaxLength(80);
        practitioner.Property(pr => pr.Specialty).IsRequired().HasMaxLength(100);

        var appointment = modelBuilder.Entity<Appointment>();
        appointment.HasKey(a => a.Id);
        appointment.HasOne(a => a.Patient).WithMany().HasForeignKey(a => a.PatientId);
        appointment.HasOne(a => a.Practitioner).WithMany().HasForeignKey(a => a.PractitionerId);
        appointment.HasOne(a => a.Service).WithMany().HasForeignKey(a => a.ServiceId);
        patient.Property(p => p.MedicalAllergies).HasMaxLength(2000);
        patient.Property(p => p.MedicalMedications).HasMaxLength(2000);
        patient.Property(p => p.MedicalConditions).HasMaxLength(2000);
        patient.Property(p => p.MedicalNotes).HasMaxLength(2000);
    }
}
