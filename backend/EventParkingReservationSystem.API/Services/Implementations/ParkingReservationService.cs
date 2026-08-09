using System.Data;

using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.DTOs.Parking;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;

using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Services.Implementations;

public class ParkingReservationService
    : IParkingReservationService
{
    private readonly IParkingReservationRepository
        _parkingReservationRepository;

    private readonly ApplicationDbContext
        _context;

    public ParkingReservationService(
        IParkingReservationRepository parkingReservationRepository,
        ApplicationDbContext context)
    {
        _parkingReservationRepository =
            parkingReservationRepository;

        _context =
            context;
    }

    // =====================================================
    // RESERVE PARKING
    // =====================================================

    public async Task<ParkingReservationResponseDto> ReserveAsync(
        int bookingId,
        int customerId,
        ReserveParkingRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (bookingId <= 0)
        {
            throw new ArgumentException(
                "Booking id must be greater than zero.");
        }

        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Customer id must be greater than zero.");
        }

        if (request.ParkingSlotId <= 0)
        {
            throw new ArgumentException(
                "Parking slot id must be greater than zero.");
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

        try
        {
            var now =
                DateTime.UtcNow;

            // -------------------------------------------------
            // BOOKING VALIDATION
            // -------------------------------------------------

            var booking =
                await _parkingReservationRepository
                    .GetBookingAsync(
                        bookingId,
                        cancellationToken);

            if (booking is null)
            {
                throw new KeyNotFoundException(
                    $"Booking with id {bookingId} was not found.");
            }

            if (booking.CustomerId != customerId)
            {
                throw new UnauthorizedAccessException(
                    "You are not allowed to modify this booking.");
            }

            if (booking.Status != BookingStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Parking can only be selected for a pending booking.");
            }

            if (booking.HoldExpiresAtUtc.HasValue &&
                booking.HoldExpiresAtUtc.Value <= now)
            {
                throw new InvalidOperationException(
                    "The booking hold has expired.");
            }

            // -------------------------------------------------
            // PREVENT MORE THAN ONE ACTIVE PARKING RESERVATION
            // -------------------------------------------------

            var existingReservation =
                await _parkingReservationRepository
                    .GetActiveByBookingIdAsync(
                        bookingId,
                        cancellationToken);

            if (existingReservation is not null)
            {
                throw new InvalidOperationException(
                    "This booking already has an active parking reservation.");
            }

            // -------------------------------------------------
            // PARKING SLOT VALIDATION
            // -------------------------------------------------

            var parkingSlot =
                await _parkingReservationRepository
                    .GetParkingSlotAsync(
                        request.ParkingSlotId,
                        cancellationToken);

            if (parkingSlot is null)
            {
                throw new KeyNotFoundException(
                    $"Parking slot with id {request.ParkingSlotId} was not found.");
            }

            if (parkingSlot.EventId != booking.EventId)
            {
                throw new InvalidOperationException(
                    "The selected parking slot does not belong to the booking event.");
            }

            if (parkingSlot.Status !=
                ParkingSlotStatus.Available)
            {
                throw new InvalidOperationException(
                    "The selected parking slot is not available.");
            }

            var slotAlreadyReserved =
                await _parkingReservationRepository
                    .HasActiveReservationForSlotAsync(
                        parkingSlot.Id,
                        cancellationToken);

            if (slotAlreadyReserved)
            {
                throw new InvalidOperationException(
                    "The selected parking slot already has an active reservation.");
            }

            // -------------------------------------------------
            // CREATE PARKING RESERVATION
            // -------------------------------------------------

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
                        now
                };

            await _parkingReservationRepository.AddAsync(
                parkingReservation,
                cancellationToken);

            // -------------------------------------------------
            // HOLD PARKING SLOT
            // -------------------------------------------------

            parkingSlot.Status =
                ParkingSlotStatus.Held;

            parkingSlot.UpdatedAt =
                now;

            // -------------------------------------------------
            // ADD PARKING FEE TO BOOKING TOTAL
            // -------------------------------------------------

            booking.TotalAmount +=
                parkingSlot.Fee;

            booking.UpdatedAt =
                now;

            // -------------------------------------------------
            // SAVE ALL CHANGES ATOMICALLY
            // -------------------------------------------------

            await _parkingReservationRepository
                .SaveChangesAsync(
                    cancellationToken);

            await transaction.CommitAsync(
                cancellationToken);

            return new ParkingReservationResponseDto
            {
                Id =
                    parkingReservation.Id,

                BookingId =
                    parkingReservation.BookingId,

                ParkingSlotId =
                    parkingReservation.ParkingSlotId,

                SlotNumber =
                    parkingSlot.SlotNumber,

                Zone =
                    parkingSlot.Zone,

                FeeSnapshot =
                    parkingReservation.FeeSnapshot,

                Status =
                    parkingSlot.Status,

                IsActive =
                    parkingReservation.IsActive,

                ReservedAtUtc =
                    parkingReservation.ReservedAtUtc,

                ReleasedAtUtc =
                    parkingReservation.ReleasedAtUtc
            };
        }
        catch (DbUpdateException exception)
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw new InvalidOperationException(
                "The parking slot could not be reserved because it may have been selected by another customer.",
                exception);
        }
        catch
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw;
        }
    }

    // =====================================================
    // RELEASE PARKING
    // =====================================================

    public async Task ReleaseAsync(
        int bookingId,
        int customerId,
        CancellationToken cancellationToken = default)
    {
        if (bookingId <= 0)
        {
            throw new ArgumentException(
                "Booking id must be greater than zero.");
        }

        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Customer id must be greater than zero.");
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

        try
        {
            var now =
                DateTime.UtcNow;

            // -------------------------------------------------
            // BOOKING VALIDATION
            // -------------------------------------------------

            var booking =
                await _parkingReservationRepository
                    .GetBookingAsync(
                        bookingId,
                        cancellationToken);

            if (booking is null)
            {
                throw new KeyNotFoundException(
                    $"Booking with id {bookingId} was not found.");
            }

            if (booking.CustomerId != customerId)
            {
                throw new UnauthorizedAccessException(
                    "You are not allowed to modify this booking.");
            }

            if (booking.Status != BookingStatus.Pending)
            {
                throw new InvalidOperationException(
                    "Parking can only be removed from a pending booking.");
            }

            // -------------------------------------------------
            // FIND ACTIVE PARKING RESERVATION
            // -------------------------------------------------

            var parkingReservation =
                await _parkingReservationRepository
                    .GetActiveByBookingIdAsync(
                        bookingId,
                        cancellationToken);

            if (parkingReservation is null)
            {
                throw new KeyNotFoundException(
                    "This booking does not have an active parking reservation.");
            }

            var parkingSlot =
                parkingReservation.ParkingSlot;

            // -------------------------------------------------
            // RELEASE RESERVATION
            // -------------------------------------------------

            parkingReservation.IsActive =
                false;

            parkingReservation.ReleasedAtUtc =
                now;

            // -------------------------------------------------
            // RELEASE PARKING SLOT
            // -------------------------------------------------

            if (parkingSlot.Status ==
                ParkingSlotStatus.Held)
            {
                parkingSlot.Status =
                    ParkingSlotStatus.Available;

                parkingSlot.UpdatedAt =
                    now;
            }

            // -------------------------------------------------
            // REMOVE PARKING FEE FROM BOOKING TOTAL
            // -------------------------------------------------

            booking.TotalAmount =
                Math.Max(
                    0m,
                    booking.TotalAmount -
                    parkingReservation.FeeSnapshot);

            booking.UpdatedAt =
                now;

            // -------------------------------------------------
            // SAVE ALL CHANGES ATOMICALLY
            // -------------------------------------------------

            await _parkingReservationRepository
                .SaveChangesAsync(
                    cancellationToken);

            await transaction.CommitAsync(
                cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw;
        }
    }
}