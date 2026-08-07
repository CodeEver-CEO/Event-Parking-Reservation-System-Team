using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Customers;

public class UpdateCustomerDto
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(
        100,
        MinimumLength = 2,
        ErrorMessage = "Name must contain between 2 and 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Enter a valid phone number.")]
    [MaxLength(20)]
    public string? Phone { get; set; }
}