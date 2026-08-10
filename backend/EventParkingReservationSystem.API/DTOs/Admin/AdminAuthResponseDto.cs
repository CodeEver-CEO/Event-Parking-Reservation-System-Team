namespace EventParkingReservationSystem.API.DTOs.Admin;

public sealed class AdminAuthResponseDto
{
    // JWT access token used for admin-protected endpoints.
    public string AccessToken { get; set; } = string.Empty;

    // Authentication scheme used with the token.
    public string TokenType { get; set; } = "Bearer";

    // Date and time when the token expires.
    public DateTime ExpiresAt { get; set; }

    // Logged-in administrator details.
    public AdminResponseDto Admin { get; set; } = new();
}