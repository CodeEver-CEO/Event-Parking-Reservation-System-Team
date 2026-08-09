
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EventParkingReservationSystem.API.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class PaymentsController
        : ControllerBase
    {
        private readonly IPaymentService
            _paymentService;

        private readonly IBookingService
            _bookingService;

        public PaymentsController(
            IPaymentService paymentService,
            IBookingService bookingService)
        {
            _paymentService =
                paymentService;

            _bookingService =
                bookingService;
        }

        [HttpGet("bookings/{id}/payment")]
        public async Task<IActionResult>
            GetPayment(
                int id)
        {
            var booking =
                await _bookingService
                    .GetBookingByIdAsync(id);

            if (booking == null)
            {
                return NotFound();
            }

            var result =
                await _paymentService
                    .GetPaymentAsync(id);

            return Ok(result);
        }

        [HttpPost("bookings/{id}/payment")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult>
            CompletePayment(
                int id)
        {
            try
            {
                var customerId =
                    GetCustomerId();

                var result =
                    await _paymentService
                        .CompletePaymentAsync(
                            id,
                            customerId);

                return Ok(new
                {
                    message =
                        "Payment completed successfully.",

                    payment = result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet(
            "payments/customer/{customerId}")]
        public async Task<IActionResult>
            GetPaymentHistory(
                int customerId)
        {
            var currentCustomerId =
                GetCustomerId();

            if (currentCustomerId !=
                customerId &&
                !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var result =
                await _paymentService
                    .GetCustomerPaymentHistoryAsync(
                        customerId);

            return Ok(result);
        }

        [HttpGet("payments/{id}/receipt")]
        public async Task<IActionResult>
            DownloadReceipt(
                int id)
        {
            var result =
                await _paymentService
                    .GenerateReceiptAsync(id);

            if (result == null)
            {
                return NotFound();
            }

            return File(
                result.Value.File,
                result.Value.ContentType,
                result.Value.FileName);
        }

        private int GetCustomerId()
        {
            var claim =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                    claim,
                    out int customerId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid customer ID.");
            }

            return customerId;
        }
    }
}