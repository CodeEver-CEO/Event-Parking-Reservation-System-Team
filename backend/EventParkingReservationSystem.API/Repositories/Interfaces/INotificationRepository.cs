using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces
{
    public interface INotificationRepository
    {
        Task<Notification> AddAsync(Notification notification);

        Task<List<Notification>> GetByCustomerIdAsync(int customerId);

        Task<Notification?> GetByIdAsync(int notificationId);

        Task<int> GetUnreadCountAsync(int customerId);

        Task UpdateAsync(Notification notification);

        Task SaveChangesAsync();
    }
}
