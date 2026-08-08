using System.Security.Cryptography;

namespace EventParkingReservationSystem.API.Helpers;

public sealed class SecureTokenGenerator
{
    // Generates a cryptographically secure token for verification links.
    public string GenerateToken()
    {
        byte[] bytes = new byte[32];

        using var randomGenerator =
            RandomNumberGenerator.Create();

        randomGenerator.GetBytes(bytes);

        return Convert.ToBase64String(bytes);
    }

    // Hashes the token before storing it in the database.
    public string HashToken(string token)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);

        using var sha256 = SHA256.Create();

        byte[] tokenBytes =
            System.Text.Encoding.UTF8.GetBytes(token);

        byte[] hashBytes =
            sha256.ComputeHash(tokenBytes);

        return Convert.ToHexString(hashBytes);
    }
}