using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces
{
    public interface IEventRepository
    {
        Task<IEnumerable<Event>> GetAllAsync();

        Task<Event?> GetByIdAsync(int id);

        Task<Event> AddAsync(Event eventEntity);

        Task UpdateAsync(Event eventEntity);

        Task DeleteAsync(Event eventEntity);

        Task<bool> HasOverlapAsync(
            int venueId,
            DateOnly eventDate,
            TimeOnly startTime,
            TimeOnly endTime,
            int? excludeEventId = null);
    }
}
