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
    [Authorize(Roles = "Customer")]
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

    // Updates the authenticated customer's name and phone number.
    [HttpPut("me")]
    [Authorize(Roles = "Customer")]
    [ProducesResponseType(
        typeof(CustomerResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponseDto>>
        UpdateCurrentCustomer(
            [FromBody] UpdateCustomerDto request)
    {
        string? customerIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(customerIdValue, out int customerId))
        {
            return Unauthorized(new
            {
                message =
                    "The access token does not contain a valid customer ID."
            });
        }

        var result =
            await _customerService.UpdateAsync(
                customerId,
                request);

        if (!result.Succeeded)
        {
            return NotFound(new
            {
                message = result.Error
            });
        }

        return Ok(result.Data);
    }

    // Returns customers matching the optional search value.
    [HttpGet]
    [Authorize(Roles = "Administrator")]
    [ProducesResponseType(
        typeof(IReadOnlyList<CustomerResponseDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    public async Task<
        ActionResult<IReadOnlyList<CustomerResponseDto>>>
        SearchCustomers(
            [FromQuery] string? search)
    {
        var result =
            await _customerService.SearchAsync(search);

        return Ok(result.Data);
    }

    // Returns one customer's details for admin management.
    [HttpGet("{customerId:int}")]
    [Authorize(Roles = "Administrator")]
    [ProducesResponseType(
        typeof(CustomerResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponseDto>>
        GetCustomerById(int customerId)
    {
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

    // Soft-deactivates a customer account.
    [HttpDelete("{customerId:int}")]
    [Authorize(Roles = "Administrator")]
    [ProducesResponseType(
        typeof(CustomerResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponseDto>>
        DeactivateCustomer(int customerId)
    {
        var result =
            await _customerService.ChangeStatusAsync(
                customerId,
                activate: false);

        if (!result.Succeeded)
        {
            // Missing customer -> 404; business-rule rejection -> 400.
            if (result.Error is not null &&
                result.Error.Contains(
                    "not found",
                    StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new
                {
                    message = result.Error
                });
            }

            return BadRequest(new
            {
                message = result.Error
            });
        }

        return Ok(result.Data);
    }

    // Reactivates a previously deactivated customer account.
    [HttpPost("{customerId:int}/reactivate")]
    [Authorize(Roles = "Administrator")]
    [ProducesResponseType(
        typeof(CustomerResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerResponseDto>>
        ReactivateCustomer(int customerId)
    {
        var result =
            await _customerService.ChangeStatusAsync(
                customerId,
                activate: true);

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
