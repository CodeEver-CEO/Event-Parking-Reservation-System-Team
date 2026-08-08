using System.ComponentModel.DataAnnotations;

namespace EventParkingReservationSystem.API.Models
{
    public class Venue
    {
        [Key]
        public int VenueId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(250)]
        public string Address { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int TotalCapacity { get; set; }

        // Navigation Property
        public ICollection<Event> Events { get; set; } = new List<Event>();
    }
}
