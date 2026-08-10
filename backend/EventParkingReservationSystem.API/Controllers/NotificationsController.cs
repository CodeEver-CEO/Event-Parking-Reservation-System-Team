using EventParkingReservationSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EventParkingReservationSystem.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize(Roles = "Customer")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService
            _notificationService;

        public NotificationsController(
            INotificationService notificationService)
        {
            _notificationService =
                notificationService;
        }

        // ============================================================
        // GET LOGGED-IN CUSTOMER NOTIFICATIONS
        // GET /api/notifications
        // ============================================================

        [HttpGet]
        public async Task<IActionResult>
            GetMyNotifications()
        {
            var customerId =
                GetCustomerId();

            var notifications =
                await _notificationService
                    .GetCustomerNotificationsAsync(
                        customerId);

            return Ok(notifications);
        }


        // ============================================================
        // GET CUSTOMER NOTIFICATIONS
        // GET /api/notifications/customer/{customerId}
        // ============================================================

        [HttpGet("customer/{customerId:int}")]
        public async Task<IActionResult>
            GetCustomerNotifications(
                int customerId)
        {
            var loggedInCustomerId =
                GetCustomerId();

            // Customer can access only own notifications
            if (loggedInCustomerId != customerId)
            {
                return Forbid();
            }

            var notifications =
                await _notificationService
                    .GetCustomerNotificationsAsync(
                        customerId);

            return Ok(notifications);
        }


        // ============================================================
        // GET UNREAD COUNT
        // GET /api/notifications/unread-count
        // ============================================================

        [HttpGet("unread-count")]
        public async Task<IActionResult>
            GetUnreadCount()
        {
            var customerId =
                GetCustomerId();

            var count =
                await _notificationService
                    .GetUnreadCountAsync(
                        customerId);

            return Ok(
                new
                {
                    unreadCount = count
                });
        }


        // ============================================================
        // MARK ONE NOTIFICATION AS READ
        // PUT /api/notifications/{id}/read
        // ============================================================

        [HttpPut("{id:int}/read")]
        public async Task<IActionResult>
            MarkAsRead(
                int id)
        {
            var customerId =
                GetCustomerId();

            var result =
                await _notificationService
                    .MarkAsReadAsync(
                        id,
                        customerId);

            if (!result)
            {
                return NotFound(
                    new
                    {
                        message =
                            "Notification not found."
                    });
            }

            return Ok(
                new
                {
                    message =
                        "Notification marked as read."
                });
        }


        // ============================================================
        // MARK ALL AS READ
        // PUT /api/notifications/read-all
        // ============================================================

        [HttpPut("read-all")]
        public async Task<IActionResult>
            MarkAllAsRead()
        {
            var customerId =
                GetCustomerId();

            var updatedCount =
                await _notificationService
                    .MarkAllAsReadAsync(
                        customerId);

            return Ok(
                new
                {
                    message =
                        "All notifications marked as read.",

                    updatedCount
                });
        }


        // ============================================================
        // GET CUSTOMER ID FROM JWT
        // ============================================================

        private int GetCustomerId()
        {
            var customerIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                customerIdValue,
                out var customerId))
            {
                throw new UnauthorizedAccessException(
                    "Invalid customer ID in access token.");
            }

            return customerId;
        }
    }
}