namespace EventParkingReservationSystem.API.DTOs.Payments
{
    public class PaymentResponseDto
    {
        public int PaymentId { get; set; }

        public int BookingId { get; set; }

        public string BookingNumber { get; set; }
            = string.Empty;

        public decimal SeatAmount { get; set; }

        public decimal ParkingAmount { get; set; }

        public decimal TotalAmount { get; set; }

        public string PaymentStatus { get; set; }
            = string.Empty;

        public string PaymentReference { get; set; }
            = string.Empty;

        public DateTime? PaymentDate { get; set; }

        public string BookingStatus { get; set; }
            = string.Empty;
    }
}