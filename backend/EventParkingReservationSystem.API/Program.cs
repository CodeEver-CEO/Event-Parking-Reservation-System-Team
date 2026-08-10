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

// ============================================================
// CONTROLLERS
// ============================================================

builder.Services.AddControllers();


// ============================================================
// SWAGGER
// ============================================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT access token."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
});


// ============================================================
// DATABASE CONNECTION
// ============================================================

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString(
            "DefaultConnection")));


// ============================================================
// CORS
// ============================================================

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


// ============================================================
// JWT CONFIGURATION
// ============================================================

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(
        JwtOptions.SectionName));

var jwtOptions =
    builder.Configuration
        .GetSection(JwtOptions.SectionName)
        .Get<JwtOptions>();

if (jwtOptions == null)
{
    throw new InvalidOperationException(
        "JWT configuration is missing.");
}

if (string.IsNullOrWhiteSpace(jwtOptions.Key))
{
    throw new InvalidOperationException(
        "JWT key is missing.");
}

byte[] jwtKeyBytes;

try
{
    jwtKeyBytes =
        Convert.FromBase64String(
            jwtOptions.Key);
}
catch (FormatException)
{
    throw new InvalidOperationException(
        "JWT key must be a valid Base64 string.");
}


// ============================================================
// AUTHENTICATION
// ============================================================

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidIssuer =
                    jwtOptions.Issuer,

                ValidateAudience = true,

                ValidAudience =
                    jwtOptions.Audience,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        jwtKeyBytes),

                ClockSkew =
                    TimeSpan.Zero
            };
    });


// ============================================================
// REPOSITORY DEPENDENCY INJECTION
// ============================================================

// Venue
builder.Services.AddScoped<
    IVenueRepository,
    VenueRepository>();

// Category
builder.Services.AddScoped<
    ICategoryRepository,
    CategoryRepository>();

// Event
builder.Services.AddScoped<
    IEventRepository,
    EventRepository>();

// Customer / Authentication
builder.Services.AddScoped<
    ICustomerRepository,
    CustomerRepository>();

// Booking
builder.Services.AddScoped<
    IBookingRepository,
    BookingRepository>();

// Payment
builder.Services.AddScoped<
    IPaymentRepository,
    PaymentRepository>();

// Notification
builder.Services.AddScoped<
    INotificationRepository,
    NotificationRepository>();

// Admin
builder.Services.AddScoped<
    IAdminRepository,
    AdminRepository>();

// Seat
builder.Services.AddScoped<
    ISeatRepository,
    SeatRepository>();

// Parking Slot
builder.Services.AddScoped<
    IParkingSlotRepository,
    ParkingSlotRepository>();

// Parking Reservation
builder.Services.AddScoped<
    IParkingReservationRepository,
    ParkingReservationRepository>();


// ============================================================
// SERVICE DEPENDENCY INJECTION
// ============================================================

// Venue
builder.Services.AddScoped<
    IVenueService,
    VenueService>();

// Category
builder.Services.AddScoped<
    ICategoryService,
    CategoryService>();

// Event
builder.Services.AddScoped<
    IEventService,
    EventService>();

// Authentication
builder.Services.AddScoped<
    IAuthService,
    AuthService>();

// JWT
builder.Services.AddScoped<
    IJwtTokenGenerator,
    JwtTokenGenerator>();

// Email
builder.Services.AddScoped<
    IEmailService,
    EmailService>();

// Booking
builder.Services.AddScoped<
    IBookingService,
    BookingService>();

// Payment
builder.Services.AddScoped<
    IPaymentService,
    PaymentService>();

// Notification
builder.Services.AddScoped<
    INotificationService,
    NotificationService>();

// Admin Authentication
builder.Services.AddScoped<
    IAdminAuthService,
    AdminAuthService>();

// Customer
builder.Services.AddScoped<
    ICustomerService,
    CustomerService>();

// Seat
builder.Services.AddScoped<
    ISeatService,
    SeatService>();

// Parking Slot
builder.Services.AddScoped<
    IParkingSlotService,
    ParkingSlotService>();

// Parking Reservation
builder.Services.AddScoped<
    IParkingReservationService,
    ParkingReservationService>();


// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

builder.Services.AddSingleton<
    PasswordHasher>();

builder.Services.AddSingleton<
    SecureTokenGenerator>();

// Admin JWT token generator
builder.Services.AddScoped<
    IAdminJwtTokenGenerator,
    AdminJwtTokenGenerator>();


// ============================================================
// BACKGROUND SERVICES
// ============================================================

// Automatically expires pending bookings
builder.Services.AddHostedService<
    BookingExpiryService>();

// Automatically creates event reminders
builder.Services.AddHostedService<
    EventReminderBackgroundService>();


// ============================================================
// BUILD APPLICATION
// ============================================================

var app = builder.Build();


// ============================================================
// HTTP REQUEST PIPELINE
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}


// ============================================================
// HTTPS
// ============================================================

app.UseHttpsRedirection();


// ============================================================
// CORS
// ============================================================

app.UseCors("FrontendPolicy");


// ============================================================
// AUTHENTICATION
// ============================================================

app.UseAuthentication();


// ============================================================
// AUTHORIZATION
// ============================================================

app.UseAuthorization();


// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();


// ============================================================
// RUN
// ============================================================

app.Run();