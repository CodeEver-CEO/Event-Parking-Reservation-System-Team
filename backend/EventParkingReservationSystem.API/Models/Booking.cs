
using EventParkingReservationSystem.API.Enums;
using Microsoft.Extensions.Logging;

namespace EventParkingReservationSystem.API.Models
{
    public class Booking
    {
        public int BookingId { get; set; }

        public string BookingNumber { get; set; } = string.Empty;

        public int CustomerId { get; set; }

        public int EventId { get; set; }

        public BookingStatus Status { get; set; }

        public DateTime HoldExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Optional parking
        public int? ParkingSlotId { get; set; }

        public decimal ParkingFee { get; set; }

        // Navigation properties
        public Customer Customer { get; set; } = null!;

        public Event Event { get; set; } = null!;

        public ParkingSlot? ParkingSlot { get; set; }

        public ICollection<BookingSeat> BookingSeats { get; set; }
            = new List<BookingSeat>();

        public Payment? Payment { get; set; }
    }
}