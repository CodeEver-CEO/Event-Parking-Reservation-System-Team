using EventParkingReservationSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("Customers");

            entity.HasKey(customer => customer.Id);

            entity.HasIndex(customer => customer.Email)
                .IsUnique();

            entity.Property(customer => customer.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(customer => customer.Email)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(customer => customer.Phone)
                .HasMaxLength(20);

            entity.Property(customer => customer.PasswordHash)
                .IsRequired();

            entity.Property(customer => customer.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.Property(customer => customer.Role)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.Property(customer => customer.EmailVerificationTokenHash)
                .HasMaxLength(256);

            entity.Property(customer => customer.PasswordResetTokenHash)
                .HasMaxLength(256);
        });
    }
}