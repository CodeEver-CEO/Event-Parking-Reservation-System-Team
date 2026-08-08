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

// Reads the SQL Server connection string from appsettings.json.
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
        options =>
            !string.IsNullOrWhiteSpace(options.Key) &&
            options.Key.Length >= 32,
        "JWT key must contain at least 32 characters.")
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

// Loads the configured JWT settings for token validation.
var jwtOptions =
    builder.Configuration
        .GetSection(JwtOptions.SectionName)
        .Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "JWT configuration was not found.");

// Converts the Base64 JWT secret into the original secure key bytes.
byte[] jwtKeyBytes;

try
{
    jwtKeyBytes = Convert.FromBase64String(jwtOptions.Key);
}
catch (FormatException exception)
{
    throw new InvalidOperationException(
        "Jwt:Key must be a valid Base64 value.",
        exception);
}

// Configures JWT authentication for incoming API requests.
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
                // Confirms that the token was issued by this API.
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,

                // Confirms that the token belongs to the intended client.
                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,

                // Confirms that the token has a valid signature.
                ValidateIssuerSigningKey = true,
                IssuerSigningKey =
                    new SymmetricSecurityKey(jwtKeyBytes),

                // Rejects expired access tokens.
                ValidateLifetime = true,

                // Removes the default additional token validity time.
                ClockSkew = TimeSpan.Zero
            };
    });

// Registers authorization services for protected endpoints.
builder.Services.AddAuthorization();

// Registers repositories responsible for database operations.
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();

// Registers services containing application business rules.
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();

// Registers password hashing and JWT token generation services.
builder.Services.AddScoped<PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

// Registers API controllers and endpoint discovery.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configures Swagger documentation and JWT authentication.
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Event Parking Reservation System API",
        Version = "v1",
        Description =
            "API for event booking and parking reservation management."
    });

    // Adds the JWT Authorize button to Swagger UI.
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter the JWT access token only."
        });

    // Sends the JWT token with protected Swagger requests.
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

var app = builder.Build();

// Enables Swagger only in the development environment.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Authentication must run before authorization.
app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();