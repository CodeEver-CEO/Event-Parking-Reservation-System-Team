using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.DTOs.Notifications
{
    public class CreateNotificationDto
    {
        public int CustomerId { get; set; }

        public int? BookingId { get; set; }

        public int? EventId { get; set; }

        public NotificationType Type { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;
    }
}