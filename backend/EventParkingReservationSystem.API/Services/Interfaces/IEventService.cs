using EventParkingReservationSystem.API.DTOs.Events;

namespace EventParkingReservationSystem.API.Services.Interfaces
{
    public interface IEventService
    {
        Task<IEnumerable<EventDto>> GetAllAsync(
            string? name = null,
            DateOnly? date = null,
            int? venueId = null,
            int? categoryId = null);

        Task<EventDto?> GetByIdAsync(int id);

        Task<(bool Success, string Message, EventDto? Data)>
            CreateAsync(CreateEventDto dto);

        Task<(bool Success, string Message)>
            UpdateAsync(int id, UpdateEventDto dto);

        Task<(bool Success, string Message)>
            DeleteAsync(int id);
    }
}