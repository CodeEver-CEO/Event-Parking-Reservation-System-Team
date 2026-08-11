

namespace EventParkingReservationSystem.API.Helpers;

public sealed class PasswordHasher
{
    private const int WorkFactor = 12;

    // Creates a secure BCrypt password hash.
    public string HashPassword(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        return global::BCrypt.Net.BCrypt.HashPassword(
            password,
            workFactor: WorkFactor);
    }

    // Verifies a plain password against a stored BCrypt hash.
    public bool VerifyPassword(
        string password,
        string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        return global::BCrypt.Net.BCrypt.Verify(
            password,
            passwordHash);
    }

    // Supports services that call Hash().
    public string Hash(string password)
    {
        return HashPassword(password);
    }

    // Supports services that call Verify().
    public bool Verify(
        string password,
        string passwordHash)
    {
        return VerifyPassword(password, passwordHash);
    }
}