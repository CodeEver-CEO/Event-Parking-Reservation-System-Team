/* =========================================================
   Event & Parking Reservation System
   Customer Dashboard
   ========================================================= */


   document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeCustomerDashboard();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeCustomerDashboard() {

    if (!validateCustomerAccess()) {
        return;
    }


    displayCustomerName();

    clearDashboardError();


    await loadDashboardData();
}


/* =========================================================
   AUTHORIZATION CHECK
   ========================================================= */

function validateCustomerAccess() {

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


    const normalizedRole =
        String(role || "")
            .trim()
            .toLowerCase();


    if (normalizedRole !== "customer") {

        window.location.href =
            "../auth/login.html";

        return false;
    }


    return true;
}


/* =========================================================
   CUSTOMER NAME
   ========================================================= */

function displayCustomerName() {

    const nameElement =
        document.getElementById(
            "dashboardCustomerName"
        );


    if (!nameElement) {
        return;
    }


    const storedUser =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.USER
        );


    if (!storedUser) {

        nameElement.textContent =
            "Customer";

        return;
    }


    try {

        const user =
            JSON.parse(
                storedUser
            );


        nameElement.textContent =
            user.name ||
            user.fullName ||
            "Customer";


    } catch (error) {

        console.error(
            "Unable to read customer data.",
            error
        );


        nameElement.textContent =
            "Customer";
    }
}


/* =========================================================
   LOAD DASHBOARD DATA
   ========================================================= */

async function loadDashboardData() {

    clearDashboardError();

    showDashboardLoading();


    const customerId =
        getCustomerId();


    if (!customerId) {

        hideDashboardLoading();


        showDashboardError(
            "Customer information could not be found. Please login again."
        );


        return;
    }


    try {

        /*
         * Actual Backend Endpoints:
         *
         * GET /api/bookings/customer/{customerId}
         *
         * GET /api/payments/customer/{customerId}
         *
         * GET /api/notifications
         *
         * Notifications uses the logged-in
         * Customer ID from the JWT token.
         */

        const results =
            await Promise.all([

                apiGet(
                    `/bookings/customer/${customerId}`
                ),

                apiGet(
                    `/payments/customer/${customerId}`
                ),

                apiGet(
                    "/notifications"
                )

            ]);


        const bookings =
            normalizeArray(
                results[0]
            );


        const payments =
            normalizeArray(
                results[1]
            );


        const notifications =
            normalizeArray(
                results[2]
            );


        renderDashboard(
            bookings,
            payments,
            notifications
        );


        hideDashboardLoading();

        clearDashboardError();

        showDashboardContent();


    } catch (error) {

        console.error(
            "Customer Dashboard Error:",
            error
        );


        hideDashboardLoading();


        if (error.status === 401) {

            showDashboardError(
                "Your session has expired. Please login again."
            );

            return;
        }


        if (error.status === 403) {

            showDashboardError(
                "You do not have permission to access this dashboard."
            );

            return;
        }


        if (error.status === 404) {

            showDashboardError(
                "One of the dashboard API endpoints could not be found."
            );

            return;
        }


        showDashboardError(
            error.message ||
            "Unable to load your dashboard."
        );
    }
}


/* =========================================================
   CUSTOMER ID
   ========================================================= */

function getCustomerId() {

    const storedCustomerId =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.CUSTOMER_ID
        );


    if (storedCustomerId) {

        return storedCustomerId;
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
            user.id ||
            user.userId ||
            null
        );


    } catch (error) {

        console.error(
            "Unable to read customer ID.",
            error
        );


        return null;
    }
}


/* =========================================================
   NORMALIZE API ARRAY
   ========================================================= */

function normalizeArray(response) {

    if (Array.isArray(response)) {

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
        Array.isArray(response.results)
    ) {

        return response.results;
    }


    return [];
}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function renderDashboard(
    bookings,
    payments,
    notifications
) {

    const upcomingBookings =
        getUpcomingBookings(
            bookings
        );


    const parkingBookings =
        getBookingsWithParking(
            upcomingBookings
        );


    const recentPayments =
        getRecentPayments(
            payments
        );


    const sortedNotifications =
        getRecentNotifications(
            notifications
        );


    const unreadNotifications =
        sortedNotifications.filter(
            function (notification) {

                return !getNotificationReadStatus(
                    notification
                );
            }
        );


    /* Summary Cards */

    setText(
        "upcomingBookingsCount",
        upcomingBookings.length
    );


    setText(
        "reservedParkingCount",
        parkingBookings.length
    );


    setText(
        "recentPaymentsCount",
        recentPayments.length
    );


    setText(
        "unreadNotificationsCount",
        unreadNotifications.length
    );


    updateNotificationBadge(
        unreadNotifications.length
    );


    /* Lists */

    renderUpcomingBookings(
        upcomingBookings.slice(
            0,
            4
        )
    );


    renderParkingReservations(
        parkingBookings.slice(
            0,
            4
        )
    );


    renderRecentPayments(
        recentPayments.slice(
            0,
            4
        )
    );


    renderRecentNotifications(
        sortedNotifications.slice(
            0,
            4
        )
    );
}


/* =========================================================
   UPCOMING BOOKINGS
   ========================================================= */

function getUpcomingBookings(bookings) {

    const now =
        new Date();


    return bookings
        .filter(
            function (booking) {

                const status =
                    getBookingStatus(
                        booking
                    );


                if (
                    status === "cancelled" ||
                    status === "expired"
                ) {

                    return false;
                }


                /*
                 * Current backend BookingResponseDto
                 * does not always contain event date.
                 *
                 * If event date is unavailable,
                 * keep active booking visible.
                 */

                const eventDate =
                    getBookingEventDate(
                        booking
                    );


                if (!eventDate) {

                    return true;
                }


                const date =
                    new Date(
                        eventDate
                    );


                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {

                    return true;
                }


                return date >= now;
            }
        )
        .sort(
            function (a, b) {

                const firstDate =
                    getBookingEventDate(
                        a
                    );


                const secondDate =
                    getBookingEventDate(
                        b
                    );


                if (
                    !firstDate &&
                    !secondDate
                ) {

                    return 0;
                }


                if (!firstDate) {

                    return 1;
                }


                if (!secondDate) {

                    return -1;
                }


                return (
                    new Date(firstDate) -
                    new Date(secondDate)
                );
            }
        );
}


/* =========================================================
   BOOKINGS WITH PARKING
   ========================================================= */

function getBookingsWithParking(
    bookings
) {

    return bookings.filter(
        function (booking) {

            return Boolean(
                getParkingSlot(
                    booking
                )
            );
        }
    );
}


/* =========================================================
   RECENT PAYMENTS
   ========================================================= */

function getRecentPayments(
    payments
) {

    return [...payments].sort(
        function (a, b) {

            const first =
                new Date(
                    getPaymentDate(a) ||
                    0
                );


            const second =
                new Date(
                    getPaymentDate(b) ||
                    0
                );


            return second - first;
        }
    );
}


/* =========================================================
   RECENT NOTIFICATIONS
   ========================================================= */

function getRecentNotifications(
    notifications
) {

    return [...notifications].sort(
        function (a, b) {

            const first =
                new Date(
                    getNotificationDate(a) ||
                    0
                );


            const second =
                new Date(
                    getNotificationDate(b) ||
                    0
                );


            return second - first;
        }
    );
}


/* =========================================================
   RENDER UPCOMING BOOKINGS
   ========================================================= */

function renderUpcomingBookings(
    bookings
) {

    const container =
        document.getElementById(
            "upcomingBookingsContainer"
        );


    const emptyState =
        document.getElementById(
            "noUpcomingBookings"
        );


    if (
        !container ||
        !emptyState
    ) {

        return;
    }


    container.innerHTML =
        "";


    if (bookings.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );


        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    bookings.forEach(
        function (booking) {

            const bookingId =
                getBookingId(
                    booking
                );


            const bookingNumber =
                getBookingNumber(
                    booking
                );


            const eventName =
                getEventName(
                    booking
                );


            const eventDate =
                formatDate(
                    getBookingEventDate(
                        booking
                    )
                );


            const status =
                getBookingStatusDisplay(
                    booking
                );


            const seatText =
                getSeatText(
                    booking
                );


            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "dashboard-booking-item";


            item.innerHTML = `

                <div>

                    <div class="dashboard-booking-number">
                        ${escapeHtml(bookingNumber)}
                    </div>

                    <h3 class="dashboard-booking-title">
                        ${escapeHtml(eventName)}
                    </h3>

                    <div class="dashboard-booking-meta">

                        <span>
                            ${escapeHtml(eventDate)}
                        </span>

                        <span>
                            Seats:
                            ${escapeHtml(seatText)}
                        </span>

                    </div>

                </div>


                <div class="dashboard-booking-action">

                    <span class="${getBookingBadgeClass(status)}">

                        ${escapeHtml(status)}

                    </span>

                    <br>

                    ${
                        bookingId
                            ? `
                                <a
                                    href="booking-details.html?id=${encodeURIComponent(bookingId)}"
                                >
                                    View Details
                                </a>
                              `
                            : ""
                    }

                </div>
            `;


            container.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   RENDER PARKING RESERVATIONS
   ========================================================= */

function renderParkingReservations(
    bookings
) {

    const container =
        document.getElementById(
            "parkingReservationsContainer"
        );


    const emptyState =
        document.getElementById(
            "noParkingReservations"
        );


    if (
        !container ||
        !emptyState
    ) {

        return;
    }


    container.innerHTML =
        "";


    if (bookings.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );


        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    bookings.forEach(
        function (booking) {

            const eventName =
                getEventName(
                    booking
                );


            const parkingSlot =
                getParkingSlot(
                    booking
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dashboard-simple-item";


            item.innerHTML = `

                <div>

                    <h4>
                        ${escapeHtml(eventName)}
                    </h4>

                    <p>
                        Reserved parking
                    </p>

                </div>


                <span class="dashboard-simple-value">

                    ${escapeHtml(parkingSlot)}

                </span>
            `;


            container.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   RENDER RECENT PAYMENTS
   ========================================================= */

function renderRecentPayments(
    payments
) {

    const container =
        document.getElementById(
            "recentPaymentsContainer"
        );


    const emptyState =
        document.getElementById(
            "noRecentPayments"
        );


    if (
        !container ||
        !emptyState
    ) {

        return;
    }


    container.innerHTML =
        "";


    if (payments.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );


        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    payments.forEach(
        function (payment) {

            const bookingNumber =
                getPaymentBookingNumber(
                    payment
                );


            const amount =
                formatCurrency(
                    getPaymentAmount(
                        payment
                    )
                );


            const paymentDate =
                formatDate(
                    getPaymentDate(
                        payment
                    )
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dashboard-simple-item";


            item.innerHTML = `

                <div>

                    <h4>
                        ${escapeHtml(bookingNumber)}
                    </h4>

                    <p>
                        ${escapeHtml(paymentDate)}
                    </p>

                </div>


                <span class="dashboard-simple-value">

                    ${escapeHtml(amount)}

                </span>
            `;


            container.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   RENDER RECENT NOTIFICATIONS
   ========================================================= */

function renderRecentNotifications(
    notifications
) {

    const container =
        document.getElementById(
            "recentNotificationsContainer"
        );


    const emptyState =
        document.getElementById(
            "noNotifications"
        );


    if (
        !container ||
        !emptyState
    ) {

        return;
    }


    container.innerHTML =
        "";


    if (notifications.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );


        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    notifications.forEach(
        function (notification) {

            const title =
                getNotificationTitle(
                    notification
                );


            const message =
                getNotificationMessage(
                    notification
                );


            const isRead =
                getNotificationReadStatus(
                    notification
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dashboard-simple-item";


            item.innerHTML = `

                <div class="dashboard-notification-content">

                    <span
                        class="dashboard-notification-dot
                        ${isRead ? "read" : ""}"
                    >
                    </span>


                    <div>

                        <h4>
                            ${escapeHtml(title)}
                        </h4>

                        <p>
                            ${escapeHtml(message)}
                        </p>

                    </div>

                </div>
            `;


            container.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   BOOKING HELPERS
   ========================================================= */

function getBookingId(
    booking
) {

    return (
        booking.bookingId ||
        booking.BookingId ||
        booking.id ||
        null
    );
}


function getBookingNumber(
    booking
) {

    return (
        booking.bookingNumber ||
        booking.BookingNumber ||
        `Booking #${getBookingId(booking) || "-"}`
    );
}


function getBookingStatus(
    booking
) {

    return String(
        booking.status ||
        booking.Status ||
        "pending"
    )
        .trim()
        .toLowerCase();
}


function getBookingStatusDisplay(
    booking
) {

    const status =
        getBookingStatus(
            booking
        );


    if (!status) {

        return "Pending";
    }


    return (
        status.charAt(0).toUpperCase() +
        status.slice(1)
    );
}


function getEventName(
    booking
) {

    return (
        booking.eventName ||
        booking.EventName ||
        booking.event?.name ||
        booking.event?.eventName ||
        "Event"
    );
}


function getBookingEventDate(
    booking
) {

    return (
        booking.eventDate ||
        booking.EventDate ||
        booking.eventStartDateTime ||
        booking.EventStartDateTime ||
        booking.startDateTime ||
        booking.StartDateTime ||
        booking.event?.startDateTime ||
        booking.event?.date ||
        null
    );
}


function getSeatText(
    booking
) {

    const seats =
        booking.seats ||
        booking.Seats ||
        booking.bookingSeats ||
        [];


    if (!Array.isArray(seats)) {

        return (
            booking.seatNumbers ||
            booking.SeatNumbers ||
            "-"
        );
    }


    if (seats.length === 0) {

        return "-";
    }


    return seats
        .map(
            function (seat) {

                if (
                    typeof seat ===
                    "string"
                ) {

                    return seat;
                }


                return (
                    seat.seatNumber ||
                    seat.SeatNumber ||
                    seat.number ||
                    "-"
                );
            }
        )
        .join(", ");
}


/* =========================================================
   PARKING HELPER
   ========================================================= */

function getParkingSlot(
    booking
) {

    const parking =
        booking.parkingReservation ||
        booking.ParkingReservation ||
        booking.parking ||
        booking.Parking ||
        null;


    if (parking) {

        return (
            parking.slotNumber ||
            parking.SlotNumber ||
            parking.parkingSlotNumber ||
            parking.ParkingSlotNumber ||
            parking.slot?.slotNumber ||
            null
        );
    }


    const slotNumber =
        booking.parkingSlotNumber ||
        booking.ParkingSlotNumber ||
        booking.slotNumber ||
        booking.SlotNumber ||
        null;


    if (slotNumber) {

        return slotNumber;
    }


    /*
     * Current backend BookingResponseDto
     * contains ParkingSlotId.
     */

    const parkingSlotId =
        booking.parkingSlotId ??
        booking.ParkingSlotId ??
        null;


    if (parkingSlotId) {

        return `Slot #${parkingSlotId}`;
    }


    return null;
}


/* =========================================================
   PAYMENT HELPERS
   ========================================================= */

function getPaymentBookingNumber(
    payment
) {

    return (
        payment.bookingNumber ||
        payment.BookingNumber ||
        payment.booking?.bookingNumber ||
        "Payment"
    );
}


function getPaymentAmount(
    payment
) {

    return (
        payment.totalAmount ??
        payment.TotalAmount ??
        payment.amount ??
        payment.Amount ??
        0
    );
}


function getPaymentDate(
    payment
) {

    return (
        payment.paymentDate ||
        payment.PaymentDate ||
        payment.createdAt ||
        payment.CreatedAt ||
        null
    );
}


/* =========================================================
   NOTIFICATION HELPERS
   ========================================================= */

function getNotificationTitle(
    notification
) {

    return (
        notification.title ||
        notification.Title ||
        notification.type ||
        notification.Type ||
        "Notification"
    );
}


function getNotificationMessage(
    notification
) {

    return (
        notification.message ||
        notification.Message ||
        notification.content ||
        notification.Content ||
        ""
    );
}


function getNotificationReadStatus(
    notification
) {

    return Boolean(
        notification.isRead ??
        notification.IsRead ??
        notification.read ??
        false
    );
}


function getNotificationDate(
    notification
) {

    return (
        notification.createdAt ||
        notification.CreatedAt ||
        notification.readAtUtc ||
        notification.ReadAtUtc ||
        null
    );
}


/* =========================================================
   BOOKING BADGE
   ========================================================= */

function getBookingBadgeClass(
    status
) {

    const normalized =
        String(status)
            .trim()
            .toLowerCase();


    if (normalized === "confirmed") {

        return "badge badge-success";
    }


    if (
        normalized === "cancelled" ||
        normalized === "expired"
    ) {

        return "badge badge-danger";
    }


    return "badge badge-warning";
}


/* =========================================================
   NOTIFICATION BADGE
   ========================================================= */

function updateNotificationBadge(
    count
) {

    const badge =
        document.getElementById(
            "notificationBadge"
        );


    if (!badge) {

        return;
    }


    if (count <= 0) {

        badge.textContent =
            "";

        badge.classList.add(
            "hidden"
        );


        return;
    }


    badge.textContent =
        count > 99
            ? "99+"
            : count;


    badge.classList.remove(
        "hidden"
    );
}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "Date not available";
    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );
    }


    return date.toLocaleDateString(
        "en-LK",
        {
            year:
                "numeric",

            month:
                "short",

            day:
                "numeric"
        }
    );
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatCurrency(
    value
) {

    const amount =
        Number(
            value
        );


    if (
        Number.isNaN(
            amount
        )
    ) {

        return "LKR 0.00";
    }


    return new Intl.NumberFormat(
        "en-LK",
        {
            style:
                "currency",

            currency:
                "LKR",

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    ).format(
        amount
    );
}


/* =========================================================
   SET TEXT
   ========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;
    }


    element.textContent =
        value ?? "";
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(
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


/* =========================================================
   SHOW LOADING
   ========================================================= */

function showDashboardLoading() {

    const loading =
        document.getElementById(
            "dashboardLoading"
        );


    const content =
        document.getElementById(
            "dashboardContent"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );
    }


    if (content) {

        content.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   HIDE LOADING
   ========================================================= */

function hideDashboardLoading() {

    const loading =
        document.getElementById(
            "dashboardLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   SHOW DASHBOARD CONTENT
   ========================================================= */

function showDashboardContent() {

    const content =
        document.getElementById(
            "dashboardContent"
        );


    if (content) {

        content.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   DASHBOARD ERROR
   ========================================================= */

function showDashboardError(
    message
) {

    const messageElement =
        document.getElementById(
            "dashboardMessage"
        );


    if (!messageElement) {

        return;
    }


    messageElement.textContent =
        message;


    messageElement.className =
        "alert alert-error";
}


/* =========================================================
   CLEAR DASHBOARD ERROR
   ========================================================= */

function clearDashboardError() {

    const messageElement =
        document.getElementById(
            "dashboardMessage"
        );


    if (!messageElement) {

        return;
    }


    messageElement.textContent =
        "";


    messageElement.className =
        "alert hidden";
}