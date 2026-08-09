using EventParkingReservationSystem.API.DTOs.Auth;
using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // Creates a new customer account.
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(
        typeof(CustomerResponseDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CustomerResponseDto>> Register(
        [FromBody] RegisterRequestDto request)
    {
        var result = await _authService.RegisterAsync(request);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = result.Error
            });
        }

        return StatusCode(
            StatusCodes.Status201Created,
            result.Data);
    }

    // Validates credentials and returns a JWT access token.
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(
        typeof(AuthResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (!result.Succeeded)
        {
            return Unauthorized(new
            {
                message = result.Error
            });
        }

        return Ok(result.Data);
    }

    // Verifies the customer's email using the verification token.
    [AllowAnonymous]
    [HttpPost("verify-email")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail(
        [FromBody] VerifyEmailRequestDto request)
    {
        var result = await _authService.VerifyEmailAsync(request);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = result.Error
            });
        }

        return Ok(new
        {
            message = result.Data
        });
    }

    // Sends a new verification token to an unverified customer.
    [AllowAnonymous]
    [HttpPost("resend-verification")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ResendVerification(
        [FromBody] ResendVerificationRequestDto request)
    {
        var result =
            await _authService.ResendVerificationAsync(request);

        return Ok(new
        {
            message = result.Data
        });
    }

    // Sends password-reset instructions without revealing account existence.
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequestDto request)
    {
        var result =
            await _authService.ForgotPasswordAsync(request);

        return Ok(new
        {
            message = result.Data
        });
    }

    // Changes the password using a valid reset token.
    [AllowAnonymous]
    [HttpPost("reset-password")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequestDto request)
    {
        var result =
            await _authService.ResetPasswordAsync(request);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = result.Error
            });
        }

        return Ok(new
        {
            message = result.Data
        });
    }
}