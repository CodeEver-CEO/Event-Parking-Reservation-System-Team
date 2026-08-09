namespace EventParkingReservationSystem.API.DTOs.Customers;

public class CustomerSummaryDto
{
    public int CustomerId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public int TotalBookings { get; set; }

    public int UpcomingBookings { get; set; }
}