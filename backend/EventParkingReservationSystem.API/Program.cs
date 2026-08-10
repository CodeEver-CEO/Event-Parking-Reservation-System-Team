using System.Text.Json.Serialization;
using EventParkingReservationSystem.API.BackgroundServices;
using EventParkingReservationSystem.API.Configuration;
using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Helpers;
using EventParkingReservationSystem.API.Repositories.Implementations;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Implementations;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ------------------------------------
// Database Connection
// ------------------------------------
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ------------------------------------
// Repository Dependency Injection
// ------------------------------------
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();

// =====================================================
// DATABASE
// =====================================================

var connectionString =
    builder.Configuration.GetConnectionString(
        "DefaultConnection")
    ?? throw new InvalidOperationException(
        "DefaultConnection was not found in appsettings.json.");

builder.Services.AddDbContext<ApplicationDbContext>(
    options =>
        options.UseSqlServer(connectionString));

// =====================================================
// JWT CONFIGURATION
// =====================================================

builder.Services
    .AddOptions<JwtOptions>()
    .Bind(
        builder.Configuration.GetSection(
            JwtOptions.SectionName))
    .Validate(
        options =>
            !string.IsNullOrWhiteSpace(options.Key),
        "JWT key is required.")
    .Validate(
        options =>
            !string.IsNullOrWhiteSpace(options.Issuer),
        "JWT issuer is required.")
    .Validate(
        options =>
            !string.IsNullOrWhiteSpace(options.Audience),
        "JWT audience is required.")
    .Validate(
        options =>
            options.AccessTokenMinutes > 0,
        "JWT access-token duration must be greater than zero.")
    .ValidateOnStart();

var jwtOptions =
    builder.Configuration
        .GetSection(JwtOptions.SectionName)
        .Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "JWT configuration was not found.");

byte[] jwtKeyBytes;

try
{
    jwtKeyBytes =
        Convert.FromBase64String(
            jwtOptions.Key);
}
catch (FormatException exception)
{
    throw new InvalidOperationException(
        "Jwt:Key must be a valid Base64 value.",
        exception);
}

// =====================================================
// AUTHENTICATION
// =====================================================

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = true;
        options.SaveToken = true;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,

                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,

                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        jwtKeyBytes),

                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();

// ------------------------------------
// Repository Dependency Injection
// ------------------------------------
builder.Services.AddScoped<
    ICustomerRepository,
    CustomerRepository>();

builder.Services.AddScoped<
    IAdminRepository,
    AdminRepository>();

builder.Services.AddScoped<
    IBookingRepository,
    BookingRepository>();

builder.Services.AddScoped<
    IPaymentRepository,
    PaymentRepository>();

builder.Services.AddScoped<
    ISeatRepository,
    SeatRepository>();

// Module 5 - Parking Slot Repository
builder.Services.AddScoped<
    IParkingSlotRepository,
    ParkingSlotRepository>();

// Module 5 - Parking Reservation Repository
builder.Services.AddScoped<
    IParkingReservationRepository,
    ParkingReservationRepository>();

// =====================================================
// SERVICES
// =====================================================

// Authentication Service
builder.Services.AddScoped<
    IAuthService,
    AuthService>();

builder.Services.AddScoped<
    IAdminAuthService,
    AdminAuthService>();

builder.Services.AddScoped<
    ICustomerService,
    CustomerService>();

builder.Services.AddScoped<
    IEmailService,
    EmailService>();

builder.Services.AddScoped<
    ISeatService,
    SeatService>();

// Module 5 - Parking Slot Service
builder.Services.AddScoped<
    IParkingSlotService,
    ParkingSlotService>();

// Module 5 - Parking Reservation Service
builder.Services.AddScoped<
    IParkingReservationService,
    ParkingReservationService>();

// Module 4 - Booking Expiry Background Service
builder.Services.AddHostedService<
    BookingExpiryService>();

// =====================================================
// HELPERS
// =====================================================

builder.Services.AddScoped<
    PasswordHasher>();

builder.Services.AddScoped<DatabaseSeeder>();

builder.Services.AddSingleton<SecureTokenGenerator>();

builder.Services.AddSingleton<
    IJwtTokenGenerator,
    JwtTokenGenerator>();

// =====================================================
// CONTROLLERS
// =====================================================

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions
            .Converters
            .Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();

// =====================================================
// CORS
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "FrontendPolicy",
        policy =>
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// =====================================================
// SWAGGER
// =====================================================

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title =
                "Event Parking Reservation System API",

            Version = "v1",

            Description =
                "API for event booking and parking reservation management."
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description =
                "Enter the JWT access token only."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference =
                        new OpenApiReference
                        {
                            Type =
                                ReferenceType.SecurityScheme,

                            Id =
                                "Bearer"
                        }
                },
                Array.Empty<string>()
            }
        });
});

// ------------------------------------
// Build Application
// ------------------------------------
var app = builder.Build();

// =====================================================
// HTTP PIPELINE
// =====================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();