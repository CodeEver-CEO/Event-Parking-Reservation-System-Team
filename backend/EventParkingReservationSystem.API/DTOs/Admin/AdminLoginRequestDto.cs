using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Admin;

public sealed class AdminLoginRequestDto
{
    // Administrator login email.
    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    // Administrator login password.
    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}