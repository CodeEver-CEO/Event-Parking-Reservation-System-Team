using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Parking;

public class CreateParkingSlotRequestDto
{
    [Required]
    [MaxLength(30)]
    public string SlotNumber { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Zone { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Fee { get; set; }
}