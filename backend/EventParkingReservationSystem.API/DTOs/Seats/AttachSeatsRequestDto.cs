using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Seats;

public class AttachSeatsRequestDto
{
    [Required(ErrorMessage = "At least one seat must be selected.")]
    [MinLength(
        1,
        ErrorMessage = "At least one seat must be selected.")]
    public List<int> SeatIds { get; set; } = new();
}