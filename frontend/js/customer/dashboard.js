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

    /*
     * Customer authentication check
     */

    if (!validateCustomerAccess()) {
        return;
    }


    displayCustomerName();


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


    if (
        !role ||
        role.toLowerCase() !==
            "customer"
    ) {

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
        return;
    }


    try {

        const user =
            JSON.parse(storedUser);


        nameElement.textContent =
            user.name ||
            user.fullName ||
            "Customer";


    } catch (error) {

        console.error(
            "Unable to read customer data.",
            error
        );
    }
}


/* =========================================================
   LOAD DASHBOARD DATA
   ========================================================= */

async function loadDashboardData() {

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
         * BRD provides these endpoints:
         *
         * Bookings:
         * GET /api/bookings/customer/{customerId}
         *
         * Payments:
         * GET /api/payments/customer/{customerId}
         *
         * Notifications:
         * GET /api/notifications/customer/{customerId}
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
                    `/notifications/customer/${customerId}`
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


        showDashboardContent();


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );


        hideDashboardLoading();


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


    /*
     * Fallback:
     * try user object
     */

    const storedUser =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.USER
        );


    if (!storedUser) {
        return null;
    }


    try {

        const user =
            JSON.parse(storedUser);


        return (
            user.customerId ||
            user.id ||
            user.userId ||
            null
        );


    } catch (error) {

        return null;
    }
}


/* =========================================================
   NORMALIZE API ARRAY RESPONSE
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


    const unreadNotifications =
        notifications.filter(
            function (notification) {

                return !getNotificationReadStatus(
                    notification
                );
            }
        );


    /* Summary */

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


    /*
     * Navbar notification badge
     */

    updateNotificationBadge(
        unreadNotifications.length
    );


    /* Lists */

    renderUpcomingBookings(
        upcomingBookings.slice(0, 4)
    );


    renderParkingReservations(
        parkingBookings.slice(0, 4)
    );


    renderRecentPayments(
        recentPayments.slice(0, 4)
    );


    renderRecentNotifications(
        notifications.slice(0, 4)
    );
}


/* =========================================================
   UPCOMING BOOKINGS
   ========================================================= */

function getUpcomingBookings(
    bookings
) {

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


                const eventDate =
                    getBookingEventDate(
                        booking
                    );


                /*
                 * If API doesn't provide
                 * event date in booking DTO,
                 * keep active booking visible.
                 */

                if (!eventDate) {
                    return true;
                }


                const date =
                    new Date(eventDate);


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

                const first =
                    new Date(
                        getBookingEventDate(a) || 0
                    );


                const second =
                    new Date(
                        getBookingEventDate(b) || 0
                    );


                return first - second;
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
                    getPaymentDate(a) || 0
                );


            const second =
                new Date(
                    getPaymentDate(b) || 0
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
                                <a href="booking-details.html?id=${encodeURIComponent(bookingId)}">
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
   PARKING
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
   PAYMENTS
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
   NOTIFICATIONS
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

function getBookingId(booking) {

    return (
        booking.id ||
        booking.bookingId ||
        booking.BookingId ||
        null
    );
}


function getBookingNumber(booking) {

    return (
        booking.bookingNumber ||
        booking.BookingNumber ||
        `Booking #${getBookingId(booking) || "-"}`
    );
}


function getBookingStatus(booking) {

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


function getEventName(booking) {

    return (
        booking.eventName ||
        booking.EventName ||
        booking.event?.name ||
        booking.event?.eventName ||
        "Event"
    );
}


function getBookingEventDate(booking) {

    return (
        booking.eventDate ||
        booking.EventDate ||
        booking.date ||
        booking.event?.date ||
        booking.event?.eventDate ||
        null
    );
}


function getSeatText(booking) {

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


function getParkingSlot(booking) {

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


    return (
        booking.parkingSlotNumber ||
        booking.ParkingSlotNumber ||
        booking.slotNumber ||
        null
    );
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


function getPaymentAmount(payment) {

    return (
        payment.amount ||
        payment.Amount ||
        payment.totalAmount ||
        payment.TotalAmount ||
        0
    );
}


function getPaymentDate(payment) {

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


/* =========================================================
   BADGES
   ========================================================= */

function getBookingBadgeClass(status) {

    const normalized =
        String(status)
            .toLowerCase();


    if (
        normalized ===
        "confirmed"
    ) {

        return "badge badge-success";
    }


    if (
        normalized ===
        "cancelled"
    ) {

        return "badge badge-danger";
    }


    if (
        normalized ===
        "expired"
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

function formatDate(value) {

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


    return date.toLocaleDateString(
        "en-LK",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatCurrency(value) {

    const amount =
        Number(value);


    if (
        Number.isNaN(amount)
    ) {

        return "LKR 0.00";
    }


    return new Intl.NumberFormat(
        "en-LK",
        {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2
        }
    ).format(amount);
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


    if (element) {

        element.textContent =
            value;
    }
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}


/* =========================================================
   LOADING
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
   ERROR
   ========================================================= */

function showDashboardError(message) {

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