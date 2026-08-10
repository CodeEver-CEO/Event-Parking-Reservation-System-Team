using System.Data;
using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.BackgroundServices;

public class BookingExpiryService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingExpiryService> _logger;
    private readonly IConfiguration _configuration;

    public BookingExpiryService(
        IServiceScopeFactory scopeFactory,
        ILogger<BookingExpiryService> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        var scanIntervalSeconds =
            _configuration.GetValue<int?>(
                "BookingSettings:ExpiryScanIntervalSeconds")
            ?? 10;

        if (scanIntervalSeconds <= 0)
        {
            scanIntervalSeconds = 10;
        }

        _logger.LogInformation(
            "Booking expiry background service started. " +
            "Scan interval: {Seconds} seconds.",
            scanIntervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredBookingsAsync(
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "An error occurred while processing expired bookings.");
            }

            try
            {
                await Task.Delay(
                    TimeSpan.FromSeconds(
                        scanIntervalSeconds),
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation(
            "Booking expiry background service stopped.");
    }

    private async Task ProcessExpiredBookingsAsync(
        CancellationToken cancellationToken)
    {
        using var scope =
            _scopeFactory.CreateScope();

        var context =
            scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

        var now =
            DateTime.UtcNow;

        // --------------------------------------------------------
        // Find Pending bookings whose hold has expired
        // --------------------------------------------------------
        var expiredBookingIds =
            await context.Bookings
                .AsNoTracking()
                .Where(
                    booking =>
                        booking.Status ==
                            BookingStatus.Pending &&
                        booking.HoldExpiresAtUtc.HasValue &&
                        booking.HoldExpiresAtUtc.Value <= now)
                .Select(
                    booking => booking.BookingId)
                .ToListAsync(
                    cancellationToken);

        if (expiredBookingIds.Count == 0)
        {
            return;
        }

        foreach (var bookingId in expiredBookingIds)
        {
            await ExpireSingleBookingAsync(
                context,
                bookingId,
                cancellationToken);
        }
    }

    private async Task ExpireSingleBookingAsync(
        ApplicationDbContext context,
        int bookingId,
        CancellationToken cancellationToken)
    {
        await using var transaction =
            await context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

        try
        {
            var now =
                DateTime.UtcNow;

            // ----------------------------------------------------
            // Re-read booking inside transaction.
            //
            // Another process may have confirmed the booking
            // between the original scan and this transaction.
            // ----------------------------------------------------
            var booking =
                await context.Bookings
                    .FirstOrDefaultAsync(
                        item =>
                            item.BookingId == bookingId,
                        cancellationToken);

            if (booking is null)
            {
                await transaction.RollbackAsync(
                    cancellationToken);

                return;
            }

            // ----------------------------------------------------
            // Booking must still be Pending
            // ----------------------------------------------------
            if (booking.Status !=
                BookingStatus.Pending)
            {
                await transaction.RollbackAsync(
                    cancellationToken);

                return;
            }

            // ----------------------------------------------------
            // Hold must actually be expired
            // ----------------------------------------------------
            if (!booking.HoldExpiresAtUtc.HasValue ||
                booking.HoldExpiresAtUtc.Value > now)
            {
                await transaction.RollbackAsync(
                    cancellationToken);

                return;
            }

            // ====================================================
            // MODULE 4 - SEAT RELEASE
            // ====================================================

            // ----------------------------------------------------
            // Get active seat allocations
            // ----------------------------------------------------
            var activeBookingSeats =
                await context.BookingSeats
                    .Where(
                        bookingSeat =>
                            bookingSeat.BookingId ==
                                bookingId &&
                            bookingSeat.IsActive)
                    .ToListAsync(
                        cancellationToken);

            // ----------------------------------------------------
            // Find physical Seat records
            // ----------------------------------------------------
            var seatIds =
                activeBookingSeats
                    .Select(
                        bookingSeat =>
                            bookingSeat.SeatId)
                    .Distinct()
                    .ToList();

            var seats =
                seatIds.Count == 0
                    ? new List<Models.Seat>()
                    : await context.Seats
                        .Where(
                            seat =>
                                seatIds.Contains(
                                    seat.Id))
                        .ToListAsync(
                            cancellationToken);

            // ----------------------------------------------------
            // Release BookingSeat allocations
            // ----------------------------------------------------
            foreach (var bookingSeat
                     in activeBookingSeats)
            {
                bookingSeat.IsActive =
                    false;

                bookingSeat.ReleasedAtUtc =
                    now;
            }

            // ----------------------------------------------------
            // Release held physical seats
            //
            // Only temporary Held seats are released.
            // ----------------------------------------------------
            foreach (var seat in seats)
            {
                if (seat.Status ==
                    SeatStatus.Held)
                {
                    seat.Status =
                        SeatStatus.Available;

                    seat.UpdatedAt =
                        now;
                }
            }

            // ====================================================
            // MODULE 5 - PARKING RELEASE
            // ====================================================

            // ----------------------------------------------------
            // Find active parking reservation for this booking
            //
            // Database rules allow only one active parking
            // reservation per booking.
            // ----------------------------------------------------
            var activeParkingReservation =
                await context.ParkingReservations
                    .Include(
                        reservation =>
                            reservation.ParkingSlot)
                    .FirstOrDefaultAsync(
                        reservation =>
                            reservation.BookingId ==
                                bookingId &&
                            reservation.IsActive,
                        cancellationToken);

            var releasedParkingCount = 0;

            if (activeParkingReservation is not null)
            {
                // ------------------------------------------------
                // Release active parking reservation
                // ------------------------------------------------
                activeParkingReservation.IsActive =
                    false;

                activeParkingReservation.ReleasedAtUtc =
                    now;

                var parkingSlot =
                    activeParkingReservation.ParkingSlot;

                // ------------------------------------------------
                // Release physical parking slot
                //
                // Pending booking parking is Held.
                // Only Held parking is returned to Available here.
                // ------------------------------------------------
                if (parkingSlot.Status ==
                    ParkingSlotStatus.Held)
                {
                    parkingSlot.Status =
                        ParkingSlotStatus.Available;

                    parkingSlot.UpdatedAt =
                        now;
                }

                releasedParkingCount = 1;
            }

            // ====================================================
            // BOOKING EXPIRY
            // ====================================================

            booking.Status =
                BookingStatus.Expired;

            booking.UpdatedAt =
                now;

            // ----------------------------------------------------
            // Save booking + seats + parking atomically
            // ----------------------------------------------------
            await context.SaveChangesAsync(
                cancellationToken);

            await transaction.CommitAsync(
                cancellationToken);

            _logger.LogInformation(
                "Expired booking {BookingId}. " +
                "Released {SeatCount} active seat allocation(s) " +
                "and {ParkingCount} active parking reservation(s).",
                bookingId,
                activeBookingSeats.Count,
                releasedParkingCount);
        }
        catch
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw;
        }
    }
}   