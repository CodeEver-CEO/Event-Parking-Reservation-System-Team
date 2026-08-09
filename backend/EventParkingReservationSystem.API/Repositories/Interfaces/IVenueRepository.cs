using EventParkingReservationSystem.API.Models;
namespace EventParkingReservationSystem.API.Repositories.Interfaces
{
    public interface IVenueRepository
    {
        Task<IEnumerable<Venue>> GetAllAsync();

        Task<Venue?> GetByIdAsync(int id);

        Task<Venue> AddAsync(Venue venue);

        Task UpdateAsync(Venue venue);

        Task DeleteAsync(Venue venue);

        Task<bool> HasUpcomingEventsAsync(int venueId);

        Task<bool> IsAvailableAsync(
            int venueId,
            DateOnly date,
            TimeOnly startTime,
            TimeOnly endTime,
            int? excludeEventId = null);
    }
}