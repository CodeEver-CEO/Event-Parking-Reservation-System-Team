namespace EventParkingReservationSystem.API.DTOs.Customers;

public sealed class CustomerDetailsResponseDto
{
    // Customer database ID.
    public int Id { get; set; }

    // Customer's full name.
    public string Name { get; set; } = string.Empty;

    // Customer's unique email address.
    public string Email { get; set; } = string.Empty;

    // Customer's phone number.
    public string? Phone { get; set; }

    // Customer authorization role.
    public string Role { get; set; } = string.Empty;

    // Customer account status.
    public string Status { get; set; } = string.Empty;

    // Shows whether the email address is verified.
    public bool IsEmailVerified { get; set; }

    // Customer account creation date.
    public DateTime CreatedAt { get; set; }

    // Total number of customer bookings.
    public int TotalBookings { get; set; }
}