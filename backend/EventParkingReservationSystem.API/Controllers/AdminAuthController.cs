using System.Security.Claims;
using EventParkingReservationSystem.API.DTOs.Admin;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AdminAuthController : ControllerBase
{
    private readonly IAdminAuthService _adminAuthService;

    public AdminAuthController(
        IAdminAuthService adminAuthService)
    {
        _adminAuthService = adminAuthService;
    }

    // Validates administrator credentials and returns a JWT.
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(
        typeof(AdminAuthResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AdminAuthResponseDto>> Login(
        [FromBody] AdminLoginRequestDto request)
    {
        var result =
            await _adminAuthService.LoginAsync(request);

        if (!result.Succeeded)
        {
            return Unauthorized(new
            {
                message = result.Error
            });
        }

        return Ok(result.Data);
    }

    // Returns the currently authenticated administrator.
    [Authorize(Roles = "Administrator")]
    [HttpGet("me")]
    [ProducesResponseType(
        typeof(AdminResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminResponseDto>>
        GetCurrentAdmin()
    {
        string? adminIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(
                adminIdValue,
                out int adminId))
        {
            return Unauthorized(new
            {
                message = "The administrator token is invalid."
            });
        }

        var result =
            await _adminAuthService.GetCurrentAdminAsync(
                adminId);

        if (!result.Succeeded)
        {
            return NotFound(new
            {
                message = result.Error
            });
        }

        return Ok(result.Data);
    }
}