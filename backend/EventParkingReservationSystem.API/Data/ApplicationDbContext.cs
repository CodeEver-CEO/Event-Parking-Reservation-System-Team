using EventParkingReservationSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Exposes database tables to Entity Framework Core.
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<EventCategory> EventCategories => Set<EventCategory>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Seat> Seats => Set<Seat>();
    public DbSet<ParkingSlot> ParkingSlots => Set<ParkingSlot>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingSeat> BookingSeats => Set<BookingSeat>();

    public DbSet<ParkingReservation> ParkingReservations =>
        Set<ParkingReservation>();

    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureCustomer(modelBuilder);
        ConfigureVenue(modelBuilder);
        ConfigureEventCategory(modelBuilder);
        ConfigureEvent(modelBuilder);
        ConfigureSeat(modelBuilder);
        ConfigureParkingSlot(modelBuilder);
        ConfigureBooking(modelBuilder);
        ConfigureBookingSeat(modelBuilder);
        ConfigureParkingReservation(modelBuilder);
        ConfigurePayment(modelBuilder);
        ConfigureNotification(modelBuilder);
    }

    private static void ConfigureCustomer(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("Customers");

            entity.HasKey(customer => customer.Id);

            // Prevents two customer accounts from using the same email.
            entity.HasIndex(customer => customer.Email)
                .IsUnique();

            entity.Property(customer => customer.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(customer => customer.Email)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(customer => customer.Phone)
                .HasMaxLength(20);

            entity.Property(customer => customer.PasswordHash)
                .IsRequired();

            entity.Property(customer => customer.Role)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.Property(customer => customer.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.Property(customer =>
                    customer.EmailVerificationTokenHash)
                .HasMaxLength(256);

            entity.Property(customer =>
                    customer.PasswordResetTokenHash)
                .HasMaxLength(256);
        });
    }

    private static void ConfigureVenue(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Venue>(entity =>
        {
            entity.ToTable(
                "Venues",
                table => table.HasCheckConstraint(
                    "CK_Venues_Capacity",
                    "[Capacity] > 0"));

            entity.HasKey(venue => venue.Id);

            entity.HasIndex(venue => venue.Name);

            entity.Property(venue => venue.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(venue => venue.Address)
                .HasMaxLength(300)
                .IsRequired();

            // Prevents venue deletion when event history exists.
            entity.HasMany(venue => venue.Events)
                .WithOne(eventItem => eventItem.Venue)
                .HasForeignKey(eventItem => eventItem.VenueId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureEventCategory(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EventCategory>(entity =>
        {
            entity.ToTable("EventCategories");

            entity.HasKey(category => category.Id);

            // Prevents duplicate event-category names.
            entity.HasIndex(category => category.Name)
                .IsUnique();

            entity.Property(category => category.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(category => category.Description)
                .HasMaxLength(500);

            entity.HasMany(category => category.Events)
                .WithOne(eventItem => eventItem.Category)
                .HasForeignKey(eventItem => eventItem.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureEvent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Event>(entity =>
        {
            entity.ToTable(
                "Events",
                table =>
                {
                    // Ensures every event ends after it starts.
                    table.HasCheckConstraint(
                        "CK_Events_DateRange",
                        "[StartsAtUtc] < [EndsAtUtc]");

                    table.HasCheckConstraint(
                        "CK_Events_TicketPrice",
                        "[TicketPrice] >= 0");

                    table.HasCheckConstraint(
                        "CK_Events_ParkingFee",
                        "[ParkingFee] >= 0");

                    table.HasCheckConstraint(
                        "CK_Events_Capacity",
                        "[Capacity] > 0");
                });

            entity.HasKey(eventItem => eventItem.Id);

            // Improves event-name search performance.
            entity.HasIndex(eventItem => eventItem.Name);

            entity.HasIndex(eventItem =>
                new
                {
                    eventItem.VenueId,
                    eventItem.StartsAtUtc,
                    eventItem.EndsAtUtc
                });

            entity.HasIndex(eventItem =>
                new
                {
                    eventItem.CategoryId,
                    eventItem.StartsAtUtc
                });

            entity.Property(eventItem => eventItem.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(eventItem => eventItem.Description)
                .HasMaxLength(1000);

            entity.Property(eventItem => eventItem.TicketPrice)
                .HasPrecision(18, 2);

            entity.Property(eventItem => eventItem.ParkingFee)
                .HasPrecision(18, 2);

            entity.Property(eventItem => eventItem.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            // Event-owned seats are removed when the event is deleted.
            entity.HasMany(eventItem => eventItem.Seats)
                .WithOne(seat => seat.Event)
                .HasForeignKey(seat => seat.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(eventItem => eventItem.ParkingSlots)
                .WithOne(slot => slot.Event)
                .HasForeignKey(slot => slot.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            // Booking history prevents the related event from being deleted.
            entity.HasMany(eventItem => eventItem.Bookings)
                .WithOne(booking => booking.Event)
                .HasForeignKey(booking => booking.EventId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureSeat(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Seat>(entity =>
        {
            entity.ToTable(
                "Seats",
                table =>
                {
                    table.HasCheckConstraint(
                        "CK_Seats_ColumnNumber",
                        "[ColumnNumber] > 0");

                    table.HasCheckConstraint(
                        "CK_Seats_Price",
                        "[Price] >= 0");
                });

            entity.HasKey(seat => seat.Id);

            // Seat numbers must be unique inside the same event.
            entity.HasIndex(seat =>
                    new
                    {
                        seat.EventId,
                        seat.SeatNumber
                    })
                .IsUnique();

            entity.Property(seat => seat.SeatNumber)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(seat => seat.RowLabel)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(seat => seat.SeatType)
                .HasMaxLength(50);

            entity.Property(seat => seat.Price)
                .HasPrecision(18, 2);

            entity.Property(seat => seat.Status)
                .HasConversion<string>()
                .HasMaxLength(30);
        });
    }

    private static void ConfigureParkingSlot(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ParkingSlot>(entity =>
        {
            entity.ToTable(
                "ParkingSlots",
                table => table.HasCheckConstraint(
                    "CK_ParkingSlots_Fee",
                    "[Fee] >= 0"));

            entity.HasKey(slot => slot.Id);

            // Parking-slot numbers must be unique inside an event.
            entity.HasIndex(slot =>
                    new
                    {
                        slot.EventId,
                        slot.SlotNumber
                    })
                .IsUnique();

            entity.Property(slot => slot.SlotNumber)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(slot => slot.Zone)
                .HasMaxLength(50);

            entity.Property(slot => slot.Fee)
                .HasPrecision(18, 2);

            entity.Property(slot => slot.Status)
                .HasConversion<string>()
                .HasMaxLength(30);
        });
    }

    private static void ConfigureBooking(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.ToTable(
                "Bookings",
                table => table.HasCheckConstraint(
                    "CK_Bookings_TotalAmount",
                    "[TotalAmount] >= 0"));

            entity.HasKey(booking => booking.BookingId);

            // Every booking receives a globally unique booking number.
            entity.HasIndex(booking => booking.BookingNumber)
                .IsUnique();

            entity.HasIndex(booking =>
                new
                {
                    booking.CustomerId,
                    booking.Status
                });

            entity.HasIndex(booking =>
                new
                {
                    booking.EventId,
                    booking.Status
                });

            // Helps the background service find expired pending bookings.
            entity.HasIndex(booking =>
                new
                {
                    booking.Status,
                    booking.HoldExpiresAtUtc
                });

            entity.Property(booking => booking.BookingNumber)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(booking => booking.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.Property(booking => booking.TotalAmount)
                .HasPrecision(18, 2);

            // Customer history is preserved by preventing cascade deletion.
            entity.HasOne(booking => booking.Customer)
                .WithMany(customer => customer.Bookings)
                .HasForeignKey(booking => booking.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Each booking can have one payment record.
            entity.HasOne(booking => booking.Payment)
                .WithOne(payment => payment.Booking)
                .HasForeignKey<Payment>(
                    payment => payment.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureBookingSeat(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BookingSeat>(entity =>
        {
            entity.ToTable(
                "BookingSeats",
                table => table.HasCheckConstraint(
                    "CK_BookingSeats_PriceSnapshot",
                    "[TicketPriceSnapshot] >= 0"));

            // BookingId and SeatId together form the primary key.
            entity.HasKey(allocation =>
                new
                {
                    allocation.BookingId,
                    allocation.SeatId
                });

            // Prevents the same seat from having two active allocations.
            entity.HasIndex(allocation => allocation.SeatId)
                .IsUnique()
                .HasFilter("[IsActive] = 1");

            entity.Property(allocation =>
                    allocation.TicketPriceSnapshot)
                .HasPrecision(18, 2);

            entity.HasOne(allocation => allocation.Booking)
                .WithMany(booking => booking.BookingSeats)
                .HasForeignKey(allocation => allocation.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(allocation => allocation.Seat)
                .WithMany(seat => seat.BookingSeats)
                .HasForeignKey(allocation => allocation.SeatId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureParkingReservation(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ParkingReservation>(entity =>
        {
            entity.ToTable(
                "ParkingReservations",
                table => table.HasCheckConstraint(
                    "CK_ParkingReservations_FeeSnapshot",
                    "[FeeSnapshot] >= 0"));

            entity.HasKey(reservation => reservation.Id);

            // Allows only one active parking reservation per booking.
            entity.HasIndex(reservation => reservation.BookingId)
                .IsUnique()
                .HasFilter("[IsActive] = 1");

            // Prevents a parking slot from being actively reserved twice.
            entity.HasIndex(
                    reservation => reservation.ParkingSlotId)
                .IsUnique()
                .HasFilter("[IsActive] = 1");

            entity.Property(reservation => reservation.FeeSnapshot)
                .HasPrecision(18, 2);

            entity.HasOne(reservation => reservation.Booking)
                .WithMany(booking =>
                    booking.ParkingReservations)
                .HasForeignKey(reservation =>
                    reservation.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(reservation =>
                    reservation.ParkingSlot)
                .WithMany(slot =>
                    slot.ParkingReservations)
                .HasForeignKey(reservation =>
                    reservation.ParkingSlotId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigurePayment(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable(
                "Payments",
                table => table.HasCheckConstraint(
                    "CK_Payments_Amount",
                    "[Amount] >= 0"));

            entity.HasKey(payment => payment.PaymentId);

            // Enforces one payment row for each booking.
            entity.HasIndex(payment => payment.BookingId)
                .IsUnique();

            entity.HasIndex(payment => payment.PaymentReference)
                .IsUnique()
                .HasFilter("[Reference] IS NOT NULL");

            entity.HasIndex(payment =>
                new
                {
                    payment.CustomerId,
                    payment.Status
                });

            entity.Property(payment => payment.Amount)
                .HasPrecision(18, 2);

            entity.Property(payment => payment.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.Property(payment => payment.PaymentReference)
                .HasMaxLength(100);

            entity.HasOne(payment => payment.Customer)
                .WithMany(customer => customer.Payments)
                .HasForeignKey(payment => payment.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureNotification(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");

            entity.HasKey(notification => notification.Id);

            // Supports fast unread-notification queries.
            entity.HasIndex(notification =>
                new
                {
                    notification.CustomerId,
                    notification.IsRead,
                    notification.CreatedAt
                });

            entity.Property(notification => notification.Type)
                .HasConversion<string>()
                .HasMaxLength(40);

            entity.Property(notification => notification.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(notification => notification.Message)
                .HasMaxLength(2000)
                .IsRequired();

            entity.HasOne(notification => notification.Customer)
                .WithMany(customer =>
                    customer.Notifications)
                .HasForeignKey(notification =>
                    notification.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Booking deletion keeps the notification but clears its link.
            entity.HasOne(notification => notification.Booking)
                .WithMany(booking => booking.Notifications)
                .HasForeignKey(notification =>
                    notification.BookingId)
                .OnDelete(DeleteBehavior.SetNull);

            // Event deletion keeps the notification but clears its link.
            entity.HasOne(notification => notification.Event)
                .WithMany(eventItem =>
                    eventItem.Notifications)
                .HasForeignKey(notification =>
                    notification.EventId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}