namespace EventParkingReservationSystem.API.Enums;

public enum NotificationType
{
    BookingCreated = 1,

    BookingConfirmed = 2,

    BookingCancelled = 3,

    BookingExpired = 4,

    PaymentCompleted = 5,

    EventUpdated = 6,

    EventReminder = 7
}