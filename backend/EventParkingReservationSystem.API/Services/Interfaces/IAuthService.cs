using EventParkingReservationSystem.API.DTOs.Auth;
using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Services.Common;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IAuthService
{
    // Registers a new customer account.
    Task<ServiceResult<CustomerResponseDto>> RegisterAsync(
        RegisterRequestDto request);

    // Authenticates a customer and creates a JWT response.
    Task<ServiceResult<AuthResponseDto>> LoginAsync(
        LoginRequestDto request);
}