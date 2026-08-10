using EventParkingReservationSystem.API.DTOs.Notifications;

namespace EventParkingReservationSystem.API.Services.Interfaces
{
    public interface INotificationService
    {
        // Create a new notification
        Task<NotificationResponseDto> CreateNotificationAsync(
            CreateNotificationDto dto);

        // Get all notifications for a customer
        Task<List<NotificationResponseDto>>
            GetCustomerNotificationsAsync(
                int customerId);

        // Get unread notification count
        Task<int> GetUnreadCountAsync(
            int customerId);

        // Mark one notification as read
        Task<bool> MarkAsReadAsync(
            int notificationId,
            int customerId);

        // Mark all customer notifications as read
        Task<int> MarkAllAsReadAsync(
            int customerId);
    }
}
