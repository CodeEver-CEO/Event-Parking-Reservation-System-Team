# Event Parking Reservation System

A web application for booking event seats and parking. The solution is split
into an ASP.NET Core Web API backend and a static HTML/CSS/JS frontend.

> **Status:** Customer authentication (register, email verification, login,
> resend verification, forgot/reset password) and the customer profile endpoint
> are implemented. The remaining modules (events, venues, bookings, seats,
> parking, payments, notifications, dashboard) are scaffolded and in progress.

## Prerequisites

- [.NET SDK 8.0](https://dotnet.microsoft.com/download)
- SQL Server LocalDB (installed with Visual Studio, or SQL Server Express)

## Backend setup

All commands are run from `backend/EventParkingReservationSystem.API`.

### 1. Configure the JWT signing key (required)

The JWT signing key is a **secret** and is deliberately **not** stored in
`appsettings*.json`. Supply it through .NET user secrets so it never lands in
source control. The app validates this at startup and will refuse to run
without it.

The key must be Base64 and decode to **at least 32 bytes** (256-bit).

```bash
# Generate a random 32-byte key (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))

# Store it as a user secret for this project
dotnet user-secrets set "Jwt:Key" "<paste-the-generated-base64-key>"
```

The non-secret JWT settings (`Issuer`, `Audience`, `AccessTokenMinutes`) live in
`appsettings.json`.

### 2. Connection string

`appsettings.json` defaults to a LocalDB instance:

```
Server=(localdb)\MSSQLLocalDB;Database=EventParkingReservationSystemDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true
```

Override it locally with user secrets or `appsettings.Development.json` if your
SQL Server differs.

### 3. Apply database migrations

```bash
dotnet tool install --global dotnet-ef   # first time only
dotnet ef database update
```

### 4. Run the API

```bash
dotnet run
```

Swagger UI is available in the Development environment at the root of the API
(e.g. `https://localhost:<port>/swagger`).

## Frontend

The frontend is static and lives in `frontend/`. Open the pages directly or
serve the folder with any static file server, and point it at the running API.

## Project layout

```
backend/EventParkingReservationSystem.API/
  Controllers/     API endpoints
  Services/        Business logic (Interfaces + Implementations)
  Repositories/    Data access (Interfaces + Implementations)
  Models/          EF Core entities
  DTOs/            Request/response contracts
  Data/            DbContext and migrations
  Helpers/         Password hashing, token generation, JWT, mappers
frontend/          Static HTML/CSS/JS client
```
