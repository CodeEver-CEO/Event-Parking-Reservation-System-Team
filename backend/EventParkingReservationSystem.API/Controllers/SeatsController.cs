using System.Security.Claims;
using EventParkingReservationSystem.API.DTOs.Seats;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers;

[ApiController]
[Route("api")]
public class SeatsController : ControllerBase
{
    private readonly ISeatService _seatService;

    public SeatsController(ISeatService seatService)
    {
        _seatService = seatService;
    }

    // ============================================================
    // GET COMPLETE SEAT MAP
    // GET /api/events/{eventId}/seats
    // Customer + Administrator
    // ============================================================
    [Authorize]
    [HttpGet("events/{eventId:int}/seats")]
    [ProducesResponseType(
        typeof(IReadOnlyList<SeatResponseDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<SeatResponseDto>>>
        GetSeatMap(
            int eventId,
            CancellationToken cancellationToken)
    {
        try
        {
            var result =
                await _seatService.GetSeatMapAsync(
                    eventId,
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
    }

    // ============================================================
    // GENERATE SEAT MAP
    // POST /api/events/{eventId}/seats
    // ADMINISTRATOR ONLY
    // ============================================================
    [Authorize(Roles = "Administrator")]
    [HttpPost("events/{eventId:int}/seats")]
    [ProducesResponseType(
        typeof(IReadOnlyList<SeatResponseDto>),
        StatusCodes.Status201Created)]
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
    public async Task<ActionResult<IReadOnlyList<SeatResponseDto>>>
        GenerateSeatMap(
            int eventId,
            [FromBody] GenerateSeatMapRequestDto request,
            CancellationToken cancellationToken)
    {
        try
        {
            var result =
                await _seatService.GenerateSeatMapAsync(
                    eventId,
                    request,
                    cancellationToken);

            return CreatedAtAction(
                nameof(GetSeatMap),
                new
                {
                    eventId
                },
                result);
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
    // UPDATE ONE SEAT
    // PUT /api/events/{eventId}/seats/{seatId}
    // ADMINISTRATOR ONLY
    // ============================================================
    [Authorize(Roles = "Administrator")]
    [HttpPut("events/{eventId:int}/seats/{seatId:int}")]
    [ProducesResponseType(
        typeof(SeatResponseDto),
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
    public async Task<ActionResult<SeatResponseDto>>
        UpdateSeat(
            int eventId,
            int seatId,
            [FromBody] UpdateSeatRequestDto request,
            CancellationToken cancellationToken)
    {
        try
        {
            var result =
                await _seatService.UpdateSeatAsync(
                    eventId,
                    seatId,
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
    // DELETE ONE SEAT
    // DELETE /api/events/{eventId}/seats/{seatId}
    // ADMINISTRATOR ONLY
    // ============================================================
    [Authorize(Roles = "Administrator")]
    [HttpDelete("events/{eventId:int}/seats/{seatId:int}")]
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
        DeleteSeat(
            int eventId,
            int seatId,
            CancellationToken cancellationToken)
    {
        try
        {
            await _seatService.DeleteSeatAsync(
                eventId,
                seatId,
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
    // ATTACH SELECTED SEATS TO BOOKING
    // POST /api/bookings/{bookingId}/seats
    // CUSTOMER ONLY
    //
    // SECURITY:
    // Customer can modify ONLY their own booking.
    // ============================================================
    [Authorize(Roles = "Customer")]
    [HttpPost("bookings/{bookingId:int}/seats")]
    [ProducesResponseType(
        typeof(IReadOnlyList<SeatResponseDto>),
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
    public async Task<ActionResult<IReadOnlyList<SeatResponseDto>>>
        AttachSeatsToBooking(
            int bookingId,
            [FromBody] AttachSeatsRequestDto request,
            CancellationToken cancellationToken)
    {
        // --------------------------------------------------------
        // Read authenticated CustomerId from JWT
        // --------------------------------------------------------
        var customerIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
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
                await _seatService
                    .AttachSeatsToBookingAsync(
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
}