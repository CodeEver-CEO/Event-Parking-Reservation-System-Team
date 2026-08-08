using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EventParkingReservationSystem.API.Models
{
    public class Event
    {
        [Key]
        public int EventId { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public DateOnly EventDate { get; set; }

        [Required]
        public TimeOnly StartTime { get; set; }

        [Required]
        public TimeOnly EndTime { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TicketPrice { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Capacity { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        // Foreign Key - Venue
        [Required]
        public int VenueId { get; set; }

        [ForeignKey("VenueId")]
        public Venue? Venue { get; set; }

        // Foreign Key - Category
        [Required]
        public int CategoryId { get; set; }

        [ForeignKey("CategoryId")]
        public EventCategory? EventCategory { get; set; }
    }
}
