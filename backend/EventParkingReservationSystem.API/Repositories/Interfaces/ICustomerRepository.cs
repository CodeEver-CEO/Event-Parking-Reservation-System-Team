using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(int id);

    Task<Customer?> GetByEmailAsync(string email);

    Task<Customer?> GetByEmailVerificationTokenHashAsync(
        string tokenHash);

    Task<IReadOnlyList<Customer>> SearchAsync(string? search);

    Task<bool> EmailExistsAsync(string email);

    // Finds a customer using the email-verification token hash.
    Task<Customer?> GetByEmailVerificationTokenHashAsync(
        string tokenHash);

    // Finds a customer using the password-reset token hash.
    Task<Customer?> GetByPasswordResetTokenHashAsync(
        string tokenHash);

    Task AddAsync(Customer customer);

    Task SaveChangesAsync();
}