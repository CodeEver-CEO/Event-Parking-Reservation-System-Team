
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models
{
    public class Customer
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; }
            = string.Empty;
        public string LastName { get; set; }
            = string.Empty;
        public string Email { get; set; }
            = string.Empty;
        public string PhoneNumber { get; set; }
            = string.Empty;
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}