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

// Venue / Event / Category Repositories
builder.Services.AddScoped<
    IVenueRepository,
    VenueRepository>();

builder.Services.AddScoped<
    IEventRepository,
    EventRepository>();

builder.Services.AddScoped<
    ICategoryRepository,
    CategoryRepository>();

// Admin Repository
builder.Services.AddScoped<
    IAdminRepository,
    AdminRepository>();

// Notification Repository
builder.Services.AddScoped<
    INotificationRepository,
    NotificationRepository>();

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

// Module 4 - Booking & Payment Services
builder.Services.AddScoped<
    IBookingService,
    BookingService>();

builder.Services.AddScoped<
    IPaymentService,
    PaymentService>();

// Venue / Event / Category Services
builder.Services.AddScoped<
    IVenueService,
    VenueService>();

builder.Services.AddScoped<
    IEventService,
    EventService>();

builder.Services.AddScoped<
    ICategoryService,
    CategoryService>();

// Notification Service
builder.Services.AddScoped<
    INotificationService,
    NotificationService>();

// Module 4 - Booking Expiry Background Service
builder.Services.AddHostedService<
    BookingExpiryService>();

// Module 8 - Event Reminder Background Service
builder.Services.AddHostedService<
    EventReminderBackgroundService>();

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

builder.Services.AddSingleton<
    IAdminJwtTokenGenerator,
    AdminJwtTokenGenerator>();

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

// In Development, make sure the local database is reachable and its schema is
// up to date, without any manual steps.
if (app.Environment.IsDevelopment())
{
    // Newer LocalDB builds do not reliably auto-start from the SQL client, so
    // start the instance explicitly first (best effort).
    try
    {
        using var localDbStart = System.Diagnostics.Process.Start(
            new System.Diagnostics.ProcessStartInfo
            {
                FileName = "sqllocaldb",
                Arguments = "start MSSQLLocalDB",
                UseShellExecute = false,
                CreateNoWindow = true
            });
        localDbStart?.WaitForExit(15000);
    }
    catch (Exception localDbException)
    {
        app.Logger.LogWarning(
            localDbException,
            "Could not start LocalDB automatically.");
    }

    // Apply any pending EF Core migrations. Wrapped so an unavailable database
    // does not crash startup.
    try
    {
        using var migrationScope = app.Services.CreateScope();
        var migrationDb = migrationScope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();
        migrationDb.Database.Migrate();

        // Create the default administrator from AdminSeed config (idempotent).
        var seeder = migrationScope.ServiceProvider
            .GetRequiredService<DatabaseSeeder>();
        await seeder.SeedAsync();
    }
    catch (Exception migrationException)
    {
        app.Logger.LogWarning(
            migrationException,
            "Startup migration/seeding skipped - database unavailable.");
    }
}

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