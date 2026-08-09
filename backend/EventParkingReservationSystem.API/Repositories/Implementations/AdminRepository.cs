using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations;

public sealed class AdminRepository : IAdminRepository
{
    private readonly ApplicationDbContext _context;

    public AdminRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // Finds an administrator using the database ID.
    public async Task<Admin?> GetByIdAsync(int id)
    {
        return await _context.Admins
            .AsNoTracking()
            .FirstOrDefaultAsync(admin => admin.Id == id);
    }

    // Finds an administrator using the normalized email address.
    public async Task<Admin?> GetByEmailAsync(string email)
    {
        return await _context.Admins
            .FirstOrDefaultAsync(admin => admin.Email == email);
    }

    // Saves pending administrator changes.
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}