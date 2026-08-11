using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    // GET: api/dashboard/admin
    // System-wide statistics for the administrator dashboard.
    [Authorize(Roles = "Administrator")]
    [HttpGet("admin")]
    public async Task<IActionResult> GetAdminDashboard()
    {
        var data = await _dashboardService.GetAdminDashboardAsync();

        return Ok(data);
    }
}
