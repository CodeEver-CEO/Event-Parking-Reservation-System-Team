using EventParkingReservationSystem.API.DTOs.Parking;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IParkingSlotService
{
    Task<IReadOnlyList<ParkingSlotResponseDto>> GetByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken = default);

    Task<ParkingSlotResponseDto> CreateAsync(
        int eventId,
        CreateParkingSlotRequestDto request,
        CancellationToken cancellationToken = default);

    Task<ParkingSlotResponseDto> UpdateAsync(
        int eventId,
        int parkingSlotId,
        UpdateParkingSlotRequestDto request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        int eventId,
        int parkingSlotId,
        CancellationToken cancellationToken = default);
}