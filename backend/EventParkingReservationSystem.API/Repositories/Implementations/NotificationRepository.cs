using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly ApplicationDbContext _context;

        public NotificationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // ----------------------------------------------------
        // Add new notification
        // ----------------------------------------------------
        public async Task<Notification> AddAsync(
            Notification notification)
        {
            await _context.Notifications.AddAsync(notification);

            return notification;
        }

        // ----------------------------------------------------
        // Get all notifications for a customer
        // Newest notification first
        // ----------------------------------------------------
        public async Task<List<Notification>> GetByCustomerIdAsync(
            int customerId)
        {
            return await _context.Notifications
                .Where(n => n.CustomerId == customerId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        // ----------------------------------------------------
        // Get notification by Id
        // ----------------------------------------------------
        public async Task<Notification?> GetByIdAsync(
            int notificationId)
        {
            return await _context.Notifications
                .FirstOrDefaultAsync(
                    n => n.Id == notificationId);
        }

        // ----------------------------------------------------
        // Get unread notification count
        // ----------------------------------------------------
        public async Task<int> GetUnreadCountAsync(
            int customerId)
        {
            return await _context.Notifications
                .CountAsync(n =>
                    n.CustomerId == customerId &&
                    !n.IsRead);
        }

        // ----------------------------------------------------
        // Update notification
        // ----------------------------------------------------
        public async Task UpdateAsync(
            Notification notification)
        {
            _context.Notifications.Update(notification);

            await Task.CompletedTask;
        }

        // ----------------------------------------------------
        // Save database changes
        // ----------------------------------------------------
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
