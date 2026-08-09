using System.Security.Claims;
using EventParkingReservationSystem.API.DTOs.Customers;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    // Returns the profile of the customer identified by the JWT token.
    [HttpGet("me")]
    [ProducesResponseType(
        typeof(CustomerResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponseDto>>
        GetCurrentCustomer()
    {
        // Reads the authenticated customer ID stored inside the JWT claims.
        string? customerIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(customerIdValue, out int customerId))
        {
            return Unauthorized(new
            {
                message = "The access token does not contain a valid customer ID."
            });
        }

        var result =
            await _customerService.GetByIdAsync(customerId);

        if (!result.Succeeded)
        {
            return NotFound(new
            {
                message = result.Error
            });
        }

        return Ok(result.Data);
    }
}
