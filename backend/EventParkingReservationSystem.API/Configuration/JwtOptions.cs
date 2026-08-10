namespace EventParkingReservationSystem.API.Configuration;

public sealed class JwtOptions
{
    // Defines the configuration section name used in appsettings.json.
    public const string SectionName = "Jwt";

    // Secret key used to sign and validate JWT access tokens.
    public string Key { get; set; } = string.Empty;

    // Identifies the API that issued the token.
    public string Issuer { get; set; } = string.Empty;

    // Identifies the client allowed to use the token.
    public string Audience { get; set; } = string.Empty;

    // Controls how long the access token remains valid.
    public int AccessTokenMinutes { get; set; } = 60;
}