using System.ComponentModel.DataAnnotations;
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models;

public class Booking
{
    public int Id { get; set; }

    [Required]
    [MaxLength(30)]
    public string BookingNumber { get; set; } = string.Empty;

    public int CustomerId { get; set; }

    public Customer Customer { get; set; } = null!;

    public int EventId { get; set; }

    public Event Event { get; set; } = null!;

    public BookingStatus Status { get; set; } =
        BookingStatus.Pending;

    // Controls when an unpaid booking hold expires.
    public DateTime? HoldExpiresAtUtc { get; set; }

    public decimal TotalAmount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? ConfirmedAtUtc { get; set; }

    public DateTime? CancelledAtUtc { get; set; }

    // A booking can contain multiple selected seats.
    public ICollection<BookingSeat> BookingSeats { get; set; } =
        new List<BookingSeat>();

    // Keeps parking reservation history for the booking.
    public ICollection<ParkingReservation> ParkingReservations
    { get; set; } = new List<ParkingReservation>();

    // Each booking has one simulated payment record.
    public Payment? Payment { get; set; }

    public ICollection<Notification> Notifications { get; set; } =
        new List<Notification>();
}
