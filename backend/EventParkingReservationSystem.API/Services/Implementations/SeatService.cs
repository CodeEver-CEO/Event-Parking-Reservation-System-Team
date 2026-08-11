using System.Data;
using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.DTOs.Seats;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Services.Implementations;

public class SeatService : ISeatService
{
    private readonly ISeatRepository _seatRepository;
    private readonly ApplicationDbContext _context;

    public SeatService(
        ISeatRepository seatRepository,
        ApplicationDbContext context)
    {
        _seatRepository = seatRepository;
        _context = context;
    }

    // ============================================================
    // GET COMPLETE SEAT MAP
    // ============================================================
    public async Task<IReadOnlyList<SeatResponseDto>> GetSeatMapAsync(
        int eventId,
        CancellationToken cancellationToken = default)
    {
        var eventEntity =
            await _seatRepository.GetEventByIdAsync(
                eventId,
                cancellationToken);

        if (eventEntity is null)
        {
            throw new KeyNotFoundException(
                $"Event with ID {eventId} was not found.");
        }

        var seats =
            await _seatRepository.GetByEventIdAsync(
                eventId,
                cancellationToken);

        return seats
            .OrderBy(seat => seat.RowLabel)
            .ThenBy(seat => seat.ColumnNumber)
            .Select(MapSeat)
            .ToList();
    }

    // ============================================================
    // GENERATE SEAT MAP
    // ============================================================
    public async Task<IReadOnlyList<SeatResponseDto>>
        GenerateSeatMapAsync(
            int eventId,
            GenerateSeatMapRequestDto request,
            CancellationToken cancellationToken = default)
    {
        var eventEntity =
            await _seatRepository.GetEventByIdAsync(
                eventId,
                cancellationToken);

        if (eventEntity is null)
        {
            throw new KeyNotFoundException(
                $"Event with ID {eventId} was not found.");
        }

        if (eventEntity.Capacity <= 0)
        {
            throw new InvalidOperationException(
                "The event must have a valid capacity before a seat map can be generated.");
        }

        if (request.Rows is null ||
            request.Rows.Count == 0)
        {
            throw new ArgumentException(
                "At least one seat row must be provided.");
        }

        var seatMapAlreadyExists =
            await _seatRepository.SeatMapExistsAsync(
                eventId,
                cancellationToken);

        if (seatMapAlreadyExists)
        {
            throw new InvalidOperationException(
                "A seat map already exists for this event.");
        }

        if (request.Rows.Any(
            row => row.SeatCount <= 0))
        {
            throw new ArgumentException(
                "Every row must contain at least one seat.");
        }

        if (request.Rows.Any(
            row => row.RowPrice < 0))
        {
            throw new ArgumentException(
                "Seat price cannot be negative.");
        }

        var requestedSeatCount =
            request.Rows.Sum(
                row => row.SeatCount);

        if (requestedSeatCount !=
            eventEntity.Capacity)
        {
            throw new ArgumentException(
                $"Seat map cannot be generated because the total seat count " +
                $"must exactly match the event capacity. " +
                $"Event capacity: {eventEntity.Capacity}. " +
                $"Configured seats: {requestedSeatCount}.");
        }

        var seats =
            new List<Seat>();

        for (var rowIndex = 0;
             rowIndex < request.Rows.Count;
             rowIndex++)
        {
            var requestRow =
                request.Rows[rowIndex];

            var rowLabel =
                GenerateRowLabel(rowIndex);

            for (var columnNumber = 1;
                 columnNumber <= requestRow.SeatCount;
                 columnNumber++)
            {
                var seatNumber =
                    $"{rowLabel}{columnNumber:D2}";

                var seatType =
                    string.IsNullOrWhiteSpace(
                        requestRow.SeatType)
                        ? null
                        : requestRow.SeatType.Trim();

                seats.Add(
                    new Seat
                    {
                        EventId =
                            eventId,

                        RowLabel =
                            rowLabel,

                        ColumnNumber =
                            columnNumber,

                        SeatNumber =
                            seatNumber,

                        SeatType =
                            seatType,

                        Price =
                            requestRow.RowPrice,

                        Status =
                            SeatStatus.Available,

                        CreatedAt =
                            DateTime.UtcNow
                    });
            }
        }

        await _seatRepository.AddSeatsAsync(
            seats,
            cancellationToken);

        try
        {
            await _seatRepository.SaveChangesAsync(
                cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw new InvalidOperationException(
                "The seat map could not be generated because duplicate or invalid seat data was detected.");
        }

        return seats
            .OrderBy(seat => seat.RowLabel)
            .ThenBy(seat => seat.ColumnNumber)
            .Select(MapSeat)
            .ToList();
    }

    // ============================================================
    // UPDATE SINGLE SEAT
    // ============================================================
    public async Task<SeatResponseDto> UpdateSeatAsync(
        int eventId,
        int seatId,
        UpdateSeatRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var eventEntity =
            await _seatRepository.GetEventByIdAsync(
                eventId,
                cancellationToken);

        if (eventEntity is null)
        {
            throw new KeyNotFoundException(
                $"Event with ID {eventId} was not found.");
        }

        var seat =
            await _seatRepository.GetByIdAsync(
                seatId,
                cancellationToken);

        if (seat is null)
        {
            throw new KeyNotFoundException(
                $"Seat with ID {seatId} was not found.");
        }

        if (seat.EventId != eventId)
        {
            throw new ArgumentException(
                "The selected seat does not belong to this event.");
        }

        var hasActiveBooking =
            await _seatRepository.HasActiveBookingAsync(
                seatId,
                cancellationToken);

        if (hasActiveBooking)
        {
            throw new InvalidOperationException(
                "This seat cannot be modified because it has an active booking.");
        }

        var normalizedSeatNumber =
            request.SeatNumber
                .Trim()
                .ToUpperInvariant();

        var normalizedRowLabel =
            request.RowLabel
                .Trim()
                .ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(
            normalizedSeatNumber))
        {
            throw new ArgumentException(
                "Seat number is required.");
        }

        if (string.IsNullOrWhiteSpace(
            normalizedRowLabel))
        {
            throw new ArgumentException(
                "Row label is required.");
        }

        var seatNumberExists =
            await _seatRepository.SeatNumberExistsAsync(
                eventId,
                normalizedSeatNumber,
                seatId,
                cancellationToken);

        if (seatNumberExists)
        {
            throw new InvalidOperationException(
                $"Seat number '{normalizedSeatNumber}' already exists for this event.");
        }

        seat.SeatNumber =
            normalizedSeatNumber;

        seat.RowLabel =
            normalizedRowLabel;

        seat.ColumnNumber =
            request.ColumnNumber;

        seat.Price =
            request.Price;

        seat.SeatType =
            string.IsNullOrWhiteSpace(
                request.SeatType)
                ? null
                : request.SeatType.Trim();

        seat.UpdatedAt =
            DateTime.UtcNow;

        _seatRepository.UpdateSeat(seat);

        try
        {
            await _seatRepository.SaveChangesAsync(
                cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw new InvalidOperationException(
                "The seat could not be updated because the new seat details conflict with existing data.");
        }

        return MapSeat(seat);
    }

    // ============================================================
    // DELETE SINGLE SEAT
    // ============================================================
    public async Task DeleteSeatAsync(
        int eventId,
        int seatId,
        CancellationToken cancellationToken = default)
    {
        var eventEntity =
            await _seatRepository.GetEventByIdAsync(
                eventId,
                cancellationToken);

        if (eventEntity is null)
        {
            throw new KeyNotFoundException(
                $"Event with ID {eventId} was not found.");
        }

        var seat =
            await _seatRepository.GetByIdAsync(
                seatId,
                cancellationToken);

        if (seat is null)
        {
            throw new KeyNotFoundException(
                $"Seat with ID {seatId} was not found.");
        }

        if (seat.EventId != eventId)
        {
            throw new ArgumentException(
                "The selected seat does not belong to this event.");
        }

        var hasActiveBooking =
            await _seatRepository.HasActiveBookingAsync(
                seatId,
                cancellationToken);

        if (hasActiveBooking)
        {
            throw new InvalidOperationException(
                "This seat cannot be deleted because it has an active booking.");
        }

        _seatRepository.RemoveSeat(seat);

        try
        {
            await _seatRepository.SaveChangesAsync(
                cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw new InvalidOperationException(
                "The seat could not be deleted because it is referenced by existing reservation data.");
        }
    }

    // ============================================================
    // ATTACH SELECTED SEATS TO BOOKING
    //
    // SECURITY:
    // Logged-in customer may modify ONLY their own booking.
    // ============================================================
    public async Task<IReadOnlyList<SeatResponseDto>>
        AttachSeatsToBookingAsync(
            int bookingId,
            int customerId,
            AttachSeatsRequestDto request,
            CancellationToken cancellationToken = default)
    {
        // --------------------------------------------------------
        // 1. At least one seat must be selected
        // --------------------------------------------------------
        if (request.SeatIds is null ||
            request.SeatIds.Count == 0)
        {
            throw new ArgumentException(
                "At least one seat must be selected.");
        }

        // --------------------------------------------------------
        // 2. Prevent duplicate seat IDs
        // --------------------------------------------------------
        var requestedSeatIds =
            request.SeatIds
                .Distinct()
                .ToList();

        if (requestedSeatIds.Count !=
            request.SeatIds.Count)
        {
            throw new ArgumentException(
                "The same seat cannot be selected more than once.");
        }

        // --------------------------------------------------------
        // 3. Serializable transaction
        // --------------------------------------------------------
        await using var transaction =
            await _context.Database
                .BeginTransactionAsync(
                    IsolationLevel.Serializable,
                    cancellationToken);

        try
        {
            // ----------------------------------------------------
            // 4. Booking must exist
            // ----------------------------------------------------
            var booking =
                await _seatRepository.GetBookingByIdAsync(
                    bookingId,
                    cancellationToken);

            if (booking is null)
            {
                throw new KeyNotFoundException(
                    $"Booking with ID {bookingId} was not found.");
            }

            // ----------------------------------------------------
            // 5. SECURITY:
            // Customer can modify only their own booking
            // ----------------------------------------------------
            if (booking.CustomerId != customerId)
            {
                throw new UnauthorizedAccessException(
                    "You are not allowed to modify this booking.");
            }

            // ----------------------------------------------------
            // 6. Only Pending booking can receive seats
            // ----------------------------------------------------
            if (booking.Status !=
                BookingStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Seats can only be attached to a pending booking.");
            }

            // ----------------------------------------------------
            // 7. Reject expired booking hold
            // ----------------------------------------------------
            if (booking.HoldExpiresAtUtc.HasValue &&
                booking.HoldExpiresAtUtc.Value <=
                DateTime.UtcNow)
            {
                throw new InvalidOperationException(
                    "This booking hold has expired. Please create a new booking.");
            }

            // ----------------------------------------------------
            // 8. Existing active allocation check
            // ----------------------------------------------------
            var bookingAlreadyHasActiveSeats =
                await _seatRepository
                    .BookingHasActiveSeatsAsync(
                        bookingId,
                        cancellationToken);

            if (bookingAlreadyHasActiveSeats)
            {
                throw new InvalidOperationException(
                    "This booking already has active seat allocations.");
            }

            // ----------------------------------------------------
            // 9. Load selected seats
            // ----------------------------------------------------
            var seats =
                await _seatRepository.GetByIdsAsync(
                    requestedSeatIds,
                    cancellationToken);

            // ----------------------------------------------------
            // 10. Every requested seat must exist
            // ----------------------------------------------------
            if (seats.Count !=
                requestedSeatIds.Count)
            {
                throw new KeyNotFoundException(
                    "One or more selected seats were not found.");
            }

            // ----------------------------------------------------
            // 11. Seats must belong to booking event
            // ----------------------------------------------------
            var wrongEventSeats =
                seats
                    .Where(
                        seat =>
                            seat.EventId !=
                            booking.EventId)
                    .Select(
                        seat =>
                            seat.SeatNumber)
                    .ToList();

            if (wrongEventSeats.Count > 0)
            {
                throw new InvalidOperationException(
                    "One or more selected seats do not belong to the booking event.");
            }

            // ----------------------------------------------------
            // 12. Only Available seats can be selected
            // ----------------------------------------------------
            var unavailableSeats =
                seats
                    .Where(
                        seat =>
                            seat.Status !=
                            SeatStatus.Available)
                    .Select(
                        seat =>
                            seat.SeatNumber)
                    .ToList();

            if (unavailableSeats.Count > 0)
            {
                throw new InvalidOperationException(
                    "The following seats are no longer available: " +
                    string.Join(
                        ", ",
                        unavailableSeats));
            }

            // ----------------------------------------------------
            // 13. Create BookingSeat allocations
            // ----------------------------------------------------
            var now =
                DateTime.UtcNow;

            var bookingSeats =
                new List<BookingSeat>();

            foreach (var seat in seats)
            {
                seat.Status =
                    SeatStatus.Held;

                seat.UpdatedAt =
                    now;

                bookingSeats.Add(
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
                            now,

                        ReleasedAtUtc =
                            null
                    });
            }

            // ----------------------------------------------------
            // 14. Add BookingSeat records
            // ----------------------------------------------------
            await _seatRepository
                .AddBookingSeatsAsync(
                    bookingSeats,
                    cancellationToken);

            // ----------------------------------------------------
            // 15. Save changes
            // ----------------------------------------------------
            await _seatRepository.SaveChangesAsync(
                cancellationToken);

            // ----------------------------------------------------
            // 16. Commit
            // ----------------------------------------------------
            await transaction.CommitAsync(
                cancellationToken);

            return seats
                .OrderBy(
                    seat => seat.RowLabel)
                .ThenBy(
                    seat => seat.ColumnNumber)
                .Select(MapSeat)
                .ToList();
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw new InvalidOperationException(
                "One or more selected seats were reserved by another customer. Please refresh the seat map and select again.");
        }
        catch
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw;
        }
    }

    // ============================================================
    // ENTITY -> RESPONSE DTO
    // ============================================================
    private static SeatResponseDto MapSeat(
        Seat seat)
    {
        return new SeatResponseDto
        {
            Id =
                seat.Id,

            EventId =
                seat.EventId,

            SeatNumber =
                seat.SeatNumber,

            RowLabel =
                seat.RowLabel,

            ColumnNumber =
                seat.ColumnNumber,

            SeatType =
                seat.SeatType,

            Price =
                seat.Price,

            Status =
                seat.Status,

            IsAvailable =
                seat.Status ==
                SeatStatus.Available,

            IsProtected =
                seat.Status ==
                    SeatStatus.Held ||
                seat.Status ==
                    SeatStatus.Booked
        };
    }

    // ============================================================
    // ROW LABEL GENERATOR
    // ============================================================
    private static string GenerateRowLabel(
        int rowIndex)
    {
        var value =
            rowIndex + 1;

        var rowLabel =
            string.Empty;

        while (value > 0)
        {
            value--;

            rowLabel =
                (char)(
                    'A' +
                    value % 26) +
                rowLabel;

            value /= 26;
        }

        return rowLabel;
    }
}