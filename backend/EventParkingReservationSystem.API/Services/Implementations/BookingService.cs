using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.DTOs.Bookings;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Services.Implementations
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository
            _bookingRepository;

        private readonly ApplicationDbContext
            _context;

        private readonly IConfiguration
            _configuration;

        public BookingService(
            IBookingRepository bookingRepository,
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _bookingRepository =
                bookingRepository;

            _context = context;

            _configuration =
                configuration;
        }

        public async Task<BookingResponseDto>
            CreateBookingAsync(
                int customerId,
                CreateBookingDto dto)
        {
            if (dto.SeatIds == null ||
                dto.SeatIds.Count == 0)
            {
                throw new Exception(
                    "At least one seat is required.");
            }

            var seatIds =
                dto.SeatIds
                    .Distinct()
                    .ToList();

            if (seatIds.Count !=
                dto.SeatIds.Count)
            {
                throw new Exception(
                    "Duplicate seats selected.");
            }

            var eventData =
                await _context.Events
                    .FindAsync(dto.EventId);

            if (eventData == null)
            {
                throw new Exception(
                    "Event not found.");
            }

            var seats =
                await _context.Seats
                    .Where(s =>
                        seatIds.Contains(
                            s.Id) &&
                        s.EventId ==
                            dto.EventId)
                    .ToListAsync();

            if (seats.Count != seatIds.Count)
            {
                throw new Exception(
                    "One or more seats are invalid.");
            }

            if (seats.Any(s =>
                !s.Available))
            {
                throw new Exception(
                    "One or more selected seats are unavailable.");
            }

            ParkingSlot? parkingSlot = null;

            if (dto.ParkingSlotId.HasValue)
            {
                parkingSlot =
                    await _context.ParkingSlots
                        .FirstOrDefaultAsync(p =>
                            p.Id ==
                                dto.ParkingSlotId.Value &&
                            p.EventId ==
                                dto.EventId);

                if (parkingSlot == null)
                {
                    throw new Exception(
                        "Parking slot not found.");
                }

                if (parkingSlot.IsAvailable)
                {
                }
                else
                {
                    throw new Exception(
                        "Parking slot is unavailable.");
                }
            }

            var holdMinutes =
                _configuration.GetValue<int>(
                    "BookingSettings:HoldMinutes");

            if (holdMinutes <= 0)
                holdMinutes = 15;

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
                        DateTime.UtcNow.AddMinutes(
                            holdMinutes),

                    ParkingSlotId =
                        dto.ParkingSlotId,

                    ParkingFee =
                        dto.ParkingSlotId.HasValue
                            ? eventData.ParkingFee
                            : 0,

                    CreatedAt =
                        DateTime.UtcNow
                };

            await _bookingRepository
                .AddAsync(booking);

            await _bookingRepository
                .SaveChangesAsync();

            foreach (var seat in seats)
            {
                seat.Available = false;

                var bookingSeat =
                    new BookingSeat
                    {
                        BookingId =
                            booking.BookingId,

                        SeatId =
                            seat.Id,

                        TicketPriceSnapshot =
                            seat.TicketPrice
                    };

                _context.BookingSeats.Add(
                    bookingSeat);
            }

            if (parkingSlot != null)
            {
                parkingSlot.Available =
                    false;
            }

            await _context.SaveChangesAsync();

            return await GetBookingByIdAsync(
                booking.BookingId)
                ?? throw new Exception(
                    "Unable to create booking.");
        }

        public async Task<BookingResponseDto?>
            GetBookingByIdAsync(
                int bookingId)
        {
            var booking =
                await _bookingRepository
                    .GetByIdAsync(bookingId);

            if (booking == null)
                return null;

            return MapToResponse(booking);
        }

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

        public async Task<List<BookingResponseDto>>
            GetEventBookingsAsync(
                int eventId)
        {
            var bookings =
                await _bookingRepository
                    .GetByEventIdAsync(eventId);

            return bookings
                .Select(MapToResponse)
                .ToList();
        }

        public async Task<HoldStatusDto?>
            GetHoldStatusAsync(
                int bookingId)
        {
            var booking =
                await _bookingRepository
                    .GetByIdAsync(bookingId);

            if (booking == null)
                return null;

            var remaining =
                booking.HoldExpiresAtUtc -
                DateTime.UtcNow;

            var seconds =
                Math.Max(0,
                         val2: (int)remaining.TotalSeconds);

            return new HoldStatusDto
            {
                BookingId =
                    booking.BookingId,

                Status =
                    booking.Status.ToString(),

                HoldExpiresAt =
                    (DateTime)booking.HoldExpiresAtUtc,

                RemainingSeconds =
                    seconds,

                IsExpired =
                    seconds <= 0
            };
        }

        public async Task<bool>
            CancelBookingAsync(
                int bookingId,
                int customerId)
        {
            var booking =
                await _bookingRepository
                    .GetByIdAsync(bookingId);

            if (booking == null)
                return false;

            if (booking.CustomerId !=
                customerId)
                return false;

            if (booking.Status ==
                    BookingStatus.Cancelled ||
                booking.Status ==
                    BookingStatus.Expired)
            {
                return false;
            }

            foreach (var bookingSeat
                in booking.BookingSeats)
            {
                bookingSeat.Seat.Available =
                    true;
            }

            if (booking.ParkingSlot != null)
            {
                booking.ParkingSlot.Available =
                    true;
            }

            booking.Status =
                BookingStatus.Cancelled;

            booking.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task ExpireBookingsAsync()
        {
            var bookings =
                await _bookingRepository
                    .GetExpiredPendingBookingsAsync();

            foreach (var booking in bookings)
            {
                foreach (var bookingSeat
                    in booking.BookingSeats)
                {
                    var seat =
                        await _context.Seats
                            .FindAsync(
                                bookingSeat.SeatId);

                    if (seat != null)
                    {
                        seat.IsAvailable =
                            true;
                    }
                }

                if (booking.ParkingSlot != null)
                {
                    booking.ParkingSlot.IsAvailable =
                        true;
                }

                booking.Status =
                    BookingStatus.Expired;

                booking.UpdatedAt =
                    DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        private async Task<string>
            GenerateBookingNumberAsync()
        {
            var year =
                DateTime.UtcNow.Year;

            var count =
                await _context.Bookings
                    .CountAsync();

            return
                $"BKG-{year}-{(count + 1):D6}";
        }

        private BookingResponseDto
            MapToResponse(
                Booking booking)
        {
            var seatTotal =
                booking.BookingSeats
                    .Sum(x => x.TicketPriceSnapshot);

            return new BookingResponseDto
            {
                BookingId =
                    booking.BookingId,

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
                    (DateTime)booking.HoldExpiresAtUtc,

                Seats =
                    booking.BookingSeats
                        .Select(x =>
                            x.Seat.SeatNumber.ToString())
                        .ToList(),

                SeatTotal =
                    seatTotal,

                ParkingSlotId =
                    booking.ParkingSlotId,

                ParkingFee =
                    booking.ParkingFee,

                TotalAmount =
                    seatTotal +
                    booking.ParkingFee,

                CreatedAt =
                    booking.CreatedAt
            };
        }
    }
}