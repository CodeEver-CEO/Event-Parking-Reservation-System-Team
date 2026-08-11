using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.DTOs.Dashboard;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Services.Implementations;

public sealed class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync()
    {
        int totalEvents =
            await _context.Events.CountAsync();

        int totalBookings =
            await _context.Bookings.CountAsync();

        int totalCustomers =
            await _context.Customers.CountAsync();

        // Seats currently free to be booked.
        int availableSeats =
            await _context.Seats
                .CountAsync(s => s.Status == SeatStatus.Available);

        // Parking slots that are held or reserved (i.e. not available).
        int occupiedParkingSlots =
            await _context.ParkingSlots
                .CountAsync(p => p.Status != ParkingSlotStatus.Available);

        // Revenue from completed (simulated) payments only.
        decimal totalRevenue =
            await _context.Payments
                .Where(p => p.Status == PaymentStatus.Completed)
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        return new AdminDashboardDto
        {
            TotalEvents = totalEvents,
            TotalBookings = totalBookings,
            AvailableSeats = availableSeats,
            OccupiedParkingSlots = occupiedParkingSlots,
            TotalRevenue = totalRevenue,
            TotalCustomers = totalCustomers
        };
    }
}
