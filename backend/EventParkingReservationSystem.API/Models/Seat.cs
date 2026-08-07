using System.ComponentModel.DataAnnotations;
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models;

public class Seat
{
    public int Id { get; set; }

    public int EventId { get; set; }

    public Event Event { get; set; } = null!;

    [Required]
    [MaxLength(30)]
    public string SeatNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string RowLabel { get; set; } = string.Empty;

    public int ColumnNumber { get; set; }

    [MaxLength(50)]
    public string? SeatType { get; set; }

    public decimal Price { get; set; }

    public SeatStatus Status { get; set; } =
        SeatStatus.Available;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Preserves the seat's booking allocation history.
    public ICollection<BookingSeat> BookingSeats { get; set; } =
        new List<BookingSeat>();
}
