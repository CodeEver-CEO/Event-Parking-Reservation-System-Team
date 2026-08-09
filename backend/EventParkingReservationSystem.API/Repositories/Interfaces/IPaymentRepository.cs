
using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces
{
    public interface IPaymentRepository
    {
        Task<Payment?> GetByBookingIdAsync(
            int bookingId);

        Task<Payment?> GetByIdAsync(
            int paymentId);

        Task<List<Payment>>
            GetByCustomerIdAsync(
                int customerId);

        Task<Payment> AddAsync(
            Payment payment);

        Task SaveChangesAsync();
    }
}