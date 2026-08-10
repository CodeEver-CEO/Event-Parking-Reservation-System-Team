namespace EventParkingReservationSystem.API.DTOs.Admin;

public sealed class AdminResponseDto
{
    // Administrator database ID.
    public int Id { get; set; }

    // Administrator display name.
    public string Name { get; set; } = string.Empty;

    // Administrator login email.
    public string Email { get; set; } = string.Empty;

    // Administrator authorization role.
    public string Role { get; set; } = string.Empty;

    // Shows whether the administrator account is active.
    public bool IsActive { get; set; }

    // Most recent successful login date and time.
    public DateTime? LastLoginAt { get; set; }

    // Administrator account creation date.
    public DateTime CreatedAt { get; set; }
}