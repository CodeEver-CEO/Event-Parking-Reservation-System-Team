

using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models
{
    public class Seat
    {
        public int SeatNumber { get; set; }
        public int SeatId { get; internal set; }
        public int EventId { get; internal set; }
        public bool IsAvailable { get; internal set; }
        public decimal TicketPrice { get; internal set; }
    }
}
