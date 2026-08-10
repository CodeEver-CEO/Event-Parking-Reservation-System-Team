using EventParkingReservationSystem.API.DTOs.Events;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IVenueRepository _venueRepository;
        private readonly ICategoryRepository _categoryRepository;

        public EventService(
            IEventRepository eventRepository,
            IVenueRepository venueRepository,
            ICategoryRepository categoryRepository)
        {
            _eventRepository = eventRepository;
            _venueRepository = venueRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task<IEnumerable<EventDto>> GetAllAsync()
        {
            var events = await _eventRepository.GetAllAsync();

            return events.Select(MapToDto);
        }

        public async Task<EventDto?> GetByIdAsync(int id)
        {
            var eventEntity = await _eventRepository.GetByIdAsync(id);

            if (eventEntity == null)
                return null;

            return MapToDto(eventEntity);
        }

        public async Task<(bool Success, string Message, EventDto? Data)>
            CreateAsync(CreateEventDto dto)
        {
            if (dto.StartTime >= dto.EndTime)
                return (false,
                    "Start time must be earlier than end time.",
                    null);

            var venue = await _venueRepository.GetByIdAsync(dto.VenueId);

            if (venue == null)
                return (false, "Venue not found.", null);

            var category =
                await _categoryRepository.GetByIdAsync(dto.CategoryId);

            if (category == null)
                return (false, "Category not found.", null);

            if (dto.Capacity > venue.TotalCapacity)
            {
                return (false,
                    "Event capacity cannot exceed venue capacity.",
                    null);
            }

            var hasOverlap = await _eventRepository.HasOverlapAsync(
                dto.VenueId,
                dto.EventDate,
                dto.StartTime,
                dto.EndTime);

            if (hasOverlap)
            {
                return (false,
                    "Venue is already booked for the selected date and time.",
                    null);
            }

            var eventEntity = new Event
            {
                Name = dto.Name,
                VenueId = dto.VenueId,
                CategoryId = dto.CategoryId,
                EventDate = dto.EventDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                TicketPrice = dto.TicketPrice,
                Capacity = dto.Capacity,
                Description = dto.Description
            };

            var createdEvent =
                await _eventRepository.AddAsync(eventEntity);

            // Load Venue and Category for response
            var loadedEvent =
                await _eventRepository.GetByIdAsync(createdEvent.EventId);

            return (
                true,
                "Event created successfully.",
                loadedEvent == null ? null : MapToDto(loadedEvent)
            );
        }

        public async Task<(bool Success, string Message)>
            UpdateAsync(int id, UpdateEventDto dto)
        {
            var eventEntity =
                await _eventRepository.GetByIdAsync(id);

            if (eventEntity == null)
                return (false, "Event not found.");

            if (dto.StartTime >= dto.EndTime)
                return (false,
                    "Start time must be earlier than end time.");

            var venue =
                await _venueRepository.GetByIdAsync(dto.VenueId);

            if (venue == null)
                return (false, "Venue not found.");

            var category =
                await _categoryRepository.GetByIdAsync(dto.CategoryId);

            if (category == null)
                return (false, "Category not found.");

            if (dto.Capacity > venue.TotalCapacity)
            {
                return (false,
                    "Event capacity cannot exceed venue capacity.");
            }

            var hasOverlap =
                await _eventRepository.HasOverlapAsync(
                    dto.VenueId,
                    dto.EventDate,
                    dto.StartTime,
                    dto.EndTime,
                    id);

            if (hasOverlap)
            {
                return (false,
                    "Venue is already booked for the selected date and time.");
            }

            eventEntity.Name = dto.Name;
            eventEntity.VenueId = dto.VenueId;
            eventEntity.CategoryId = dto.CategoryId;
            eventEntity.EventDate = dto.EventDate;
            eventEntity.StartTime = dto.StartTime;
            eventEntity.EndTime = dto.EndTime;
            eventEntity.TicketPrice = dto.TicketPrice;
            eventEntity.Capacity = dto.Capacity;
            eventEntity.Description = dto.Description;

            await _eventRepository.UpdateAsync(eventEntity);

            return (true, "Event updated successfully.");
        }

        public async Task<(bool Success, string Message)>
            DeleteAsync(int id)
        {
            var eventEntity =
                await _eventRepository.GetByIdAsync(id);

            if (eventEntity == null)
                return (false, "Event not found.");

            await _eventRepository.DeleteAsync(eventEntity);

            return (true, "Event deleted successfully.");
        }

        private static EventDto MapToDto(Event eventEntity)
        {
            return new EventDto
            {
                EventId = eventEntity.EventId,
                Name = eventEntity.Name,

                VenueId = eventEntity.VenueId,
                VenueName = eventEntity.Venue?.Name ?? string.Empty,

                CategoryId = eventEntity.CategoryId,
                CategoryName =
                    eventEntity.EventCategory?.Name ?? string.Empty,

                EventDate = eventEntity.EventDate,
                StartTime = eventEntity.StartTime,
                EndTime = eventEntity.EndTime,
                TicketPrice = eventEntity.TicketPrice,
                Capacity = eventEntity.Capacity,
                Description = eventEntity.Description
            };
        }
    }
}
