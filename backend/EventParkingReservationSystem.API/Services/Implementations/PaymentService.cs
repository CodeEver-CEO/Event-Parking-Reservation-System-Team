
using EventParkingReservationSystem.API.DTOs.Payments;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository
            _paymentRepository;

        private readonly IBookingRepository
            _bookingRepository;

        public PaymentService(
            IPaymentRepository paymentRepository,
            IBookingRepository bookingRepository)
        {
            _paymentRepository =
                paymentRepository;

            _bookingRepository =
                bookingRepository;
        }

        public async Task<PaymentResponseDto?>
            GetPaymentAsync(
                int bookingId)
        {
            var booking =
                await _bookingRepository
                    .GetByIdAsync(bookingId);

            if (booking == null)
                return null;

            var payment =
                await _paymentRepository
                    .GetByBookingIdAsync(
                        bookingId);

            var seatAmount =
                booking.BookingSeats
                    .Sum(x => x.TicketPriceSnapshot);

            return new PaymentResponseDto
            {
                PaymentId =
                    payment?.PaymentId ?? 0,

                BookingId =
                    booking.BookingId,

                BookingNumber =
                    booking.BookingNumber,

                SeatAmount =
                    seatAmount,

                ParkingAmount =
                    booking.ParkingFee,

                TotalAmount =
                    seatAmount +
                    booking.ParkingFee,

                PaymentStatus =
                    payment?.Status.ToString()
                    ?? PaymentStatus.Pending.ToString(),

                PaymentReference =
                    payment?.PaymentReference
                    ?? string.Empty,

                PaymentDate =
                    payment?.PaymentDate,

                BookingStatus =
                    booking.Status.ToString()
            };
        }

        public async Task<PaymentResponseDto>
            CompletePaymentAsync(
                int bookingId,
                int customerId)
        {
            var booking =
                await _bookingRepository
                    .GetByIdAsync(bookingId);

            if (booking == null)
            {
                throw new Exception(
                    "Booking not found.");
            }

            if (booking.CustomerId !=
                customerId)
            {
                throw new UnauthorizedAccessException(
                    "You cannot pay for this booking.");
            }

            if (booking.Status ==
                BookingStatus.Expired)
            {
                throw new Exception(
                    "Booking has expired.");
            }

            if (booking.Status ==
                BookingStatus.Cancelled)
            {
                throw new Exception(
                    "Cancelled booking cannot be paid.");
            }

            if (booking.Status ==
                BookingStatus.Confirmed)
            {
                throw new Exception(
                    "Booking is already confirmed.");
            }

            if (booking.HoldExpiresAtUtc <=
                DateTime.UtcNow)
            {
                throw new Exception(
                    "Booking hold has expired.");
            }

            var existingPayment =
                await _paymentRepository
                    .GetByBookingIdAsync(
                        bookingId);

            if (existingPayment != null &&
                existingPayment.Status ==
                    PaymentStatus.Completed)
            {
                throw new Exception(
                    "Payment already completed.");
            }

            var seatAmount =
                booking.BookingSeats
                    .Sum(x => x.TicketPriceSnapshot);

            var total =
                seatAmount +
                booking.ParkingFee;

            var payment =
                new Payment
                {
                    BookingId =
                        bookingId,

                    Amount =
                        total,

                    Status =
                        PaymentStatus.Completed,

                    PaymentReference =
                        $"PAY-{DateTime.UtcNow:yyyyMMddHHmmssfff}",

                    PaymentDate =
                        DateTime.UtcNow
                };

            await _paymentRepository
                .AddAsync(payment);

            booking.Status =
                BookingStatus.Confirmed;

            booking.UpdatedAt =
                DateTime.UtcNow;

            await _paymentRepository
                .SaveChangesAsync();

            return await GetPaymentAsync(
                bookingId)
                ?? throw new Exception(
                    "Payment completed but response failed.");
        }

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

                if (booking == null)
                    continue;

                var seatAmount =
                    booking.BookingSeats
                        .Sum(x => x.TicketPriceSnapshot);

                result.Add(
                    new PaymentResponseDto
                    {
                        PaymentId =
                            payment.PaymentId,

                        BookingId =
                            payment.BookingId,

                        BookingNumber =
                            booking.BookingNumber,

                        SeatAmount =
                            seatAmount,

                        ParkingAmount =
                            booking.ParkingFee,

                        TotalAmount =
                            payment.Amount,

                        PaymentStatus =
                            payment.Status.ToString(),

                        PaymentReference =
                            payment.PaymentReference,

                        PaymentDate =
                            payment.PaymentDate,

                        BookingStatus =
                            booking.Status.ToString()
                    });
            }

            return result;
        }

        public async Task<(
            byte[] File,
            string ContentType,
            string FileName)?>
            GenerateReceiptAsync(
                int paymentId)
        {
            var payment =
                await _paymentRepository
                    .GetByIdAsync(paymentId);

            if (payment == null)
                return null;

            if (payment.Status !=
                PaymentStatus.Completed)
            {
                throw new Exception(
                    "Receipt is available only for completed payments.");
            }

            var booking =
                payment.Booking;

            var receipt = $"""
            ========================================
                EVENT PARKING RESERVATION RECEIPT
            ========================================

            Booking Number : {booking.BookingNumber}

            Payment ID     : {payment.PaymentId}

            Payment Ref    : {payment.PaymentReference}

            Amount Paid    : Rs. {payment.Amount:N2}

            Payment Status : {payment.Status}

            Payment Date   : {payment.PaymentDate:yyyy-MM-dd HH:mm}

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
}