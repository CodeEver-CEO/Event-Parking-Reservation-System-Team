using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations
{
    public class EventRepository : IEventRepository
    {
        private readonly ApplicationDbContext _context;

        public EventRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Event>> GetAllAsync()
        {
            return await _context.Events
                .AsNoTracking()
                .Include(e => e.Venue)
                .Include(e => e.EventCategory)
                .ToListAsync();
        }

        public async Task<Event?> GetByIdAsync(int id)
        {
            return await _context.Events
                .Include(e => e.Venue)
                .Include(e => e.EventCategory)
                .FirstOrDefaultAsync(e => e.EventId == id);
        }

        public async Task<Event> AddAsync(Event eventEntity)
        {
            await _context.Events.AddAsync(eventEntity);
            await _context.SaveChangesAsync();

            return eventEntity;
        }

        public async Task UpdateAsync(Event eventEntity)
        {
            _context.Events.Update(eventEntity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Event eventEntity)
        {
            _context.Events.Remove(eventEntity);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> HasOverlapAsync(
            int venueId,
            DateOnly eventDate,
            TimeOnly startTime,
            TimeOnly endTime,
            int? excludeEventId = null)
        {
            return await _context.Events
                .AnyAsync(e =>
                    e.VenueId == venueId &&
                    e.EventDate == eventDate &&
                    (!excludeEventId.HasValue ||
                     e.EventId != excludeEventId.Value) &&
                    startTime < e.EndTime &&
                    endTime > e.StartTime);
        }
    }
}
