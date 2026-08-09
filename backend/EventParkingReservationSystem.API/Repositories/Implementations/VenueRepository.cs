using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations
{
    public class VenueRepository : IVenueRepository
    {
        private readonly ApplicationDbContext _context;

        public VenueRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Venue>> GetAllAsync()
        {
            return await _context.Venues
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Venue?> GetByIdAsync(int id)
        {
            return await _context.Venues
                .FirstOrDefaultAsync(v => v.VenueId == id);
        }

        public async Task<Venue> AddAsync(Venue venue)
        {
            await _context.Venues.AddAsync(venue);
            await _context.SaveChangesAsync();

            return venue;
        }

        public async Task UpdateAsync(Venue venue)
        {
            _context.Venues.Update(venue);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Venue venue)
        {
            _context.Venues.Remove(venue);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> HasUpcomingEventsAsync(int venueId)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);

            return await _context.Events
                .AnyAsync(e =>
                    e.VenueId == venueId &&
                    e.EventDate >= today);
        }

        public async Task<bool> IsAvailableAsync(
            int venueId,
            DateOnly date,
            TimeOnly startTime,
            TimeOnly endTime,
            int? excludeEventId = null)
        {
            var hasOverlap = await _context.Events
                .AnyAsync(e =>
                    e.VenueId == venueId &&
                    e.EventDate == date &&
                    (!excludeEventId.HasValue ||
                     e.EventId != excludeEventId.Value) &&
                    startTime < e.EndTime &&
                    endTime > e.StartTime);

            return !hasOverlap;
        }
    }
}