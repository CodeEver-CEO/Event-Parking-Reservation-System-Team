using System.Security.Claims;
using EventParkingReservationSystem.API.DTOs.Notifications;
using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventParkingReservationSystem.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize(Roles = "Customer")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(
        INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    // ----------------------------------------------------
    // GET: /api/notifications
    // Returns all notifications for logged-in customer
    // ----------------------------------------------------
    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<NotificationResponseDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<
        ActionResult<IReadOnlyList<NotificationResponseDto>>>
        GetNotifications()
    {
        if (!TryGetCustomerId(out int customerId))
        {
            return Unauthorized(new
            {
                message =
                    "The access token does not contain a valid customer ID."
            });
        }

        var result =
            await _notificationService
                .GetNotificationsAsync(customerId);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = result.Error
            });
        }

        return Ok(result.Data);
    }

    // ----------------------------------------------------
    // GET: /api/notifications/unread-count
    // Returns unread notification count
    // ----------------------------------------------------
    [HttpGet("unread-count")]
    [ProducesResponseType(
        typeof(UnreadNotificationCountDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<
        ActionResult<UnreadNotificationCountDto>>
        GetUnreadCount()
    {
        if (!TryGetCustomerId(out int customerId))
        {
            return Unauthorized(new
            {
                message =
                    "The access token does not contain a valid customer ID."
            });
        }

        var result =
            await _notificationService
                .GetUnreadCountAsync(customerId);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = result.Error
            });
        }

        return Ok(result.Data);
    }

    // ----------------------------------------------------
    // PUT: /api/notifications/{id}/read
    // Marks one notification as read
    // ----------------------------------------------------
    [HttpPut("{notificationId:int}/read")]
    [ProducesResponseType(
        typeof(NotificationResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<
        ActionResult<NotificationResponseDto>>
        MarkAsRead(int notificationId)
    {
        if (!TryGetCustomerId(out int customerId))
        {
            return Unauthorized(new
            {
                message =
                    "The access token does not contain a valid customer ID."
            });
        }

        var result =
            await _notificationService
                .MarkAsReadAsync(
                    customerId,
                    notificationId);

        if (!result.Succeeded)
        {
            return NotFound(new
            {
                message = result.Error
            });
        }

        return Ok(result.Data);
    }

    // ----------------------------------------------------
    // PUT: /api/notifications/read-all
    // Marks all notifications as read
    // ----------------------------------------------------
    [HttpPut("read-all")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult>
        MarkAllAsRead()
    {
        if (!TryGetCustomerId(out int customerId))
        {
            return Unauthorized(new
            {
                message =
                    "The access token does not contain a valid customer ID."
            });
        }

        var result =
            await _notificationService
                .MarkAllAsReadAsync(customerId);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = result.Error
            });
        }

        return Ok(new
        {
            message =
                "All notifications were marked as read."
        });
    }

    // ----------------------------------------------------
    // Reads customer ID from JWT token
    // ----------------------------------------------------
    private bool TryGetCustomerId(
        out int customerId)
    {
        string? customerIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        return int.TryParse(
            customerIdValue,
            out customerId);
    }
}