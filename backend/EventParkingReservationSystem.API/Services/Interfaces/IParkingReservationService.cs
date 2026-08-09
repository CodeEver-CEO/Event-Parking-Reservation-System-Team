using EventParkingReservationSystem.API.DTOs.Parking;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IParkingReservationService
{
    Task<ParkingReservationResponseDto> ReserveAsync(
        int bookingId,
        int customerId,
        ReserveParkingRequestDto request,
        CancellationToken cancellationToken = default);

    Task ReleaseAsync(
        int bookingId,
        int customerId,
        CancellationToken cancellationToken = default);
}