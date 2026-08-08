using EventParkingReservationSystem.API.BackgroundServices;
using EventParkingReservationSystem.API.Data;
using EventParkingReservationSystem.API.Repositories.Implementations;
using EventParkingReservationSystem.API.Repositories.Interfaces;
using EventParkingReservationSystem.API.Services.Implementations;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;



var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

// ------------------------------------
// Database Connection
// ------------------------------------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ------------------------------------
// Repository Dependency Injection
// ------------------------------------
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();


// ------------------------------------
// Service Dependency Injection
// ------------------------------------
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddHostedService<BookingExpiryService>();
// ------------------------------------
// Background Service
// ------------------------------------
builder.Services.AddHostedService<BookingExpiryService>();

// ------------------------------------
// Swagger
// ------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ------------------------------------
// Build Application
// ------------------------------------
var app = builder.Build();

// ------------------------------------
// HTTP Request Pipeline
// ------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();