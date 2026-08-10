namespace EventParkingReservationSystem.API.Models;

public sealed class Admin
{
    // Primary key of the administrator.
    public int Id { get; set; }

    // Administrator's display name.
    public string Name { get; set; } = string.Empty;

    // Unique login email address.
    public string Email { get; set; } = string.Empty;

    // Securely hashed administrator password.
    public string PasswordHash { get; set; } = string.Empty;

    // Authorization role stored in the JWT.
    public string Role { get; set; } = "Admin";

    // Controls whether the administrator can log in.
    public bool IsActive { get; set; } = true;

    // Records the last successful login.
    public DateTime? LastLoginAt { get; set; }

    // Records when the account was created.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Records the most recent account update.
    public DateTime? UpdatedAt { get; set; }
}