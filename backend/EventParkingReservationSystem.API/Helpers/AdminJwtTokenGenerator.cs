using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EventParkingReservationSystem.API.Configuration;
using EventParkingReservationSystem.API.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EventParkingReservationSystem.API.Helpers;

public sealed class AdminJwtTokenGenerator
    : IAdminJwtTokenGenerator
{
    private readonly JwtOptions _jwtOptions;
    private readonly byte[] _keyBytes;

    public AdminJwtTokenGenerator(
        IOptions<JwtOptions> jwtOptions)
    {
        _jwtOptions = jwtOptions.Value;

        _keyBytes = Convert.FromBase64String(
            _jwtOptions.Key);
    }

    // Generates a role-based JWT token for an admin.
    public AdminJwtTokenResult Generate(Admin admin)
    {
        DateTime expiresAt = DateTime.UtcNow.AddMinutes(
            _jwtOptions.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(
                JwtRegisteredClaimNames.Sub,
                admin.Id.ToString()),

            new(
                ClaimTypes.NameIdentifier,
                admin.Id.ToString()),

            new(
                ClaimTypes.Name,
                admin.Name),

            new(
                ClaimTypes.Email,
                admin.Email),

            new(
                ClaimTypes.Role,
                admin.Role),

            new(
                "userType",
                "Admin"),

            new(
                JwtRegisteredClaimNames.Jti,
                Guid.NewGuid().ToString())
        };

        var signingCredentials =
            new SigningCredentials(
                new SymmetricSecurityKey(_keyBytes),
                SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: signingCredentials);

        string accessToken =
            new JwtSecurityTokenHandler()
                .WriteToken(token);

        return new AdminJwtTokenResult
        {
            AccessToken = accessToken,
            ExpiresAt = expiresAt
        };
    }
}