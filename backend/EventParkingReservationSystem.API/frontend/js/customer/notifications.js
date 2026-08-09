/* =========================================================
   Event & Parking Reservation System
   Customer Notifications
   ========================================================= */


let customerNotifications = [];

let notificationRequestInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeNotificationsPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeNotificationsPage() {

    if (!validateNotificationAccess()) {
        return;
    }


    initializeNotificationControls();


    await loadCustomerNotifications();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateNotificationAccess() {

    const token =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.TOKEN
        );


    const role =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.ROLE
        );


    if (!token) {

        window.location.href =
            "../auth/login.html";

        return false;
    }


    if (
        !role ||
        role.toLowerCase() !== "customer"
    ) {

        window.location.href =
            "../auth/login.html";

        return false;
    }


    return true;
}


/* =========================================================
   CUSTOMER ID
   ========================================================= */

function getNotificationCustomerId() {

    const directId =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.CUSTOMER_ID
        );


    if (directId) {

        return directId;
    }


    const storedUser =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.USER
        );


    if (!storedUser) {

        return null;
    }


    try {

        const user =
            JSON.parse(
                storedUser
            );


        return (

            user.customerId ||

            user.userId ||

            user.id ||

            null
        );


    } catch (error) {

        return null;
    }
}


/* =========================================================
   CONTROLS
   ========================================================= */

function initializeNotificationControls() {

    const filter =
        document.getElementById(
            "notificationFilter"
        );


    const refresh =
        document.getElementById(
            "refreshNotificationsButton"
        );


    const markAll =
        document.getElementById(
            "markAllNotificationsReadButton"
        );


    if (filter) {

        filter.addEventListener(
            "change",
            applyNotificationFilter
        );
    }


    if (refresh) {

        refresh.addEventListener(
            "click",
            loadCustomerNotifications
        );
    }


    if (markAll) {

        markAll.addEventListener(
            "click",
            markAllNotificationsAsRead
        );
    }
}


/* =========================================================
   LOAD NOTIFICATIONS
   ========================================================= */

async function loadCustomerNotifications() {

    clearNotificationsMessage();

    showNotificationsLoading();


    const customerId =
        getNotificationCustomerId();


    if (!customerId) {

        hideNotificationsLoading();


        showNotificationsMessage(
            "Customer information is unavailable. Please login again.",
            "error"
        );


        return;
    }


    try {

        /*
         * BRD:
         *
         * GET /api/notifications/customer/{customerId}
         *
         * Customer must only receive their
         * own notifications.
         */

        const response =
            await apiGet(
                `/notifications/customer/${encodeURIComponent(
                    customerId
                )}`
            );


        customerNotifications =
            normalizeNotificationsResponse(
                response
            );


        sortNotificationsNewestFirst();


        renderNotificationSummary();


        hideNotificationsLoading();


        applyNotificationFilter();


    } catch (error) {

        console.error(
            "Notifications Error:",
            error
        );


        hideNotificationsLoading();


        showNotificationsMessage(
            error.message ||
            "Unable to load your notifications.",
            "error"
        );
    }
}


/* =========================================================
   NORMALIZE RESPONSE
   ========================================================= */

function normalizeNotificationsResponse(
    response
) {

    if (
        Array.isArray(response)
    ) {

        return response;
    }


    if (
        response &&
        Array.isArray(response.data)
    ) {

        return response.data;
    }


    if (
        response &&
        Array.isArray(response.items)
    ) {

        return response.items;
    }


    if (
        response &&
        Array.isArray(
            response.notifications
        )
    ) {

        return response.notifications;
    }


    return [];
}


/* =========================================================
   SORT NEWEST FIRST
   ========================================================= */

function sortNotificationsNewestFirst() {

    customerNotifications.sort(
        function (a, b) {

            const first =
                new Date(
                    getNotificationCreatedDate(a) ||
                    0
                );


            const second =
                new Date(
                    getNotificationCreatedDate(b) ||
                    0
                );


            return (
                second -
                first
            );
        }
    );
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderNotificationSummary() {

    const allCount =
        customerNotifications.length;


    const unreadCount =
        customerNotifications.filter(
            function (notification) {

                return !getNotificationReadStatus(
                    notification
                );
            }
        ).length;


    const readCount =
        allCount -
        unreadCount;


    setNotificationText(
        "allNotificationCount",
        allCount
    );


    setNotificationText(
        "unreadNotificationCount",
        unreadCount
    );


    setNotificationText(
        "readNotificationCount",
        readCount
    );


    const summary =
        document.getElementById(
            "notificationSummary"
        );


    if (summary) {

        summary.classList.remove(
            "hidden"
        );
    }


    updateMarkAllReadButton(
        unreadCount
    );


    updateNotificationsNavbarBadge(
        unreadCount
    );
}


/* =========================================================
   FILTER
   ========================================================= */

function applyNotificationFilter() {

    const filter =
        document
            .getElementById(
                "notificationFilter"
            )
            ?.value ||
        "all";


    let filtered =
        [...customerNotifications];


    if (filter === "unread") {

        filtered =
            filtered.filter(
                function (notification) {

                    return !getNotificationReadStatus(
                        notification
                    );
                }
            );
    }


    if (filter === "read") {

        filtered =
            filtered.filter(
                function (notification) {

                    return getNotificationReadStatus(
                        notification
                    );
                }
            );
    }


    renderNotifications(
        filtered,
        filter
    );
}


/* =========================================================
   RENDER LIST
   ========================================================= */

function renderNotifications(
    notifications,
    filter
) {

    const list =
        document.getElementById(
            "notificationsList"
        );


    const empty =
        document.getElementById(
            "notificationsEmpty"
        );


    if (
        !list ||
        !empty
    ) {

        return;
    }


    list.innerHTML =
        "";


    updateNotificationResultCount(
        notifications.length
    );


    if (
        notifications.length === 0
    ) {

        list.classList.add(
            "hidden"
        );


        empty.classList.remove(
            "hidden"
        );


        updateNotificationEmptyText(
            filter
        );


        return;
    }


    empty.classList.add(
        "hidden"
    );


    list.classList.remove(
        "hidden"
    );


    notifications.forEach(
        function (notification) {

            list.appendChild(
                createNotificationCard(
                    notification
                )
            );
        }
    );
}


/* =========================================================
   CREATE CARD
   ========================================================= */

function createNotificationCard(
    notification
) {

    const notificationId =
        getNotificationId(
            notification
        );


    const title =
        getNotificationTitle(
            notification
        );


    const message =
        getNotificationMessage(
            notification
        );


    const type =
        getNotificationType(
            notification
        );


    const createdAt =
        getNotificationCreatedDate(
            notification
        );


    const isRead =
        getNotificationReadStatus(
            notification
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        `notification-card ${
            isRead
                ? "read"
                : "unread"
        }`;


    card.innerHTML = `

        <div class="notification-card-icon">

            ${escapeNotificationHtml(
                getNotificationIcon(type)
            )}

        </div>


        <div class="notification-card-content">


            <div class="notification-card-top">

                ${
                    !isRead
                        ? `
                            <span
                                class="notification-unread-indicator"
                                title="Unread"
                            >
                            </span>
                          `
                        : ""
                }


                <h3>

                    ${escapeNotificationHtml(
                        title
                    )}

                </h3>


                <span class="notification-type-badge">

                    ${escapeNotificationHtml(
                        formatNotificationType(
                            type
                        )
                    )}

                </span>

            </div>


            <p class="notification-card-message">

                ${escapeNotificationHtml(
                    message
                )}

            </p>


            <span class="notification-card-date">

                ${escapeNotificationHtml(
                    formatNotificationDateTime(
                        createdAt
                    )
                )}

            </span>


        </div>


        <div class="notification-card-action">

            ${
                !isRead &&
                notificationId
                    ? `
                        <button
                            type="button"
                            class="btn btn-outline"
                            data-notification-read-id="${escapeNotificationHtml(
                                notificationId
                            )}"
                        >
                            Mark as Read
                        </button>
                      `
                    : `
                        <span class="notification-read-text">
                            ✓ Read
                        </span>
                      `
            }

        </div>
    `;


    initializeNotificationReadButton(
        card
    );


    return card;
}


/* =========================================================
   READ BUTTON
   ========================================================= */

function initializeNotificationReadButton(
    card
) {

    const button =
        card.querySelector(
            "[data-notification-read-id]"
        );


    if (!button) {

        return;
    }


    button.addEventListener(
        "click",
        async function () {

            const notificationId =
                this.dataset
                    .notificationReadId;


            await markNotificationAsRead(
                notificationId,
                this
            );
        }
    );
}


/* =========================================================
   MARK ONE AS READ
   ========================================================= */

async function markNotificationAsRead(
    notificationId,
    button
) {

    if (
        !notificationId ||
        notificationRequestInProgress
    ) {

        return;
    }


    clearNotificationsMessage();


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Updating...";
    }


    try {

        /*
         * BRD:
         *
         * PUT /api/notifications/{id}/read
         */

        await apiPut(
            `/notifications/${encodeURIComponent(
                notificationId
            )}/read`
        );


        updateLocalNotificationReadStatus(
            notificationId
        );


        renderNotificationSummary();

        applyNotificationFilter();


    } catch (error) {

        console.error(
            "Mark Notification Read Error:",
            error
        );


        showNotificationsMessage(
            error.message ||
            "Unable to mark this notification as read.",
            "error"
        );


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Mark as Read";
        }
    }
}


/* =========================================================
   UPDATE LOCAL READ STATUS
   ========================================================= */

function updateLocalNotificationReadStatus(
    notificationId
) {

    const notification =
        customerNotifications.find(
            function (item) {

                return String(
                    getNotificationId(
                        item
                    )
                ) ===
                String(
                    notificationId
                );
            }
        );


    if (!notification) {

        return;
    }


    /*
     * Set common property variants.
     */

    notification.isRead =
        true;


    if (
        Object.prototype.hasOwnProperty.call(
            notification,
            "IsRead"
        )
    ) {

        notification.IsRead =
            true;
    }
}


/* =========================================================
   MARK ALL AS READ
   ========================================================= */

async function markAllNotificationsAsRead() {

    if (notificationRequestInProgress) {

        return;
    }


    const unreadNotifications =
        customerNotifications.filter(
            function (notification) {

                return (
                    !getNotificationReadStatus(
                        notification
                    ) &&
                    getNotificationId(
                        notification
                    )
                );
            }
        );


    if (
        unreadNotifications.length === 0
    ) {

        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Mark All as Read",

            message:
                `Mark all ${unreadNotifications.length} unread notifications as read?`,

            confirmText:
                "Mark All Read",

            cancelText:
                "Cancel"
        });


    if (!confirmed) {

        return;
    }


    notificationRequestInProgress =
        true;


    setMarkAllNotificationsLoading(
        true
    );


    clearNotificationsMessage();


    try {

        /*
         * BRD does not define a separate
         * mark-all endpoint.
         *
         * Therefore we reuse the existing
         * PUT /notifications/{id}/read
         * endpoint for each unread item.
         */

        const results =
            await Promise.allSettled(

                unreadNotifications.map(
                    function (notification) {

                        const id =
                            getNotificationId(
                                notification
                            );


                        return apiPut(
                            `/notifications/${encodeURIComponent(
                                id
                            )}/read`
                        );
                    }
                )
            );


        let successCount =
            0;


        results.forEach(
            function (result, index) {

                if (
                    result.status ===
                    "fulfilled"
                ) {

                    successCount++;


                    updateLocalNotificationReadStatus(
                        getNotificationId(
                            unreadNotifications[index]
                        )
                    );
                }
            }
        );


        renderNotificationSummary();

        applyNotificationFilter();


        if (
            successCount ===
            unreadNotifications.length
        ) {

            showNotificationsMessage(
                "All notifications were marked as read.",
                "success"
            );


        } else {

            showNotificationsMessage(
                `${successCount} of ${unreadNotifications.length} notifications were marked as read. Refresh and try again for the remaining notifications.`,
                "error"
            );
        }


    } catch (error) {

        console.error(
            "Mark All Notifications Error:",
            error
        );


        showNotificationsMessage(
            "Unable to mark all notifications as read.",
            "error"
        );


    } finally {

        notificationRequestInProgress =
            false;


        setMarkAllNotificationsLoading(
            false
        );
    }
}


/* =========================================================
   MARK ALL BUTTON STATE
   ========================================================= */

function updateMarkAllReadButton(
    unreadCount
) {

    const button =
        document.getElementById(
            "markAllNotificationsReadButton"
        );


    if (!button) {

        return;
    }


    button.disabled =
        unreadCount <= 0;
}


/* =========================================================
   MARK ALL LOADING
   ========================================================= */

function setMarkAllNotificationsLoading(
    loading
) {

    const button =
        document.getElementById(
            "markAllNotificationsReadButton"
        );


    if (!button) {

        return;
    }


    button.disabled =
        loading;


    button.textContent =
        loading
            ? "Updating..."
            : "Mark All as Read";


    if (!loading) {

        const unreadCount =
            customerNotifications.filter(
                function (notification) {

                    return !getNotificationReadStatus(
                        notification
                    );
                }
            ).length;


        button.disabled =
            unreadCount <= 0;
    }
}


/* =========================================================
   NAVBAR BADGE
   ========================================================= */

function updateNotificationsNavbarBadge(
    unreadCount,
    attempt = 0
) {

    const badge =
        document.getElementById(
            "notificationBadge"
        );


    /*
     * Navbar component may still be
     * loading asynchronously.
     */

    if (
        !badge &&
        attempt < 5
    ) {

        setTimeout(
            function () {

                updateNotificationsNavbarBadge(
                    unreadCount,
                    attempt + 1
                );
            },
            200
        );


        return;
    }


    if (!badge) {

        return;
    }


    if (
        unreadCount <= 0
    ) {

        badge.textContent =
            "";


        badge.classList.add(
            "hidden"
        );


        return;
    }


    badge.textContent =
        unreadCount > 99
            ? "99+"
            : unreadCount;


    badge.classList.remove(
        "hidden"
    );
}


/* =========================================================
   NOTIFICATION ID
   ========================================================= */

function getNotificationId(
    notification
) {

    return (

        notification.notificationId ||

        notification.NotificationId ||

        notification.id ||

        notification.Id ||

        null
    );
}


/* =========================================================
   TITLE
   ========================================================= */

function getNotificationTitle(
    notification
) {

    return String(

        notification.title ||

        notification.Title ||

        notification.subject ||

        notification.Subject ||

        getNotificationDefaultTitle(
            getNotificationType(
                notification
            )
        )
    );
}


/* =========================================================
   MESSAGE
   ========================================================= */

function getNotificationMessage(
    notification
) {

    return String(

        notification.message ||

        notification.Message ||

        notification.content ||

        notification.Content ||

        notification.description ||

        notification.Description ||

        ""
    );
}


/* =========================================================
   TYPE
   ========================================================= */

function getNotificationType(
    notification
) {

    return String(

        notification.type ||

        notification.Type ||

        notification.notificationType ||

        notification.NotificationType ||

        "general"
    )
        .trim()
        .toLowerCase();
}


/* =========================================================
   READ STATUS
   ========================================================= */

function getNotificationReadStatus(
    notification
) {

    const value =

        notification.isRead ??

        notification.IsRead ??

        notification.read ??

        notification.Read ??

        false;


    if (
        typeof value ===
        "string"
    ) {

        return (
            value.toLowerCase() ===
            "true"
        );
    }


    return Boolean(value);
}


/* =========================================================
   CREATED DATE
   ========================================================= */

function getNotificationCreatedDate(
    notification
) {

    return (

        notification.createdAt ||

        notification.CreatedAt ||

        notification.createdDate ||

        notification.CreatedDate ||

        notification.notificationDate ||

        notification.NotificationDate ||

        notification.date ||

        null
    );
}


/* =========================================================
   DEFAULT TITLE
   ========================================================= */

function getNotificationDefaultTitle(
    type
) {

    if (
        type.includes("payment")
    ) {

        return "Payment Update";
    }


    if (
        type.includes("confirm")
    ) {

        return "Booking Confirmed";
    }


    if (
        type.includes("cancel")
    ) {

        return "Booking Cancelled";
    }


    if (
        type.includes("reminder")
    ) {

        return "Event Reminder";
    }


    if (
        type.includes("event")
    ) {

        return "Event Update";
    }


    if (
        type.includes("booking")
    ) {

        return "Booking Update";
    }


    return "Notification";
}


/* =========================================================
   ICON
   ========================================================= */

function getNotificationIcon(
    type
) {

    if (
        type.includes("payment")
    ) {

        return "$";
    }


    if (
        type.includes("confirm")
    ) {

        return "✓";
    }


    if (
        type.includes("cancel")
    ) {

        return "×";
    }


    if (
        type.includes("reminder")
    ) {

        return "◷";
    }


    if (
        type.includes("event")
    ) {

        return "★";
    }


    if (
        type.includes("booking")
    ) {

        return "🎟";
    }


    return "🔔";
}


/* =========================================================
   FORMAT TYPE
   ========================================================= */

function formatNotificationType(
    type
) {

    if (!type) {

        return "General";
    }


    return String(type)
        .replace(
            /[-_]/g,
            " "
        )
        .replace(
            /\b\w/g,
            function (character) {

                return character
                    .toUpperCase();
            }
        );
}


/* =========================================================
   DATE + TIME
   ========================================================= */

function formatNotificationDateTime(
    value
) {

    if (!value) {

        return "Date not available";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);
    }


    return date.toLocaleString(
        "en-LK",
        {
            year:
                "numeric",

            month:
                "short",

            day:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}


/* =========================================================
   RESULT COUNT
   ========================================================= */

function updateNotificationResultCount(
    count
) {

    const element =
        document.getElementById(
            "notificationResultCount"
        );


    if (!element) {

        return;
    }


    element.textContent =
        count === 1
            ? "1 notification"
            : `${count} notifications`;
}


/* =========================================================
   EMPTY TEXT
   ========================================================= */

function updateNotificationEmptyText(
    filter
) {

    const element =
        document.getElementById(
            "notificationsEmptyText"
        );


    if (!element) {

        return;
    }


    if (filter === "unread") {

        element.textContent =
            "You have no unread notifications.";

        return;
    }


    if (filter === "read") {

        element.textContent =
            "You have no read notifications yet.";

        return;
    }


    element.textContent =
        "You don't have any notifications yet.";
}


/* =========================================================
   TEXT
   ========================================================= */

function setNotificationText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value ?? "";
    }
}


/* =========================================================
   LOADING
   ========================================================= */

function showNotificationsLoading() {

    const loading =
        document.getElementById(
            "notificationsLoading"
        );


    const list =
        document.getElementById(
            "notificationsList"
        );


    const empty =
        document.getElementById(
            "notificationsEmpty"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );
    }


    if (list) {

        list.classList.add(
            "hidden"
        );
    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   HIDE LOADING
   ========================================================= */

function hideNotificationsLoading() {

    const loading =
        document.getElementById(
            "notificationsLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showNotificationsMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "notificationsMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        type === "success"
            ? "alert alert-success"
            : "alert alert-error";
}


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

function clearNotificationsMessage() {

    const element =
        document.getElementById(
            "notificationsMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        "";


    element.className =
        "alert hidden";
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeNotificationHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}
