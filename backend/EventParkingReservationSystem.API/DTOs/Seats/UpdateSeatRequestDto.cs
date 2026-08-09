using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Seats;

public class UpdateSeatRequestDto
{
    [Required(ErrorMessage = "Seat number is required.")]
    [MaxLength(
        30,
        ErrorMessage = "Seat number cannot exceed 30 characters.")]
    public string SeatNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Row label is required.")]
    [MaxLength(
        20,
        ErrorMessage = "Row label cannot exceed 20 characters.")]
    public string RowLabel { get; set; } = string.Empty;

    [Range(
        1,
        int.MaxValue,
        ErrorMessage = "Column number must be greater than zero.")]
    public int ColumnNumber { get; set; }

    [Range(
        typeof(decimal),
        "0",
        "99999999",
        ErrorMessage = "Seat price cannot be negative.")]
    public decimal Price { get; set; }

    [MaxLength(
        50,
        ErrorMessage = "Seat type cannot exceed 50 characters.")]
    public string? SeatType { get; set; }
}