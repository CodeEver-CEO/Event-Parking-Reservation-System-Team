/* =========================================================
   Event & Parking Reservation System
   Admin Booking Management
   ========================================================= */


let adminBookingEvents = [];
let adminBookings = [];

let selectedAdminBookingEventId = null;
let selectedAdminBookingEvent = null;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        initializeAdminBookingsPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminBookingsPage() {

    if (!validateAdminBookingsAccess()) {
        return;
    }

    await loadBookingsAdminSidebar();

    initializeAdminBookingControls();

    await loadAdminBookingEvents();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateAdminBookingsAccess() {

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

async function loadBookingsAdminSidebar() {

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

                link.classList.remove("active");

                if (
                    link.dataset.adminPage ===
                    "bookings"
                ) {
                    link.classList.add("active");
                }
            }
        );


    const logoutButton =
        document.getElementById(
            "adminSidebarLogoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
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
   CONTROLS
   ========================================================= */

function initializeAdminBookingControls() {

    const eventSelect =
        document.getElementById(
            "adminBookingEventSelect"
        );


    const search =
        document.getElementById(
            "adminBookingSearch"
        );


    const status =
        document.getElementById(
            "adminBookingStatusFilter"
        );


    const clear =
        document.getElementById(
            "clearAdminBookingFilters"
        );


    if (eventSelect) {

        eventSelect.addEventListener(
            "change",
            async function () {

                await selectAdminBookingEvent(
                    this.value
                );
            }
        );
    }


    if (search) {

        search.addEventListener(
            "input",
            applyAdminBookingFilters
        );
    }


    if (status) {

        status.addEventListener(
            "change",
            applyAdminBookingFilters
        );
    }


    if (clear) {

        clear.addEventListener(
            "click",
            function () {

                if (search) {
                    search.value = "";
                }

                if (status) {
                    status.value = "";
                }

                applyAdminBookingFilters();
            }
        );
    }
}


/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadAdminBookingEvents() {

    clearAdminBookingsMessage();


    try {

        const response =
            await apiGet(
                "/events"
            );


        adminBookingEvents =
            normalizeAdminBookingArray(
                response,
                "events"
            );


        populateAdminBookingEventSelect();


        /*
         * Optional:
         * bookings.html?eventId=5
         */

        const parameters =
            new URLSearchParams(
                window.location.search
            );


        const eventId =
            parameters.get(
                "eventId"
            );


        if (eventId) {

            const select =
                document.getElementById(
                    "adminBookingEventSelect"
                );


            if (select) {
                select.value = eventId;
            }


            await selectAdminBookingEvent(
                eventId
            );
        }


    } catch (error) {

        showAdminBookingsMessage(
            error.message ||
            "Unable to load events.",
            "error"
        );
    }
}


/* =========================================================
   EVENT SELECT OPTIONS
   ========================================================= */

function populateAdminBookingEventSelect() {

    const select =
        document.getElementById(
            "adminBookingEventSelect"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">Select an event</option>`;


    adminBookingEvents.forEach(
        function (event) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                getAdminBookingEventId(
                    event
                );


            option.textContent =
                getAdminBookingEventName(
                    event
                );


            select.appendChild(
                option
            );
        }
    );
}


/* =========================================================
   SELECT EVENT
   ========================================================= */

async function selectAdminBookingEvent(
    eventId
) {

    clearAdminBookingsMessage();


    if (!eventId) {

        selectedAdminBookingEventId =
            null;

        selectedAdminBookingEvent =
            null;

        adminBookings =
            [];

        showAdminBookingsNoEvent();

        return;
    }


    selectedAdminBookingEventId =
        eventId;


    selectedAdminBookingEvent =
        adminBookingEvents.find(
            function (event) {

                return (
                    String(
                        getAdminBookingEventId(
                            event
                        )
                    ) ===
                    String(eventId)
                );
            }
        ) || null;


    setAdminBookingText(
        "adminBookingSelectedEventName",
        selectedAdminBookingEvent
            ? getAdminBookingEventName(
                selectedAdminBookingEvent
            )
            : "Event"
    );


    const url =
        new URL(
            window.location.href
        );


    url.searchParams.set(
        "eventId",
        eventId
    );


    window.history.replaceState(
        {},
        "",
        url
    );


    showAdminBookingsContent();


    await loadAdminBookingsForEvent();
}


/* =========================================================
   LOAD BOOKINGS
   ========================================================= */

async function loadAdminBookingsForEvent() {

    if (!selectedAdminBookingEventId) {
        return;
    }


    clearAdminBookingsMessage();

    showAdminBookingsLoading();


    try {

        /*
         * BRD Admin Endpoint:
         *
         * GET /api/bookings?eventId=
         */

        const query =
            new URLSearchParams();


        query.set(
            "eventId",
            selectedAdminBookingEventId
        );


        const response =
            await apiGet(
                `/bookings?${query.toString()}`
            );


        adminBookings =
            normalizeAdminBookingArray(
                response,
                "bookings"
            );


        sortAdminBookings();


        renderAdminBookingSummary();


        hideAdminBookingsLoading();


        applyAdminBookingFilters();


    } catch (error) {

        console.error(
            "Admin Booking Load Error:",
            error
        );


        adminBookings =
            [];


        hideAdminBookingsLoading();


        showAdminBookingsMessage(
            error.message ||
            "Unable to load bookings for this event.",
            "error"
        );
    }
}


/* =========================================================
   NORMALIZE
   ========================================================= */

function normalizeAdminBookingArray(
    response,
    collectionName
) {

    if (Array.isArray(response)) {
        return response;
    }


    if (
        Array.isArray(
            response?.data
        )
    ) {
        return response.data;
    }


    if (
        Array.isArray(
            response?.items
        )
    ) {
        return response.items;
    }


    if (
        Array.isArray(
            response?.[collectionName]
        )
    ) {
        return response[
            collectionName
        ];
    }


    return [];
}


/* =========================================================
   SORT
   ========================================================= */

function sortAdminBookings() {

    adminBookings.sort(
        function (a, b) {

            const first =
                new Date(
                    getAdminBookingCreatedDate(a) ||
                    0
                );


            const second =
                new Date(
                    getAdminBookingCreatedDate(b) ||
                    0
                );


            return second - first;
        }
    );
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderAdminBookingSummary() {

    const total =
        adminBookings.length;


    const pending =
        adminBookings.filter(
            function (booking) {

                return (
                    getAdminBookingStatus(
                        booking
                    ) === "pending"
                );
            }
        ).length;


    const confirmed =
        adminBookings.filter(
            function (booking) {

                return (
                    getAdminBookingStatus(
                        booking
                    ) === "confirmed"
                );
            }
        ).length;


    const closed =
        adminBookings.filter(
            function (booking) {

                const status =
                    getAdminBookingStatus(
                        booking
                    );


                return (
                    status === "cancelled" ||
                    status === "expired"
                );
            }
        ).length;


    setAdminBookingText(
        "adminTotalBookingCount",
        total
    );


    setAdminBookingText(
        "adminPendingBookingCount",
        pending
    );


    setAdminBookingText(
        "adminConfirmedBookingCount",
        confirmed
    );


    setAdminBookingText(
        "adminClosedBookingCount",
        closed
    );
}


/* =========================================================
   FILTER
   ========================================================= */

function applyAdminBookingFilters() {

    const search =
        document
            .getElementById(
                "adminBookingSearch"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const statusFilter =
        document
            .getElementById(
                "adminBookingStatusFilter"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const filtered =
        adminBookings.filter(
            function (booking) {

                const bookingNumber =
                    getAdminBookingNumber(
                        booking
                    ).toLowerCase();


                const customerName =
                    getAdminBookingCustomerName(
                        booking
                    ).toLowerCase();


                const customerEmail =
                    getAdminBookingCustomerEmail(
                        booking
                    ).toLowerCase();


                const status =
                    getAdminBookingStatus(
                        booking
                    );


                const searchMatch =
                    !search ||
                    bookingNumber.includes(search) ||
                    customerName.includes(search) ||
                    customerEmail.includes(search);


                const statusMatch =
                    !statusFilter ||
                    status === statusFilter;


                return (
                    searchMatch &&
                    statusMatch
                );
            }
        );


    renderAdminBookings(
        filtered
    );
}


/* =========================================================
   RENDER
   ========================================================= */

function renderAdminBookings(
    bookings
) {

    const table =
        document.getElementById(
            "adminBookingsTableContainer"
        );


    const body =
        document.getElementById(
            "adminBookingsTableBody"
        );


    const empty =
        document.getElementById(
            "adminBookingsEmpty"
        );


    if (
        !table ||
        !body ||
        !empty
    ) {
        return;
    }


    body.innerHTML =
        "";


    setAdminBookingText(
        "adminBookingResultCount",
        bookings.length === 1
            ? "1 booking"
            : `${bookings.length} bookings`
    );


    if (
        bookings.length === 0
    ) {

        table.classList.add(
            "hidden"
        );

        empty.classList.remove(
            "hidden"
        );

        return;
    }


    empty.classList.add(
        "hidden"
    );

    table.classList.remove(
        "hidden"
    );


    bookings.forEach(
        function (booking) {

            body.appendChild(
                createAdminBookingRow(
                    booking
                )
            );
        }
    );
}


/* =========================================================
   ROW
   ========================================================= */

function createAdminBookingRow(
    booking
) {

    const bookingId =
        getAdminBookingId(
            booking
        );


    const bookingNumber =
        getAdminBookingNumber(
            booking
        );


    const customerName =
        getAdminBookingCustomerName(
            booking
        );


    const customerEmail =
        getAdminBookingCustomerEmail(
            booking
        );


    const seatCount =
        getAdminBookingSeatCount(
            booking
        );


    const parking =
        getAdminBookingParkingSlot(
            booking
        );


    const total =
        getAdminBookingTotal(
            booking
        );


    const status =
        getAdminBookingStatus(
            booking
        );


    const row =
        document.createElement(
            "tr"
        );


    row.innerHTML = `

        <td>
            <strong class="admin-booking-number">
                ${escapeAdminBookingHtml(
                    bookingNumber
                )}
            </strong>

            <span class="admin-booking-id">
                ID:
                ${escapeAdminBookingHtml(
                    bookingId || "-"
                )}
            </span>
        </td>


        <td>
            <strong class="admin-booking-customer-name">
                ${escapeAdminBookingHtml(
                    customerName
                )}
            </strong>

            <span class="admin-booking-customer-email">
                ${escapeAdminBookingHtml(
                    customerEmail || "-"
                )}
            </span>
        </td>


        <td>
            ${escapeAdminBookingHtml(
                seatCount
            )}
        </td>


        <td>
            ${escapeAdminBookingHtml(
                parking || "No Parking"
            )}
        </td>


        <td>
            ${
                total === null
                    ? "-"
                    : escapeAdminBookingHtml(
                        formatAdminBookingCurrency(
                            total
                        )
                    )
            }
        </td>


        <td>
            <span class="admin-booking-status ${escapeAdminBookingHtml(status)}">

                ${escapeAdminBookingHtml(
                    formatAdminBookingStatus(
                        status
                    )
                )}

            </span>
        </td>


        <td>
            ${escapeAdminBookingHtml(
                formatAdminBookingDateTime(
                    getAdminBookingCreatedDate(
                        booking
                    )
                )
            )}
        </td>


        <td>
            <a
                href="booking-details.html?id=${encodeURIComponent(
                    bookingId
                )}"
                class="btn btn-outline"
            >
                View Details
            </a>
        </td>
    `;


    return row;
}


/* =========================================================
   BOOKING HELPERS
   ========================================================= */

function getAdminBookingId(
    booking
) {

    return (
        booking?.bookingId ||
        booking?.BookingId ||
        booking?.id ||
        booking?.Id ||
        null
    );
}


function getAdminBookingNumber(
    booking
) {

    return String(
        booking?.bookingNumber ||
        booking?.BookingNumber ||
        `Booking #${getAdminBookingId(booking) || "-"}`
    );
}


function getAdminBookingStatus(
    booking
) {

    return String(
        booking?.status ||
        booking?.Status ||
        "Pending"
    )
        .trim()
        .toLowerCase();
}


/* =========================================================
   CUSTOMER
   ========================================================= */

function getAdminBookingCustomerName(
    booking
) {

    return String(
        booking?.customerName ||
        booking?.CustomerName ||
        booking?.customer?.name ||
        booking?.customer?.fullName ||
        booking?.Customer?.Name ||
        `Customer #${getAdminBookingCustomerId(booking) || "-"}`
    );
}


function getAdminBookingCustomerEmail(
    booking
) {

    return String(
        booking?.customerEmail ||
        booking?.CustomerEmail ||
        booking?.customer?.email ||
        booking?.Customer?.Email ||
        ""
    );
}


function getAdminBookingCustomerId(
    booking
) {

    return (
        booking?.customerId ||
        booking?.CustomerId ||
        booking?.customer?.customerId ||
        booking?.customer?.id ||
        null
    );
}


/* =========================================================
   SEAT COUNT
   ========================================================= */

function getAdminBookingSeatCount(
    booking
) {

    const seats =
        booking?.seats ||
        booking?.Seats ||
        booking?.bookingSeats ||
        booking?.BookingSeats;


    if (Array.isArray(seats)) {
        return seats.length;
    }


    const count =
        Number(
            booking?.seatCount ??
            booking?.SeatCount ??
            booking?.numberOfSeats ??
            0
        );


    return Number.isNaN(count)
        ? 0
        : count;
}


/* =========================================================
   PARKING
   ========================================================= */

function getAdminBookingParkingSlot(
    booking
) {

    return String(
        booking?.parkingSlotNumber ||
        booking?.ParkingSlotNumber ||
        booking?.parking?.slotNumber ||
        booking?.parkingSlot?.slotNumber ||
        booking?.parkingReservation?.slotNumber ||
        booking?.parkingReservation?.parkingSlot?.slotNumber ||
        ""
    );
}


/* =========================================================
   TOTAL
   ========================================================= */

function getAdminBookingTotal(
    booking
) {

    const value =
        booking?.totalAmount ??
        booking?.TotalAmount ??
        booking?.grandTotal ??
        booking?.GrandTotal ??
        booking?.amountDue ??
        booking?.AmountDue ??
        null;


    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }


    const number =
        Number(value);


    return Number.isNaN(number)
        ? null
        : number;
}


/* =========================================================
   CREATED
   ========================================================= */

function getAdminBookingCreatedDate(
    booking
) {

    return (
        booking?.createdAt ||
        booking?.CreatedAt ||
        booking?.bookingDate ||
        booking?.BookingDate ||
        booking?.createdDate ||
        null
    );
}


/* =========================================================
   EVENT HELPERS
   ========================================================= */

function getAdminBookingEventId(
    event
) {

    return (
        event?.eventId ||
        event?.EventId ||
        event?.id ||
        event?.Id ||
        null
    );
}


function getAdminBookingEventName(
    event
) {

    return String(
        event?.name ||
        event?.Name ||
        event?.eventName ||
        event?.EventName ||
        "Event"
    );
}


/* =========================================================
   FORMAT STATUS
   ========================================================= */

function formatAdminBookingStatus(
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


/* =========================================================
   CURRENCY
   ========================================================= */

function formatAdminBookingCurrency(
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


/* =========================================================
   DATE
   ========================================================= */

function formatAdminBookingDateTime(
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
   UI STATES
   ========================================================= */

function showAdminBookingsContent() {

    document
        .getElementById(
            "adminBookingsNoEvent"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminBookingsContent"
        )
        ?.classList.remove(
            "hidden"
        );
}


function showAdminBookingsNoEvent() {

    document
        .getElementById(
            "adminBookingsContent"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminBookingsNoEvent"
        )
        ?.classList.remove(
            "hidden"
        );


    setAdminBookingText(
        "adminBookingSelectedEventName",
        "-"
    );
}


function showAdminBookingsLoading() {

    document
        .getElementById(
            "adminBookingsLoading"
        )
        ?.classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "adminBookingsTableContainer"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminBookingsEmpty"
        )
        ?.classList.add(
            "hidden"
        );
}


function hideAdminBookingsLoading() {

    document
        .getElementById(
            "adminBookingsLoading"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   TEXT
   ========================================================= */

function setAdminBookingText(
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


/* =========================================================
   MESSAGE
   ========================================================= */

function showAdminBookingsMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminBookingsMessage"
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


function clearAdminBookingsMessage() {

    const element =
        document.getElementById(
            "adminBookingsMessage"
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

function escapeAdminBookingHtml(
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
