
using EventParkingReservationSystem.API.DTOs.Bookings;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EventParkingReservationSystem.API.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    [Authorize]
    public class BookingsController
        : ControllerBase
    {
        private readonly IBookingService
            _bookingService;

        public BookingsController(
            IBookingService bookingService)
        {
            _bookingService =
                bookingService;
        }

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult>
            CreateBooking(
                CreateBookingDto dto)
        {
            try
            {
                var customerId =
                    GetCustomerId();

                var result =
                    await _bookingService
                        .CreateBookingAsync(
                            customerId,
                            dto);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("{BookingId}")]
        public async Task<IActionResult>
            GetBooking(
                int BookingId)
        {
            var result =
                await _bookingService
                    .GetBookingByIdAsync(BookingId);

            if (result == null)
            {
                return NotFound(new
                {
                    message =
                        "Booking not found."
                });
            }

            return Ok(result);
        }

        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult>
            GetCustomerBookings(
                int customerId)
        {
            var currentCustomerId =
                GetCustomerId();

            if (currentCustomerId !=
                customerId &&
                !User.IsInRole("Administrator"))
            {
                return Forbid();
            }

            var result =
                await _bookingService
                    .GetCustomerBookingsAsync(
                        customerId);

            return Ok(result);
        }

        [HttpGet("{BookingId}/hold-status")]
        public async Task<IActionResult>
            GetHoldStatus(
                int BookingId)
        {
            var result =
                await _bookingService
                    .GetHoldStatusAsync(BookingId);

            if (result == null)
            {
                return NotFound();
            }

            return Ok(result);
        }

        [HttpDelete("{BookingId}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult>
            CancelBooking(
                int BookingId)
        {
            var customerId =
                GetCustomerId();

            var result =
                await _bookingService
                    .CancelBookingAsync(
                        BookingId,
                        customerId);

            if (!result)
            {
                return BadRequest(new
                {
                    message =
                        "Booking cannot be cancelled."
                });
            }

            return Ok(new
            {
                message =
                    "Booking cancelled successfully."
            });
        }

        [HttpGet]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult>
            GetEventBookings(
                [FromQuery] int eventId)
        {
            var result =
                await _bookingService
                    .GetEventBookingsAsync(
                        eventId);

            return Ok(result);
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