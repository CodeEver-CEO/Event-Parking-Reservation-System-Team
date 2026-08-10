
using EventParkingReservationSystem.API.DTOs.Admin;
using EventParkingReservationSystem.API.Services.Common;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IAdminAuthService
{
    // Validates admin credentials and generates an admin JWT token.
    Task<ServiceResult<AdminAuthResponseDto>> LoginAsync(
        AdminLoginRequestDto request);

    // Returns the currently authenticated administrator's details.
    Task<ServiceResult<AdminResponseDto>> GetCurrentAdminAsync(
        int adminId);
}