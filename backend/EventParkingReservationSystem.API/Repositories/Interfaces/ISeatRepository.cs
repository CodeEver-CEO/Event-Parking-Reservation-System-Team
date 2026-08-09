using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Repositories.Interfaces;

public interface ISeatRepository
{
    Task<Event?> GetEventByIdAsync(
        int eventId,
        CancellationToken cancellationToken = default);

    Task<Booking?> GetBookingByIdAsync(
        int bookingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Seat>> GetByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken = default);

    Task<Seat?> GetByIdAsync(
        int seatId,
        CancellationToken cancellationToken = default);

    Task<List<Seat>> GetByIdsAsync(
        IEnumerable<int> seatIds,
        CancellationToken cancellationToken = default);

    Task<bool> SeatMapExistsAsync(
        int eventId,
        CancellationToken cancellationToken = default);

    Task<bool> SeatNumberExistsAsync(
        int eventId,
        string seatNumber,
        int? excludeSeatId = null,
        CancellationToken cancellationToken = default);

    Task<bool> HasActiveBookingAsync(
        int seatId,
        CancellationToken cancellationToken = default);

    Task<bool> BookingHasActiveSeatsAsync(
        int bookingId,
        CancellationToken cancellationToken = default);

    Task AddSeatsAsync(
        IEnumerable<Seat> seats,
        CancellationToken cancellationToken = default);

    Task AddBookingSeatsAsync(
        IEnumerable<BookingSeat> bookingSeats,
        CancellationToken cancellationToken = default);

    void UpdateSeat(Seat seat);

    void RemoveSeat(Seat seat);

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default);
}