namespace EventParkingReservationSystem.API.Helpers;

// Holds the generated access token and its expiry time.
public sealed record JwtTokenResult(
    string AccessToken,
    DateTime ExpiresAtUtc);