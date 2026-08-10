using EventParkingReservationSystem.API.Helpers;
using EventParkingReservationSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Data;

public sealed class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly PasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(
        ApplicationDbContext context,
        PasswordHasher passwordHasher,
        IConfiguration configuration,
        ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
    }

    // Creates the first administrator account when it does not exist.
    public async Task SeedAsync(
        CancellationToken cancellationToken = default)
    {
        string adminName =
            _configuration["AdminSeed:Name"]?.Trim()
            ?? string.Empty;

        string adminEmail =
            _configuration["AdminSeed:Email"]?
                .Trim()
                .ToLowerInvariant()
            ?? string.Empty;

        string adminPassword =
            _configuration["AdminSeed:Password"]
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(adminName) ||
            string.IsNullOrWhiteSpace(adminEmail) ||
            string.IsNullOrWhiteSpace(adminPassword))
        {
            _logger.LogWarning(
                "Default admin was not created because AdminSeed configuration is incomplete.");

            return;
        }

        bool adminExists =
            await _context.Admins.AnyAsync(
                admin => admin.Email == adminEmail,
                cancellationToken);

        if (adminExists)
        {
            _logger.LogInformation(
                "Default administrator already exists.");

            return;
        }

        var admin = new Admin
        {
            Name = adminName,
            Email = adminEmail,
            PasswordHash =
                _passwordHasher.HashPassword(adminPassword),
            Role = "Administrator",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Admins.AddAsync(
            admin,
            cancellationToken);

        await _context.SaveChangesAsync(
            cancellationToken);

        _logger.LogInformation(
            "Default administrator account was created successfully.");
    }
}
