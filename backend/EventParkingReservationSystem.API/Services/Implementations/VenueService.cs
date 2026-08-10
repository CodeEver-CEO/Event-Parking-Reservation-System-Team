using EventParkingReservationSystem.API.DTOs.Venues;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations
{
    public class VenueService : IVenueService
    {
        private readonly IVenueRepository _venueRepository;

        public VenueService(IVenueRepository venueRepository)
        {
            _venueRepository = venueRepository;
        }

        public async Task<IEnumerable<VenueDto>> GetAllAsync()
        {
            var venues = await _venueRepository.GetAllAsync();

            return venues.Select(v => new VenueDto
            {
                VenueId = v.VenueId,
                Name = v.Name,
                Address = v.Address,
                TotalCapacity = v.TotalCapacity
            });
        }

        public async Task<VenueDto?> GetByIdAsync(int id)
        {
            var venue = await _venueRepository.GetByIdAsync(id);

            if (venue == null)
                return null;

            return new VenueDto
            {
                VenueId = venue.VenueId,
                Name = venue.Name,
                Address = venue.Address,
                TotalCapacity = venue.TotalCapacity
            };
        }

        public async Task<VenueDto> CreateAsync(CreateVenueDto dto)
        {
            var venue = new Venue
            {
                Name = dto.Name,
                Address = dto.Address,
                TotalCapacity = dto.TotalCapacity
            };

            var createdVenue = await _venueRepository.AddAsync(venue);

            return new VenueDto
            {
                VenueId = createdVenue.VenueId,
                Name = createdVenue.Name,
                Address = createdVenue.Address,
                TotalCapacity = createdVenue.TotalCapacity
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdateVenueDto dto)
        {
            var venue = await _venueRepository.GetByIdAsync(id);

            if (venue == null)
                return false;

            venue.Name = dto.Name;
            venue.Address = dto.Address;
            venue.TotalCapacity = dto.TotalCapacity;

            await _venueRepository.UpdateAsync(venue);

            return true;
        }

        public async Task<(bool Success, string Message)> DeleteAsync(int id)
        {
            var venue = await _venueRepository.GetByIdAsync(id);

            if (venue == null)
                return (false, "Venue not found.");

            var hasUpcomingEvents =
                await _venueRepository.HasUpcomingEventsAsync(id);

            if (hasUpcomingEvents)
            {
                return (
                    false,
                    "Venue cannot be deleted because it has upcoming events."
                );
            }

            await _venueRepository.DeleteAsync(venue);

            return (true, "Venue deleted successfully.");
        }

        public async Task<bool> CheckAvailabilityAsync(
            int venueId,
            DateOnly date,
            TimeOnly startTime,
            TimeOnly endTime)
        {
            if (startTime >= endTime)
                return false;

            return await _venueRepository.IsAvailableAsync(
                venueId,
                date,
                startTime,
                endTime);
        }
    }
}