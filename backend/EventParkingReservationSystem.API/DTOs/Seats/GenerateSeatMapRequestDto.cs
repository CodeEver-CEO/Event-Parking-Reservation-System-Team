using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Seats;

public class GenerateSeatMapRequestDto
{
    [Required(ErrorMessage = "At least one seat row is required.")]
    [MinLength(
        1,
        ErrorMessage = "At least one seat row is required.")]
    public List<GenerateSeatRowRequestDto> Rows { get; set; }
        = new();
}