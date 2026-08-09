using EventParkingReservationSystem.API.DTOs.Auth;
using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Helpers;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Common;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations;

public sealed class AuthService : IAuthService
{
    private readonly ICustomerRepository _customerRepository;
    private readonly PasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly SecureTokenGenerator _secureTokenGenerator;
    private readonly IEmailService _emailService;

    public AuthService(
        ICustomerRepository customerRepository,
        PasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        SecureTokenGenerator secureTokenGenerator,
        IEmailService emailService)
    {
        _customerRepository = customerRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _secureTokenGenerator = secureTokenGenerator;
        _emailService = emailService;
    }

    // Registers a new customer and sends an email-verification token.
    public async Task<ServiceResult<CustomerResponseDto>> RegisterAsync(
        RegisterRequestDto request)
    {
        // Confirms that the password and confirmation password match.
        if (request.Password != request.ConfirmPassword)
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "Password and confirmation password do not match.");
        }

        // Normalises the email to prevent duplicate accounts with different casing.
        string normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        bool emailExists =
            await _customerRepository.EmailExistsAsync(normalizedEmail);

        if (emailExists)
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "An account already exists with this email address.");
        }

        // Generates the raw token that will be sent to the customer.
        string verificationToken =
            _secureTokenGenerator.GenerateToken();

        // Stores only the token hash to protect it if the database is exposed.
        string verificationTokenHash =
            _secureTokenGenerator.HashToken(verificationToken);

        var customer = new Customer
        {
            Name = request.Name.Trim(),
            Email = normalizedEmail,

            Phone = string.IsNullOrWhiteSpace(request.Phone)
                ? null
                : request.Phone.Trim(),

            // Stores only the secure password hash.
            PasswordHash =
                _passwordHasher.HashPassword(request.Password),

            Role = UserRole.Customer,
            Status = CustomerStatus.Active,
            EmailVerified = false,

            EmailVerificationTokenHash =
                verificationTokenHash,

            EmailVerificationTokenExpiresAt =
                DateTime.UtcNow.AddHours(24),

            CreatedAt = DateTime.UtcNow
        };

        await _customerRepository.AddAsync(customer);
        await _customerRepository.SaveChangesAsync();

        // Sends the raw verification token only after the customer is saved.
        await _emailService.SendVerificationEmailAsync(
            customer.Email,
            customer.Name,
            verificationToken);

        return ServiceResult<CustomerResponseDto>.Success(
            CustomerMapper.ToResponseDto(customer));
    }

    // Validates credentials and returns a signed JWT access token.
    public async Task<ServiceResult<AuthResponseDto>> LoginAsync(
        LoginRequestDto request)
    {
        string normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        var customer =
            await _customerRepository.GetByEmailAsync(
                normalizedEmail);

        // Uses one generic error to prevent account discovery.
        if (customer is null ||
            !_passwordHasher.VerifyPassword(
                request.Password,
                customer.PasswordHash))
        {
            return ServiceResult<AuthResponseDto>.Failure(
                "Invalid email or password.");
        }

        if (customer.Status != CustomerStatus.Active)
        {
            return ServiceResult<AuthResponseDto>.Failure(
                "This customer account is currently deactivated.");
        }

        // Prevents login until the registered email is verified.
        if (!customer.EmailVerified)
        {
            return ServiceResult<AuthResponseDto>.Failure(
                "Please verify your email address before logging in.");
        }

        // Generates a signed JWT token.
        var token =
            _jwtTokenGenerator.GenerateToken(customer);

        var response = new AuthResponseDto
        {
            AccessToken = token.AccessToken,
            TokenType = "Bearer",
            ExpiresAtUtc = token.ExpiresAtUtc,
            CustomerId = customer.Id,
            Name = customer.Name,
            Email = customer.Email,
            Role = customer.Role.ToString()
        };

        return ServiceResult<AuthResponseDto>.Success(response);
    }

    // Verifies the customer email using a one-time token.
    public async Task<ServiceResult<string>> VerifyEmailAsync(
        VerifyEmailRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return ServiceResult<string>.Failure(
                "Verification token is required.");
        }

        // Hashes the received token before database comparison.
        string tokenHash =
            _secureTokenGenerator.HashToken(
                request.Token.Trim());

        var customer =
            await _customerRepository
                .GetByEmailVerificationTokenHashAsync(
                    tokenHash);

        if (customer is null)
        {
            return ServiceResult<string>.Failure(
                "The email-verification token is invalid.");
        }

        if (customer.EmailVerified)
        {
            return ServiceResult<string>.Success(
                "Email verified successfully.");
        }

        // Rejects expired verification tokens.
        if (customer.EmailVerificationTokenExpiresAt is null ||
            customer.EmailVerificationTokenExpiresAt <=
            DateTime.UtcNow)
        {
            customer.EmailVerificationTokenHash = null;
            customer.EmailVerificationTokenExpiresAt = null;
            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.SaveChangesAsync();

            return ServiceResult<string>.Failure(
                "The email-verification token has expired.");
        }

        customer.EmailVerified = true;

        // Removes the verification token after successful use.
        customer.EmailVerificationTokenHash = null;
        customer.EmailVerificationTokenExpiresAt = null;
        customer.UpdatedAt = DateTime.UtcNow;

        await _customerRepository.SaveChangesAsync();

        return ServiceResult<string>.Success(
            "Email verified successfully.");
    }

    // Generates a replacement email-verification token.
    public async Task<ServiceResult<string>>
        ResendVerificationAsync(
            ResendVerificationRequestDto request)
    {
        string normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        const string safeMessage =
            "If an eligible account exists, a verification email has been sent.";

        var customer =
            await _customerRepository.GetByEmailAsync(
                normalizedEmail);

        // Returns the same response to prevent account discovery.
        if (customer is null ||
            customer.Status != CustomerStatus.Active ||
            customer.EmailVerified)
        {
            return ServiceResult<string>.Success(
                safeMessage);
        }

        string verificationToken =
            _secureTokenGenerator.GenerateToken();

        customer.EmailVerificationTokenHash =
            _secureTokenGenerator.HashToken(
                verificationToken);

        customer.EmailVerificationTokenExpiresAt =
            DateTime.UtcNow.AddHours(24);

        customer.UpdatedAt = DateTime.UtcNow;

        await _customerRepository.SaveChangesAsync();

        await _emailService.SendVerificationEmailAsync(
            customer.Email,
            customer.Name,
            verificationToken);

        return ServiceResult<string>.Success(
            safeMessage);
    }

    // Generates a secure password-reset token.
    public async Task<ServiceResult<string>> ForgotPasswordAsync(
        ForgotPasswordRequestDto request)
    {
        string normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        var customer =
            await _customerRepository.GetByEmailAsync(
                normalizedEmail);

        const string safeMessage =
            "If an eligible account exists, password-reset instructions have been sent.";

        // Returns the same response to prevent account discovery.
        if (customer is null ||
            customer.Status != CustomerStatus.Active ||
            !customer.EmailVerified)
        {
            return ServiceResult<string>.Success(
                safeMessage);
        }

        string resetToken =
            _secureTokenGenerator.GenerateToken();

        // Stores only the reset-token hash.
        customer.PasswordResetTokenHash =
            _secureTokenGenerator.HashToken(
                resetToken);

        // Makes the reset token valid for one hour.
        customer.PasswordResetTokenExpiresAt =
            DateTime.UtcNow.AddHours(1);

        customer.UpdatedAt = DateTime.UtcNow;

        await _customerRepository.SaveChangesAsync();

        await _emailService.SendPasswordResetEmailAsync(
            customer.Email,
            customer.Name,
            resetToken);

        return ServiceResult<string>.Success(
            safeMessage);
    }

    // Resets the password using a valid one-time token.
    public async Task<ServiceResult<string>> ResetPasswordAsync(
        ResetPasswordRequestDto request)
    {
        if (request.NewPassword != request.ConfirmPassword)
        {
            return ServiceResult<string>.Failure(
                "New password and confirmation password do not match.");
        }

        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return ServiceResult<string>.Failure(
                "Password-reset token is required.");
        }

        string tokenHash =
            _secureTokenGenerator.HashToken(
                request.Token.Trim());

        var customer =
            await _customerRepository
                .GetByPasswordResetTokenHashAsync(
                    tokenHash);

        if (customer is null)
        {
            return ServiceResult<string>.Failure(
                "The password-reset token is invalid.");
        }

        // Rejects expired reset tokens.
        if (customer.PasswordResetTokenExpiresAt is null ||
            customer.PasswordResetTokenExpiresAt <=
            DateTime.UtcNow)
        {
            customer.PasswordResetTokenHash = null;
            customer.PasswordResetTokenExpiresAt = null;
            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.SaveChangesAsync();

            return ServiceResult<string>.Failure(
                "The password-reset token has expired.");
        }

        // Replaces the previous password hash.
        customer.PasswordHash =
            _passwordHasher.HashPassword(
                request.NewPassword);

        // Removes the reset token to prevent reuse.
        customer.PasswordResetTokenHash = null;
        customer.PasswordResetTokenExpiresAt = null;
        customer.UpdatedAt = DateTime.UtcNow;

        await _customerRepository.SaveChangesAsync();

        return ServiceResult<string>.Success(
            "Password reset successfully.");
    }
}