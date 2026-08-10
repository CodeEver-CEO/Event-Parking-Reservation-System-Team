using EventParkingReservationSystem.API.DTOs.Notifications;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Services.Common;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface INotificationService
{
    // Gets all notifications for the authenticated customer.
    Task<ServiceResult<IReadOnlyList<NotificationResponseDto>>>
        GetNotificationsAsync(
            int customerId);

    // Gets the unread notification count.
    Task<ServiceResult<UnreadNotificationCountDto>>
        GetUnreadCountAsync(
            int customerId);

    // Marks one notification as read.
    Task<ServiceResult<NotificationResponseDto>>
        MarkAsReadAsync(
            int customerId,
            int notificationId);

    // Marks all notifications as read.
    Task<ServiceResult<bool>>
        MarkAllAsReadAsync(
            int customerId);

    // Creates a notification from another system module.
    Task CreateNotificationAsync(
        CreateNotificationDto dto);
}