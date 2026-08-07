namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IEmailService
{
    // Sends the email-verification token to the registered customer.
    Task SendVerificationEmailAsync(
        string recipientEmail,
        string recipientName,
        string verificationToken);
}
