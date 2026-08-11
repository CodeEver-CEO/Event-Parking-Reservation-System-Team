namespace EventParkingReservationSystem.API.DTOs.Dashboard;

// System-wide statistics for the administrator dashboard (BRD Section 5.2).
public sealed class AdminDashboardDto
{
    public int TotalEvents { get; set; }

    public int TotalBookings { get; set; }

    public int AvailableSeats { get; set; }

    public int OccupiedParkingSlots { get; set; }

    public decimal TotalRevenue { get; set; }

    public int TotalCustomers { get; set; }
}
