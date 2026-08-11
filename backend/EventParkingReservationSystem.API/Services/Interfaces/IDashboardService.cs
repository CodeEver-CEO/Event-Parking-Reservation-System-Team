using EventParkingReservationSystem.API.DTOs.Dashboard;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IDashboardService
{
    // Returns the system-wide statistics for the administrator dashboard.
    Task<AdminDashboardDto> GetAdminDashboardAsync();
}
