using EventParkingReservationSystem.API.DTOs.Admin;
using EventParkingReservationSystem.API.Helpers;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Common;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations;

public sealed class AdminAuthService : IAdminAuthService
{
    private readonly IAdminRepository _adminRepository;
    private readonly PasswordHasher _passwordHasher;
    private readonly IAdminJwtTokenGenerator _tokenGenerator;

    public AdminAuthService(
        IAdminRepository adminRepository,
        PasswordHasher passwordHasher,
        IAdminJwtTokenGenerator tokenGenerator)
    {
        _adminRepository = adminRepository;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    // Validates admin credentials and generates a JWT token.
    public async Task<ServiceResult<AdminAuthResponseDto>> LoginAsync(
        AdminLoginRequestDto request)
    {
        string normalizedEmail =
            request.Email.Trim().ToLowerInvariant();

        var admin =
            await _adminRepository.GetByEmailAsync(
                normalizedEmail);

        if (admin is null ||
            !_passwordHasher.Verify(
                request.Password,
                admin.PasswordHash))
        {
            return ServiceResult<AdminAuthResponseDto>.Failure(
                "Invalid email or password.");
        }

        if (!admin.IsActive)
        {
            return ServiceResult<AdminAuthResponseDto>.Failure(
                "This administrator account is inactive.");
        }

        admin.LastLoginAt = DateTime.UtcNow;
        admin.UpdatedAt = DateTime.UtcNow;

        await _adminRepository.SaveChangesAsync();

        AdminJwtTokenResult token =
            _tokenGenerator.Generate(admin);

        var response = new AdminAuthResponseDto
        {
            AccessToken = token.AccessToken,
            TokenType = "Bearer",
            ExpiresAt = token.ExpiresAt,
            Admin = MapAdmin(admin)
        };

        return ServiceResult<AdminAuthResponseDto>.Success(
            response);
    }

    // Returns the currently authenticated admin's details.
    public async Task<ServiceResult<AdminResponseDto>>
        GetCurrentAdminAsync(int adminId)
    {
        var admin =
            await _adminRepository.GetByIdAsync(adminId);

        if (admin is null)
        {
            return ServiceResult<AdminResponseDto>.Failure(
                "Administrator account was not found.");
        }

        if (!admin.IsActive)
        {
            return ServiceResult<AdminResponseDto>.Failure(
                "This administrator account is inactive.");
        }

        return ServiceResult<AdminResponseDto>.Success(
            MapAdmin(admin));
    }

    // Converts the Admin entity into a safe response DTO.
    private static AdminResponseDto MapAdmin(
        Models.Admin admin)
    {
        return new AdminResponseDto
        {
            Id = admin.Id,
            Name = admin.Name,
            Email = admin.Email,
            Role = admin.Role,
            IsActive = admin.IsActive,
            LastLoginAt = admin.LastLoginAt,
            CreatedAt = admin.CreatedAt
        };
    }
}