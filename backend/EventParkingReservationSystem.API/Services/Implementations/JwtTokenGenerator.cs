using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EventParkingReservationSystem.API.Configuration;
using EventParkingReservationSystem.API.Helpers;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EventParkingReservationSystem.API.Services.Implementations;

public sealed class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtOptions _jwtOptions;

    public JwtTokenGenerator(IOptions<JwtOptions> jwtOptions)
    {
        _jwtOptions = jwtOptions.Value;
    }

    public JwtTokenResult GenerateToken(Customer customer)
    {
        DateTime issuedAtUtc = DateTime.UtcNow;

        DateTime expiresAtUtc =
            issuedAtUtc.AddMinutes(_jwtOptions.AccessTokenMinutes);

        // Stores only the required customer identity and role information.
        var claims = new List<Claim>
        {
            new(
                JwtRegisteredClaimNames.Sub,
                customer.Id.ToString()),

            new(
                JwtRegisteredClaimNames.Email,
                customer.Email),

            new(
                JwtRegisteredClaimNames.Jti,
                Guid.NewGuid().ToString()),

            new(
                ClaimTypes.NameIdentifier,
                customer.Id.ToString()),

            new(
                ClaimTypes.Name,
                customer.Name),

            new(
                ClaimTypes.Role,
                customer.Role.ToString())
        };

        // Converts the stored Base64 secret into secure signing-key bytes.
        byte[] keyBytes =
            Convert.FromBase64String(_jwtOptions.Key);

        var securityKey =
            new SymmetricSecurityKey(keyBytes);

        var signingCredentials =
            new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256);

        // Creates the signed JWT access token.
        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            notBefore: issuedAtUtc,
            expires: expiresAtUtc,
            signingCredentials: signingCredentials);

        string accessToken =
            new JwtSecurityTokenHandler()
                .WriteToken(token);

        return new JwtTokenResult(
            accessToken,
            expiresAtUtc);
    }
}