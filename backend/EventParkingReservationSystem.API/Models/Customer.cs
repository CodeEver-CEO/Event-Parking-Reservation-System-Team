using System.ComponentModel.DataAnnotations;
using EventParkingReservationSystem.API.Enums;

namespace EventParkingReservationSystem.API.Models;

public class Customer
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Customer;

    public CustomerStatus Status { get; set; } = CustomerStatus.Active;

    public bool EmailVerified { get; set; }

    public string? EmailVerificationTokenHash { get; set; }

    public DateTime? EmailVerificationTokenExpiresAt { get; set; }

    public string? PasswordResetTokenHash { get; set; }

    public DateTime? PasswordResetTokenExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Connects the customer to their booking history.
    public ICollection<Booking> Bookings { get; set; } =
        new List<Booking>();

    // Connects the customer to their payment history.
    public ICollection<Payment> Payments { get; set; } =
        new List<Payment>();

    // Connects the customer to their notifications.
    public ICollection<Notification> Notifications { get; set; } =
        new List<Notification>();
}