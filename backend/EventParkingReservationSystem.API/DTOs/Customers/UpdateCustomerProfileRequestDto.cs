using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Customers;

public sealed class UpdateCustomerProfileRequestDto
{
    // Customer's updated full name.
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    // Customer's updated phone number.
    [Phone]
    [StringLength(20)]
    public string? Phone { get; set; }
}