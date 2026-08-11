using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Helpers;

public interface IAdminJwtTokenGenerator
{
    // Generates a JWT access token for an authenticated admin.
    AdminJwtTokenResult Generate(Admin admin);
}