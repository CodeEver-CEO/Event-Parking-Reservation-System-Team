using EventParkingReservationSystem.API.Services.Common;
using EventParkingReservationSystem.API.DTOs.Auth;
using EventParkingReservationSystem.API.DTOs.Customers;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IAuthService
{
    Task<ServiceResult<CustomerResponseDto>> RegisterAsync(
        RegisterRequestDto request);

    Task<ServiceResult<AuthResponseDto>> LoginAsync(
        LoginRequestDto request);

    Task<ServiceResult<string>> VerifyEmailAsync(
        VerifyEmailRequestDto request);

    Task<ServiceResult<string>> ResendVerificationAsync(
        ResendVerificationRequestDto request);

    Task<ServiceResult<string>> ForgotPasswordAsync(
        ForgotPasswordRequestDto request);

    Task<ServiceResult<string>> ResetPasswordAsync(
        ResetPasswordRequestDto request);
}
