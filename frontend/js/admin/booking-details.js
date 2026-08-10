/* =========================================================
   Event & Parking Reservation System
   Admin Booking Details
   ========================================================= */


let adminBookingDetailsId = null;

let adminBookingDetailsData = null;

let adminBookingCustomerData = null;

let adminBookingPaymentData = null;

let adminBookingHoldTimer = null;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        initializeAdminBookingDetailsPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminBookingDetailsPage() {

    if (!validateAdminBookingDetailsAccess()) {
        return;
    }


    adminBookingDetailsId =
        new URLSearchParams(
            window.location.search
        ).get("id");


    await loadAdminBookingDetailsSidebar();


    if (!adminBookingDetailsId) {

        hideAdminBookingDetailsLoading();

        showAdminBookingDetailsNotFound();

        return;
    }


    await loadAdminBookingDetails();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateAdminBookingDetailsAccess() {

    const token =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.TOKEN
        );


    const role =
        String(
            localStorage.getItem(
                APP_CONFIG.STORAGE_KEYS.ROLE
            ) || ""
        )
            .trim()
            .toLowerCase();


    if (!token) {

        window.location.href =
            "../auth/login.html";

        return false;
    }


    if (
        role !== "admin" &&
        role !== "administrator"
    ) {

        window.location.href =
            "../auth/login.html";

        return false;
    }


    return true;
}


/* =========================================================
   SIDEBAR
   ========================================================= */

async function loadAdminBookingDetailsSidebar() {

    await loadComponent(
        "adminSidebarContainer",
        "components/admin-sidebar.html"
    );


    document
        .querySelectorAll(
            "[data-admin-page]"
        )
        .forEach(
            function (link) {

                link.classList.remove(
                    "active"
                );


                if (
                    link.dataset.adminPage ===
                    "bookings"
                ) {

                    link.classList.add(
                        "active"
                    );
                }
            }
        );


    const logout =
        document.getElementById(
            "adminSidebarLogoutButton"
        );


    if (logout) {

        logout.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    APP_CONFIG.STORAGE_KEYS.TOKEN
                );

                localStorage.removeItem(
                    APP_CONFIG.STORAGE_KEYS.USER
                );

                localStorage.removeItem(
                    APP_CONFIG.STORAGE_KEYS.ROLE
                );

                localStorage.removeItem(
                    APP_CONFIG.STORAGE_KEYS.CUSTOMER_ID
                );


                sessionStorage.clear();


                window.location.href =
                    "../auth/login.html";
            }
        );
    }
}


/* =========================================================
   LOAD BOOKING
   ========================================================= */

async function loadAdminBookingDetails() {

    clearAdminBookingDetailsMessage();

    showAdminBookingDetailsLoading();


    try {

        /*
         * BRD:
         * GET /api/bookings/{id}
         */

        const response =
            await apiGet(
                `/bookings/${encodeURIComponent(
                    adminBookingDetailsId
                )}`
            );


        adminBookingDetailsData =
            response?.data ||
            response?.booking ||
            response;


        if (!adminBookingDetailsData) {

            hideAdminBookingDetailsLoading();

            showAdminBookingDetailsNotFound();

            return;
        }


        /*
         * Customer information can be
         * enriched using Module 1 endpoint.
         */

        await loadAdminBookingCustomer();


        /*
         * Payment amount/status endpoint
         * is explicitly defined in Module 7.
         */

        await loadAdminBookingPayment();


        renderAdminBookingDetails();


        /*
         * Pending booking only.
         */

        if (
            getAdminDetailBookingStatus() ===
            "pending"
        ) {

            await loadAdminBookingHoldStatus();
        }


        hideAdminBookingDetailsLoading();

        showAdminBookingDetailsContent();


    } catch (error) {

        console.error(
            "Admin Booking Details Error:",
            error
        );


        hideAdminBookingDetailsLoading();


        if (
            error.status === 404 ||
            error.status === 403
        ) {

            showAdminBookingDetailsNotFound();

            return;
        }


        showAdminBookingDetailsMessage(
            error.message ||
            "Unable to load booking details.",
            "error"
        );
    }
}


/* =========================================================
   CUSTOMER
   ========================================================= */

async function loadAdminBookingCustomer() {

    const customerId =
        getAdminDetailCustomerId();


    if (!customerId) {

        adminBookingCustomerData =
            getNestedAdminBookingCustomer();

        return;
    }


    try {

        /*
         * Module 1:
         * GET /api/customers/{id}
         */

        const response =
            await apiGet(
                `/customers/${encodeURIComponent(
                    customerId
                )}`
            );


        adminBookingCustomerData =
            response?.data ||
            response?.customer ||
            response;


    } catch (error) {

        /*
         * Booking can still be displayed
         * even if customer enrichment fails.
         */

        console.warn(
            "Customer details unavailable:",
            error
        );


        adminBookingCustomerData =
            getNestedAdminBookingCustomer();
    }
}


/* =========================================================
   PAYMENT
   ========================================================= */

async function loadAdminBookingPayment() {

    try {

        /*
         * Module 7:
         *
         * GET /api/bookings/{id}/payment
         */

        const response =
            await apiGet(
                `/bookings/${encodeURIComponent(
                    adminBookingDetailsId
                )}/payment`
            );


        adminBookingPaymentData =
            response?.data ||
            response?.payment ||
            response;


    } catch (error) {

        /*
         * 404 can simply mean no payment
         * exists for a Pending booking.
         */

        if (error.status !== 404) {

            console.warn(
                "Payment details unavailable:",
                error
            );
        }


        adminBookingPaymentData =
            null;
    }
}


/* =========================================================
   RENDER
   ========================================================= */

function renderAdminBookingDetails() {

    const booking =
        adminBookingDetailsData;


    const bookingNumber =
        getAdminDetailBookingNumber();


    const status =
        getAdminDetailBookingStatus();


    const eventId =
        getAdminDetailEventId();


    setAdminBookingDetailText(
        "detailBookingNumber",
        bookingNumber
    );


    setAdminBookingDetailText(
        "detailSideBookingNumber",
        bookingNumber
    );


    setAdminBookingDetailText(
        "detailSideBookingStatus",
        formatAdminDetailStatus(
            status
        )
    );


    updateAdminBookingDetailStatusBadge(
        status
    );


    /*
     * Back to event-filtered bookings.
     */

    if (eventId) {

        const backUrl =
            `bookings.html?eventId=${encodeURIComponent(
                eventId
            )}`;


        setAdminBookingDetailsHref(
            "adminBookingBackLink",
            backUrl
        );


        setAdminBookingDetailsHref(
            "detailBackToBookingsButton",
            backUrl
        );
    }


    renderAdminBookingCustomer();

    renderAdminBookingEvent();

    renderAdminBookingSeats();

    renderAdminBookingParking();

    renderAdminBookingPayment();


    setAdminBookingDetailText(
        "detailBookingCreated",
        formatAdminBookingDetailDateTime(
            booking?.createdAt ||
            booking?.CreatedAt ||
            booking?.bookingDate ||
            booking?.BookingDate
        )
    );
}


/* =========================================================
   CUSTOMER RENDER
   ========================================================= */

function renderAdminBookingCustomer() {

    const customer =
        adminBookingCustomerData ||
        getNestedAdminBookingCustomer() ||
        {};


    const customerId =
        getAdminDetailCustomerId();


    const name =
        String(
            customer?.name ||
            customer?.Name ||
            customer?.fullName ||
            customer?.FullName ||
            adminBookingDetailsData?.customerName ||
            adminBookingDetailsData?.CustomerName ||
            "Customer"
        );


    const email =
        String(
            customer?.email ||
            customer?.Email ||
            adminBookingDetailsData?.customerEmail ||
            adminBookingDetailsData?.CustomerEmail ||
            "-"
        );


    const phone =
        String(
            customer?.phone ||
            customer?.Phone ||
            customer?.phoneNumber ||
            customer?.PhoneNumber ||
            "-"
        );


    setAdminBookingDetailText(
        "detailCustomerId",
        customerId || "-"
    );


    setAdminBookingDetailText(
        "detailCustomerName",
        name
    );


    setAdminBookingDetailText(
        "detailCustomerEmail",
        email
    );


    setAdminBookingDetailText(
        "detailCustomerPhone",
        phone
    );


    const profileLink =
        document.getElementById(
            "detailCustomerProfileLink"
        );


    if (
        profileLink &&
        customerId
    ) {

        profileLink.href =
            `customer-details.html?id=${encodeURIComponent(
                customerId
            )}`;


        profileLink.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   EVENT RENDER
   ========================================================= */

function renderAdminBookingEvent() {

    const booking =
        adminBookingDetailsData;


    const event =
        booking?.event ||
        booking?.Event ||
        {};


    setAdminBookingDetailText(
        "detailEventName",
        booking?.eventName ||
        booking?.EventName ||
        event?.name ||
        event?.Name ||
        "Event"
    );


    setAdminBookingDetailText(
        "detailEventDate",
        formatAdminBookingDetailDate(
            booking?.eventDate ||
            booking?.EventDate ||
            event?.eventDate ||
            event?.date
        )
    );


    const startTime =
        booking?.startTime ||
        booking?.StartTime ||
        event?.startTime ||
        event?.StartTime ||
        "";


    const endTime =
        booking?.endTime ||
        booking?.EndTime ||
        event?.endTime ||
        event?.EndTime ||
        "";


    setAdminBookingDetailText(
        "detailEventTime",
        startTime && endTime
            ? `${startTime} - ${endTime}`
            : startTime || "-"
    );


    setAdminBookingDetailText(
        "detailEventVenue",
        booking?.venueName ||
        booking?.VenueName ||
        event?.venueName ||
        event?.venue?.name ||
        "-"
    );
}


/* =========================================================
   SEATS
   ========================================================= */

function renderAdminBookingSeats() {

    const container =
        document.getElementById(
            "detailSeatsList"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const seats =
        getAdminDetailSeats();


    setAdminBookingDetailText(
        "detailSeatCount",
        seats.length
    );


    if (
        seats.length === 0
    ) {

        container.innerHTML =
            `<p class="admin-booking-no-data">
                Seat information was not returned.
             </p>`;

        return;
    }


    seats.forEach(
        function (item) {

            const seat =
                item?.seat ||
                item?.Seat ||
                item;


            const number =
                seat?.seatNumber ||
                seat?.SeatNumber ||
                item?.seatNumber ||
                item?.SeatNumber ||
                "-";


            const unitPrice =
                Number(
                    item?.unitPriceAtBooking ??
                    item?.UnitPriceAtBooking ??
                    seat?.price ??
                    seat?.Price ??
                    0
                );


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "admin-booking-seat-item";


            element.innerHTML = `

                <strong>
                    ${escapeAdminBookingDetailHtml(
                        number
                    )}
                </strong>

                <span>
                    ${escapeAdminBookingDetailHtml(
                        formatAdminBookingDetailCurrency(
                            unitPrice
                        )
                    )}
                </span>
            `;


            container.appendChild(
                element
            );
        }
    );
}


/* =========================================================
   PARKING
   ========================================================= */

function renderAdminBookingParking() {

    const parking =
        getAdminDetailParking();


    const content =
        document.getElementById(
            "detailParkingContent"
        );


    const noParking =
        document.getElementById(
            "detailNoParking"
        );


    if (!parking) {

        if (content) {
            content.classList.add(
                "hidden"
            );
        }

        if (noParking) {
            noParking.classList.remove(
                "hidden"
            );
        }


        setAdminBookingDetailText(
            "detailParkingSummary",
            "None"
        );


        return;
    }


    if (content) {
        content.classList.remove(
            "hidden"
        );
    }


    if (noParking) {
        noParking.classList.add(
            "hidden"
        );
    }


    const slot =
        parking?.slotNumber ||
        parking?.SlotNumber ||
        parking?.parkingSlot?.slotNumber ||
        "-";


    const zone =
        parking?.zone ||
        parking?.Zone ||
        parking?.parkingSlot?.zone ||
        "-";


    const fee =
        Number(
            parking?.feeAtReservation ??
            parking?.FeeAtReservation ??
            parking?.parkingFee ??
            parking?.ParkingFee ??
            parking?.fee ??
            0
        );


    setAdminBookingDetailText(
        "detailParkingSlot",
        slot
    );


    setAdminBookingDetailText(
        "detailParkingZone",
        zone
    );


    setAdminBookingDetailText(
        "detailParkingFee",
        formatAdminBookingDetailCurrency(
            fee
        )
    );


    setAdminBookingDetailText(
        "detailParkingSummary",
        slot
    );
}


/* =========================================================
   PAYMENT RENDER
   ========================================================= */

function renderAdminBookingPayment() {

    const payment =
        adminBookingPaymentData ||
        {};


    const status =
        String(
            payment?.paymentStatus ||
            payment?.PaymentStatus ||
            payment?.status ||
            payment?.Status ||
            (
                getAdminDetailBookingStatus() ===
                "confirmed"
                    ? "Completed"
                    : "Not Paid"
            )
        );


    const amount =
        getAdminDetailPaymentAmount();


    const reference =
        payment?.paymentReference ||
        payment?.PaymentReference ||
        payment?.reference ||
        payment?.Reference ||
        "-";


    const paidAt =
        payment?.paymentDate ||
        payment?.PaymentDate ||
        payment?.paidAt ||
        payment?.PaidAt ||
        payment?.createdAt ||
        null;


    setAdminBookingDetailText(
        "detailPaymentStatus",
        status
    );


    setAdminBookingDetailText(
        "detailPaymentSummary",
        status
    );


    setAdminBookingDetailText(
        "detailPaymentAmount",
        amount === null
            ? "-"
            : formatAdminBookingDetailCurrency(
                amount
            )
    );


    setAdminBookingDetailText(
        "detailBookingTotal",
        amount === null
            ? "-"
            : formatAdminBookingDetailCurrency(
                amount
            )
    );


    setAdminBookingDetailText(
        "detailPaymentReference",
        reference
    );


    setAdminBookingDetailText(
        "detailPaymentDate",
        paidAt
            ? formatAdminBookingDetailDateTime(
                paidAt
            )
            : "-"
    );
}


/* =========================================================
   HOLD STATUS
   ========================================================= */

async function loadAdminBookingHoldStatus() {

    try {

        const response =
            await apiGet(
                `/bookings/${encodeURIComponent(
                    adminBookingDetailsId
                )}/hold-status`
            );


        const data =
            response?.data ||
            response;


        const card =
            document.getElementById(
                "adminBookingHoldCard"
            );


        if (card) {
            card.classList.remove(
                "hidden"
            );
        }


        const remaining =
            Number(
                data?.remainingSeconds ??
                data?.RemainingSeconds ??
                data?.secondsRemaining ??
                NaN
            );


        const expiresAt =
            data?.holdExpiresAt ||
            data?.HoldExpiresAt ||
            adminBookingDetailsData?.holdExpiresAt ||
            adminBookingDetailsData?.HoldExpiresAt ||
            null;


        if (
            !Number.isNaN(remaining)
        ) {

            startAdminBookingHoldCountdown(
                remaining
            );


            return;
        }


        if (expiresAt) {

            const seconds =
                Math.max(
                    0,
                    Math.floor(
                        (
                            new Date(expiresAt) -
                            new Date()
                        ) / 1000
                    )
                );


            startAdminBookingHoldCountdown(
                seconds
            );


            return;
        }


        setAdminBookingDetailText(
            "adminBookingHoldCountdown",
            "-"
        );


    } catch (error) {

        console.warn(
            "Hold status unavailable:",
            error
        );
    }
}


/* =========================================================
   HOLD COUNTDOWN
   ========================================================= */

function startAdminBookingHoldCountdown(
    initialSeconds
) {

    clearInterval(
        adminBookingHoldTimer
    );


    let remaining =
        Math.max(
            0,
            Number(initialSeconds) || 0
        );


    function render() {

        const minutes =
            Math.floor(
                remaining / 60
            );


        const seconds =
            remaining % 60;


        setAdminBookingDetailText(
            "adminBookingHoldCountdown",
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );


        setAdminBookingDetailText(
            "adminBookingHoldText",
            remaining > 0
                ? "Seats and optional parking are temporarily held while payment is pending."
                : "The hold period has reached zero. Refresh to confirm the latest server booking status."
        );
    }


    render();


    adminBookingHoldTimer =
        setInterval(
            function () {

                if (
                    remaining <= 0
                ) {

                    clearInterval(
                        adminBookingHoldTimer
                    );

                    return;
                }


                remaining--;

                render();
            },
            1000
        );
}


/* =========================================================
   DATA HELPERS
   ========================================================= */

function getAdminDetailBookingNumber() {

    return String(
        adminBookingDetailsData?.bookingNumber ||
        adminBookingDetailsData?.BookingNumber ||
        `Booking #${adminBookingDetailsId}`
    );
}


function getAdminDetailBookingStatus() {

    return String(
        adminBookingDetailsData?.status ||
        adminBookingDetailsData?.Status ||
        "Pending"
    )
        .trim()
        .toLowerCase();
}


function getAdminDetailCustomerId() {

    return (
        adminBookingDetailsData?.customerId ||
        adminBookingDetailsData?.CustomerId ||
        adminBookingDetailsData?.customer?.customerId ||
        adminBookingDetailsData?.customer?.id ||
        null
    );
}


function getNestedAdminBookingCustomer() {

    return (
        adminBookingDetailsData?.customer ||
        adminBookingDetailsData?.Customer ||
        null
    );
}


function getAdminDetailEventId() {

    return (
        adminBookingDetailsData?.eventId ||
        adminBookingDetailsData?.EventId ||
        adminBookingDetailsData?.event?.eventId ||
        adminBookingDetailsData?.event?.id ||
        null
    );
}


function getAdminDetailSeats() {

    const seats =
        adminBookingDetailsData?.bookingSeats ||
        adminBookingDetailsData?.BookingSeats ||
        adminBookingDetailsData?.seats ||
        adminBookingDetailsData?.Seats ||
        [];


    return Array.isArray(seats)
        ? seats
        : [];
}


/* =========================================================
   PARKING HELPER
   ========================================================= */

function getAdminDetailParking() {

    return (
        adminBookingDetailsData?.parkingReservation ||
        adminBookingDetailsData?.ParkingReservation ||
        adminBookingDetailsData?.parking ||
        adminBookingDetailsData?.Parking ||
        adminBookingDetailsData?.parkingSlot ||
        null
    );
}


/* =========================================================
   PAYMENT AMOUNT
   ========================================================= */

function getAdminDetailPaymentAmount() {

    const payment =
        adminBookingPaymentData ||
        {};


    const value =
        payment?.amountDue ??
        payment?.AmountDue ??
        payment?.amount ??
        payment?.Amount ??
        payment?.totalAmount ??
        adminBookingDetailsData?.totalAmount ??
        adminBookingDetailsData?.TotalAmount ??
        null;


    if (
        value === null ||
        value === undefined
    ) {

        /*
         * Final fallback:
         * calculate from booked seat snapshots
         * + parking fee snapshot.
         */

        const seats =
            getAdminDetailSeats();


        let total =
            0;


        let foundAmount =
            false;


        seats.forEach(
            function (item) {

                const value =
                    item?.unitPriceAtBooking ??
                    item?.UnitPriceAtBooking ??
                    item?.price ??
                    item?.seat?.price;


                if (
                    value !== undefined &&
                    value !== null
                ) {

                    total +=
                        Number(value) || 0;

                    foundAmount =
                        true;
                }
            }
        );


        const parking =
            getAdminDetailParking();


        if (parking) {

            const parkingFee =
                parking?.feeAtReservation ??
                parking?.FeeAtReservation ??
                parking?.parkingFee ??
                parking?.fee;


            if (
                parkingFee !== undefined &&
                parkingFee !== null
            ) {

                total +=
                    Number(parkingFee) || 0;

                foundAmount =
                    true;
            }
        }


        return foundAmount
            ? total
            : null;
    }


    const number =
        Number(value);


    return Number.isNaN(number)
        ? null
        : number;
}


/* =========================================================
   STATUS BADGE
   ========================================================= */

function updateAdminBookingDetailStatusBadge(
    status
) {

    const element =
        document.getElementById(
            "detailBookingStatus"
        );


    if (!element) {
        return;
    }


    element.textContent =
        formatAdminDetailStatus(
            status
        );


    element.className =
        `admin-booking-status ${status}`;
}


/* =========================================================
   FORMAT
   ========================================================= */

function formatAdminDetailStatus(
    status
) {

    if (!status) {
        return "Pending";
    }


    return (
        status.charAt(0).toUpperCase() +
        status.slice(1)
    );
}


function formatAdminBookingDetailCurrency(
    value
) {

    return new Intl.NumberFormat(
        "en-LK",
        {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    );
}


function formatAdminBookingDetailDate(
    value
) {

    if (!value) {
        return "-";
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


function formatAdminBookingDetailDateTime(
    value
) {

    if (!value) {
        return "-";
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
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   TEXT / HREF
   ========================================================= */

function setAdminBookingDetailText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent =
            value ?? "";
    }
}


function setAdminBookingDetailsHref(
    id,
    href
) {

    const element =
        document.getElementById(id);


    if (element) {
        element.href = href;
    }
}


/* =========================================================
   UI STATES
   ========================================================= */

function showAdminBookingDetailsLoading() {

    document
        .getElementById(
            "adminBookingDetailsLoading"
        )
        ?.classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "adminBookingDetailsContent"
        )
        ?.classList.add(
            "hidden"
        );
}


function hideAdminBookingDetailsLoading() {

    document
        .getElementById(
            "adminBookingDetailsLoading"
        )
        ?.classList.add(
            "hidden"
        );
}


function showAdminBookingDetailsContent() {

    document
        .getElementById(
            "adminBookingDetailsNotFound"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminBookingDetailsContent"
        )
        ?.classList.remove(
            "hidden"
        );
}


function showAdminBookingDetailsNotFound() {

    document
        .getElementById(
            "adminBookingDetailsContent"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminBookingDetailsNotFound"
        )
        ?.classList.remove(
            "hidden"
        );
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showAdminBookingDetailsMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminBookingDetailsMessage"
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


function clearAdminBookingDetailsMessage() {

    const element =
        document.getElementById(
            "adminBookingDetailsMessage"
        );


    if (!element) {
        return;
    }


    element.textContent = "";

    element.className =
        "alert hidden";
}


/* =========================================================
   ESCAPE
   ========================================================= */

function escapeAdminBookingDetailHtml(
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
   CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    function () {

        clearInterval(
            adminBookingHoldTimer
        );
    }
);