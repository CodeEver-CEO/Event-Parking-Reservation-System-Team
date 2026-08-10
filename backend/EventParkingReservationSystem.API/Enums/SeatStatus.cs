namespace EventParkingReservationSystem.API.Enums;

public enum SeatStatus
{
    // Seat is available for booking.
    Available = 1,

    // Seat is temporarily held during checkout.
    Held = 2,

    // Seat is successfully booked.
    Booked = 3,

    // Seat cannot be selected.
    Unavailable = 4
}
