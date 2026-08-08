using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.DTOs.Seats;

public class SeatResponseDto
{
    public int Id { get; set; }

    public int EventId { get; set; }

    public string SeatNumber { get; set; } = string.Empty;

    public string RowLabel { get; set; } = string.Empty;

    public int ColumnNumber { get; set; }

    public string? SeatType { get; set; }

    public decimal Price { get; set; }

    public SeatStatus Status { get; set; }

    public bool IsAvailable { get; set; }

    public bool IsProtected { get; set; }
}