using System.Net;
using EventParkingReservationSystem.API.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace EventParkingReservationSystem.API.Services.Implementations;

public sealed class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IConfiguration configuration,
        ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    // =====================================================
    // EMAIL VERIFICATION
    // =====================================================

    public async Task SendVerificationEmailAsync(
        string recipientEmail,
        string recipientName,
        string verificationToken)
    {
        var frontendUrl =
            GetFrontendUrl();

        var encodedToken =
            Uri.EscapeDataString(
                verificationToken);

        var verificationLink =
            $"{frontendUrl}/pages/auth/verify-email.html?token={encodedToken}";

        var safeName =
            WebUtility.HtmlEncode(
                recipientName);

        var safeLink =
            WebUtility.HtmlEncode(
                verificationLink);

        var subject =
            "Verify your EventPark account";

        var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <body style="
                margin:0;
                padding:0;
                background:#f4f7fb;
                font-family:Arial,Helvetica,sans-serif;
            ">

                <div style="
                    max-width:600px;
                    margin:40px auto;
                    background:#ffffff;
                    border-radius:16px;
                    padding:40px;
                    box-shadow:0 4px 20px rgba(0,0,0,0.08);
                ">

                    <h1 style="
                        color:#111827;
                        margin-bottom:20px;
                    ">
                        Welcome to EventPark
                    </h1>

                    <p style="
                        color:#4b5563;
                        font-size:16px;
                        line-height:1.6;
                    ">
                        Hi {safeName},
                    </p>

                    <p style="
                        color:#4b5563;
                        font-size:16px;
                        line-height:1.6;
                    ">
                        Thank you for creating your EventPark account.
                        Please verify your email address to activate
                        your account.
                    </p>

                    <div style="
                        text-align:center;
                        margin:32px 0;
                    ">

                        <a
                            href="{safeLink}"
                            style="
                                display:inline-block;
                                background:#2563eb;
                                color:#ffffff;
                                text-decoration:none;
                                padding:14px 28px;
                                border-radius:8px;
                                font-weight:bold;
                            ">
                            Verify Email
                        </a>

                    </div>

                    <p style="
                        color:#6b7280;
                        font-size:14px;
                        line-height:1.6;
                    ">
                        If the button does not work, copy and paste
                        this link into your browser:
                    </p>

                    <p style="
                        color:#2563eb;
                        font-size:13px;
                        word-break:break-all;
                    ">
                        {safeLink}
                    </p>

                    <p style="
                        color:#6b7280;
                        font-size:13px;
                        margin-top:30px;
                    ">
                        This verification link expires after 24 hours.
                    </p>

                </div>

            </body>
            </html>
            """;

        await SendEmailAsync(
            recipientEmail,
            subject,
            htmlBody);

        _logger.LogInformation(
            "Verification email sent successfully to {Email}.",
            recipientEmail);
    }


    // =====================================================
    // PASSWORD RESET
    // =====================================================

    public async Task SendPasswordResetEmailAsync(
        string recipientEmail,
        string recipientName,
        string resetToken)
    {
        var frontendUrl =
            GetFrontendUrl();

        var encodedToken =
            Uri.EscapeDataString(
                resetToken);

        var resetLink =
            $"{frontendUrl}/pages/auth/reset-password.html?token={encodedToken}";

        var safeName =
            WebUtility.HtmlEncode(
                recipientName);

        var safeLink =
            WebUtility.HtmlEncode(
                resetLink);

        var subject =
            "Reset your EventPark password";

        var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <body style="
                margin:0;
                padding:0;
                background:#f4f7fb;
                font-family:Arial,Helvetica,sans-serif;
            ">

                <div style="
                    max-width:600px;
                    margin:40px auto;
                    background:#ffffff;
                    border-radius:16px;
                    padding:40px;
                    box-shadow:0 4px 20px rgba(0,0,0,0.08);
                ">

                    <h1 style="
                        color:#111827;
                    ">
                        Reset Your Password
                    </h1>

                    <p style="
                        color:#4b5563;
                        font-size:16px;
                        line-height:1.6;
                    ">
                        Hi {safeName},
                    </p>

                    <p style="
                        color:#4b5563;
                        font-size:16px;
                        line-height:1.6;
                    ">
                        We received a request to reset your
                        EventPark account password.
                    </p>

                    <div style="
                        text-align:center;
                        margin:32px 0;
                    ">

                        <a
                            href="{safeLink}"
                            style="
                                display:inline-block;
                                background:#2563eb;
                                color:#ffffff;
                                text-decoration:none;
                                padding:14px 28px;
                                border-radius:8px;
                                font-weight:bold;
                            ">
                            Reset Password
                        </a>

                    </div>

                    <p style="
                        color:#6b7280;
                        font-size:14px;
                    ">
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                    <p style="
                        color:#6b7280;
                        font-size:13px;
                        margin-top:30px;
                    ">
                        This password reset link expires after 1 hour.
                    </p>

                </div>

            </body>
            </html>
            """;

        await SendEmailAsync(
            recipientEmail,
            subject,
            htmlBody);

        _logger.LogInformation(
            "Password reset email sent successfully to {Email}.",
            recipientEmail);
    }


    // =====================================================
    // SMTP SEND
    // =====================================================

    private async Task SendEmailAsync(
        string recipientEmail,
        string subject,
        string htmlBody)
    {
        var smtpHost =
            _configuration[
                "EmailSettings:SmtpHost"];

        var smtpPort =
            _configuration.GetValue<int>(
                "EmailSettings:SmtpPort");

        var username =
            _configuration[
                "EmailSettings:Username"];

        var password =
            _configuration[
                "EmailSettings:Password"];

        var fromEmail =
            _configuration[
                "EmailSettings:FromEmail"];

        var fromName =
            _configuration[
                "EmailSettings:FromName"]
            ?? "EventPark";


        if (string.IsNullOrWhiteSpace(smtpHost))
        {
            throw new InvalidOperationException(
                "EmailSettings:SmtpHost is missing.");
        }

        if (smtpPort <= 0)
        {
            throw new InvalidOperationException(
                "EmailSettings:SmtpPort is missing.");
        }

        if (string.IsNullOrWhiteSpace(username))
        {
            throw new InvalidOperationException(
                "EmailSettings:Username is missing.");
        }

        if (string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "EmailSettings:Password is missing.");
        }

        if (string.IsNullOrWhiteSpace(fromEmail))
        {
            throw new InvalidOperationException(
                "EmailSettings:FromEmail is missing.");
        }


        var message =
            new MimeMessage();


        message.From.Add(
            new MailboxAddress(
                fromName,
                fromEmail));


        message.To.Add(
            MailboxAddress.Parse(
                recipientEmail));


        message.Subject =
            subject;


        var bodyBuilder =
            new BodyBuilder
            {
                HtmlBody =
                    htmlBody
            };


        message.Body =
            bodyBuilder.ToMessageBody();


        using var smtpClient =
            new SmtpClient();


        try
        {
            await smtpClient.ConnectAsync(
                smtpHost,
                smtpPort,
                SecureSocketOptions.StartTls);


            await smtpClient.AuthenticateAsync(
                username,
                password);


            await smtpClient.SendAsync(
                message);


            await smtpClient.DisconnectAsync(
                true);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Failed to send email to {Email}.",
                recipientEmail);

            throw;
        }
    }


    // =====================================================
    // FRONTEND URL
    // =====================================================

    private string GetFrontendUrl()
    {
        var frontendUrl =
            _configuration[
                "EmailSettings:FrontendUrl"];


        if (string.IsNullOrWhiteSpace(frontendUrl))
        {
            throw new InvalidOperationException(
                "EmailSettings:FrontendUrl is missing.");
        }


        return frontendUrl.TrimEnd('/');
    }
}