
using EventParkingReservationSystem.API.DTOs.Payments;

namespace EventParkingReservationSystem.API.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<PaymentResponseDto?>
            GetPaymentAsync(
                int bookingId);

        Task<PaymentResponseDto>
            CompletePaymentAsync(
                int bookingId,
                int customerId);

        Task<List<PaymentResponseDto>>
            GetCustomerPaymentHistoryAsync(
                int customerId);

        Task<(
            byte[] File,
            string ContentType,
            string FileName)?>
            GenerateReceiptAsync(
                int paymentId);
    }
}