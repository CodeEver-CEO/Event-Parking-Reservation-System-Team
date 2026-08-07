namespace EventParkingReservationSystem.API.Helpers;

public class PasswordHasher
{
    private const int WorkFactor = 12;

    public string HashPassword(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        return BCrypt.Net.BCrypt.HashPassword(
            password,
            workFactor: WorkFactor);
    }

    public bool VerifyPassword(
        string password,
        string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        return BCrypt.Net.BCrypt.Verify(
            password,
            passwordHash);
    }
}
