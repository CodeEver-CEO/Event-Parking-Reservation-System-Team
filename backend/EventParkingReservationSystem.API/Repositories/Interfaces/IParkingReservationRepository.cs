using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces;

public interface IParkingReservationRepository
{
    Task<Booking?> GetBookingAsync(
        int bookingId,
        CancellationToken cancellationToken = default);

    Task<ParkingSlot?> GetParkingSlotAsync(
        int parkingSlotId,
        CancellationToken cancellationToken = default);

    Task<ParkingReservation?> GetActiveByBookingIdAsync(
        int bookingId,
        CancellationToken cancellationToken = default);

    Task<bool> HasActiveReservationForSlotAsync(
        int parkingSlotId,
        CancellationToken cancellationToken = default);

    Task AddAsync(
        ParkingReservation parkingReservation,
        CancellationToken cancellationToken = default);

    Task SaveChangesAsync(
        CancellationToken cancellationToken = default);
}