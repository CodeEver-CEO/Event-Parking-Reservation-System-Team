
using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly ApplicationDbContext _context;

        public PaymentRepository(
            ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Payment?>
            GetByBookingIdAsync(
                int bookingId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(
                    p => p.BookingId == bookingId);
        }

        public async Task<Payment?>
            GetByIdAsync(
                int paymentId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b.Event)
                .FirstOrDefaultAsync(
                    p => p.PaymentId == paymentId);
        }

        public async Task<List<Payment>>
            GetByCustomerIdAsync(
                int customerId)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p =>
                    p.Booking.CustomerId ==
                    customerId)
                .OrderByDescending(
                    p => p.PaymentDate)
                .ToListAsync();
        }

        public async Task<Payment>
            AddAsync(
                Payment payment)
        {
            await _context.Payments.AddAsync(
                payment);

            return payment;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}