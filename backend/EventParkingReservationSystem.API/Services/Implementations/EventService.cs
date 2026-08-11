using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.DTOs.Events;
using EventParkingReservationSystem.API.DTOs.Notifications;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Services.Implementations
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;
        private readonly IVenueRepository _venueRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public EventService(
            IEventRepository eventRepository,
            IVenueRepository venueRepository,
            ICategoryRepository categoryRepository,
            ApplicationDbContext context,
            INotificationService notificationService)
        {
            _eventRepository = eventRepository;
            _venueRepository = venueRepository;
            _categoryRepository = categoryRepository;
            _context = context;
            _notificationService = notificationService;
        }

        // ============================================================
        // GET ALL EVENTS
        // ============================================================

        public async Task<IEnumerable<EventDto>> GetAllAsync(
            string? name = null,
            DateOnly? date = null,
            int? venueId = null,
            int? categoryId = null)
        {
            var events =
                await _eventRepository.GetAllAsync();

            var query = events.AsEnumerable();

            // ========================================================
            // OPTIONAL FILTERS (BRD Module 3)
            // ========================================================

            if (!string.IsNullOrWhiteSpace(name))
            {
                var trimmedName = name.Trim();

                query = query.Where(e =>
                    !string.IsNullOrEmpty(e.Name) &&
                    e.Name.Contains(
                        trimmedName,
                        StringComparison.OrdinalIgnoreCase));
            }

            if (date.HasValue)
            {
                query = query.Where(e =>
                    e.EventDate == date.Value);
            }

            if (venueId.HasValue)
            {
                query = query.Where(e =>
                    e.VenueId == venueId.Value);
            }

            if (categoryId.HasValue)
            {
                query = query.Where(e =>
                    e.CategoryId == categoryId.Value);
            }

            return query
                .Select(MapToDto)
                .ToList();
        }

        // ============================================================
        // GET EVENT BY ID
        // ============================================================

        public async Task<EventDto?> GetByIdAsync(int id)
        {
            var eventEntity =
                await _eventRepository.GetByIdAsync(id);

            if (eventEntity == null)
            {
                return null;
            }

            return MapToDto(eventEntity);
        }

        // ============================================================
        // CREATE EVENT
        // ============================================================

        public async Task<(
            bool Success,
            string Message,
            EventDto? Data)>
            CreateAsync(CreateEventDto dto)
        {
            if (dto.StartTime >= dto.EndTime)
            {
                return (
                    false,
                    "Start time must be earlier than end time.",
                    null
                );
            }

            var venue =
                await _venueRepository
                    .GetByIdAsync(dto.VenueId);

            if (venue == null)
            {
                return (
                    false,
                    "Venue not found.",
                    null
                );
            }

            var category =
                await _categoryRepository
                    .GetByIdAsync(dto.CategoryId);

            if (category == null)
            {
                return (
                    false,
                    "Category not found.",
                    null
                );
            }

            if (dto.Capacity > venue.TotalCapacity)
            {
                return (
                    false,
                    "Event capacity cannot exceed venue capacity.",
                    null
                );
            }

            var hasOverlap =
                await _eventRepository
                    .HasOverlapAsync(
                        dto.VenueId,
                        dto.EventDate,
                        dto.StartTime,
                        dto.EndTime);

            if (hasOverlap)
            {
                return (
                    false,
                    "Venue is already booked for the selected date and time.",
                    null
                );
            }

            var eventEntity =
                new Event
                {
                    Name =
                        dto.Name,

                    VenueId =
                        dto.VenueId,

                    CategoryId =
                        dto.CategoryId,

                    EventDate =
                        dto.EventDate,

                    StartTime =
                        dto.StartTime,

                    EndTime =
                        dto.EndTime,

                    TicketPrice =
                        dto.TicketPrice,

                    Capacity =
                        dto.Capacity,

                    Description =
                        dto.Description
                };

            var createdEvent =
                await _eventRepository
                    .AddAsync(eventEntity);

            // Load Venue and Category for response
            var loadedEvent =
                await _eventRepository
                    .GetByIdAsync(
                        createdEvent.EventId);

            return (
                true,
                "Event created successfully.",
                loadedEvent == null
                    ? null
                    : MapToDto(loadedEvent)
            );
        }

        // ============================================================
        // UPDATE EVENT
        // ============================================================

        public async Task<(
            bool Success,
            string Message)>
            UpdateAsync(
                int id,
                UpdateEventDto dto)
        {
            var eventEntity =
                await _eventRepository
                    .GetByIdAsync(id);

            if (eventEntity == null)
            {
                return (
                    false,
                    "Event not found."
                );
            }

            if (dto.StartTime >= dto.EndTime)
            {
                return (
                    false,
                    "Start time must be earlier than end time."
                );
            }

            var venue =
                await _venueRepository
                    .GetByIdAsync(
                        dto.VenueId);

            if (venue == null)
            {
                return (
                    false,
                    "Venue not found."
                );
            }

            var category =
                await _categoryRepository
                    .GetByIdAsync(
                        dto.CategoryId);

            if (category == null)
            {
                return (
                    false,
                    "Category not found."
                );
            }

            if (dto.Capacity >
                venue.TotalCapacity)
            {
                return (
                    false,
                    "Event capacity cannot exceed venue capacity."
                );
            }

            var hasOverlap =
                await _eventRepository
                    .HasOverlapAsync(
                        dto.VenueId,
                        dto.EventDate,
                        dto.StartTime,
                        dto.EndTime,
                        id);

            if (hasOverlap)
            {
                return (
                    false,
                    "Venue is already booked for the selected date and time."
                );
            }

            // ========================================================
            // UPDATE EVENT DATA
            // ========================================================

            eventEntity.Name =
                dto.Name;

            eventEntity.VenueId =
                dto.VenueId;

            eventEntity.CategoryId =
                dto.CategoryId;

            eventEntity.EventDate =
                dto.EventDate;

            eventEntity.StartTime =
                dto.StartTime;

            eventEntity.EndTime =
                dto.EndTime;

            eventEntity.TicketPrice =
                dto.TicketPrice;

            eventEntity.Capacity =
                dto.Capacity;

            eventEntity.Description =
                dto.Description;

            await _eventRepository
                .UpdateAsync(eventEntity);

            // ========================================================
            // EVENT UPDATED NOTIFICATION
            // ========================================================

            var customerIds =
                await _context.Bookings
                    .Where(b =>
                        b.EventId == id &&
                        (
                            b.Status ==
                                BookingStatus.Pending ||

                            b.Status ==
                                BookingStatus.Confirmed
                        ))
                    .Select(b =>
                        b.CustomerId)
                    .Distinct()
                    .ToListAsync();

            foreach (var customerId
                in customerIds)
            {
                await _notificationService
                    .CreateNotificationAsync(
                        new CreateNotificationDto
                        {
                            CustomerId =
                                customerId,

                            BookingId =
                                null,

                            EventId =
                                eventEntity.EventId,

                            Type =
                                NotificationType.EventUpdated,

                            Title =
                                "Event updated",

                            Message =
                                $"Event {eventEntity.Name} has been updated. " +
                                $"Date: {eventEntity.EventDate:yyyy-MM-dd}, " +
                                $"Time: {eventEntity.StartTime:hh\\:mm} - " +
                                $"{eventEntity.EndTime:hh\\:mm}."
                        });
            }

            return (
                true,
                "Event updated successfully."
            );
        }

        // ============================================================
        // DELETE EVENT
        // ============================================================

        public async Task<(
            bool Success,
            string Message)>
            DeleteAsync(int id)
        {
            var eventEntity =
                await _eventRepository
                    .GetByIdAsync(id);

            if (eventEntity == null)
            {
                return (
                    false,
                    "Event not found."
                );
            }

            await _eventRepository
                .DeleteAsync(eventEntity);

            return (
                true,
                "Event deleted successfully."
            );
        }

        // ============================================================
        // MAP EVENT TO DTO
        // ============================================================

        private static EventDto MapToDto(
            Event eventEntity)
        {
            return new EventDto
            {
                EventId =
                    eventEntity.EventId,

                Name =
                    eventEntity.Name,

                VenueId =
                    eventEntity.VenueId,

                VenueName =
                    eventEntity.Venue?.Name
                    ?? string.Empty,

                CategoryId =
                    eventEntity.CategoryId,

                CategoryName =
                    eventEntity.EventCategory?.Name
                    ?? string.Empty,

                EventDate =
                    eventEntity.EventDate,

                StartTime =
                    eventEntity.StartTime,

                EndTime =
                    eventEntity.EndTime,

                TicketPrice =
                    eventEntity.TicketPrice,

                Capacity =
                    eventEntity.Capacity,

                Description =
                    eventEntity.Description
            };
        }
    }
}