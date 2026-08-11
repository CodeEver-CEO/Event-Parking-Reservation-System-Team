namespace EventParkingReservationSystem.API.DTOs.Bookings
{
    public class CreateBookingDto
    {
        public int EventId { get; set; }

        public List<int> SeatIds { get; set; }
            = new();

        public int? ParkingSlotId { get; set; }
    }
}