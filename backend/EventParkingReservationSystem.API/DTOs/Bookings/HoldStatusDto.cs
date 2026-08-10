namespace EventParkingReservationSystem.API.DTOs.Bookings
{
    public class HoldStatusDto
    {
        public int BookingId { get; set; }

        public string Status { get; set; }
            = string.Empty;

        public DateTime? HoldExpiresAt { get; set; }

        public int RemainingSeconds { get; set; }

        public bool IsExpired { get; set; }
    }
}