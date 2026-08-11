namespace EventParkingReservationSystem.API.Models;

public class ParkingReservation
{
    public int Id { get; set; }

    public int BookingId { get; set; }

    public Booking Booking { get; set; } = null!;

    public int ParkingSlotId { get; set; }

    public ParkingSlot ParkingSlot { get; set; } = null!;

    // Stores the parking fee at the time of reservation.
    public decimal FeeSnapshot { get; set; }

    // Identifies whether the parking allocation is currently active.
    public bool IsActive { get; set; } = true;

    public DateTime ReservedAtUtc { get; set; } =
        DateTime.UtcNow;

    public DateTime? ReleasedAtUtc { get; set; }
}
