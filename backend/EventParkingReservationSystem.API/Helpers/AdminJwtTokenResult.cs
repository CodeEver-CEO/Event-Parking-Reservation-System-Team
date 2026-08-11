namespace EventParkingReservationSystem.API.Helpers;

public sealed class AdminJwtTokenResult
{
    // Generated JWT access token.
    public string AccessToken { get; init; } = string.Empty;

    // Date and time when the token expires.
    public DateTime ExpiresAt { get; init; }
}