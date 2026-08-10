using System.ComponentModel.DataAnnotations;
namespace EventParkingReservationSystem.API.DTOs.Venues
{
    public class CreateVenueDto
    {
         
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(250)]
        public string Address { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int TotalCapacity { get; set; }
    }
}
