
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations;

public sealed class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendVerificationEmailAsync(
        string recipientEmail,
        string recipientName,
        string verificationToken)
    {
        // Logs the token only for local development and testing.
        _logger.LogInformation(
            """
            EMAIL VERIFICATION
            Customer: {CustomerName}
            Email: {CustomerEmail}
            Verification token: {VerificationToken}
            """,
            recipientName,
            recipientEmail,
            verificationToken);

        return Task.CompletedTask;
    }
}