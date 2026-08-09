namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IEmailService
{
    // Sends an email-verification token.
    Task SendVerificationEmailAsync(
        string recipientEmail,
        string recipientName,
        string verificationToken);

    // Sends a password-reset token.
    Task SendPasswordResetEmailAsync(
        string recipientEmail,
        string recipientName,
        string resetToken);
}
