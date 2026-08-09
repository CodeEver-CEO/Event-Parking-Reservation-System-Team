using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces;

public interface IParkingSlotRepository
{
    Task<IReadOnlyList<ParkingSlot>> GetByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken = default);

    Task<ParkingSlot?> GetByIdAsync(
        int parkingSlotId,
        CancellationToken cancellationToken = default);

    Task<bool> EventExistsAsync(
        int eventId,
        CancellationToken cancellationToken = default);

    Task<bool> SlotNumberExistsAsync(
        int eventId,
        string slotNumber,
        int? excludeParkingSlotId = null,
        CancellationToken cancellationToken = default);

    Task<bool> HasActiveReservationAsync(
        int parkingSlotId,
        CancellationToken cancellationToken = default);

    Task AddAsync(
        ParkingSlot parkingSlot,
        CancellationToken cancellationToken = default);

    void Update(
        ParkingSlot parkingSlot);

    void Delete(
        ParkingSlot parkingSlot);

    Task SaveChangesAsync(
        CancellationToken cancellationToken = default);
}