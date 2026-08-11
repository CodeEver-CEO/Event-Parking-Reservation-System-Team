using System.Security.Claims;

using EventParkingReservationSystem.API.DTOs.Parking;
using EventParkingReservationSystem.API.Services.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers;

[ApiController]
[Route("api/bookings/{bookingId:int}/parking")]
[Authorize(Roles = "Customer")]
public class ParkingReservationsController : ControllerBase
{
    private readonly IParkingReservationService
        _parkingReservationService;

    public ParkingReservationsController(
        IParkingReservationService parkingReservationService)
    {
        _parkingReservationService =
            parkingReservationService;
    }

    // ============================================================
    // RESERVE PARKING FOR BOOKING
    // POST /api/bookings/{bookingId}/parking
    // CUSTOMER ONLY
    // ============================================================

    [HttpPost]
    [ProducesResponseType(
        typeof(ParkingReservationResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    [ProducesResponseType(
        StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ParkingReservationResponseDto>>
        ReserveParking(
            int bookingId,
            [FromBody] ReserveParkingRequestDto request,
            CancellationToken cancellationToken)
    {
        var customerIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? User.FindFirstValue("customerId");

        if (!int.TryParse(
            customerIdValue,
            out var customerId))
        {
            return Unauthorized(
                new
                {
                    message =
                        "The authenticated customer identity is invalid."
                });
        }

        try
        {
            var result =
                await _parkingReservationService
                    .ReserveAsync(
                        bookingId,
                        customerId,
                        request,
                        cancellationToken);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message = ex.Message
                });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(
                new
                {
                    message = ex.Message
                });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = ex.Message
                });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(
                new
                {
                    message = ex.Message
                });
        }
    }

    // ============================================================
    // RELEASE PARKING FROM BOOKING
    // DELETE /api/bookings/{bookingId}/parking
    // CUSTOMER ONLY
    // ============================================================

    [HttpDelete]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    [ProducesResponseType(
        StatusCodes.Status409Conflict)]
    public async Task<IActionResult>
        ReleaseParking(
            int bookingId,
            CancellationToken cancellationToken)
    {
        var customerIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? User.FindFirstValue("customerId");

        if (!int.TryParse(
            customerIdValue,
            out var customerId))
        {
            return Unauthorized(
                new
                {
                    message =
                        "The authenticated customer identity is invalid."
                });
        }

        try
        {
            await _parkingReservationService
                .ReleaseAsync(
                    bookingId,
                    customerId,
                    cancellationToken);

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(
                new
                {
                    message = ex.Message
                });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(
                new
                {
                    message = ex.Message
                });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = ex.Message
                });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(
                new
                {
                    message = ex.Message
                });
        }
    }
}