using EventParkingReservationSystem.API.Services.Common;
using EventParkingReservationSystem.API.DTOs.Auth;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IAuthService
{
    // Registers a customer. Returns a generic message that never reveals
    // whether the email already exists, to prevent account enumeration.
    Task<ServiceResult<string>> RegisterAsync(
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
