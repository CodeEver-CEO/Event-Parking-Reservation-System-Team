using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces;

public interface IAdminRepository
{
    // Finds an administrator using the database ID.
    Task<Admin?> GetByIdAsync(int id);

    // Finds an administrator using the normalized email address.
    Task<Admin?> GetByEmailAsync(string email);

    // Saves pending administrator changes to the database.
    Task SaveChangesAsync();
}