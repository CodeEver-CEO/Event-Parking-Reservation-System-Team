using EventParkingReservationSystem.API.DTOs.Categories;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllAsync()
        {
            var categories = await _categoryRepository.GetAllAsync();

            return categories.Select(c => new CategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name
            });
        }

        public async Task<CategoryDto?> GetByIdAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);

            if (category == null)
                return null;

            return new CategoryDto
            {
                CategoryId = category.CategoryId,
                Name = category.Name
            };
        }

        public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
        {
            var category = new EventCategory
            {
                Name = dto.Name
            };

            var createdCategory =
                await _categoryRepository.AddAsync(category);

            return new CategoryDto
            {
                CategoryId = createdCategory.CategoryId,
                Name = createdCategory.Name
            };
        }

        public async Task<bool> UpdateAsync(
            int id,
            UpdateCategoryDto dto)
        {
            var category =
                await _categoryRepository.GetByIdAsync(id);

            if (category == null)
                return false;

            category.Name = dto.Name;

            await _categoryRepository.UpdateAsync(category);

            return true;
        }

        public async Task<(bool Success, string Message)> DeleteAsync(int id)
        {
            var category =
                await _categoryRepository.GetByIdAsync(id);

            if (category == null)
                return (false, "Category not found.");

            var isInUse =
                await _categoryRepository.IsInUseAsync(id);

            if (isInUse)
            {
                return (
                    false,
                    "Category cannot be deleted because it is assigned to an event."
                );
            }

            await _categoryRepository.DeleteAsync(category);

            return (true, "Category deleted successfully.");
        }
    }
}
