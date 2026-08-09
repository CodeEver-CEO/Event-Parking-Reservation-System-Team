using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.Models;

public class Venue
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Address { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // A venue can contain multiple events.
    public ICollection<Event> Events { get; set; } =
        new List<Event>();
}
