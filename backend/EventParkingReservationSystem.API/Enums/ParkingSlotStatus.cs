namespace EventParkingReservationSystem.API.Enums;

public enum ParkingSlotStatus
{
    // Parking slot is available for reservation.
    Available = 1,

    // Parking slot is temporarily held during checkout.
    Held = 2,

    // Parking slot is successfully reserved.
    Reserved = 3,

    // Parking slot cannot be used.
    Unavailable = 4
}
