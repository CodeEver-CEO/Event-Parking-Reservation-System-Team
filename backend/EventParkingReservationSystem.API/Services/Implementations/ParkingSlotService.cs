using EventParkingReservationSystem.API.DTOs.Parking;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations;

public class ParkingSlotService : IParkingSlotService
{
    private readonly IParkingSlotRepository _parkingSlotRepository;

    public ParkingSlotService(
        IParkingSlotRepository parkingSlotRepository)
    {
        _parkingSlotRepository = parkingSlotRepository;
    }

    public async Task<IReadOnlyList<ParkingSlotResponseDto>> GetByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken = default)
    {
        if (eventId <= 0)
        {
            throw new ArgumentException(
                "Event id must be greater than zero.");
        }

        var eventExists =
            await _parkingSlotRepository.EventExistsAsync(
                eventId,
                cancellationToken);

        if (!eventExists)
        {
            throw new KeyNotFoundException(
                $"Event with id {eventId} was not found.");
        }

        var parkingSlots =
            await _parkingSlotRepository.GetByEventIdAsync(
                eventId,
                cancellationToken);

        return parkingSlots
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<ParkingSlotResponseDto> CreateAsync(
        int eventId,
        CreateParkingSlotRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (eventId <= 0)
        {
            throw new ArgumentException(
                "Event id must be greater than zero.");
        }

        var eventExists =
            await _parkingSlotRepository.EventExistsAsync(
                eventId,
                cancellationToken);

        if (!eventExists)
        {
            throw new KeyNotFoundException(
                $"Event with id {eventId} was not found.");
        }

        var slotNumber =
            request.SlotNumber.Trim();

        if (string.IsNullOrWhiteSpace(slotNumber))
        {
            throw new ArgumentException(
                "Parking slot number is required.");
        }

        if (request.Fee < 0)
        {
            throw new ArgumentException(
                "Parking fee cannot be negative.");
        }

        var duplicateExists =
            await _parkingSlotRepository.SlotNumberExistsAsync(
                eventId,
                slotNumber,
                cancellationToken: cancellationToken);

        if (duplicateExists)
        {
            throw new InvalidOperationException(
                $"Parking slot '{slotNumber}' already exists for this event.");
        }

        var parkingSlot =
            new ParkingSlot
            {
                EventId = eventId,
                SlotNumber = slotNumber,
                Zone = NormalizeOptionalText(
                    request.Zone),
                Fee = request.Fee,
                Status = ParkingSlotStatus.Available,
                CreatedAt = DateTime.UtcNow
            };

        await _parkingSlotRepository.AddAsync(
            parkingSlot,
            cancellationToken);

        await _parkingSlotRepository.SaveChangesAsync(
            cancellationToken);

        return MapToResponse(
            parkingSlot);
    }

    public async Task<ParkingSlotResponseDto> UpdateAsync(
        int eventId,
        int parkingSlotId,
        UpdateParkingSlotRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (eventId <= 0)
        {
            throw new ArgumentException(
                "Event id must be greater than zero.");
        }

        if (parkingSlotId <= 0)
        {
            throw new ArgumentException(
                "Parking slot id must be greater than zero.");
        }

        if (!Enum.IsDefined(
                typeof(ParkingSlotStatus),
                request.Status))
        {
            throw new ArgumentException(
                "Invalid parking slot status.");
        }

        var parkingSlot =
            await _parkingSlotRepository.GetByIdAsync(
                parkingSlotId,
                cancellationToken);

        if (parkingSlot is null ||
            parkingSlot.EventId != eventId)
        {
            throw new KeyNotFoundException(
                $"Parking slot with id {parkingSlotId} was not found for event {eventId}.");
        }

        var slotNumber =
            request.SlotNumber.Trim();

        if (string.IsNullOrWhiteSpace(slotNumber))
        {
            throw new ArgumentException(
                "Parking slot number is required.");
        }

        if (request.Fee < 0)
        {
            throw new ArgumentException(
                "Parking fee cannot be negative.");
        }

        var duplicateExists =
            await _parkingSlotRepository.SlotNumberExistsAsync(
                eventId,
                slotNumber,
                parkingSlotId,
                cancellationToken);

        if (duplicateExists)
        {
            throw new InvalidOperationException(
                $"Parking slot '{slotNumber}' already exists for this event.");
        }

        var hasActiveReservation =
            await _parkingSlotRepository.HasActiveReservationAsync(
                parkingSlotId,
                cancellationToken);

        if (hasActiveReservation)
        {
            throw new InvalidOperationException(
                "This parking slot has an active reservation and cannot be modified.");
        }

        if (request.Status == ParkingSlotStatus.Held ||
            request.Status == ParkingSlotStatus.Reserved)
        {
            throw new ArgumentException(
                "Held and Reserved statuses are managed automatically by the reservation system.");
        }

        parkingSlot.SlotNumber =
            slotNumber;

        parkingSlot.Zone =
            NormalizeOptionalText(
                request.Zone);

        parkingSlot.Fee =
            request.Fee;

        parkingSlot.Status =
            request.Status;

        parkingSlot.UpdatedAt =
            DateTime.UtcNow;

        _parkingSlotRepository.Update(
            parkingSlot);

        await _parkingSlotRepository.SaveChangesAsync(
            cancellationToken);

        return MapToResponse(
            parkingSlot);
    }

    public async Task DeleteAsync(
        int eventId,
        int parkingSlotId,
        CancellationToken cancellationToken = default)
    {
        if (eventId <= 0)
        {
            throw new ArgumentException(
                "Event id must be greater than zero.");
        }

        if (parkingSlotId <= 0)
        {
            throw new ArgumentException(
                "Parking slot id must be greater than zero.");
        }

        var parkingSlot =
            await _parkingSlotRepository.GetByIdAsync(
                parkingSlotId,
                cancellationToken);

        if (parkingSlot is null ||
            parkingSlot.EventId != eventId)
        {
            throw new KeyNotFoundException(
                $"Parking slot with id {parkingSlotId} was not found for event {eventId}.");
        }

        var hasActiveReservation =
            await _parkingSlotRepository.HasActiveReservationAsync(
                parkingSlotId,
                cancellationToken);

        if (hasActiveReservation)
        {
            throw new InvalidOperationException(
                "This parking slot has an active reservation and cannot be deleted.");
        }

        _parkingSlotRepository.Delete(
            parkingSlot);

        await _parkingSlotRepository.SaveChangesAsync(
            cancellationToken);
    }

    private static ParkingSlotResponseDto MapToResponse(
        ParkingSlot parkingSlot)
    {
        return new ParkingSlotResponseDto
        {
            Id = parkingSlot.Id,
            EventId = parkingSlot.EventId,
            SlotNumber = parkingSlot.SlotNumber,
            Zone = parkingSlot.Zone,
            Fee = parkingSlot.Fee,
            Status = parkingSlot.Status
        };
    }

    private static string? NormalizeOptionalText(
        string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }
}