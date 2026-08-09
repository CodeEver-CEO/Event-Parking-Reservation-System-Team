namespace EventParkingReservationSystem.API.Models;

public class BookingSeat
{
    public int BookingId { get; set; }

    public Booking Booking { get; set; } = null!;

    public int SeatId { get; set; }

    public Seat Seat { get; set; } = null!;

    // Stores the seat price at the time of booking.
    public decimal TicketPriceSnapshot { get; set; }

    // Identifies whether the seat allocation is currently active.
    public bool IsActive { get; set; } = true;

    public DateTime ReservedAtUtc { get; set; } =
        DateTime.UtcNow;

    public DateTime? ReleasedAtUtc { get; set; }
}
