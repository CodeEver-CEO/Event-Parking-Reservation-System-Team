namespace EventParkingReservationSystem.API.DTOs.Venues
{
    public class VenueDto
    {
        public int VenueId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public int TotalCapacity { get; set; }
    }
}
