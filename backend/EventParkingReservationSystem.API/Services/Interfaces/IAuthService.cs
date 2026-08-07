using EventParkingReservationSystem.API.DTOs.Auth;
using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Services.Common;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IAuthService
{
    // Registers a new customer account.
    Task<ServiceResult<CustomerResponseDto>> RegisterAsync(
        RegisterRequestDto request);

    // Authenticates a customer and returns JWT login details.
    Task<ServiceResult<AuthResponseDto>> LoginAsync(
        LoginRequestDto request);

    // Verifies a customer email using a secure token.
    Task<ServiceResult<string>> VerifyEmailAsync(
        VerifyEmailRequestDto request);

    // Generates and sends a replacement verification token.
    Task<ServiceResult<string>> ResendVerificationAsync(
        ResendVerificationRequestDto request);
}