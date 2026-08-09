using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.DTOs.Parking;

public class ParkingSlotResponseDto
{
    public int Id { get; set; }

    public int EventId { get; set; }

    public string SlotNumber { get; set; } = string.Empty;

    public string? Zone { get; set; }

    public decimal Fee { get; set; }

    public ParkingSlotStatus Status { get; set; }
}