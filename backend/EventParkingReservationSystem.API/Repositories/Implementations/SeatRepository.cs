using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations;

public class SeatRepository : ISeatRepository
{
    private readonly ApplicationDbContext _context;

    public SeatRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ----------------------------------------------------
    // Get Event
    // ----------------------------------------------------
    public async Task<Event?> GetEventByIdAsync(
        int eventId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(
                e => e.Id == eventId,
                cancellationToken);
    }

    // ----------------------------------------------------
    // Get Booking
    // ----------------------------------------------------
    public async Task<Booking?> GetBookingByIdAsync(
        int bookingId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .FirstOrDefaultAsync(
                b => b.BookingId == bookingId,
                cancellationToken);
    }

    // ----------------------------------------------------
    // Get all seats for an event
    // ----------------------------------------------------
    public async Task<IReadOnlyList<Seat>> GetByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Seats
            .AsNoTracking()
            .Where(s => s.EventId == eventId)
            .OrderBy(s => s.RowLabel)
            .ThenBy(s => s.ColumnNumber)
            .ToListAsync(cancellationToken);
    }

    // ----------------------------------------------------
    // Get one seat by Id
    // Tracked because Service may update/delete it
    // ----------------------------------------------------
    public async Task<Seat?> GetByIdAsync(
        int seatId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Seats
            .FirstOrDefaultAsync(
                s => s.Id == seatId,
                cancellationToken);
    }

    // ----------------------------------------------------
    // Get multiple selected seats
    // Tracked because Service changes status to Held
    // ----------------------------------------------------
    public async Task<List<Seat>> GetByIdsAsync(
        IEnumerable<int> seatIds,
        CancellationToken cancellationToken = default)
    {
        var ids = seatIds
            .Distinct()
            .ToList();

        return await _context.Seats
            .Where(s => ids.Contains(s.Id))
            .ToListAsync(cancellationToken);
    }

    // ----------------------------------------------------
    // Check whether event already has a seat map
    // ----------------------------------------------------
    public async Task<bool> SeatMapExistsAsync(
        int eventId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Seats
            .AnyAsync(
                s => s.EventId == eventId,
                cancellationToken);
    }

    // ----------------------------------------------------
    // Check duplicate seat number inside same event
    // ----------------------------------------------------
    public async Task<bool> SeatNumberExistsAsync(
        int eventId,
        string seatNumber,
        int? excludeSeatId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedSeatNumber = seatNumber
            .Trim()
            .ToUpperInvariant();

        var query = _context.Seats
            .Where(s =>
                s.EventId == eventId &&
                s.SeatNumber == normalizedSeatNumber);

        if (excludeSeatId.HasValue)
        {
            query = query.Where(
                s => s.Id != excludeSeatId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    // ----------------------------------------------------
    // Check whether seat has an ACTIVE booking allocation
    // ----------------------------------------------------
    public async Task<bool> HasActiveBookingAsync(
        int seatId,
        CancellationToken cancellationToken = default)
    {
        return await _context.BookingSeats
            .AnyAsync(
                bs =>
                    bs.SeatId == seatId &&
                    bs.IsActive,
                cancellationToken);
    }

    // ----------------------------------------------------
    // Check whether booking already has active seats
    // ----------------------------------------------------
    public async Task<bool> BookingHasActiveSeatsAsync(
        int bookingId,
        CancellationToken cancellationToken = default)
    {
        return await _context.BookingSeats
            .AnyAsync(
                bs =>
                    bs.BookingId == bookingId &&
                    bs.IsActive,
                cancellationToken);
    }

    // ----------------------------------------------------
    // Add generated seat map
    // ----------------------------------------------------
    public async Task AddSeatsAsync(
        IEnumerable<Seat> seats,
        CancellationToken cancellationToken = default)
    {
        await _context.Seats.AddRangeAsync(
            seats,
            cancellationToken);
    }

    // ----------------------------------------------------
    // Add seat allocations to booking
    // ----------------------------------------------------
    public async Task AddBookingSeatsAsync(
        IEnumerable<BookingSeat> bookingSeats,
        CancellationToken cancellationToken = default)
    {
        await _context.BookingSeats.AddRangeAsync(
            bookingSeats,
            cancellationToken);
    }

    // ----------------------------------------------------
    // Update seat
    // ----------------------------------------------------
    public void UpdateSeat(Seat seat)
    {
        _context.Seats.Update(seat);
    }

    // ----------------------------------------------------
    // Delete seat
    // ----------------------------------------------------
    public void RemoveSeat(Seat seat)
    {
        _context.Seats.Remove(seat);
    }

    // ----------------------------------------------------
    // Save database changes
    // ----------------------------------------------------
    public async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(
            cancellationToken);
    }
}