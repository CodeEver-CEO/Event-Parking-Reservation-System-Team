using EventParkingReservationSystem.API.DTOs.Notifications;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Common;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;

    public NotificationService(
        INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    // ----------------------------------------------------
    // Get all notifications for customer
    // ----------------------------------------------------
    public async Task<
        ServiceResult<IReadOnlyList<NotificationResponseDto>>>
        GetNotificationsAsync(int customerId)
    {
        if (customerId <= 0)
        {
            return ServiceResult<
                IReadOnlyList<NotificationResponseDto>>
                .Failure("Invalid customer ID.");
        }

        var notifications =
            await _notificationRepository
                .GetByCustomerIdAsync(customerId);

        IReadOnlyList<NotificationResponseDto> response =
            notifications
                .Select(MapToResponseDto)
                .ToList();

        return ServiceResult<
            IReadOnlyList<NotificationResponseDto>>
            .Success(response);
    }

    // ----------------------------------------------------
    // Get unread notification count
    // ----------------------------------------------------
    public async Task<
        ServiceResult<UnreadNotificationCountDto>>
        GetUnreadCountAsync(int customerId)
    {
        if (customerId <= 0)
        {
            return ServiceResult<
                UnreadNotificationCountDto>
                .Failure("Invalid customer ID.");
        }

        int count =
            await _notificationRepository
                .GetUnreadCountAsync(customerId);

        var response =
            new UnreadNotificationCountDto
            {
                Count = count
            };

        return ServiceResult<
            UnreadNotificationCountDto>
            .Success(response);
    }

    // ----------------------------------------------------
    // Mark one notification as read
    // ----------------------------------------------------
    public async Task<
        ServiceResult<NotificationResponseDto>>
        MarkAsReadAsync(
            int customerId,
            int notificationId)
    {
        if (customerId <= 0 ||
            notificationId <= 0)
        {
            return ServiceResult<
                NotificationResponseDto>
                .Failure("Invalid notification request.");
        }

        var notification =
            await _notificationRepository
                .GetByIdAsync(
                    notificationId,
                    customerId);

        if (notification is null)
        {
            return ServiceResult<
                NotificationResponseDto>
                .Failure("Notification was not found.");
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAtUtc = DateTime.UtcNow;

            await _notificationRepository
                .UpdateAsync(notification);

            await _notificationRepository
                .SaveChangesAsync();
        }

        return ServiceResult<
            NotificationResponseDto>
            .Success(
                MapToResponseDto(notification));
    }

    // ----------------------------------------------------
    // Mark all customer notifications as read
    // ----------------------------------------------------
    public async Task<ServiceResult<bool>>
        MarkAllAsReadAsync(int customerId)
    {
        if (customerId <= 0)
        {
            return ServiceResult<bool>
                .Failure("Invalid customer ID.");
        }

        var notifications =
            await _notificationRepository
                .GetUnreadByCustomerIdAsync(
                    customerId);

        if (notifications.Count == 0)
        {
            return ServiceResult<bool>
                .Success(true);
        }

        DateTime readAtUtc = DateTime.UtcNow;

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAtUtc = readAtUtc;

            await _notificationRepository
                .UpdateAsync(notification);
        }

        await _notificationRepository
            .SaveChangesAsync();

        return ServiceResult<bool>
            .Success(true);
    }

    // ----------------------------------------------------
    // Create a notification (called by other modules)
    // ----------------------------------------------------
    public async Task CreateNotificationAsync(
        CreateNotificationDto dto)
    {
        var notification = new Notification
        {
            CustomerId = dto.CustomerId,
            Type = dto.Type,
            Title = dto.Title,
            Message = dto.Message,
            BookingId = dto.BookingId,
            EventId = dto.EventId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();
    }

    // ----------------------------------------------------
    // Entity -> DTO mapping
    // ----------------------------------------------------
    private static NotificationResponseDto MapToResponseDto(
        Notification notification)
    {
        return new NotificationResponseDto
        {
            Id = notification.Id,
            CustomerId = notification.CustomerId,
            BookingId = notification.BookingId,
            EventId = notification.EventId,
            Type = notification.Type,
            Title = notification.Title,
            Message = notification.Message,
            IsRead = notification.IsRead,
            ReadAtUtc = notification.ReadAtUtc,
            CreatedAt = notification.CreatedAt
        };
    }
}
       