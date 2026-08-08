using EventParkingReservationSystem.API.DTOs.Auth;
using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Services.Common;
using EventParkingReservationSystem.API.Helpers;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IAuthService
{
    // Registers a new customer account.
    Task<ServiceResult<CustomerResponseDto>> RegisterAsync(
        RegisterRequestDto request);

<<<<<<< Updated upstream
    // Authenticates a customer and returns JWT login details.
    Task<ServiceResult<AuthResponseDto>> LoginAsync(
        LoginRequestDto request);

    // Verifies a customer email using a secure token.
    Task<ServiceResult<string>> VerifyEmailAsync(
        VerifyEmailRequestDto request);

    // Generates and sends a replacement verification token.
    Task<ServiceResult<string>> ResendVerificationAsync(
        ResendVerificationRequestDto request);
=======
    // Authenticates a customer and returns a JWT token.
    Task<ServiceResult<AuthResponseDto>> LoginAsync(
        LoginRequestDto request);

    // Verifies the customer's email address.
    Task<ServiceResult<string>> VerifyEmailAsync(
        VerifyEmailRequestDto request);

    // Generates a new email-verification token.
    Task<ServiceResult<string>> ResendVerificationAsync(
        ResendVerificationRequestDto request);

    // Generates a password-reset token.
    Task<ServiceResult<string>> ForgotPasswordAsync(
        ForgotPasswordRequestDto request);

    // Resets the password using a valid token.
    Task<ServiceResult<string>> ResetPasswordAsync(
        ResetPasswordRequestDto request);
>>>>>>> Stashed changes
}