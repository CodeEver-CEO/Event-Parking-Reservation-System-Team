using EventParkingReservationSystem.API.DTOs.Venues;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers
{
    [ApiController]
    [Route("api/venues")]
    public class VenuesController : ControllerBase
    {
        private readonly IVenueService _venueService;

        public VenuesController(IVenueService venueService)
        {
            _venueService = venueService;
        }

        // GET: api/venues
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var venues = await _venueService.GetAllAsync();
            return Ok(venues);
        }

        // GET: api/venues/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var venue = await _venueService.GetByIdAsync(id);

            if (venue == null)
                return NotFound(new { message = "Venue not found." });

            return Ok(venue);
        }

        // GET: api/venues/available?date=2026-08-10&startTime=10:00&endTime=12:00[&venueId=1]
        // Without venueId: returns every venue free for the range.
        // With venueId: returns that specific venue's availability.
        [HttpGet("available")]
        public async Task<IActionResult> CheckAvailability(
            [FromQuery] DateOnly date,
            [FromQuery] TimeOnly startTime,
            [FromQuery] TimeOnly endTime,
            [FromQuery] int? venueId = null)
        {
            if (startTime >= endTime)
            {
                return BadRequest(new
                {
                    message = "Start time must be earlier than end time."
                });
            }

            // No venue specified: return all venues that are free for the range.
            if (venueId is null || venueId <= 0)
            {
                var allVenues = await _venueService.GetAllAsync();
                var availableVenues = new List<VenueDto>();

                foreach (var candidate in allVenues)
                {
                    if (await _venueService.CheckAvailabilityAsync(
                            candidate.VenueId, date, startTime, endTime))
                    {
                        availableVenues.Add(candidate);
                    }
                }

                return Ok(availableVenues);
            }

            var venue = await _venueService.GetByIdAsync(venueId.Value);

            if (venue == null)
            {
                return NotFound(new
                {
                    message = "Venue not found."
                });
            }

            var isAvailable =
                await _venueService.CheckAvailabilityAsync(
                    venueId.Value,
                    date,
                    startTime,
                    endTime);

            return Ok(new
            {
                venueId = venueId.Value,
                date,
                startTime,
                endTime,
                isAvailable,
                message = isAvailable
                    ? "Venue is available."
                    : "Venue is not available."
            });
        }

        // POST: api/venues
        [Authorize(Roles = "Administrator")]
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateVenueDto dto)
        {
            var venue = await _venueService.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = venue.VenueId },
                venue);
        }

        // PUT: api/venues/5
        [Authorize(Roles = "Administrator")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateVenueDto dto)
        {
            var updated =
                await _venueService.UpdateAsync(id, dto);

            if (!updated)
            {
                return NotFound(new
                {
                    message = "Venue not found."
                });
            }

            return Ok(new
            {
                message = "Venue updated successfully."
            });
        }

        // DELETE: api/venues/5
        [Authorize(Roles = "Administrator")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result =
                await _venueService.DeleteAsync(id);

            if (!result.Success)
            {
                if (result.Message == "Venue not found.")
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
    }
}
