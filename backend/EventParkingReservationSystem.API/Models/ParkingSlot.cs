using System.ComponentModel.DataAnnotations;
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models;

public class ParkingSlot
{
 

    public int Id { get; set; }

    public int EventId { get; set; }

    public Event Event { get; set; } = null!;

    [Required]
    [MaxLength(30)]
    public string SlotNumber { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Zone { get; set; }

    public decimal Fee { get; set; }

    public ParkingSlotStatus Status { get; set; } =
        ParkingSlotStatus.Available;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Preserves the parking slot's reservation history.
    public ICollection<ParkingReservation> ParkingReservations
    { get; set; } = new List<ParkingReservation>();
    public bool Available { get; internal set; }
}
