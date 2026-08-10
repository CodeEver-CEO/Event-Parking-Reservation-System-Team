using EventParkingReservationSystem.API.DTOs.Notifications;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationService(
            INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
        }

        // ----------------------------------------------------
        // Create notification
        // ----------------------------------------------------
        public async Task<NotificationResponseDto>
            CreateNotificationAsync(
                CreateNotificationDto dto)
        {
            var notification = new Notification
            {
                CustomerId = dto.CustomerId,

                BookingId = dto.BookingId,

                EventId = dto.EventId,

                Type = dto.Type,

                Title = dto.Title,

                Message = dto.Message,

                IsRead = false,

                ReadAtUtc = null,

                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository
                .AddAsync(notification);

            await _notificationRepository
                .SaveChangesAsync();

            return MapToResponse(notification);
        }

        // ----------------------------------------------------
        // Get all customer notifications
        // ----------------------------------------------------
        public async Task<List<NotificationResponseDto>>
            GetCustomerNotificationsAsync(
                int customerId)
        {
            var notifications =
                await _notificationRepository
                    .GetByCustomerIdAsync(customerId);

            return notifications
                .Select(MapToResponse)
                .ToList();
        }

        // ----------------------------------------------------
        // Get unread notification count
        // ----------------------------------------------------
        public async Task<int>
            GetUnreadCountAsync(
                int customerId)
        {
            return await _notificationRepository
                .GetUnreadCountAsync(customerId);
        }

        // ----------------------------------------------------
        // Mark one notification as read
        // ----------------------------------------------------
        public async Task<bool>
            MarkAsReadAsync(
                int notificationId,
                int customerId)
        {
            var notification =
                await _notificationRepository
                    .GetByIdAsync(notificationId);

            if (notification == null)
            {
                return false;
            }

            // Customer can only update own notification
            if (notification.CustomerId != customerId)
            {
                return false;
            }

            // Already read
            if (notification.IsRead)
            {
                return true;
            }

            notification.IsRead = true;

            notification.ReadAtUtc =
                DateTime.UtcNow;

            await _notificationRepository
                .UpdateAsync(notification);

            await _notificationRepository
                .SaveChangesAsync();

            return true;
        }

        // ----------------------------------------------------
        // Mark all notifications as read
        // ----------------------------------------------------
        public async Task<int>
            MarkAllAsReadAsync(
                int customerId)
        {
            var notifications =
                await _notificationRepository
                    .GetByCustomerIdAsync(customerId);

            var unreadNotifications =
                notifications
                    .Where(n => !n.IsRead)
                    .ToList();

            if (unreadNotifications.Count == 0)
            {
                return 0;
            }

            foreach (var notification
                in unreadNotifications)
            {
                notification.IsRead = true;

                notification.ReadAtUtc =
                    DateTime.UtcNow;

                await _notificationRepository
                    .UpdateAsync(notification);
            }

            await _notificationRepository
                .SaveChangesAsync();

            return unreadNotifications.Count;
        }

        // ----------------------------------------------------
        // Entity -> DTO mapping
        // ----------------------------------------------------
        private static NotificationResponseDto
            MapToResponse(
                Notification notification)
        {
            return new NotificationResponseDto
            {
                Id = notification.Id,

                Type =
                    notification.Type.ToString(),

                Title =
                    notification.Title,

                Message =
                    notification.Message,

                IsRead =
                    notification.IsRead,

                ReadAt =
                    notification.ReadAtUtc,

                CreatedAt =
                    notification.CreatedAt
            };
        }
    }
}
