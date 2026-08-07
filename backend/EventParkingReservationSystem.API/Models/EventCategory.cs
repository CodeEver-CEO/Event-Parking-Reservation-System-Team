using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.Models;

public class EventCategory
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // A category can be assigned to multiple events.
    public ICollection<Event> Events { get; set; } =
        new List<Event>();
}
