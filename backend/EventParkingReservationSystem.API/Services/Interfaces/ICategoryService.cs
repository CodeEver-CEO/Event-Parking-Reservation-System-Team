using EventParkingReservationSystem.API.DTOs.Categories;

namespace EventParkingReservationSystem.API.Services.Interfaces
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllAsync();

        Task<CategoryDto?> GetByIdAsync(int id);

        Task<CategoryDto> CreateAsync(CreateCategoryDto dto);

        Task<bool> UpdateAsync(int id, UpdateCategoryDto dto);

        Task<(bool Success, string Message)> DeleteAsync(int id);
    }
}
