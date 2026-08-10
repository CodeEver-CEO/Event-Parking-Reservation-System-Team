using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces;

public interface INotificationRepository
{
    // Adds a new notification.
    Task<Notification> AddAsync(
        Notification notification);

    // Gets all notifications belonging to a customer.
    Task<List<Notification>> GetByCustomerIdAsync(
        int customerId);

    // Gets one notification belonging to a specific customer.
    Task<Notification?> GetByIdAsync(
        int notificationId,
        int customerId);

    // Gets the number of unread notifications.
    Task<int> GetUnreadCountAsync(
        int customerId);

    // Gets all unread notifications belonging to a customer.
    Task<List<Notification>> GetUnreadByCustomerIdAsync(
        int customerId);

    // Updates an existing notification.
    Task UpdateAsync(
        Notification notification);

    // Saves pending database changes.
    Task SaveChangesAsync();
}