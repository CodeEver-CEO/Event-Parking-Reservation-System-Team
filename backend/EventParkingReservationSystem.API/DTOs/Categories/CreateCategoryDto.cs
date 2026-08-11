using System.ComponentModel.DataAnnotations;
namespace EventParkingReservationSystem.API.DTOs.Categories
{
    public class CreateCategoryDto
    {
       
        
            [Required]
            [StringLength(100)]
            public string Name { get; set; } = string.Empty;
    }
}
