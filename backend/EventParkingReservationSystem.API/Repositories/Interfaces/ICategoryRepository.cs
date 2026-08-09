using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<EventCategory>> GetAllAsync();

        Task<EventCategory?> GetByIdAsync(int id);

        Task<EventCategory> AddAsync(EventCategory category);

        Task UpdateAsync(EventCategory category);

        Task DeleteAsync(EventCategory category);

        Task<bool> IsInUseAsync(int categoryId);
    }
}
