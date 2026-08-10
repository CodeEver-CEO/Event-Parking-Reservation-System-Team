
using EventParkingReservationSystem.API.DTOs.Bookings;

namespace EventParkingReservationSystem.API.Services.Interfaces
{
    public interface IBookingService
    {
        Task<BookingResponseDto>
            CreateBookingAsync(
                int customerId,
                CreateBookingDto dto);

        Task<BookingResponseDto?>
            GetBookingByIdAsync(
                int bookingId);

        Task<List<BookingResponseDto>>
            GetCustomerBookingsAsync(
                int customerId);

        Task<List<BookingResponseDto>>
            GetEventBookingsAsync(
                int eventId);

        Task<HoldStatusDto?>
            GetHoldStatusAsync(
                int bookingId);

        Task<bool>
            CancelBookingAsync(
                int bookingId,
                int customerId);

        Task ExpireBookingsAsync();
    }
}