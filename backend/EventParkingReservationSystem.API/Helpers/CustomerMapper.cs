using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Helpers;

public static class CustomerMapper
{
    // Converts the customer entity into a safe response DTO.
    public static CustomerResponseDto ToResponseDto(Customer customer)
    {
        return new CustomerResponseDto
        {
            Id = customer.Id,
            Name = customer.Name,
            Email = customer.Email,
            Phone = customer.Phone,
            Role = customer.Role.ToString(),
            Status = customer.Status.ToString(),
            EmailVerified = customer.EmailVerified,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt
        };
    }
}