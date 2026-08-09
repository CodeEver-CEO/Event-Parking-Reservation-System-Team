using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;

using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations;

public class PaymentRepository : IPaymentRepository
{
    private readonly ApplicationDbContext _context;

    public PaymentRepository(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Payment?> GetByBookingIdAsync(
        int bookingId)
    {
        return await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b.Event)
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(
                p => p.BookingId == bookingId);
    }

    public async Task<Payment?> GetByIdAsync(
        int paymentId)
    {
        return await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b.Event)
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(
                p => p.Id == paymentId);
    }

    public async Task<List<Payment>> GetByCustomerIdAsync(
        int customerId)
    {
        return await _context.Payments
            .Include(p => p.Booking)
                .ThenInclude(b => b.Event)
            .Include(p => p.Customer)
            .Where(
                p => p.CustomerId == customerId)
            .OrderByDescending(
                p => p.PaidAtUtc ?? p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Payment> AddAsync(
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