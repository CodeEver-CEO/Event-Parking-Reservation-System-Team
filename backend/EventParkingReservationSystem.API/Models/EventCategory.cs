using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.Models
{
    public class EventCategory
    {
        [Key]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        // Navigation Property
        public ICollection<Event> Events { get; set; } = new List<Event>();
    }
}
