using EventParkingReservationSystem.API.DTOs.Venues;

namespace EventParkingReservationSystem.API.Services.Interfaces
{
    public interface IVenueService
    {
        Task<IEnumerable<VenueDto>> GetAllAsync();

        Task<VenueDto?> GetByIdAsync(int id);

        Task<VenueDto> CreateAsync(CreateVenueDto dto);

        Task<bool> UpdateAsync(int id, UpdateVenueDto dto);

        Task<(bool Success, string Message)> DeleteAsync(int id);

        Task<bool> CheckAvailabilityAsync(
            int venueId,
            DateOnly date,
            TimeOnly startTime,
            TimeOnly endTime);
    }
}
