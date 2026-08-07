using EventParkingReservationSystem.API.Models;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework.Internal.Execution;

namespace EventParkingReservationSystem.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Models.Event> Events { get; set; }

        public DbSet<Seat> Seats { get; set; }

        public DbSet<ParkingSlot> ParkingSlots { get; set; }

        public DbSet<Booking> Bookings { get; set; }

        public DbSet<BookingSeat> BookingSeats { get; set; }

        public DbSet<Payment> Payments { get; set; }
    }
}