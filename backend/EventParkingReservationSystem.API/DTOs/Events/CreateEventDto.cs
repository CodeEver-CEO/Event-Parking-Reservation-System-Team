using System.ComponentModel.DataAnnotations;
namespace EventParkingReservationSystem.API.DTOs.Events
{
    public class CreateEventDto
    {
            [Required]
            [StringLength(150)]
            public string Name { get; set; } = string.Empty;

            [Required]
            public int VenueId { get; set; }

            [Required]
            public int CategoryId { get; set; }

            [Required]
            public DateOnly EventDate { get; set; }

            [Required]
            public TimeOnly StartTime { get; set; }

            [Required]
            public TimeOnly EndTime { get; set; }

            [Required]
            [Range(0, double.MaxValue)]
            public decimal TicketPrice { get; set; }

            [Required]
            [Range(1, int.MaxValue)]
            public int Capacity { get; set; }

            [StringLength(500)]
            public string? Description { get; set; }

        }
    }
