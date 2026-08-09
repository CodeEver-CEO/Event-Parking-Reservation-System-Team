
using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Helpers
{
    public static class ReceiptGenerator
    {
        public static byte[] Generate(
            Payment payment)
        {
            var text = $"""
            ===========================================
                     EVENT BOOKING RECEIPT
            ===========================================

            Booking Number : {payment.Booking.BookingNumber}

            Payment ID     : {payment.PaymentId}

            Reference      : {payment.PaymentReference}

            Amount         : Rs. {payment.Amount:N2}

            Status         : {payment.Status}

            Date           : {payment.PaymentDate:yyyy-MM-dd HH:mm}

            ===========================================
                     THANK YOU, PLEASE COME AGAIN.
            ===========================================
            """;

            return System.Text.Encoding.UTF8
                .GetBytes(text);
        }
    }
}