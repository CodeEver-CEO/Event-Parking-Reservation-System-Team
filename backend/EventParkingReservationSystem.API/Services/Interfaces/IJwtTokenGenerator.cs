using EventParkingReservationSystem.API.Helpers;
using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IJwtTokenGenerator
{
    // Generates a signed JWT access token for an authenticated customer.
    JwtTokenResult GenerateToken(Customer customer);
}