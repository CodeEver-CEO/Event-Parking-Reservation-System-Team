namespace EventParkingReservationSystem.API.Enums;

public enum EventStatus
{
    // Event is saved but not visible to customers.
    Draft = 1,

    // Event is available for customer booking.
    Published = 2,

    // Event has already finished.
    Completed = 3,

    // Event is cancelled and unavailable for booking.
    Cancelled = 4
}