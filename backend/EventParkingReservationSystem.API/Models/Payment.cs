using System.ComponentModel.DataAnnotations;
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models;

public class Payment
{
  

    public int PaymentId { get; set; }

    public int BookingId { get; set; }

    public Booking Booking { get; set; } = null!;

    public int CustomerId { get; set; }
    
    public Customer Customer { get; set; } = null!;



        public decimal Amount { get; set; }

        public PaymentStatus Status { get; set; }

        public string PaymentReference { get; set; }
            = string.Empty;

        public DateTime? PaymentDate { get; set; }

   
    
}
