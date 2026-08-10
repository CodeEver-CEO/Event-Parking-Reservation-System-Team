using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Repositories.Implementations;

public sealed class CustomerRepository : ICustomerRepository
{
    private readonly ApplicationDbContext _context;

    public CustomerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // Finds a customer using the database ID.
    public async Task<Customer?> GetByIdAsync(int id)
    {
        return await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(customer =>
                customer.Id == id);
    }

    // Finds a customer using the normalized email address.
    public async Task<Customer?> GetByEmailAsync(string email)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(customer =>
                customer.Email == email);
    }

    // Finds a customer using the email-verification token hash.
    public async Task<Customer?> GetByEmailVerificationTokenHashAsync(
        string tokenHash)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(customer =>
                customer.EmailVerificationTokenHash == tokenHash);
    }

    // Finds a customer using the password-reset token hash.
    public async Task<Customer?> GetByPasswordResetTokenHashAsync(
        string tokenHash)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(customer =>
                customer.PasswordResetTokenHash == tokenHash);
    }

    // Searches customers using name, email, or phone.
    public async Task<IReadOnlyList<Customer>> SearchAsync(
        string? search)
    {
        IQueryable<Customer> query =
            _context.Customers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            string normalizedSearch =
                search.Trim().ToLowerInvariant();

            query = query.Where(customer =>
                customer.Name.ToLower().Contains(normalizedSearch) ||
                customer.Email.ToLower().Contains(normalizedSearch) ||
                (customer.Phone != null &&
                 customer.Phone.Contains(normalizedSearch)));
        }

        return await query
            .OrderByDescending(customer => customer.CreatedAt)
            .ToListAsync();
    }

    // Checks whether the normalized email already exists.
    public async Task<bool> EmailExistsAsync(string email)
    {
        return await _context.Customers
            .AnyAsync(customer =>
                customer.Email == email);
    }

    // Adds a new customer.
    public async Task AddAsync(Customer customer)
    {
        await _context.Customers.AddAsync(customer);
    }

    // Saves pending changes.
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    // Gets a tracked customer for profile or status updates.
    public async Task<Customer?> GetByIdForUpdateAsync(int id)
    {
        return await _context.Customers
            .FirstOrDefaultAsync(customer =>
                customer.Id == id);
    }

    // Returns the total number of customer bookings.
    public async Task<int> CountBookingsAsync(int customerId)
    {
        return await _context.Bookings
            .AsNoTracking()
            .CountAsync(booking =>
                booking.CustomerId == customerId);
    }


}
