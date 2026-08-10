using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.DTOs.Parking;

public class ReserveParkingRequestDto
{
    [Range(1, int.MaxValue)]
    public int ParkingSlotId { get; set; }
}