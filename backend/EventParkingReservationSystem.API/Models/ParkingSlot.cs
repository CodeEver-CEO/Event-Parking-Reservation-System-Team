
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models
{
    public class ParkingSlot
    {
        public int ParkingSlotId { get; internal set; }
        public int EventId { get; internal set; }
        public bool IsAvailable { get; internal set; }
    }
}

