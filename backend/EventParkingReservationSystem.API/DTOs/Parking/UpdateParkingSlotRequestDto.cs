using System.ComponentModel.DataAnnotations;
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.DTOs.Parking;

public class UpdateParkingSlotRequestDto
{
    [Required]
    [MaxLength(30)]
    public string SlotNumber { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Zone { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Fee { get; set; }

    public ParkingSlotStatus Status { get; set; }
}