
using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces
{
    public interface IBookingRepository
    {
        Task<Booking?> GetByIdAsync(int bookingId);

        Task<List<Booking>> GetByCustomerIdAsync(
            int customerId);

        Task<List<Booking>> GetByEventIdAsync(
            int eventId);

        Task<bool> AreSeatsAvailableAsync(
            int eventId,
            List<int> seatIds);

        Task<Booking> AddAsync(
            Booking booking);

        Task UpdateAsync(
            Booking booking);

        Task SaveChangesAsync();

        Task<List<Booking>>
            GetExpiredPendingBookingsAsync();
    }
}