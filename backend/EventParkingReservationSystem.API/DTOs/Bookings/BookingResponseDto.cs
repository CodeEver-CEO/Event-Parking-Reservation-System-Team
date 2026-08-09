namespace EventParkingReservationSystem.API.DTOs.Bookings
{
    public class BookingResponseDto
    {
        public int BookingId { get; set; }

        public string BookingNumber { get; set; }
            = string.Empty;

        public int CustomerId { get; set; }

        public int EventId { get; set; }

        public string EventName { get; set; }
            = string.Empty;

        public string Status { get; set; }
            = string.Empty;

        public DateTime HoldExpiresAt { get; set; }

        public List<string> Seats { get; set; }
            = new();

        public decimal SeatTotal { get; set; }

        public int? ParkingSlotId { get; set; }

        public decimal ParkingFee { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}