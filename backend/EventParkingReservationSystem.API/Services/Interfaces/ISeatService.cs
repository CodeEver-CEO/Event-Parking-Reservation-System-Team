using EventParkingReservationSystem.API.DTOs.Seats;

namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface ISeatService
{
    // ----------------------------------------------------
    // Get complete seat map for an event
    // GET /api/events/{eventId}/seats
    // ----------------------------------------------------
    Task<IReadOnlyList<SeatResponseDto>> GetSeatMapAsync(
        int eventId,
        CancellationToken cancellationToken = default);

    // ----------------------------------------------------
    // Generate seat map for an event
    // Admin only
    // POST /api/events/{eventId}/seats
    // ----------------------------------------------------
    Task<IReadOnlyList<SeatResponseDto>> GenerateSeatMapAsync(
        int eventId,
        GenerateSeatMapRequestDto request,
        CancellationToken cancellationToken = default);

    // ----------------------------------------------------
    // Update one seat
    // Admin only
    // PUT /api/events/{eventId}/seats/{seatId}
    // ----------------------------------------------------
    Task<SeatResponseDto> UpdateSeatAsync(
        int eventId,
        int seatId,
        UpdateSeatRequestDto request,
        CancellationToken cancellationToken = default);

    // ----------------------------------------------------
    // Delete one unbooked seat
    // Admin only
    // DELETE /api/events/{eventId}/seats/{seatId}
    // ----------------------------------------------------
    Task DeleteSeatAsync(
        int eventId,
        int seatId,
        CancellationToken cancellationToken = default);

    // ----------------------------------------------------
    // Attach selected seats to customer's own booking
    // Customer only
    // POST /api/bookings/{bookingId}/seats
    // ----------------------------------------------------
    Task<IReadOnlyList<SeatResponseDto>> AttachSeatsToBookingAsync(
        int bookingId,
        int customerId,
        AttachSeatsRequestDto request,
        CancellationToken cancellationToken = default);
}