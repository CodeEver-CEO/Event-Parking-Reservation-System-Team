using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations;

public class CustomerRepository : ICustomerRepository
{
    private readonly ApplicationDbContext _context;

    public CustomerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Customer?> GetByIdAsync(int id)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(customer => customer.Id == id);
    }

    public async Task<Customer?> GetByEmailAsync(string email)
    {
        string normalizedEmail = email.Trim().ToLowerInvariant();

        return await _context.Customers
            .FirstOrDefaultAsync(customer =>
                customer.Email.ToLower() == normalizedEmail);
    }

    public async Task<IReadOnlyList<Customer>> SearchAsync(string? search)
    {
        IQueryable<Customer> query = _context.Customers
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string searchTerm = search.Trim().ToLowerInvariant();

            query = query.Where(customer =>
                customer.Name.ToLower().Contains(searchTerm) ||
                customer.Email.ToLower().Contains(searchTerm));
        }

        return await query
            .OrderBy(customer => customer.Name)
            .ToListAsync();
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        string normalizedEmail = email.Trim().ToLowerInvariant();

        return await _context.Customers
            .AnyAsync(customer =>
                customer.Email.ToLower() == normalizedEmail);
    }

    public async Task AddAsync(Customer customer)
    {
        await _context.Customers.AddAsync(customer);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
    // Finds the customer linked to a secure verification-token hash.
    public async Task<Customer?> GetByEmailVerificationTokenHashAsync(
        string tokenHash)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(customer =>
                customer.EmailVerificationTokenHash == tokenHash);
    }
}
