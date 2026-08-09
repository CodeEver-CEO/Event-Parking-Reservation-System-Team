using System.Security.Cryptography;
using System.Text;

namespace EventParkingReservationSystem.API.Helpers;

public sealed class SecureTokenGenerator
{
    private const int TokenByteLength = 32;

    // Generates a cryptographically secure, URL-safe token. The token is
    // delivered inside verification and password-reset links, so it must not
    // contain characters ('+', '/', '=') that change meaning in a URL.
    public string GenerateToken()
    {
        byte[] bytes = RandomNumberGenerator.GetBytes(TokenByteLength);

        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    // Hashes the token with SHA-256 before it is stored, so a database leak
    // never exposes a usable token.
    public string HashToken(string token)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);

        byte[] hashBytes =
            SHA256.HashData(Encoding.UTF8.GetBytes(token));

        return Convert.ToHexString(hashBytes);
    }
}
