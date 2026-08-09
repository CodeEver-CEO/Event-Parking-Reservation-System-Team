using EventParkingReservationSystem.API.Models;

namespace EventParkingReservationSystem.API.Helpers;

public static class ReceiptGenerator
{
    public static byte[] Generate(
        Payment payment)
    {
        var paymentDate =
            payment.PaidAtUtc?.ToString(
                "yyyy-MM-dd HH:mm")
            ?? "-";

        var text = $"""
========================================
          EVENT BOOKING RECEIPT
========================================

Booking Number : {payment.Booking.BookingNumber}

Payment ID     : {payment.Id}

Reference      : {payment.Reference ?? "-"}

Amount         : Rs. {payment.Amount:N2}

Status         : {payment.Status}

Date           : {paymentDate}

========================================
          THANK YOU, PLEASE COME AGAIN.
========================================
""";

        return System.Text.Encoding.UTF8
            .GetBytes(text);
    }
}