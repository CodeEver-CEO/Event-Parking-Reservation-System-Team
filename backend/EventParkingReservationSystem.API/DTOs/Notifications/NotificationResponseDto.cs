using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.DTOs.Notifications;

public sealed class NotificationResponseDto
{
    public int Id { get; set; }

    public int CustomerId { get; set; }

    public int? BookingId { get; set; }

    public int? EventId { get; set; }

    public NotificationType Type { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime? ReadAtUtc { get; set; }

    public DateTime CreatedAt { get; set; }
}