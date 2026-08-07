using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(int id);

    Task<Customer?> GetByEmailAsync(string email);

    Task<IReadOnlyList<Customer>> SearchAsync(string? search);

    Task<bool> EmailExistsAsync(string email);

    Task AddAsync(Customer customer);

    Task SaveChangesAsync();
}
