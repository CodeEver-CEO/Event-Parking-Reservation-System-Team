using System.Data;

using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.DTOs.Bookings;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;

using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Services.Implementations;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _bookingRepository;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public BookingService(
        IBookingRepository bookingRepository,
        ApplicationDbContext context,
        IConfiguration configuration)
    {
        _bookingRepository = bookingRepository;
        _context = context;
        _configuration = configuration;
    }

    // ============================================================
    // CREATE BOOKING
    // ============================================================

    public async Task<BookingResponseDto> CreateBookingAsync(
        int customerId,
        CreateBookingDto dto)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Customer id must be greater than zero.");
        }

        if (dto.SeatIds is null ||
            dto.SeatIds.Count == 0)
        {
            throw new ArgumentException(
                "At least one seat is required.");
        }

        var seatIds =
            dto.SeatIds
                .Distinct()
                .ToList();

        if (seatIds.Count != dto.SeatIds.Count)
        {
            throw new ArgumentException(
                "Duplicate seats selected.");
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable);

        try
        {
            var now = DateTime.UtcNow;

            // ----------------------------------------------------
            // EVENT
            // ----------------------------------------------------

            var eventData =
                await _context.Events
                    .FirstOrDefaultAsync(
                        eventItem =>
                            eventItem.Id == dto.EventId);

            if (eventData is null)
            {
                throw new KeyNotFoundException(
                    "Event not found.");
            }

            // ----------------------------------------------------
            // SEATS
            // ----------------------------------------------------

            var seats =
                await _context.Seats
                    .Where(
                        seat =>
                            seatIds.Contains(seat.Id) &&
                            seat.EventId == dto.EventId)
                    .ToListAsync();

            if (seats.Count != seatIds.Count)
            {
                throw new InvalidOperationException(
                    "One or more selected seats are invalid.");
            }

            if (seats.Any(
                seat =>
                    seat.Status != SeatStatus.Available))
            {
                throw new InvalidOperationException(
                    "One or more selected seats are unavailable.");
            }

            // ----------------------------------------------------
            // OPTIONAL PARKING
            // ----------------------------------------------------

            ParkingSlot? parkingSlot = null;

            if (dto.ParkingSlotId.HasValue)
            {
                parkingSlot =
                    await _context.ParkingSlots
                        .FirstOrDefaultAsync(
                            slot =>
                                slot.Id ==
                                    dto.ParkingSlotId.Value &&
                                slot.EventId ==
                                    dto.EventId);

                if (parkingSlot is null)
                {
                    throw new KeyNotFoundException(
                        "Parking slot not found.");
                }

                if (parkingSlot.Status !=
                    ParkingSlotStatus.Available)
                {
                    throw new InvalidOperationException(
                        "Parking slot is unavailable.");
                }

                var activeParkingExists =
                    await _context.ParkingReservations
                        .AnyAsync(
                            reservation =>
                                reservation.ParkingSlotId ==
                                    parkingSlot.Id &&
                                reservation.IsActive);

                if (activeParkingExists)
                {
                    throw new InvalidOperationException(
                        "Parking slot is already reserved.");
                }
            }

            // ----------------------------------------------------
            // HOLD EXPIRY
            // ----------------------------------------------------

            var holdMinutes =
                _configuration.GetValue<int?>(
                    "BookingSettings:HoldMinutes")
                ?? 15;

            if (holdMinutes <= 0)
            {
                holdMinutes = 15;
            }

            // ----------------------------------------------------
            // TOTAL
            // ----------------------------------------------------

            var seatTotal =
                seats.Sum(
                    seat => seat.Price);

            var parkingFee =
                parkingSlot?.Fee ?? 0m;

            var totalAmount =
                seatTotal + parkingFee;

            // ----------------------------------------------------
            // CREATE BOOKING
            // ----------------------------------------------------

            var booking =
                new Booking
                {
                    BookingNumber =
                        await GenerateBookingNumberAsync(),

                    CustomerId =
                        customerId,

                    EventId =
                        dto.EventId,

                    Status =
                        BookingStatus.Pending,

                    HoldExpiresAtUtc =
                        now.AddMinutes(
                            holdMinutes),

                    TotalAmount =
                        totalAmount,

                    CreatedAt =
                        now
                };

            await _bookingRepository.AddAsync(
                booking);

            // Save first so Booking.Id is generated.
            await _bookingRepository.SaveChangesAsync();

            // ----------------------------------------------------
            // HOLD SEATS + SNAPSHOT PRICE
            // ----------------------------------------------------

            foreach (var seat in seats)
            {
                seat.Status =
                    SeatStatus.Held;

                seat.UpdatedAt =
                    now;

                var bookingSeat =
                    new BookingSeat
                    {
                        BookingId =
                            booking.Id,

                        SeatId =
                            seat.Id,

                        TicketPriceSnapshot =
                            seat.Price,

                        IsActive =
                            true,

                        ReservedAtUtc =
                            now,

                        ReleasedAtUtc =
                            null
                    };

                await _context.BookingSeats.AddAsync(
                    bookingSeat);
            }

            // ----------------------------------------------------
            // OPTIONAL PARKING RESERVATION
            // ----------------------------------------------------

            if (parkingSlot is not null)
            {
                parkingSlot.Status =
                    ParkingSlotStatus.Held;

                parkingSlot.UpdatedAt =
                    now;

                var parkingReservation =
                    new ParkingReservation
                    {
                        BookingId =
                            booking.Id,

                        ParkingSlotId =
                            parkingSlot.Id,

                        FeeSnapshot =
                            parkingSlot.Fee,

                        IsActive =
                            true,

                        ReservedAtUtc =
                            now,

                        ReleasedAtUtc =
                            null
                    };

                await _context.ParkingReservations.AddAsync(
                    parkingReservation);
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return await GetBookingByIdAsync(
                booking.Id)
                ?? throw new InvalidOperationException(
                    "Unable to create booking.");
        }
        catch (DbUpdateException exception)
        {
            await transaction.RollbackAsync();

            throw new InvalidOperationException(
                "The booking could not be created because one or more seats or parking slots were selected by another customer.",
                exception);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ============================================================
    // GET BOOKING BY ID
    // ============================================================

    public async Task<BookingResponseDto?> GetBookingByIdAsync(
        int bookingId)
    {
        var booking =
            await _bookingRepository.GetByIdAsync(
                bookingId);

        if (booking is null)
        {
            return null;
        }

        return MapToResponse(
            booking);
    }

    // ============================================================
    // CUSTOMER BOOKINGS
    // ============================================================

    public async Task<List<BookingResponseDto>>
        GetCustomerBookingsAsync(
            int customerId)
    {
        var bookings =
            await _bookingRepository
                .GetByCustomerIdAsync(
                    customerId);

        return bookings
            .Select(MapToResponse)
            .ToList();
    }

    // ============================================================
    // EVENT BOOKINGS
    // ============================================================

    public async Task<List<BookingResponseDto>>
        GetEventBookingsAsync(
            int eventId)
    {
        var bookings =
            await _bookingRepository
                .GetByEventIdAsync(
                    eventId);

        return bookings
            .Select(MapToResponse)
            .ToList();
    }

    // ============================================================
    // HOLD STATUS
    // ============================================================

    public async Task<HoldStatusDto?> GetHoldStatusAsync(
        int bookingId)
    {
        var booking =
            await _bookingRepository
                .GetByIdAsync(
                    bookingId);

        if (booking is null)
        {
            return null;
        }

        var holdExpiresAt =
            booking.HoldExpiresAtUtc
            ?? booking.CreatedAt;

        var remaining =
            holdExpiresAt -
            DateTime.UtcNow;

        var seconds =
            Math.Max(
                0,
                (int)remaining.TotalSeconds);

        return new HoldStatusDto
        {
            BookingId =
                booking.Id,

            Status =
                booking.Status.ToString(),

            HoldExpiresAt =
                holdExpiresAt,

            RemainingSeconds =
                seconds,

            IsExpired =
                seconds <= 0
        };
    }

    // ============================================================
    // CANCEL BOOKING
    // ============================================================

    public async Task<bool> CancelBookingAsync(
        int bookingId,
        int customerId)
    {
        var booking =
            await _bookingRepository
                .GetByIdAsync(
                    bookingId);

        if (booking is null)
        {
            return false;
        }

        if (booking.CustomerId != customerId)
        {
            return false;
        }

        if (booking.Status ==
                BookingStatus.Cancelled ||
            booking.Status ==
                BookingStatus.Expired)
        {
            return false;
        }

        var now =
            DateTime.UtcNow;

        // --------------------------------------------------------
        // RELEASE ACTIVE SEATS
        // --------------------------------------------------------

        foreach (var bookingSeat in
                 booking.BookingSeats
                     .Where(item => item.IsActive))
        {
            bookingSeat.IsActive =
                false;

            bookingSeat.ReleasedAtUtc =
                now;

            var seat =
                bookingSeat.Seat;

            if (seat.Status ==
                    SeatStatus.Held ||
                seat.Status ==
                    SeatStatus.Booked)
            {
                seat.Status =
                    SeatStatus.Available;

                seat.UpdatedAt =
                    now;
            }
        }

        // --------------------------------------------------------
        // RELEASE ACTIVE PARKING
        // --------------------------------------------------------

        foreach (var parkingReservation in
                 booking.ParkingReservations
                     .Where(item => item.IsActive))
        {
            parkingReservation.IsActive =
                false;

            parkingReservation.ReleasedAtUtc =
                now;

            var parkingSlot =
                parkingReservation.ParkingSlot;

            if (parkingSlot.Status ==
                    ParkingSlotStatus.Held ||
                parkingSlot.Status ==
                    ParkingSlotStatus.Reserved)
            {
                parkingSlot.Status =
                    ParkingSlotStatus.Available;

                parkingSlot.UpdatedAt =
                    now;
            }
        }

        booking.Status =
            BookingStatus.Cancelled;

        booking.CancelledAtUtc =
            now;

        booking.UpdatedAt =
            now;

        await _context.SaveChangesAsync();

        return true;
    }

    // ============================================================
    // EXPIRE BOOKINGS
    //
    // Background BookingExpiryService already performs this
    // automatically. This method remains for IBookingService
    // compatibility / manual invocation.
    // ============================================================

    public async Task ExpireBookingsAsync()
    {
        var bookings =
            await _bookingRepository
                .GetExpiredPendingBookingsAsync();

        var now =
            DateTime.UtcNow;

        foreach (var booking in bookings)
        {
            // ----------------------------------------------------
            // RELEASE SEATS
            // ----------------------------------------------------

            foreach (var bookingSeat in
                     booking.BookingSeats
                         .Where(item => item.IsActive))
            {
                bookingSeat.IsActive =
                    false;

                bookingSeat.ReleasedAtUtc =
                    now;

                var seat =
                    bookingSeat.Seat;

                if (seat.Status ==
                    SeatStatus.Held)
                {
                    seat.Status =
                        SeatStatus.Available;

                    seat.UpdatedAt =
                        now;
                }
            }

            // ----------------------------------------------------
            // RELEASE PARKING
            // ----------------------------------------------------

            foreach (var parkingReservation in
                     booking.ParkingReservations
                         .Where(item => item.IsActive))
            {
                parkingReservation.IsActive =
                    false;

                parkingReservation.ReleasedAtUtc =
                    now;

                var parkingSlot =
                    parkingReservation.ParkingSlot;

                if (parkingSlot.Status ==
                    ParkingSlotStatus.Held)
                {
                    parkingSlot.Status =
                        ParkingSlotStatus.Available;

                    parkingSlot.UpdatedAt =
                        now;
                }
            }

            booking.Status =
                BookingStatus.Expired;

            booking.UpdatedAt =
                now;
        }

        await _context.SaveChangesAsync();
    }

    // ============================================================
    // BOOKING NUMBER
    // ============================================================

    private async Task<string> GenerateBookingNumberAsync()
    {
        var year =
            DateTime.UtcNow.Year;

        var count =
            await _context.Bookings
                .CountAsync();

        return
            $"BKG-{year}-{(count + 1):D6}";
    }

    // ============================================================
    // ENTITY -> RESPONSE
    // ============================================================

    private static BookingResponseDto MapToResponse(
        Booking booking)
    {
        var bookingSeats =
            booking.BookingSeats
                .OrderBy(
                    item =>
                        item.Seat.SeatNumber)
                .ToList();

        var seatTotal =
            bookingSeats.Sum(
                item =>
                    item.TicketPriceSnapshot);

        // Active parking first.
        // If booking was cancelled/expired, use latest historical
        // reservation so booking history can still show parking.
        var parkingReservation =
            booking.ParkingReservations
                .FirstOrDefault(
                    item =>
                        item.IsActive)
            ?? booking.ParkingReservations
                .OrderByDescending(
                    item =>
                        item.ReservedAtUtc)
                .FirstOrDefault();

        var parkingFee =
            parkingReservation?.FeeSnapshot
            ?? 0m;

        return new BookingResponseDto
        {
            BookingId =
                booking.Id,

            BookingNumber =
                booking.BookingNumber,

            CustomerId =
                booking.CustomerId,

            EventId =
                booking.EventId,

            EventName =
                booking.Event.Name,

            Status =
                booking.Status.ToString(),

            HoldExpiresAt =
                booking.HoldExpiresAtUtc
                ?? booking.CreatedAt,

            Seats =
                bookingSeats
                    .Select(
                        item =>
                            item.Seat.SeatNumber)
                    .ToList(),

            SeatTotal =
                seatTotal,

            ParkingSlotId =
                parkingReservation?.ParkingSlotId,

            ParkingFee =
                parkingFee,

            TotalAmount =
                booking.TotalAmount,

            CreatedAt =
                booking.CreatedAt
        };
    }
}