using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations;

public class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _context;

    public NotificationRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    // ----------------------------------------------------
    // Add new notification
    // ----------------------------------------------------
    public async Task<Notification> AddAsync(
        Notification notification)
    {
        await _context.Notifications
            .AddAsync(notification);

        return notification;
    }

    // ----------------------------------------------------
    // Get all notifications for a customer
    // Newest notifications are returned first
    // ----------------------------------------------------
    public async Task<List<Notification>>
        GetByCustomerIdAsync(int customerId)
    {
        return await _context.Notifications
            .AsNoTracking()
            .Where(notification =>
                notification.CustomerId == customerId)
            .OrderByDescending(notification =>
                notification.CreatedAt)
            .ToListAsync();
    }

    // ----------------------------------------------------
    // Get one notification belonging to the customer
    // ----------------------------------------------------
    public async Task<Notification?> GetByIdAsync(
        int notificationId,
        int customerId)
    {
        return await _context.Notifications
            .FirstOrDefaultAsync(notification =>
                notification.Id == notificationId &&
                notification.CustomerId == customerId);
    }

    // ----------------------------------------------------
    // Get unread notification count
    // ----------------------------------------------------
    public async Task<int> GetUnreadCountAsync(
        int customerId)
    {
        return await _context.Notifications
            .CountAsync(notification =>
                notification.CustomerId == customerId &&
                !notification.IsRead);
    }

    // ----------------------------------------------------
    // Get all unread notifications for a customer
    // ----------------------------------------------------
    public async Task<List<Notification>>
        GetUnreadByCustomerIdAsync(int customerId)
    {
        return await _context.Notifications
            .Where(notification =>
                notification.CustomerId == customerId &&
                !notification.IsRead)
            .OrderByDescending(notification =>
                notification.CreatedAt)
            .ToListAsync();
    }

    // ----------------------------------------------------
    // Update notification
    // ----------------------------------------------------
    public Task UpdateAsync(
        Notification notification)
    {
        _context.Notifications.Update(notification);

        return Task.CompletedTask;
    }

    // ----------------------------------------------------
    // Save database changes
    // ----------------------------------------------------
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}