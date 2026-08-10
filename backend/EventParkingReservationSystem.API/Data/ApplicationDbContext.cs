using EventParkingReservationSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Admin
        public DbSet<Admin> Admins { get; set; }

        // Customer
        public DbSet<Customer> Customers { get; set; }

        // Venue / Category / Event
        public DbSet<Venue> Venues { get; set; }
        public DbSet<EventCategory> EventCategories { get; set; }
        public DbSet<Event> Events { get; set; }

        // Seats
        public DbSet<Seat> Seats { get; set; }

        // Parking
        public DbSet<ParkingSlot> ParkingSlots { get; set; }

        // Booking
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<BookingSeat> BookingSeats { get; set; }

        // Parking Reservation
        public DbSet<ParkingReservation> ParkingReservations { get; set; }

        // Payment
        public DbSet<Payment> Payments { get; set; }

        // Notification
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============================================================
            // VENUE -> EVENT
            // ============================================================

            modelBuilder.Entity<Event>()
                .HasOne(e => e.Venue)
                .WithMany(v => v.Events)
                .HasForeignKey(e => e.VenueId)
                .OnDelete(DeleteBehavior.Restrict);

            // ============================================================
            // EVENT CATEGORY -> EVENT
            // ============================================================

            modelBuilder.Entity<Event>()
                .HasOne(e => e.EventCategory)
                .WithMany(c => c.Events)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // ============================================================
            // BOOKING SEAT
            // ============================================================

            modelBuilder.Entity<BookingSeat>(entity =>
            {
                // Composite Primary Key
                entity.HasKey(bs => new
                {
                    bs.BookingId,
                    bs.SeatId
                });

                // Booking -> BookingSeats
                entity.HasOne(bs => bs.Booking)
                    .WithMany(b => b.BookingSeats)
                    .HasForeignKey(bs => bs.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Seat -> BookingSeats
                entity.HasOne(bs => bs.Seat)
                    .WithMany(s => s.BookingSeats)
                    .HasForeignKey(bs => bs.SeatId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Price precision
                entity.Property(bs => bs.TicketPriceSnapshot)
                    .HasPrecision(18, 2);

                // One active booking allocation per seat
                entity.HasIndex(bs => bs.SeatId)
                    .IsUnique()
                    .HasFilter("[IsActive] = 1");

                // Price cannot be negative
                entity.ToTable(table =>
                {
                    table.HasCheckConstraint(
                        "CK_BookingSeats_PriceSnapshot",
                        "[TicketPriceSnapshot] >= 0");
                });
            });
        }
    }
}