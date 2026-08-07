/* =========================================================
   Event & Parking Reservation System
   Admin Customer Details
   ========================================================= */


let adminCustomerDetailsId = null;

let adminCustomerDetailsData = null;

let adminCustomerDetailsActionInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminCustomerDetailsPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminCustomerDetailsPage() {

    if (!validateAdminCustomerDetailsAccess()) {
        return;
    }


    adminCustomerDetailsId =
        getAdminCustomerDetailsIdFromUrl();


    initializeAdminCustomerDetailsActions();


    await loadCustomerDetailsSidebar();


    if (!adminCustomerDetailsId) {

        hideAdminCustomerDetailsLoading();

        showAdminCustomerDetailsNotFound();

        return;
    }


    await loadAdminCustomerDetails();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateAdminCustomerDetailsAccess() {

    const token =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.TOKEN
        );


    const role =
        String(
            localStorage.getItem(
                APP_CONFIG.STORAGE_KEYS.ROLE
            ) ||
            ""
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
   CUSTOMER ID
   ========================================================= */

function getAdminCustomerDetailsIdFromUrl() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        "id"
    );
}


/* =========================================================
   SIDEBAR
   ========================================================= */

async function loadCustomerDetailsSidebar() {

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
                    "customers"
                ) {

                    link.classList.add(
                        "active"
                    );
                }
            }
        );


    initializeAdminCustomerDetailsLogout();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function initializeAdminCustomerDetailsLogout() {

    const button =
        document.getElementById(
            "adminSidebarLogoutButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
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


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

function initializeAdminCustomerDetailsActions() {

    const deactivateButtons = [

        document.getElementById(
            "adminCustomerDeactivateButton"
        ),

        document.getElementById(
            "detailAccountDeactivateButton"
        )

    ];


    const reactivateButtons = [

        document.getElementById(
            "adminCustomerReactivateButton"
        ),

        document.getElementById(
            "detailAccountReactivateButton"
        )

    ];


    deactivateButtons.forEach(
        function (button) {

            if (button) {

                button.addEventListener(
                    "click",
                    confirmCustomerDetailsDeactivation
                );
            }
        }
    );


    reactivateButtons.forEach(
        function (button) {

            if (button) {

                button.addEventListener(
                    "click",
                    confirmCustomerDetailsReactivation
                );
            }
        }
    );
}


/* =========================================================
   LOAD CUSTOMER
   ========================================================= */

async function loadAdminCustomerDetails() {

    clearAdminCustomerDetailsMessage();

    showAdminCustomerDetailsLoading();


    try {

        /*
         * BRD:
         *
         * GET /api/customers/{id}
         *
         * Single customer profile including
         * booking summary.
         */

        const response =
            await apiGet(
                `/customers/${encodeURIComponent(
                    adminCustomerDetailsId
                )}`
            );


        adminCustomerDetailsData =
            response?.data ||
            response?.customer ||
            response;


        if (!adminCustomerDetailsData) {

            hideAdminCustomerDetailsLoading();

            showAdminCustomerDetailsNotFound();

            return;
        }


        renderAdminCustomerDetails();


        hideAdminCustomerDetailsLoading();

        showAdminCustomerDetailsContent();


    } catch (error) {

        console.error(
            "Admin Customer Details Error:",
            error
        );


        hideAdminCustomerDetailsLoading();


        if (
            error.status === 404 ||
            error.status === 403
        ) {

            showAdminCustomerDetailsNotFound();

            return;
        }


        showAdminCustomerDetailsMessage(
            error.message ||
            "Unable to load customer details.",
            "error"
        );
    }
}


/* =========================================================
   RENDER CUSTOMER
   ========================================================= */

function renderAdminCustomerDetails() {

    const customer =
        adminCustomerDetailsData;


    const id =
        getDetailCustomerId(
            customer
        );


    const name =
        getDetailCustomerName(
            customer
        );


    const email =
        getDetailCustomerEmail(
            customer
        );


    const phone =
        getDetailCustomerPhone(
            customer
        );


    const isActive =
        getDetailCustomerIsActive(
            customer
        );


    const verified =
        getDetailCustomerVerified(
            customer
        );


    setAdminCustomerDetailsText(
        "adminCustomerDetailsName",
        name
    );


    setAdminCustomerDetailsText(
        "adminCustomerDetailsEmail",
        email
    );


    setAdminCustomerDetailsText(
        "adminCustomerDetailsAvatar",
        getDetailCustomerInitial(name)
    );


    setAdminCustomerDetailsText(
        "detailCustomerId",
        id
    );


    setAdminCustomerDetailsText(
        "detailCustomerName",
        name
    );


    setAdminCustomerDetailsText(
        "detailCustomerEmail",
        email
    );


    setAdminCustomerDetailsText(
        "detailCustomerPhone",
        phone || "-"
    );


    setAdminCustomerDetailsText(
        "detailCustomerAccountStatus",
        isActive
            ? "Active"
            : "Inactive"
    );


    setAdminCustomerDetailsText(
        "detailCustomerVerification",
        verified
            ? "Verified"
            : "Not Verified"
    );


    setAdminCustomerDetailsText(
        "detailCustomerCreatedDate",
        formatAdminCustomerDetailsDate(
            getDetailCustomerCreatedDate(
                customer
            )
        )
    );


    setAdminCustomerDetailsText(
        "detailActionCustomerName",
        name
    );


    setAdminCustomerDetailsText(
        "detailActionAccountStatus",
        isActive
            ? "Active"
            : "Inactive"
    );


    setAdminCustomerDetailsText(
        "detailActionVerification",
        verified
            ? "Verified"
            : "Not Verified"
    );


    updateAdminCustomerDetailsStatus(
        isActive
    );


    renderAdminCustomerBookingSummary();

    renderAdminCustomerEmbeddedBookings();

    updateAdminCustomerDetailsActions(
        isActive
    );
}


/* =========================================================
   BOOKING SUMMARY
   ========================================================= */

function renderAdminCustomerBookingSummary() {

    const customer =
        adminCustomerDetailsData;


    const bookings =
        getEmbeddedCustomerBookings(
            customer
        );


    const summary =
        customer.bookingSummary ||
        customer.BookingSummary ||
        {};


    /*
     * Prefer explicit backend summary
     * values when present.
     */

    let total =
        getNumberValue(

            summary.totalBookings ??

            summary.TotalBookings ??

            customer.totalBookings ??

            customer.TotalBookings
        );


    let pending =
        getNumberValue(

            summary.pendingBookings ??

            summary.PendingBookings ??

            customer.pendingBookings ??

            customer.PendingBookings
        );


    let confirmed =
        getNumberValue(

            summary.confirmedBookings ??

            summary.ConfirmedBookings ??

            customer.confirmedBookings ??

            customer.ConfirmedBookings
        );


    let cancelled =
        getNumberValue(

            summary.cancelledBookings ??

            summary.CancelledBookings ??

            customer.cancelledBookings ??

            customer.CancelledBookings
        );


    let expired =
        getNumberValue(

            summary.expiredBookings ??

            summary.ExpiredBookings ??

            customer.expiredBookings ??

            customer.ExpiredBookings
        );


    /*
     * If explicit summary is absent but
     * bookings are embedded, calculate the
     * displayed summary from those bookings.
     */

    if (
        total === null &&
        bookings.length > 0
    ) {

        total =
            bookings.length;
    }


    if (
        pending === null &&
        bookings.length > 0
    ) {

        pending =
            countBookingsByStatus(
                bookings,
                "pending"
            );
    }


    if (
        confirmed === null &&
        bookings.length > 0
    ) {

        confirmed =
            countBookingsByStatus(
                bookings,
                "confirmed"
            );
    }


    if (
        cancelled === null &&
        bookings.length > 0
    ) {

        cancelled =
            countBookingsByStatus(
                bookings,
                "cancelled"
            );
    }


    if (
        expired === null &&
        bookings.length > 0
    ) {

        expired =
            countBookingsByStatus(
                bookings,
                "expired"
            );
    }


    setAdminCustomerDetailsText(
        "customerDetailTotalBookings",
        total ?? 0
    );


    setAdminCustomerDetailsText(
        "customerDetailPendingBookings",
        pending ?? 0
    );


    setAdminCustomerDetailsText(
        "customerDetailConfirmedBookings",
        confirmed ?? 0
    );


    setAdminCustomerDetailsText(
        "customerDetailClosedBookings",
        (cancelled ?? 0) +
        (expired ?? 0)
    );
}


/* =========================================================
   EMBEDDED BOOKINGS
   ========================================================= */

function renderAdminCustomerEmbeddedBookings() {

    const container =
        document.getElementById(
            "adminCustomerBookingsContainer"
        );


    const unavailable =
        document.getElementById(
            "adminCustomerBookingsUnavailable"
        );


    if (!container) {

        return;
    }


    container.innerHTML =
        "";


    const bookings =
        getEmbeddedCustomerBookings(
            adminCustomerDetailsData
        );


    /*
     * BRD requires a booking summary, but
     * does not define the exact response
     * shape or require an embedded full list.
     */

    if (
        bookings.length === 0
    ) {

        if (unavailable) {

            unavailable.classList.remove(
                "hidden"
            );
        }


        return;
    }


    if (unavailable) {

        unavailable.classList.add(
            "hidden"
        );
    }


    const sorted =
        [...bookings]
            .sort(
                function (a, b) {

                    return (
                        new Date(
                            getDetailBookingDate(b) ||
                            0
                        ) -
                        new Date(
                            getDetailBookingDate(a) ||
                            0
                        )
                    );
                }
            );


    sorted
        .slice(0, 5)
        .forEach(
            function (booking) {

                container.appendChild(
                    createAdminCustomerBookingItem(
                        booking
                    )
                );
            }
        );
}


/* =========================================================
   CREATE BOOKING ITEM
   ========================================================= */

function createAdminCustomerBookingItem(
    booking
) {

    const bookingNumber =
        String(

            booking.bookingNumber ||

            booking.BookingNumber ||

            `Booking #${
                booking.bookingId ||
                booking.id ||
                "-"
            }`
        );


    const eventName =
        String(

            booking.eventName ||

            booking.EventName ||

            booking.event?.name ||

            booking.event?.eventName ||

            "Event"
        );


    const date =
        getDetailBookingDate(
            booking
        );


    const status =
        getDetailBookingStatus(
            booking
        );


    const item =
        document.createElement(
            "article"
        );


    item.className =
        "admin-customer-booking-item";


    item.innerHTML = `

        <div>

            <span class="admin-customer-booking-number">
                ${escapeAdminCustomerDetailsHtml(
                    bookingNumber
                )}
            </span>

            <h3>
                ${escapeAdminCustomerDetailsHtml(
                    eventName
                )}
            </h3>

            <div class="admin-customer-booking-meta">

                <span>
                    ${escapeAdminCustomerDetailsHtml(
                        formatAdminCustomerDetailsDate(
                            date
                        )
                    )}
                </span>

            </div>

        </div>


        <div class="admin-customer-booking-right">

            <span class="admin-customer-status ${
                getDetailBookingStatusClass(
                    status
                )
            }">

                ${escapeAdminCustomerDetailsHtml(
                    formatDetailBookingStatus(
                        status
                    )
                )}

            </span>

        </div>
    `;


    return item;
}


/* =========================================================
   GET EMBEDDED BOOKINGS
   ========================================================= */

function getEmbeddedCustomerBookings(
    customer
) {

    const bookings =

        customer?.bookings ||

        customer?.Bookings ||

        customer?.bookingSummary?.bookings ||

        customer?.BookingSummary?.Bookings ||

        [];


    return Array.isArray(bookings)
        ? bookings
        : [];
}


/* =========================================================
   COUNT STATUS
   ========================================================= */

function countBookingsByStatus(
    bookings,
    requiredStatus
) {

    return bookings.filter(
        function (booking) {

            return (
                getDetailBookingStatus(
                    booking
                ) ===
                requiredStatus
            );
        }
    ).length;
}


/* =========================================================
   BOOKING STATUS
   ========================================================= */

function getDetailBookingStatus(
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


function formatDetailBookingStatus(
    status
) {

    if (!status) {

        return "Pending";
    }


    return (
        status.charAt(0)
            .toUpperCase() +
        status.slice(1)
    );
}


function getDetailBookingStatusClass(
    status
) {

    if (
        status === "confirmed"
    ) {

        return "active";
    }


    if (
        status === "cancelled" ||
        status === "expired"
    ) {

        return "inactive";
    }


    /*
     * Existing status component only has
     * active/inactive styling.
     */

    return "active";
}


/* =========================================================
   BOOKING DATE
   ========================================================= */

function getDetailBookingDate(
    booking
) {

    return (

        booking.eventDate ||

        booking.EventDate ||

        booking.bookingDate ||

        booking.BookingDate ||

        booking.createdAt ||

        booking.CreatedAt ||

        booking.event?.date ||

        null
    );
}


/* =========================================================
   ACCOUNT STATUS UI
   ========================================================= */

function updateAdminCustomerDetailsStatus(
    isActive
) {

    const element =
        document.getElementById(
            "adminCustomerDetailsStatus"
        );


    if (!element) {

        return;
    }


    element.textContent =
        isActive
            ? "Active"
            : "Inactive";


    element.className =
        `admin-customer-status ${
            isActive
                ? "active"
                : "inactive"
        }`;
}


/* =========================================================
   ACTION BUTTON VISIBILITY
   ========================================================= */

function updateAdminCustomerDetailsActions(
    isActive
) {

    const deactivateIds = [

        "adminCustomerDeactivateButton",

        "detailAccountDeactivateButton"

    ];


    const reactivateIds = [

        "adminCustomerReactivateButton",

        "detailAccountReactivateButton"

    ];


    deactivateIds.forEach(
        function (id) {

            const button =
                document.getElementById(
                    id
                );


            if (!button) {
                return;
            }


            button.classList.toggle(
                "hidden",
                !isActive
            );
        }
    );


    reactivateIds.forEach(
        function (id) {

            const button =
                document.getElementById(
                    id
                );


            if (!button) {
                return;
            }


            button.classList.toggle(
                "hidden",
                isActive
            );
        }
    );
}


/* =========================================================
   DEACTIVATE CONFIRM
   ========================================================= */

async function confirmCustomerDetailsDeactivation() {

    if (
        adminCustomerDetailsActionInProgress
    ) {

        return;
    }


    const name =
        getDetailCustomerName(
            adminCustomerDetailsData
        );


    const confirmed =
        await openConfirmationModal({

            title:
                "Deactivate Customer",

            message:
                `Deactivate ${name}? The account will lose customer access until it is reactivated.`,

            confirmText:
                "Deactivate",

            cancelText:
                "Keep Active"
        });


    if (!confirmed) {

        return;
    }


    await deactivateCustomerFromDetails();
}


/* =========================================================
   DEACTIVATE
   ========================================================= */

async function deactivateCustomerFromDetails() {

    setAdminCustomerDetailsActionState(
        true,
        "deactivate"
    );


    clearAdminCustomerDetailsMessage();


    try {

        /*
         * BRD:
         * DELETE /api/customers/{id}
         *
         * Backend must reject if customer
         * has active future bookings.
         */

        await apiDelete(
            `/customers/${encodeURIComponent(
                adminCustomerDetailsId
            )}`
        );


        showAdminCustomerDetailsMessage(
            "Customer account was deactivated successfully.",
            "success"
        );


        await loadAdminCustomerDetails();


    } catch (error) {

        console.error(
            "Deactivate Customer Error:",
            error
        );


        let message =
            error.message ||
            "Unable to deactivate this customer.";


        if (
            error.status === 400 ||
            error.status === 409
        ) {

            message =
                getAdminCustomerDetailsValidationError(
                    error
                ) ||
                "This customer cannot be deactivated because active future bookings exist.";
        }


        showAdminCustomerDetailsMessage(
            message,
            "error"
        );


    } finally {

        setAdminCustomerDetailsActionState(
            false,
            "deactivate"
        );
    }
}


/* =========================================================
   REACTIVATE CONFIRM
   ========================================================= */

async function confirmCustomerDetailsReactivation() {

    if (
        adminCustomerDetailsActionInProgress
    ) {

        return;
    }


    const name =
        getDetailCustomerName(
            adminCustomerDetailsData
        );


    const confirmed =
        await openConfirmationModal({

            title:
                "Reactivate Customer",

            message:
                `Reactivate ${name}? Normal customer access will be restored.`,

            confirmText:
                "Reactivate",

            cancelText:
                "Cancel"
        });


    if (!confirmed) {

        return;
    }


    await reactivateCustomerFromDetails();
}


/* =========================================================
   REACTIVATE
   ========================================================= */

async function reactivateCustomerFromDetails() {

    setAdminCustomerDetailsActionState(
        true,
        "reactivate"
    );


    clearAdminCustomerDetailsMessage();


    try {

        /*
         * BRD:
         * POST /api/customers/{id}/reactivate
         */

        await apiPost(
            `/customers/${encodeURIComponent(
                adminCustomerDetailsId
            )}/reactivate`
        );


        showAdminCustomerDetailsMessage(
            "Customer account was reactivated successfully.",
            "success"
        );


        await loadAdminCustomerDetails();


    } catch (error) {

        console.error(
            "Reactivate Customer Error:",
            error
        );


        showAdminCustomerDetailsMessage(
            getAdminCustomerDetailsValidationError(
                error
            ) ||
            error.message ||
            "Unable to reactivate this customer.",
            "error"
        );


    } finally {

        setAdminCustomerDetailsActionState(
            false,
            "reactivate"
        );
    }
}


/* =========================================================
   ACTION STATE
   ========================================================= */

function setAdminCustomerDetailsActionState(
    loading,
    action
) {

    adminCustomerDetailsActionInProgress =
        loading;


    const ids =
        action === "deactivate"
            ? [
                "adminCustomerDeactivateButton",
                "detailAccountDeactivateButton"
              ]
            : [
                "adminCustomerReactivateButton",
                "detailAccountReactivateButton"
              ];


    ids.forEach(
        function (id) {

            const button =
                document.getElementById(
                    id
                );


            if (!button) {

                return;
            }


            button.disabled =
                loading;


            if (action === "deactivate") {

                button.textContent =
                    loading
                        ? "Deactivating..."
                        : "Deactivate Customer";

            } else {

                button.textContent =
                    loading
                        ? "Reactivating..."
                        : "Reactivate Customer";
            }
        }
    );
}


/* =========================================================
   VALIDATION ERROR
   ========================================================= */

function getAdminCustomerDetailsValidationError(
    error
) {

    if (
        !error?.data?.errors
    ) {

        return null;
    }


    const messages =
        [];


    Object.values(
        error.data.errors
    )
        .forEach(
            function (items) {

                if (
                    Array.isArray(items)
                ) {

                    messages.push(
                        ...items
                    );
                }
            }
        );


    return messages.length > 0
        ? messages.join(" ")
        : null;
}


/* =========================================================
   CUSTOMER HELPERS
   ========================================================= */

function getDetailCustomerId(
    customer
) {

    return (

        customer.customerId ||

        customer.CustomerId ||

        customer.id ||

        customer.Id ||

        adminCustomerDetailsId ||

        "-"
    );
}


function getDetailCustomerName(
    customer
) {

    return String(

        customer?.name ||

        customer?.Name ||

        customer?.fullName ||

        customer?.FullName ||

        "Customer"
    );
}


function getDetailCustomerEmail(
    customer
) {

    return String(

        customer?.email ||

        customer?.Email ||

        ""
    );
}


function getDetailCustomerPhone(
    customer
) {

    return String(

        customer?.phone ||

        customer?.Phone ||

        customer?.phoneNumber ||

        customer?.PhoneNumber ||

        ""
    );
}


/* =========================================================
   ACTIVE
   ========================================================= */

function getDetailCustomerIsActive(
    customer
) {

    if (
        customer?.isActive !==
        undefined
    ) {

        return Boolean(
            customer.isActive
        );
    }


    if (
        customer?.IsActive !==
        undefined
    ) {

        return Boolean(
            customer.IsActive
        );
    }


    const status =
        String(

            customer?.status ||

            customer?.Status ||

            "Active"
        )
            .trim()
            .toLowerCase();


    return !(
        status === "inactive" ||
        status === "deactivated" ||
        status === "disabled"
    );
}


/* =========================================================
   VERIFIED
   ========================================================= */

function getDetailCustomerVerified(
    customer
) {

    const value =

        customer?.emailVerified ??

        customer?.EmailVerified ??

        customer?.isEmailVerified ??

        customer?.IsEmailVerified ??

        false;


    if (
        typeof value === "string"
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

function getDetailCustomerCreatedDate(
    customer
) {

    return (

        customer?.createdAt ||

        customer?.CreatedAt ||

        customer?.registeredAt ||

        customer?.RegisteredAt ||

        customer?.createdDate ||

        null
    );
}


/* =========================================================
   INITIAL
   ========================================================= */

function getDetailCustomerInitial(
    name
) {

    const clean =
        String(name || "")
            .trim();


    return clean
        ? clean
            .charAt(0)
            .toUpperCase()
        : "C";
}


/* =========================================================
   NUMBER
   ========================================================= */

function getNumberValue(
    value
) {

    if (
        value === undefined ||
        value === null
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
   DATE FORMAT
   ========================================================= */

function formatAdminCustomerDetailsDate(
    value
) {

    if (!value) {

        return "Not available";
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
   TEXT
   ========================================================= */

function setAdminCustomerDetailsText(
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

function showAdminCustomerDetailsLoading() {

    const loading =
        document.getElementById(
            "adminCustomerDetailsLoading"
        );


    const content =
        document.getElementById(
            "adminCustomerDetailsContent"
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


function hideAdminCustomerDetailsLoading() {

    const loading =
        document.getElementById(
            "adminCustomerDetailsLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


function showAdminCustomerDetailsContent() {

    const content =
        document.getElementById(
            "adminCustomerDetailsContent"
        );


    const notFound =
        document.getElementById(
            "adminCustomerDetailsNotFound"
        );


    if (notFound) {

        notFound.classList.add(
            "hidden"
        );
    }


    if (content) {

        content.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   NOT FOUND
   ========================================================= */

function showAdminCustomerDetailsNotFound() {

    const content =
        document.getElementById(
            "adminCustomerDetailsContent"
        );


    const notFound =
        document.getElementById(
            "adminCustomerDetailsNotFound"
        );


    if (content) {

        content.classList.add(
            "hidden"
        );
    }


    if (notFound) {

        notFound.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showAdminCustomerDetailsMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminCustomerDetailsMessage"
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


function clearAdminCustomerDetailsMessage() {

    const element =
        document.getElementById(
            "adminCustomerDetailsMessage"
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
   HTML ESCAPE
   ========================================================= */

function escapeAdminCustomerDetailsHtml(
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