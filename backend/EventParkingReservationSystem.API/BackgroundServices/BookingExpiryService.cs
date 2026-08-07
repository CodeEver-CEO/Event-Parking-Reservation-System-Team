
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.BackgroundServices
{
    public class BookingExpiryService
        : BackgroundService
    {
        private readonly IServiceScopeFactory
            _scopeFactory;

        public BookingExpiryService(
            IServiceScopeFactory scopeFactory)
        {
            _scopeFactory =
                scopeFactory;
        }

        protected override async Task ExecuteAsync(
            CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope =
                        _scopeFactory
                            .CreateScope();

                    var bookingService =
                        scope.ServiceProvider
                            .GetRequiredService<
                                IBookingService>();

                    await bookingService
                        .ExpireBookingsAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(
                        $"Booking expiry error: {ex.Message}");
                }

                await Task.Delay(
                    TimeSpan.FromMinutes(1),
                    stoppingToken);
            }
        }
    }
}