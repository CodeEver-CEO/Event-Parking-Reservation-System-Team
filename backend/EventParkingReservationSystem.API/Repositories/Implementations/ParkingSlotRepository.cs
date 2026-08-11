using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations;

public class ParkingSlotRepository : IParkingSlotRepository
{
    private readonly ApplicationDbContext _context;

    public ParkingSlotRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ParkingSlot>> GetByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ParkingSlots
            .AsNoTracking()
            .Where(slot => slot.EventId == eventId)
            .OrderBy(slot => slot.Zone)
            .ThenBy(slot => slot.SlotNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<ParkingSlot?> GetByIdAsync(
        int parkingSlotId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ParkingSlots
            .FirstOrDefaultAsync(
                slot => slot.Id == parkingSlotId,
                cancellationToken);
    }

    public async Task<bool> EventExistsAsync(
        int eventId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Events
            .AsNoTracking()
            .AnyAsync(
                eventItem => eventItem.EventId == eventId,
                cancellationToken);
    }

    public async Task<bool> SlotNumberExistsAsync(
        int eventId,
        string slotNumber,
        int? excludeParkingSlotId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedSlotNumber =
            slotNumber.Trim();

        return await _context.ParkingSlots
            .AsNoTracking()
            .AnyAsync(
                slot =>
                    slot.EventId == eventId &&
                    slot.SlotNumber == normalizedSlotNumber &&
                    (!excludeParkingSlotId.HasValue ||
                     slot.Id != excludeParkingSlotId.Value),
                cancellationToken);
    }

    public async Task<bool> HasActiveReservationAsync(
        int parkingSlotId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ParkingReservations
            .AsNoTracking()
            .AnyAsync(
                reservation =>
                    reservation.ParkingSlotId == parkingSlotId &&
                    reservation.IsActive,
                cancellationToken);
    }

    public async Task AddAsync(
        ParkingSlot parkingSlot,
        CancellationToken cancellationToken = default)
    {
        await _context.ParkingSlots.AddAsync(
            parkingSlot,
            cancellationToken);
    }

    public void Update(
        ParkingSlot parkingSlot)
    {
        _context.ParkingSlots.Update(
            parkingSlot);
    }

    public void Delete(
        ParkingSlot parkingSlot)
    {
        _context.ParkingSlots.Remove(
            parkingSlot);
    }

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(
            cancellationToken);
    }
}