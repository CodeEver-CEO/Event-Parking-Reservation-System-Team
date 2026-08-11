using EventParkingReservationSystem.API.DTOs.Events;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers
{
    [ApiController]
    [Route("api/events")]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventsController(IEventService eventService)
        {
            _eventService = eventService;
        }

        // GET: api/events
        // Optional filters (BRD Module 3): name, date, venueId, categoryId
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? name,
            [FromQuery] DateOnly? date,
            [FromQuery] int? venueId,
            [FromQuery] int? categoryId)
        {
            var events = await _eventService.GetAllAsync(
                name,
                date,
                venueId,
                categoryId);

            return Ok(events);
        }

        // GET: api/events/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var eventDto = await _eventService.GetByIdAsync(id);

            if (eventDto == null)
            {
                return NotFound(new
                {
                    message = "Event not found."
                });
            }

            return Ok(eventDto);
        }

        // POST: api/events
        [Authorize(Roles = "Administrator")]
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateEventDto dto)
        {
            var result = await _eventService.CreateAsync(dto);

            if (!result.Success)
            {
                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return CreatedAtAction(
                nameof(GetById),
                new { id = result.Data!.EventId },
                result.Data);
        }

        // PUT: api/events/5
        [Authorize(Roles = "Administrator")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateEventDto dto)
        {
            var result = await _eventService.UpdateAsync(id, dto);

            if (!result.Success)
            {
                if (result.Message == "Event not found.")
                {
                    return NotFound(new
                    {
                        message = result.Message
                    });
                }

                return BadRequest(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message
            });
        }

        // DELETE: api/events/5
        [Authorize(Roles = "Administrator")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _eventService.DeleteAsync(id);

            if (!result.Success)
            {
                return NotFound(new
                {
                    message = result.Message
                });
            }

            return Ok(new
            {
                message = result.Message
            });
        }
    }
}