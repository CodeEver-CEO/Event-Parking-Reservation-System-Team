
namespace EventParkingReservationSystem.API.Helpers
{
    public static class BookingNumberGenerator
    {
        public static string Generate(
            int number)
        {
            return
                $"BKG-{DateTime.UtcNow.Year}-{number:D6}";
        }
    }
}