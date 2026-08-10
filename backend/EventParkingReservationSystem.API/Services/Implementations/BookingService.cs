using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.DTOs.Bookings;
using EventParkingReservationSystem.API.DTOs.Notifications;
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

        // ============================================================
        // NOTIFICATION SERVICE
        // ============================================================

        private readonly INotificationService
            _notificationService;


        // ============================================================
        // CONSTRUCTOR
        // ============================================================

        public BookingService(
            IBookingRepository bookingRepository,
            ApplicationDbContext context,
            IConfiguration configuration,
            INotificationService notificationService)
        {
            _bookingRepository =
                bookingRepository;

            _context =
                context;

            _configuration =
                configuration;

            _notificationService =
                notificationService;
        }


        // ============================================================
        // CREATE BOOKING
        // ============================================================

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
                        seatIds.Contains(s.Id) &&
                        s.EventId == dto.EventId)
                    .ToListAsync();

            if (seats.Count != seatIds.Count)
            {
                throw new Exception(
                    "One or more seats are invalid.");
            }

            if (seats.Any(s =>
                s.Status != SeatStatus.Available))
            {
                throw new Exception(
                    "One or more selected seats are unavailable.");
            }


            // ========================================================
            // OPTIONAL PARKING SLOT
            // ========================================================

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

                if (parkingSlot.Status != ParkingSlotStatus.Available)
                {
                    throw new Exception(
                        "Parking slot is unavailable.");
                }
            }


            // ========================================================
            // HOLD TIME
            // ========================================================

            var holdMinutes =
                _configuration.GetValue<int>(
                    "BookingSettings:HoldMinutes");

            if (holdMinutes <= 0)
            {
                holdMinutes = 15;
            }


            // ========================================================
            // CREATE BOOKING ENTITY
            // ========================================================

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
                        parkingSlot != null
                            ? parkingSlot.Fee
                            : 0,

                    CreatedAt =
                        DateTime.UtcNow
                };


            await _bookingRepository
                .AddAsync(booking);

            await _bookingRepository
                .SaveChangesAsync();


            // ========================================================
            // BOOKING SEATS
            // ========================================================

            foreach (var seat in seats)
            {
                seat.Status = SeatStatus.Held;

                var bookingSeat =
                    new BookingSeat
                    {
                        BookingId =
                            booking.BookingId,

                        SeatId =
                            seat.Id,

                        TicketPriceSnapshot =
                            seat.Price,

                        IsActive =
                            true,

                        ReservedAtUtc =
                            DateTime.UtcNow
                    };

                _context.BookingSeats.Add(
                    bookingSeat);
            }


            // ========================================================
            // PARKING HOLD
            // ========================================================

            if (parkingSlot != null)
            {
                parkingSlot.Status =
                    ParkingSlotStatus.Held;
            }


            await _context.SaveChangesAsync();


            // ========================================================
            // BOOKING CREATED NOTIFICATION
            // ========================================================

            await _notificationService
                .CreateNotificationAsync(
                    new CreateNotificationDto
                    {
                        CustomerId =
                            booking.CustomerId,

                        BookingId =
                            booking.BookingId,

                        EventId =
                            booking.EventId,

                        Type =
                            NotificationType.BookingCreated,

                        Title =
                            "Booking held",

                        Message =
                            $"Booking {booking.BookingNumber} " +
                            $"has been created and is held until " +
                            $"{booking.HoldExpiresAtUtc!.Value:yyyy-MM-dd HH:mm} UTC."
                    });


            return await GetBookingByIdAsync(
                booking.BookingId)
                ?? throw new Exception(
                    "Unable to create booking.");
        }


        // ============================================================
        // GET BOOKING BY ID
        // ============================================================

        public async Task<BookingResponseDto?>
            GetBookingByIdAsync(
                int bookingId)
        {
            var booking =
                await _bookingRepository
                    .GetByIdAsync(bookingId);

            if (booking == null)
            {
                return null;
            }

            return MapToResponse(booking);
        }


        // ============================================================
        // GET CUSTOMER BOOKINGS
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
        // GET EVENT BOOKINGS
        // ============================================================

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


        // ============================================================
        // GET HOLD STATUS
        // ============================================================

        public async Task<HoldStatusDto?>
            GetHoldStatusAsync(
                int bookingId)
        {
            var booking =
                await _bookingRepository
                    .GetByIdAsync(bookingId);

            if (booking == null)
            {
                return null;
            }

            return new HoldStatusDto
            {
                BookingId =
                    booking.BookingId,

                Status =
                    booking.Status.ToString(),

                HoldExpiresAt =
                    booking.HoldExpiresAtUtc
            };
        }


        // ============================================================
        // CANCEL BOOKING
        // ============================================================

        public async Task<bool>
            CancelBookingAsync(
                int bookingId,
                int customerId)
        {
            var booking =
                await _bookingRepository
                    .GetByIdAsync(bookingId);

            if (booking == null)
            {
                return false;
            }

            if (booking.CustomerId !=
                customerId)
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


            // ========================================================
            // RELEASE SEATS
            // ========================================================

            foreach (var bookingSeat
                in booking.BookingSeats)
            {
                bookingSeat.Seat.Status =
                    SeatStatus.Available;

                bookingSeat.IsActive =
                    false;

                bookingSeat.ReleasedAtUtc =
                    DateTime.UtcNow;
            }


            // ========================================================
            // RELEASE PARKING
            // ========================================================

            if (booking.ParkingSlot != null)
            {
                booking.ParkingSlot.Status =
                    ParkingSlotStatus.Available;
            }


            // ========================================================
            // UPDATE BOOKING
            // ========================================================

            booking.Status =
                BookingStatus.Cancelled;

            booking.UpdatedAt =
                DateTime.UtcNow;

            booking.CancelledAtUtc =
                DateTime.UtcNow;


            await _context.SaveChangesAsync();


            // ========================================================
            // BOOKING CANCELLED NOTIFICATION
            // ========================================================

            await _notificationService
                .CreateNotificationAsync(
                    new CreateNotificationDto
                    {
                        CustomerId =
                            booking.CustomerId,

                        BookingId =
                            booking.BookingId,

                        EventId =
                            booking.EventId,

                        Type =
                            NotificationType.BookingCancelled,

                        Title =
                            "Booking cancelled",

                        Message =
                            $"Booking {booking.BookingNumber} " +
                            $"has been cancelled successfully."
                    });


            return true;
        }


        // ============================================================
        // EXPIRE UNPAID BOOKINGS
        // ============================================================

        public async Task ExpireBookingsAsync()
        {
            var bookings =
                await _bookingRepository
                    .GetExpiredPendingBookingsAsync();

            if (bookings.Count == 0)
            {
                return;
            }


            foreach (var booking in bookings)
            {
                // ====================================================
                // RELEASE SEATS
                // ====================================================

                foreach (var bookingSeat
                    in booking.BookingSeats)
                {
                    var seat =
                        await _context.Seats
                            .FindAsync(
                                bookingSeat.SeatId);

                    if (seat != null)
                    {
                        seat.Status =
                            SeatStatus.Available;
                    }

                    bookingSeat.IsActive =
                        false;

                    bookingSeat.ReleasedAtUtc =
                        DateTime.UtcNow;
                }


                // ====================================================
                // RELEASE PARKING
                // ====================================================

                if (booking.ParkingSlot != null)
                {
                    booking.ParkingSlot.Status =
                        ParkingSlotStatus.Available;
                }


                // ====================================================
                // UPDATE BOOKING
                // ====================================================

                booking.Status =
                    BookingStatus.Expired;

                booking.UpdatedAt =
                    DateTime.UtcNow;
            }


            await _context.SaveChangesAsync();


            // ========================================================
            // BOOKING EXPIRED NOTIFICATIONS
            // ========================================================

            foreach (var booking in bookings)
            {
                await _notificationService
                    .CreateNotificationAsync(
                        new CreateNotificationDto
                        {
                            CustomerId =
                                booking.CustomerId,

                            BookingId =
                                booking.BookingId,

                            EventId =
                                booking.EventId,

                            Type =
                                NotificationType.BookingExpired,

                            Title =
                                "Booking expired",

                            Message =
                                $"Booking {booking.BookingNumber} " +
                                $"expired because payment was not completed " +
                                $"within the hold period."
                        });
            }
        }


        // ============================================================
        // GENERATE BOOKING NUMBER
        // ============================================================

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


        // ============================================================
        // MAP BOOKING -> RESPONSE DTO
        // ============================================================

        private BookingResponseDto
            MapToResponse(
                Booking booking)
        {
            var seatTotal =
                booking.BookingSeats
                    .Sum(x =>
                        x.TicketPriceSnapshot);

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
                    booking.HoldExpiresAtUtc,

                Seats =
                    booking.BookingSeats
                        .Select(x =>
                            x.Seat.SeatNumber)
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