namespace EventParkingReservationSystem.API.Enums;

public enum BookingStatus
{
    // Booking is created but payment is not completed.
    Pending = 1,

    // Payment is successful and booking is confirmed.
    Confirmed = 2,

    // Booking is cancelled by the customer or administrator.
    Cancelled = 3,

    // Booking hold time ended before payment completion.
    Expired = 4
}