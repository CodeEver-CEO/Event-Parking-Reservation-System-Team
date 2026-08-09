using EventParkingReservationSystem.API.DTOs.Payments;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IBookingRepository _bookingRepository;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IBookingRepository bookingRepository)
    {
        _paymentRepository = paymentRepository;
        _bookingRepository = bookingRepository;
    }

    // ============================================================
    // GET PAYMENT BY BOOKING
    // ============================================================

    public async Task<PaymentResponseDto?> GetPaymentAsync(
        int bookingId)
    {
        var booking =
            await _bookingRepository
                .GetByIdAsync(bookingId);

        if (booking is null)
        {
            return null;
        }

        var payment =
            await _paymentRepository
                .GetByBookingIdAsync(
                    bookingId);

        var activeBookingSeats =
            booking.BookingSeats
                .Where(
                    bookingSeat =>
                        bookingSeat.IsActive)
                .ToList();

        var seatAmount =
            activeBookingSeats.Sum(
                bookingSeat =>
                    bookingSeat.TicketPriceSnapshot);

        var parkingReservation =
            booking.ParkingReservations
                .FirstOrDefault(
                    reservation =>
                        reservation.IsActive)
            ?? booking.ParkingReservations
                .OrderByDescending(
                    reservation =>
                        reservation.ReservedAtUtc)
                .FirstOrDefault();

        var parkingAmount =
            parkingReservation?.FeeSnapshot
            ?? 0m;

        return new PaymentResponseDto
        {
            PaymentId =
                payment?.Id ?? 0,

            BookingId =
                booking.Id,

            BookingNumber =
                booking.BookingNumber,

            SeatAmount =
                seatAmount,

            ParkingAmount =
                parkingAmount,

            TotalAmount =
                booking.TotalAmount,

            PaymentStatus =
                payment?.Status.ToString()
                ?? PaymentStatus.Pending.ToString(),

            PaymentReference =
                payment?.Reference
                ?? string.Empty,

            PaymentDate =
                payment?.PaidAtUtc,

            BookingStatus =
                booking.Status.ToString()
        };
    }

    // ============================================================
    // COMPLETE PAYMENT
    // ============================================================

    public async Task<PaymentResponseDto> CompletePaymentAsync(
        int bookingId,
        int customerId)
    {
        var booking =
            await _bookingRepository
                .GetByIdAsync(
                    bookingId);

        if (booking is null)
        {
            throw new KeyNotFoundException(
                "Booking not found.");
        }

        if (booking.CustomerId != customerId)
        {
            throw new UnauthorizedAccessException(
                "You cannot pay for this booking.");
        }

        if (booking.Status ==
            BookingStatus.Expired)
        {
            throw new InvalidOperationException(
                "Booking has expired.");
        }

        if (booking.Status ==
            BookingStatus.Cancelled)
        {
            throw new InvalidOperationException(
                "Cancelled booking cannot be paid.");
        }

        if (booking.Status ==
            BookingStatus.Confirmed)
        {
            throw new InvalidOperationException(
                "Booking is already confirmed.");
        }

        if (booking.HoldExpiresAtUtc.HasValue &&
            booking.HoldExpiresAtUtc.Value <=
                DateTime.UtcNow)
        {
            throw new InvalidOperationException(
                "Booking hold has expired.");
        }

        var existingPayment =
            await _paymentRepository
                .GetByBookingIdAsync(
                    bookingId);

        if (existingPayment is not null &&
            existingPayment.Status ==
                PaymentStatus.Completed)
        {
            throw new InvalidOperationException(
                "Payment already completed.");
        }

        var now =
            DateTime.UtcNow;

        var activeBookingSeats =
            booking.BookingSeats
                .Where(
                    bookingSeat =>
                        bookingSeat.IsActive)
                .ToList();

        if (activeBookingSeats.Count == 0)
        {
            throw new InvalidOperationException(
                "Booking has no active seat reservations.");
        }

        // --------------------------------------------------------
        // CONFIRM HELD SEATS
        // --------------------------------------------------------

        foreach (var bookingSeat in
                 activeBookingSeats)
        {
            if (bookingSeat.Seat.Status ==
                SeatStatus.Held)
            {
                bookingSeat.Seat.Status =
                    SeatStatus.Booked;

                bookingSeat.Seat.UpdatedAt =
                    now;
            }
        }

        // --------------------------------------------------------
        // CONFIRM OPTIONAL PARKING
        // --------------------------------------------------------

        var activeParkingReservation =
            booking.ParkingReservations
                .FirstOrDefault(
                    reservation =>
                        reservation.IsActive);

        if (activeParkingReservation is not null &&
            activeParkingReservation.ParkingSlot.Status ==
                ParkingSlotStatus.Held)
        {
            activeParkingReservation
                .ParkingSlot
                .Status =
                    ParkingSlotStatus.Reserved;

            activeParkingReservation
                .ParkingSlot
                .UpdatedAt =
                    now;
        }

        // --------------------------------------------------------
        // PAYMENT
        // --------------------------------------------------------

        Payment payment;

        if (existingPayment is null)
        {
            payment =
                new Payment
                {
                    BookingId =
                        booking.Id,

                    CustomerId =
                        booking.CustomerId,

                    Amount =
                        booking.TotalAmount,

                    Status =
                        PaymentStatus.Completed,

                    Reference =
                        $"PAY-{now:yyyyMMddHHmmssfff}",

                    PaidAtUtc =
                        now,

                    CreatedAt =
                        now
                };

            await _paymentRepository
                .AddAsync(payment);
        }
        else
        {
            payment =
                existingPayment;

            payment.CustomerId =
                booking.CustomerId;

            payment.Amount =
                booking.TotalAmount;

            payment.Status =
                PaymentStatus.Completed;

            payment.Reference =
                $"PAY-{now:yyyyMMddHHmmssfff}";

            payment.PaidAtUtc =
                now;

            payment.UpdatedAt =
                now;
        }

        // --------------------------------------------------------
        // CONFIRM BOOKING
        // --------------------------------------------------------

        booking.Status =
            BookingStatus.Confirmed;

        booking.ConfirmedAtUtc =
            now;

        booking.UpdatedAt =
            now;

        await _paymentRepository
            .SaveChangesAsync();

        return await GetPaymentAsync(
            bookingId)
            ?? throw new InvalidOperationException(
                "Payment completed but response could not be generated.");
    }

    // ============================================================
    // CUSTOMER PAYMENT HISTORY
    // ============================================================

    public async Task<List<PaymentResponseDto>>
        GetCustomerPaymentHistoryAsync(
            int customerId)
    {
        var payments =
            await _paymentRepository
                .GetByCustomerIdAsync(
                    customerId);

        var result =
            new List<PaymentResponseDto>();

        foreach (var payment in payments)
        {
            var booking =
                await _bookingRepository
                    .GetByIdAsync(
                        payment.BookingId);

            if (booking is null)
            {
                continue;
            }

            var seatAmount =
                booking.BookingSeats
                    .Where(
                        bookingSeat =>
                            bookingSeat.IsActive)
                    .Sum(
                        bookingSeat =>
                            bookingSeat.TicketPriceSnapshot);

            var parkingReservation =
                booking.ParkingReservations
                    .FirstOrDefault(
                        reservation =>
                            reservation.IsActive)
                ?? booking.ParkingReservations
                    .OrderByDescending(
                        reservation =>
                            reservation.ReservedAtUtc)
                    .FirstOrDefault();

            var parkingAmount =
                parkingReservation?.FeeSnapshot
                ?? 0m;

            result.Add(
                new PaymentResponseDto
                {
                    PaymentId =
                        payment.Id,

                    BookingId =
                        booking.Id,

                    BookingNumber =
                        booking.BookingNumber,

                    SeatAmount =
                        seatAmount,

                    ParkingAmount =
                        parkingAmount,

                    TotalAmount =
                        payment.Amount,

                    PaymentStatus =
                        payment.Status.ToString(),

                    PaymentReference =
                        payment.Reference
                        ?? string.Empty,

                    PaymentDate =
                        payment.PaidAtUtc,

                    BookingStatus =
                        booking.Status.ToString()
                });
        }

        return result;
    }

    // ============================================================
    // GENERATE RECEIPT
    // ============================================================

    public async Task<(
        byte[] File,
        string ContentType,
        string FileName)?> GenerateReceiptAsync(
            int paymentId)
    {
        var payment =
            await _paymentRepository
                .GetByIdAsync(
                    paymentId);

        if (payment is null)
        {
            return null;
        }

        if (payment.Status !=
            PaymentStatus.Completed)
        {
            throw new InvalidOperationException(
                "Receipt is available only for completed payments.");
        }

        var booking =
            payment.Booking;

        var paymentDate =
            payment.PaidAtUtc?.ToString(
                "yyyy-MM-dd HH:mm")
            ?? "-";

        var receipt = $"""
========================================
    EVENT PARKING RESERVATION RECEIPT
========================================

Booking Number : {booking.BookingNumber}

Payment ID     : {payment.Id}

Payment Ref    : {payment.Reference ?? "-"}

Amount Paid    : Rs. {payment.Amount:N2}

Payment Status : {payment.Status}

Payment Date   : {paymentDate}

========================================
        PAYMENT SUCCESSFUL
========================================
""";

        var bytes =
            System.Text.Encoding.UTF8
                .GetBytes(receipt);

        return (
            bytes,
            "text/plain",
            $"Receipt-{booking.BookingNumber}.txt"
        );
    }
}