using System.ComponentModel.DataAnnotations;
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models;

public class Notification
{
    public int Id { get; set; }

    public int CustomerId { get; set; }

    public Customer Customer { get; set; } = null!;

    public int? BookingId { get; set; }

    public Booking? Booking { get; set; }

    public int? EventId { get; set; }

    public Event? Event { get; set; }

    public NotificationType Type { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime? ReadAtUtc { get; set; }

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;
}
