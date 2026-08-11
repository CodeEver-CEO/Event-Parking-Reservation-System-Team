using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.DTOs.Notifications;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventParkingReservationSystem.API.BackgroundServices;

public class EventReminderBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EventReminderBackgroundService> _logger;
    private readonly IConfiguration _configuration;

    public EventReminderBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<EventReminderBackgroundService> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        var scanIntervalMinutes =
            _configuration.GetValue<int?>(
                "NotificationSettings:ReminderScanIntervalMinutes")
            ?? 5;

        if (scanIntervalMinutes <= 0)
        {
            scanIntervalMinutes = 5;
        }

        _logger.LogInformation(
            "Event reminder background service started. " +
            "Scan interval: {Minutes} minute(s).",
            scanIntervalMinutes);

        // Give the API a few seconds to start
        try
        {
            await Task.Delay(
                TimeSpan.FromSeconds(10),
                stoppingToken);
        }
        catch (OperationCanceledException)
            when (stoppingToken.IsCancellationRequested)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessEventRemindersAsync(
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "An error occurred while creating event reminders.");
            }

            try
            {
                await Task.Delay(
                    TimeSpan.FromMinutes(
                        scanIntervalMinutes),
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation(
            "Event reminder background service stopped.");
    }

    private async Task ProcessEventRemindersAsync(
        CancellationToken cancellationToken)
    {
        using var scope =
            _scopeFactory.CreateScope();

        var context =
            scope.ServiceProvider
                .GetRequiredService<ApplicationDbContext>();

        var notificationService =
            scope.ServiceProvider
                .GetRequiredService<INotificationService>();

        // EventDate + StartTime are local event values
        var now = DateTime.Now;

        var reminderUntil =
            now.AddHours(24);

        // ============================================================
        // FIND CONFIRMED BOOKINGS
        // ============================================================

        var confirmedBookings =
            await context.Bookings
                .AsNoTracking()
                .Include(b => b.Event)
                .Where(b =>
                    b.Status ==
                        BookingStatus.Confirmed)
                .ToListAsync(
                    cancellationToken);

        if (confirmedBookings.Count == 0)
        {
            return;
        }

        var createdCount = 0;

        foreach (var booking
                 in confirmedBookings)
        {
            if (booking.Event == null)
            {
                continue;
            }

            // ========================================================
            // BUILD EVENT DATE + TIME
            // ========================================================

            var eventDateTime =
                booking.Event.EventDate
                    .ToDateTime(
                        booking.Event.StartTime);

            // Event already started
            if (eventDateTime <= now)
            {
                continue;
            }

            // Event is more than 24 hours away
            if (eventDateTime > reminderUntil)
            {
                continue;
            }

            // ========================================================
            // PREVENT DUPLICATE REMINDER
            // ========================================================

            var reminderAlreadyExists =
                await context.Notifications
                    .AsNoTracking()
                    .AnyAsync(
                        notification =>
                            notification.CustomerId ==
                                booking.CustomerId &&

                            notification.EventId ==
                                booking.EventId &&

                            notification.Type ==
                                NotificationType.EventReminder,
                        cancellationToken);

            if (reminderAlreadyExists)
            {
                continue;
            }

            // ========================================================
            // CREATE EVENT REMINDER
            // ========================================================

            await notificationService
                .CreateNotificationAsync(
                    new CreateNotificationDto
                    {
                        CustomerId =
                            booking.CustomerId,

                        BookingId =
                            booking.BookingId,

                        EventId =
                            booking.EventId,

                        Type =
                            NotificationType.EventReminder,

                        Title =
                            "Event reminder",

                        Message =
                            $"Reminder: {booking.Event.Name} " +
                            $"starts on " +
                            $"{booking.Event.EventDate:yyyy-MM-dd} " +
                            $"at " +
                            $"{booking.Event.StartTime:HH\\:mm}."
                    });

            createdCount++;
        }

        if (createdCount > 0)
        {
            _logger.LogInformation(
                "Created {Count} event reminder notification(s).",
                createdCount);
        }
    }
}