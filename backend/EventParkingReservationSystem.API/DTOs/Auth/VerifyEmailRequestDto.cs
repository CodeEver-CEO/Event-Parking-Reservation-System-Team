using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Auth;

public sealed class VerifyEmailRequestDto
{
    [Required(ErrorMessage = "Verification token is required.")]
    public string Token { get; set; } = string.Empty;
}