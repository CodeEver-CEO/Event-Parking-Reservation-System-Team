<<<<<<< Updated upstream
﻿
using EventParkingReservationSystem.API.Services.Interfaces;
=======
﻿using EventParkingReservationSystem.API.Services.Interfaces;
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
        // Logs the token only for local development and testing.
=======
        // Logs the verification token for development testing.
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
}
=======

    public Task SendPasswordResetEmailAsync(
        string recipientEmail,
        string recipientName,
        string resetToken)
    {
        // Logs the reset token for development testing.
        _logger.LogInformation(
            """
            PASSWORD RESET
            Customer: {CustomerName}
            Email: {CustomerEmail}
            Reset token: {ResetToken}
            """,
            recipientName,
            recipientEmail,
            resetToken);

        return Task.CompletedTask;
    }
}
>>>>>>> Stashed changes
