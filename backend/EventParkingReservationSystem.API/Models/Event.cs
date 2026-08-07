using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models
{
    public class Event
    {
        public int EventId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Location { get; set; } = string.Empty;
        public decimal ParkingFee { get; set; }

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
