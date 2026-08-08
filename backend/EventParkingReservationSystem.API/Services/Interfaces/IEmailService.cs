namespace EventParkingReservationSystem.API.Services.Interfaces;

public interface IEmailService
{
<<<<<<< Updated upstream
    // Sends the email-verification token to the registered customer.
=======
    // Sends an email-verification token.
>>>>>>> Stashed changes
    Task SendVerificationEmailAsync(
        string recipientEmail,
        string recipientName,
        string verificationToken);
<<<<<<< Updated upstream
=======

    // Sends a password-reset token.
    Task SendPasswordResetEmailAsync(
        string recipientEmail,
        string recipientName,
        string resetToken);
>>>>>>> Stashed changes
}
