using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.DTOs.Parking;

public class ParkingReservationResponseDto
{
    public int Id { get; set; }

    public int BookingId { get; set; }

    public int ParkingSlotId { get; set; }

    public string SlotNumber { get; set; } = string.Empty;

    public string? Zone { get; set; }

    public decimal FeeSnapshot { get; set; }

    public ParkingSlotStatus Status { get; set; }

    public bool IsActive { get; set; }

    public DateTime ReservedAtUtc { get; set; }

    public DateTime? ReleasedAtUtc { get; set; }
}