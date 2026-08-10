using EventParkingReservationSystem.API.DTOs.Parking;
using EventParkingReservationSystem.API.Services.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers;

[ApiController]
[Route("api/events/{eventId:int}/parking-slots")]
[Authorize]
public class ParkingSlotsController : ControllerBase
{
    private readonly IParkingSlotService _parkingSlotService;

    public ParkingSlotsController(
        IParkingSlotService parkingSlotService)
    {
        _parkingSlotService = parkingSlotService;
    }

    // =====================================================
    // GET PARKING SLOTS BY EVENT
    // =====================================================

    [HttpGet]
    public async Task<IActionResult> GetByEventId(
        int eventId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result =
                await _parkingSlotService.GetByEventIdAsync(
                    eventId,
                    cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new
                {
                    message = exception.Message
                });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                });
        }
    }

    // =====================================================
    // CREATE PARKING SLOT - ADMIN ONLY
    // =====================================================

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create(
        int eventId,
        [FromBody] CreateParkingSlotRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result =
                await _parkingSlotService.CreateAsync(
                    eventId,
                    request,
                    cancellationToken);

            return StatusCode(
                StatusCodes.Status201Created,
                result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new
                {
                    message = exception.Message
                });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(
                new
                {
                    message = exception.Message
                });
        }
    }

    // =====================================================
    // UPDATE PARKING SLOT - ADMIN ONLY
    // =====================================================

    [HttpPut("{parkingSlotId:int}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(
        int eventId,
        int parkingSlotId,
        [FromBody] UpdateParkingSlotRequestDto request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result =
                await _parkingSlotService.UpdateAsync(
                    eventId,
                    parkingSlotId,
                    request,
                    cancellationToken);

            return Ok(result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new
                {
                    message = exception.Message
                });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(
                new
                {
                    message = exception.Message
                });
        }
    }

    // =====================================================
    // DELETE PARKING SLOT - ADMIN ONLY
    // =====================================================

    [HttpDelete("{parkingSlotId:int}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(
        int eventId,
        int parkingSlotId,
        CancellationToken cancellationToken)
    {
        try
        {
            await _parkingSlotService.DeleteAsync(
                eventId,
                parkingSlotId,
                cancellationToken);

            return NoContent();
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new
                {
                    message = exception.Message
                });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(
                new
                {
                    message = exception.Message
                });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(
                new
                {
                    message = exception.Message
                });
        }
    }
}