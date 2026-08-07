using System.ComponentModel.DataAnnotations;
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models;

public class Event
{
    public int Id { get; set; }

    public int VenueId { get; set; }

    public Venue Venue { get; set; } = null!;

    public int CategoryId { get; set; }

    public EventCategory Category { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateTime StartsAtUtc { get; set; }

    public DateTime EndsAtUtc { get; set; }

    public decimal TicketPrice { get; set; }

    public decimal ParkingFee { get; set; }

    public int Capacity { get; set; }

    public EventStatus Status { get; set; } =
        EventStatus.Draft;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Stores all seats created for this event.
    public ICollection<Seat> Seats { get; set; } =
        new List<Seat>();

    // Stores all parking slots created for this event.
    public ICollection<ParkingSlot> ParkingSlots { get; set; } =
        new List<ParkingSlot>();

    // Stores all customer bookings for this event.
    public ICollection<Booking> Bookings { get; set; } =
        new List<Booking>();

    // Stores notifications associated with this event.
    public ICollection<Notification> Notifications { get; set; } =
        new List<Notification>();
}
