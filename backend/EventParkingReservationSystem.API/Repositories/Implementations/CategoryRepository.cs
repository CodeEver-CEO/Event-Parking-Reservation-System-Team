using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly ApplicationDbContext _context;

        public CategoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EventCategory>> GetAllAsync()
        {
            return await _context.EventCategories
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<EventCategory?> GetByIdAsync(int id)
        {
            return await _context.EventCategories
                .FirstOrDefaultAsync(c => c.CategoryId == id);
        }

        public async Task<EventCategory> AddAsync(EventCategory category)
        {
            await _context.EventCategories.AddAsync(category);
            await _context.SaveChangesAsync();

            return category;
        }

        public async Task UpdateAsync(EventCategory category)
        {
            _context.EventCategories.Update(category);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(EventCategory category)
        {
            _context.EventCategories.Remove(category);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsInUseAsync(int categoryId)
        {
            return await _context.Events
                .AnyAsync(e => e.CategoryId == categoryId);
        }
    }
}
