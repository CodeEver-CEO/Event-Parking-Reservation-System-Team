using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("admin")]
    public async Task<IActionResult> GetAdminDashboard()
    {
        var totalEvents =
            await _context.Events.CountAsync();

        var totalBookings =
            await _context.Bookings.CountAsync();

        var availableSeats =
            await _context.Seats.CountAsync(
                s => s.Status == SeatStatus.Available);

        var occupiedParkingSlots =
            await _context.ParkingSlots.CountAsync(
                p =>
                    p.Status == ParkingSlotStatus.Held ||
                    p.Status == ParkingSlotStatus.Reserved);

        var totalRevenue =
            await _context.Payments
                .Where(
                    p =>
                        p.Status ==
                        PaymentStatus.Completed)
                .SumAsync(p => (decimal?)p.Amount)
            ?? 0m;

        var totalCustomers =
            await _context.Customers.CountAsync();

        return Ok(new
        {
            totalEvents,
            totalBookings,
            availableSeats,
            occupiedParkingSlots,
            totalRevenue,
            totalCustomers
        });
    }
}