using EventParkingReservationSystem.API.DTOs.Auth;
using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Enums;
using EventParkingReservationSystem.API.Helpers;
using EventParkingReservationSystem.API.Models;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Common;
using EventParkingReservationSystem.API.Services.Interfaces;

namespace EventParkingReservationSystem.API.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly ICustomerRepository _customerRepository;
    private readonly PasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        ICustomerRepository customerRepository,
        PasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _customerRepository = customerRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    // Registers a new customer account with a securely hashed password.
    public async Task<ServiceResult<CustomerResponseDto>> RegisterAsync(
        RegisterRequestDto request)
    {
        // Confirms that both entered passwords match.
        if (request.Password != request.ConfirmPassword)
        {
            return ServiceResult<CustomerResponseDto>.Failure(
                "Password and confirmation password do not match.");
        }

        // Normalises the email to prevent duplicates caused by letter casing.
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

        var customer = new Customer
        {
            Name = request.Name.Trim(),
            Email = normalizedEmail,
            Phone = string.IsNullOrWhiteSpace(request.Phone)
                ? null
                : request.Phone.Trim(),

            // Stores only the password hash and never stores the plain password.
            PasswordHash =
                _passwordHasher.HashPassword(request.Password),

            Role = UserRole.Customer,
            Status = CustomerStatus.Active,
            EmailVerified = false,
            CreatedAt = DateTime.UtcNow
        };

        await _customerRepository.AddAsync(customer);
        await _customerRepository.SaveChangesAsync();

        return ServiceResult<CustomerResponseDto>.Success(
            CustomerMapper.ToResponseDto(customer));
    }

    // Validates customer credentials and returns a signed JWT access token.
    public async Task<ServiceResult<AuthResponseDto>> LoginAsync(
        LoginRequestDto request)
    {
        // Normalises the email before searching the database.
        string normalizedEmail = request.Email
            .Trim()
            .ToLowerInvariant();

        var customer =
            await _customerRepository.GetByEmailAsync(normalizedEmail);

        // Uses one generic error to avoid revealing whether the email exists.
        if (customer is null ||
            !_passwordHasher.VerifyPassword(
                request.Password,
                customer.PasswordHash))
        {
            return ServiceResult<AuthResponseDto>.Failure(
                "Invalid email or password.");
        }

        // Prevents deactivated customer accounts from logging in.
        if (customer.Status != CustomerStatus.Active)
        {
            return ServiceResult<AuthResponseDto>.Failure(
                "This customer account is currently deactivated.");
        }

        // Prevents login until the customer verifies the registered email.
        if (!customer.EmailVerified)
        {
            return ServiceResult<AuthResponseDto>.Failure(
                "Please verify your email address before logging in.");
        }

        // Generates a signed JWT access token for the authenticated customer.
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
}