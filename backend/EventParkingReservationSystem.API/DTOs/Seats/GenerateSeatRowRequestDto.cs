using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Seats;

public class GenerateSeatRowRequestDto
{
    [Range(
        1,
        500,
        ErrorMessage = "Seat count must be greater than zero.")]
    public int SeatCount { get; set; }

    [Range(
        typeof(decimal),
        "0",
        "99999999",
        ErrorMessage = "Row price cannot be negative.")]
    public decimal RowPrice { get; set; }

    [MaxLength(
        50,
        ErrorMessage = "Seat type cannot exceed 50 characters.")]
    public string? SeatType { get; set; }
}