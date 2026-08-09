using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces;

public interface ICustomerRepository
{
    // Finds a customer using the database ID.
    Task<Customer?> GetByIdAsync(int id);

    // Finds a customer using the normalized email address.
    Task<Customer?> GetByEmailAsync(string email);

    // Finds a customer using the email-verification token hash.
    Task<Customer?> GetByEmailVerificationTokenHashAsync(
        string tokenHash);

    // Finds a customer using the password-reset token hash.
    Task<Customer?> GetByPasswordResetTokenHashAsync(
        string tokenHash);

    // Searches customers using name, email, or phone.
    Task<IReadOnlyList<Customer>> SearchAsync(
        string? search);

    // Checks whether a customer email already exists.
    Task<bool> EmailExistsAsync(string email);

    // Adds a new customer.
    Task AddAsync(Customer customer);

    // Saves pending database changes.
    Task SaveChangesAsync();

    // Gets a tracked customer for profile or status updates.
    Task<Customer?> GetByIdForUpdateAsync(int id);

    // Returns the total number of bookings for a customer.
    Task<int> CountBookingsAsync(int customerId);


}
