using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Auth;

public class RegisterRequestDto
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(
        100,
        MinimumLength = 2,
        ErrorMessage = "Name must contain between 2 and 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Enter a valid phone number.")]
    [MaxLength(20)]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Password is required.")]
    [StringLength(
        100,
        MinimumLength = 8,
        ErrorMessage = "Password must contain at least 8 characters.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password confirmation is required.")]
    [Compare(
        nameof(Password),
        ErrorMessage = "Password and confirmation password do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}