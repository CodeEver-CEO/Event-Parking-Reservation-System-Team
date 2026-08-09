namespace EventParkingReservationSystem.API.Enums;

public enum PaymentStatus
{
    // Payment has not been completed.
    Pending = 1,

    // Payment was completed successfully.
    Completed = 2,

    // Payment attempt was unsuccessful.
    Failed = 3,

    // Completed payment was returned.
    Refunded = 4
}
