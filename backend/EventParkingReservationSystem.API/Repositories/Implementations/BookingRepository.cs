
using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;

namespace EventParkingReservationSystem.API.Repositories.Implementations
{
    public class BookingRepository : IBookingRepository
    {
        private readonly AppDbContext _context;

        public BookingRepository(
            AppDbContext context)
        {
            _context = context;
        }

        public async Task<Booking?> GetByIdAsync(
            int bookingId)
        {
            return await _context.Bookings
                .Include(b => b.BookingSeats)
                    .ThenInclude(bs => bs.Seat)
                .Include(b => b.Event)
                .Include(b => b.Payment)
                .Include(b => b.ParkingSlot)
                .FirstOrDefaultAsync(
                    b => b.BookingId == bookingId);
        }

        public async Task<List<Booking>>
            GetByCustomerIdAsync(
                int customerId)
        {
            return await _context.Bookings
                .Include(b => b.BookingSeats)
                    .ThenInclude(bs => bs.Seat)
                .Include(b => b.Event)
                .Include(b => b.ParkingSlot)
                .Where(b =>
                    b.CustomerId == customerId)
                .OrderByDescending(
                    b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Booking>>
            GetByEventIdAsync(
                int eventId)
        {
            return await _context.Bookings
                .Include(b => b.BookingSeats)
                    .ThenInclude(bs => bs.Seat)
                .Include(b => b.ParkingSlot)
                .Where(b =>
                    b.EventId == eventId)
                .OrderByDescending(
                    b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool>
            AreSeatsAvailableAsync(
                int eventId,
                List<int> seatIds)
        {
            var seats =
                await _context.Seats
                    .Where(s =>
                        s.EventId == eventId &&
                        seatIds.Contains(
                            s.SeatId))
                    .ToListAsync();

            if (seats.Count != seatIds.Count)
                return false;

            // Assuming your existing Seat model
            // has IsAvailable property.
            return seats.All(s =>
                s.IsAvailable);
        }

        public async Task<Booking>
            AddAsync(
                Booking booking)
        {
            await _context.Bookings.AddAsync(
                booking);

            return booking;
        }

        public async Task UpdateAsync(
            Booking booking)
        {
            _context.Bookings.Update(
                booking);

            await Task.CompletedTask;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<List<Booking>>
            GetExpiredPendingBookingsAsync()
        {
            var now = DateTime.UtcNow;

            return await _context.Bookings
                .Include(b => b.BookingSeats)
                .Include(b => b.ParkingSlot)
                .Where(b =>
                    b.Status ==
                        BookingStatus.Pending &&
                    b.HoldExpiresAt <= now)
                .ToListAsync();
        }
    }
}