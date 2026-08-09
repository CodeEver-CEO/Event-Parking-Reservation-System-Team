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

// Reads the SQL Server connection string.
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "DefaultConnection was not found in appsettings.json.");

// Registers Entity Framework Core with SQL Server.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// Reads and validates JWT settings during application startup.
builder.Services
    .AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.Key),
        "JWT key is required.")
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.Issuer),
        "JWT issuer is required.")
    .Validate(
        options => !string.IsNullOrWhiteSpace(options.Audience),
        "JWT audience is required.")
    .Validate(
        options => options.AccessTokenMinutes > 0,
        "JWT access token duration must be greater than zero.")
    .ValidateOnStart();

// Loads the configured JWT settings.
var jwtOptions =
    builder.Configuration
        .GetSection(JwtOptions.SectionName)
        .Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "JWT configuration was not found.");

// Converts the Base64 JWT key into secure key bytes.
byte[] jwtKeyBytes;

try
{
    jwtKeyBytes =
        Convert.FromBase64String(jwtOptions.Key);
}
catch (FormatException exception)
{
    throw new InvalidOperationException(
        "Jwt:Key must be a valid Base64 value.",
        exception);
}

// Requires a minimum 256-bit JWT signing key.
if (jwtKeyBytes.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key must contain at least 32 bytes.");
}

// Configures JWT authentication.
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
                // Confirms that this API issued the token.
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,

                // Confirms that the token is for the expected client.
                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,

                // Confirms that the token signature is valid.
                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(jwtKeyBytes),

                // Rejects expired tokens.
                ValidateLifetime = true,

                // Removes the default token grace period.
                ClockSkew = TimeSpan.Zero
            };
    });

// Registers authorization services.
builder.Services.AddAuthorization();

// Registers repositories.
builder.Services.AddScoped<
    ICustomerRepository,
    CustomerRepository>();

// Registers business services.
builder.Services.AddScoped<
    IAuthService,
    AuthService>();

// Registers business services.
builder.Services.AddScoped<
    ICustomerService,
    CustomerService>();

builder.Services.AddScoped<
    IEmailService,
    EmailService>();

// Registers security helper services.
builder.Services.AddScoped<PasswordHasher>();

builder.Services.AddSingleton<SecureTokenGenerator>();

builder.Services.AddSingleton<
    IJwtTokenGenerator,
    JwtTokenGenerator>();

// Registers controllers and API endpoint discovery.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configures Swagger and JWT authorization.
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "Event Parking Reservation System API",
            Version = "v1",
            Description =
                "API for event booking and parking reservation management."
        });

    // Adds the JWT Authorize button.
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

    // Sends the JWT with protected Swagger requests.
    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type =
                            ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
});

var app = builder.Build();

// Enables Swagger in development.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Authentication must execute before authorization.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();