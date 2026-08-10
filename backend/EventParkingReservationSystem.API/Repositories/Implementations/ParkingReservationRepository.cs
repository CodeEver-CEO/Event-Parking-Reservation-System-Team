using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;

using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations;

public class ParkingReservationRepository
    : IParkingReservationRepository
{
    private readonly ApplicationDbContext _context;

    public ParkingReservationRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Booking?> GetBookingAsync(
        int bookingId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .FirstOrDefaultAsync(
                booking => booking.Id == bookingId,
                cancellationToken);
    }

    public async Task<ParkingSlot?> GetParkingSlotAsync(
        int parkingSlotId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ParkingSlots
            .FirstOrDefaultAsync(
                parkingSlot =>
                    parkingSlot.Id == parkingSlotId,
                cancellationToken);
    }

    public async Task<ParkingReservation?> GetActiveByBookingIdAsync(
        int bookingId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ParkingReservations
            .Include(
                reservation =>
                    reservation.ParkingSlot)
            .FirstOrDefaultAsync(
                reservation =>
                    reservation.BookingId == bookingId &&
                    reservation.IsActive,
                cancellationToken);
    }

    public async Task<bool> HasActiveReservationForSlotAsync(
        int parkingSlotId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ParkingReservations
            .AsNoTracking()
            .AnyAsync(
                reservation =>
                    reservation.ParkingSlotId ==
                        parkingSlotId &&
                    reservation.IsActive,
                cancellationToken);
    }

    public async Task AddAsync(
        ParkingReservation parkingReservation,
        CancellationToken cancellationToken = default)
    {
        await _context.ParkingReservations
            .AddAsync(
                parkingReservation,
                cancellationToken);
    }

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(
            cancellationToken);
    }
}