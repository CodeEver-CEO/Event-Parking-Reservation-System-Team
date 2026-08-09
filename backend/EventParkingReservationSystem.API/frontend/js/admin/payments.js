/* =========================================================
   Event & Parking Reservation System
   Admin Payment Management
   ========================================================= */


let adminPaymentEvents = [];

let adminPaymentBookings = [];

let adminPaymentRecords = [];

let selectedAdminPaymentEventId = null;

let selectedAdminPaymentEvent = null;

let adminReceiptDownloadInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminPaymentsPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminPaymentsPage() {

    if (!validateAdminPaymentsAccess()) {
        return;
    }


    await loadPaymentsAdminSidebar();


    initializeAdminPaymentControls();


    await loadAdminPaymentEvents();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateAdminPaymentsAccess() {

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

async function loadPaymentsAdminSidebar() {

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
                    "payments"
                ) {

                    link.classList.add(
                        "active"
                    );
                }
            }
        );


    initializeAdminPaymentLogout();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function initializeAdminPaymentLogout() {

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
   CONTROLS
   ========================================================= */

function initializeAdminPaymentControls() {

    const eventSelect =
        document.getElementById(
            "adminPaymentEventSelect"
        );


    const search =
        document.getElementById(
            "adminPaymentSearch"
        );


    const statusFilter =
        document.getElementById(
            "adminPaymentStatusFilter"
        );


    const clearButton =
        document.getElementById(
            "clearAdminPaymentFilters"
        );


    if (eventSelect) {

        eventSelect.addEventListener(
            "change",
            async function () {

                await selectAdminPaymentEvent(
                    this.value
                );
            }
        );
    }


    if (search) {

        search.addEventListener(
            "input",
            applyAdminPaymentFilters
        );
    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyAdminPaymentFilters
        );
    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                if (search) {

                    search.value =
                        "";
                }


                if (statusFilter) {

                    statusFilter.value =
                        "";
                }


                applyAdminPaymentFilters();
            }
        );
    }
}


/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadAdminPaymentEvents() {

    clearAdminPaymentsMessage();


    try {

        const response =
            await apiGet(
                "/events"
            );


        adminPaymentEvents =
            normalizeAdminPaymentArray(
                response,
                "events"
            );


        populateAdminPaymentEventSelect();


        /*
         * Support:
         *
         * payments.html?eventId=5
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
                    "adminPaymentEventSelect"
                );


            if (select) {

                select.value =
                    eventId;
            }


            await selectAdminPaymentEvent(
                eventId
            );
        }


    } catch (error) {

        showAdminPaymentsMessage(
            error.message ||
            "Unable to load events.",
            "error"
        );
    }
}


/* =========================================================
   EVENT SELECT
   ========================================================= */

function populateAdminPaymentEventSelect() {

    const select =
        document.getElementById(
            "adminPaymentEventSelect"
        );


    if (!select) {

        return;
    }


    select.innerHTML =
        `<option value="">Select an event</option>`;


    adminPaymentEvents.forEach(
        function (event) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                getAdminPaymentEventId(
                    event
                );


            option.textContent =
                getAdminPaymentEventName(
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

async function selectAdminPaymentEvent(
    eventId
) {

    clearAdminPaymentsMessage();


    if (!eventId) {

        selectedAdminPaymentEventId =
            null;


        selectedAdminPaymentEvent =
            null;


        adminPaymentBookings =
            [];


        adminPaymentRecords =
            [];


        showAdminPaymentsNoEvent();


        return;
    }


    selectedAdminPaymentEventId =
        eventId;


    selectedAdminPaymentEvent =
        adminPaymentEvents.find(
            function (event) {

                return (
                    String(
                        getAdminPaymentEventId(
                            event
                        )
                    ) ===
                    String(eventId)
                );
            }
        ) || null;


    setAdminPaymentText(
        "adminPaymentSelectedEventName",
        selectedAdminPaymentEvent
            ? getAdminPaymentEventName(
                selectedAdminPaymentEvent
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


    showAdminPaymentsContent();


    await loadAdminPaymentsForSelectedEvent();
}


/* =========================================================
   LOAD EVENT BOOKINGS
   ========================================================= */

async function loadAdminPaymentsForSelectedEvent() {

    if (
        !selectedAdminPaymentEventId
    ) {

        return;
    }


    clearAdminPaymentsMessage();

    showAdminPaymentsLoading(
        "Loading event bookings..."
    );


    try {

        /*
         * BRD admin booking endpoint:
         *
         * GET /api/bookings?eventId=
         */

        const query =
            new URLSearchParams();


        query.set(
            "eventId",
            selectedAdminPaymentEventId
        );


        const bookingResponse =
            await apiGet(
                `/bookings?${query.toString()}`
            );


        adminPaymentBookings =
            normalizeAdminPaymentArray(
                bookingResponse,
                "bookings"
            );


        await loadPaymentInformationForBookings();


        sortAdminPaymentRecords();


        renderAdminPaymentSummary();


        hideAdminPaymentsLoading();


        applyAdminPaymentFilters();


    } catch (error) {

        console.error(
            "Admin Payment Load Error:",
            error
        );


        adminPaymentBookings =
            [];


        adminPaymentRecords =
            [];


        hideAdminPaymentsLoading();


        showAdminPaymentsMessage(
            error.message ||
            "Unable to load payment information.",
            "error"
        );
    }
}


/* =========================================================
   LOAD PAYMENT FOR EACH BOOKING
   ========================================================= */

async function loadPaymentInformationForBookings() {

    adminPaymentRecords =
        [];


    if (
        adminPaymentBookings.length ===
        0
    ) {

        return;
    }


    setAdminPaymentsLoadingText(
        `Loading payment status for ${adminPaymentBookings.length} bookings...`
    );


    /*
     * BRD:
     *
     * GET /api/bookings/{id}/payment
     *
     * We use Promise.allSettled so one
     * unusual booking/payment response
     * does not break the entire page.
     */

    const requests =
        adminPaymentBookings.map(
            async function (
                booking
            ) {

                const bookingId =
                    getAdminPaymentBookingId(
                        booking
                    );


                if (!bookingId) {

                    return createAdminPaymentRecord(
                        booking,
                        null
                    );
                }


                try {

                    const response =
                        await apiGet(
                            `/bookings/${encodeURIComponent(
                                bookingId
                            )}/payment`
                        );


                    const payment =
                        response?.data ||
                        response?.payment ||
                        response;


                    return createAdminPaymentRecord(
                        booking,
                        payment
                    );


                } catch (error) {

                    /*
                     * A backend may return 404
                     * when no payment exists yet.
                     */

                    if (
                        error.status === 404
                    ) {

                        return createAdminPaymentRecord(
                            booking,
                            null
                        );
                    }


                    console.warn(
                        `Payment information unavailable for booking ${bookingId}.`,
                        error
                    );


                    return createAdminPaymentRecord(
                        booking,
                        null,
                        true
                    );
                }
            }
        );


    const results =
        await Promise.allSettled(
            requests
        );


    adminPaymentRecords =
        results
            .filter(
                function (result) {

                    return (
                        result.status ===
                        "fulfilled"
                    );
                }
            )
            .map(
                function (result) {

                    return result.value;
                }
            )
            .filter(Boolean);
}


/* =========================================================
   CREATE VIEW MODEL
   ========================================================= */

function createAdminPaymentRecord(
    booking,
    payment,
    paymentLoadFailed = false
) {

    const bookingStatus =
        getAdminPaymentBookingStatus(
            booking
        );


    const rawStatus =

        payment?.paymentStatus ??

        payment?.PaymentStatus ??

        payment?.status ??

        payment?.Status ??

        null;


    /*
     * BRD rule:
     * A booking cannot become Confirmed
     * until payment has completed.
     *
     * Therefore Confirmed is a safe fallback
     * when the payment DTO does not expose
     * a status field.
     */

    let paymentStatus =
        rawStatus
            ? String(rawStatus)
            : bookingStatus ===
              "confirmed"
                ? "Completed"
                : "Not Paid";


    if (paymentLoadFailed) {

        paymentStatus =
            "Unavailable";
    }


    return {

        booking:
            booking,

        payment:
            payment,

        paymentStatus:
            paymentStatus,

        paymentLoadFailed:
            paymentLoadFailed
    };
}


/* =========================================================
   NORMALIZE ARRAY
   ========================================================= */

function normalizeAdminPaymentArray(
    response,
    collectionName
) {

    if (
        Array.isArray(response)
    ) {

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

function sortAdminPaymentRecords() {

    adminPaymentRecords.sort(
        function (a, b) {

            const first =
                new Date(
                    getAdminPaymentDate(
                        a
                    ) ||
                    getAdminPaymentBookingCreatedDate(
                        a.booking
                    ) ||
                    0
                );


            const second =
                new Date(
                    getAdminPaymentDate(
                        b
                    ) ||
                    getAdminPaymentBookingCreatedDate(
                        b.booking
                    ) ||
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

function renderAdminPaymentSummary() {

    const completed =
        adminPaymentRecords.filter(
            isAdminPaymentCompleted
        );


    const pending =
        adminPaymentRecords.length -
        completed.length;


    const revenue =
        completed.reduce(
            function (
                total,
                record
            ) {

                return (
                    total +
                    (
                        getAdminPaymentAmount(
                            record
                        ) ||
                        0
                    )
                );
            },
            0
        );


    setAdminPaymentText(
        "adminPaymentTotalCount",
        adminPaymentRecords.length
    );


    setAdminPaymentText(
        "adminPaymentCompletedCount",
        completed.length
    );


    setAdminPaymentText(
        "adminPaymentPendingCount",
        pending
    );


    setAdminPaymentText(
        "adminPaymentRevenue",
        formatAdminPaymentCurrency(
            revenue
        )
    );
}


/* =========================================================
   FILTER
   ========================================================= */

function applyAdminPaymentFilters() {

    const search =
        document
            .getElementById(
                "adminPaymentSearch"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const statusFilter =
        document
            .getElementById(
                "adminPaymentStatusFilter"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const filtered =
        adminPaymentRecords.filter(
            function (record) {

                const booking =
                    record.booking;


                const searchMatch =
                    !search ||

                    getAdminPaymentBookingNumber(
                        booking
                    )
                        .toLowerCase()
                        .includes(search) ||

                    getAdminPaymentCustomerName(
                        booking
                    )
                        .toLowerCase()
                        .includes(search) ||

                    getAdminPaymentCustomerEmail(
                        booking
                    )
                        .toLowerCase()
                        .includes(search) ||

                    getAdminPaymentReference(
                        record
                    )
                        .toLowerCase()
                        .includes(search);


                let statusMatch =
                    true;


                if (
                    statusFilter ===
                    "completed"
                ) {

                    statusMatch =
                        isAdminPaymentCompleted(
                            record
                        );
                }


                if (
                    statusFilter ===
                    "pending"
                ) {

                    statusMatch =
                        !isAdminPaymentCompleted(
                            record
                        );
                }


                return (
                    searchMatch &&
                    statusMatch
                );
            }
        );


    renderAdminPayments(
        filtered
    );
}


/* =========================================================
   RENDER
   ========================================================= */

function renderAdminPayments(
    records
) {

    const table =
        document.getElementById(
            "adminPaymentsTableContainer"
        );


    const body =
        document.getElementById(
            "adminPaymentsTableBody"
        );


    const empty =
        document.getElementById(
            "adminPaymentsEmpty"
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


    setAdminPaymentText(
        "adminPaymentResultCount",
        records.length === 1
            ? "1 record"
            : `${records.length} records`
    );


    if (
        records.length ===
        0
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


    records.forEach(
        function (record) {

            body.appendChild(
                createAdminPaymentRow(
                    record
                )
            );
        }
    );
}


/* =========================================================
   CREATE ROW
   ========================================================= */

function createAdminPaymentRow(
    record
) {

    const booking =
        record.booking;


    const bookingId =
        getAdminPaymentBookingId(
            booking
        );


    const bookingNumber =
        getAdminPaymentBookingNumber(
            booking
        );


    const amount =
        getAdminPaymentAmount(
            record
        );


    const status =
        record.paymentStatus;


    const completed =
        isAdminPaymentCompleted(
            record
        );


    const paymentId =
        getAdminPaymentId(
            record
        );


    const row =
        document.createElement(
            "tr"
        );


    row.innerHTML = `

        <td>

            <strong class="admin-payment-booking-number">

                ${escapeAdminPaymentHtml(
                    bookingNumber
                )}

            </strong>

            <span>

                Booking ID:
                ${escapeAdminPaymentHtml(
                    bookingId || "-"
                )}

            </span>

        </td>


        <td>

            <strong class="admin-payment-customer-name">

                ${escapeAdminPaymentHtml(
                    getAdminPaymentCustomerName(
                        booking
                    )
                )}

            </strong>

            <span>

                ${escapeAdminPaymentHtml(
                    getAdminPaymentCustomerEmail(
                        booking
                    ) ||
                    `Customer ID: ${getAdminPaymentCustomerId(booking) || "-"}`
                )}

            </span>

        </td>


        <td>

            <strong>

                ${
                    amount === null
                        ? "-"
                        : escapeAdminPaymentHtml(
                            formatAdminPaymentCurrency(
                                amount
                            )
                        )
                }

            </strong>

        </td>


        <td>

            <span class="admin-payment-status ${
                completed
                    ? "completed"
                    : record.paymentLoadFailed
                        ? "unavailable"
                        : "pending"
            }">

                ${escapeAdminPaymentHtml(
                    status
                )}

            </span>

        </td>


        <td>

            ${escapeAdminPaymentHtml(
                getAdminPaymentReference(
                    record
                ) ||
                "-"
            )}

        </td>


        <td>

            ${escapeAdminPaymentHtml(
                formatAdminPaymentDateTime(
                    getAdminPaymentDate(
                        record
                    )
                )
            )}

        </td>


        <td>

            <div class="admin-payment-actions">


                ${
                    bookingId
                        ? `
                            <a
                                href="booking-details.html?id=${encodeURIComponent(
                                    bookingId
                                )}"
                                class="btn btn-outline"
                            >
                                Booking
                            </a>
                          `
                        : ""
                }


                ${
                    completed &&
                    paymentId
                        ? `
                            <button
                                type="button"
                                class="btn btn-primary"
                                data-payment-receipt-id="${escapeAdminPaymentHtml(
                                    paymentId
                                )}"
                                data-payment-booking-number="${escapeAdminPaymentHtml(
                                    bookingNumber
                                )}"
                            >
                                Receipt
                            </button>
                          `
                        : ""
                }


            </div>

        </td>
    `;


    const receiptButton =
        row.querySelector(
            "[data-payment-receipt-id]"
        );


    if (receiptButton) {

        receiptButton.addEventListener(
            "click",
            async function () {

                await downloadAdminPaymentReceipt(
                    this.dataset
                        .paymentReceiptId,

                    this.dataset
                        .paymentBookingNumber,

                    this
                );
            }
        );
    }


    return row;
}


/* =========================================================
   PAYMENT COMPLETED?
   ========================================================= */

function isAdminPaymentCompleted(
    record
) {

    const status =
        String(
            record?.paymentStatus ||
            ""
        )
            .trim()
            .toLowerCase();


    return (

        status === "completed" ||

        status === "paid" ||

        status === "successful" ||

        status === "success" ||

        status === "confirmed"
    );
}


/* =========================================================
   RECEIPT DOWNLOAD
   ========================================================= */

async function downloadAdminPaymentReceipt(
    paymentId,
    bookingNumber,
    button
) {

    if (
        adminReceiptDownloadInProgress
    ) {

        return;
    }


    adminReceiptDownloadInProgress =
        true;


    clearAdminPaymentsMessage();


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Downloading...";
    }


    try {

        const token =
            localStorage.getItem(
                APP_CONFIG.STORAGE_KEYS.TOKEN
            );


        /*
         * BRD:
         *
         * GET /api/payments/{id}/receipt
         *
         * Direct fetch is used because the
         * response may be a PDF/file Blob
         * rather than JSON.
         */

        const response =
            await fetch(

                `${APP_CONFIG.API_BASE_URL}/payments/${encodeURIComponent(
                    paymentId
                )}/receipt`,

                {
                    method:
                        "GET",

                    headers:
                        token
                            ? {
                                Authorization:
                                    `Bearer ${token}`
                              }
                            : {}
                }
            );


        if (!response.ok) {

            let message =
                "Unable to download this receipt.";


            try {

                const contentType =
                    response.headers.get(
                        "content-type"
                    );


                if (
                    contentType &&
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    const errorData =
                        await response.json();


                    message =
                        errorData.message ||
                        errorData.title ||
                        message;

                } else {

                    const text =
                        await response.text();


                    if (text) {

                        message =
                            text;
                    }
                }


            } catch (error) {

                console.warn(
                    "Receipt error response could not be parsed.",
                    error
                );
            }


            throw new Error(
                message
            );
        }


        const blob =
            await response.blob();


        if (
            !blob ||
            blob.size === 0
        ) {

            throw new Error(
                "The receipt file was empty."
            );
        }


        const contentDisposition =
            response.headers.get(
                "content-disposition"
            );


        let fileName =
            `Receipt-${bookingNumber || paymentId}.pdf`;


        if (contentDisposition) {

            const utf8Match =
                contentDisposition.match(
                    /filename\*=UTF-8''([^;]+)/i
                );


            const normalMatch =
                contentDisposition.match(
                    /filename="?([^"]+)"?/i
                );


            if (
                utf8Match &&
                utf8Match[1]
            ) {

                fileName =
                    decodeURIComponent(
                        utf8Match[1]
                    );


            } else if (
                normalMatch &&
                normalMatch[1]
            ) {

                fileName =
                    normalMatch[1]
                        .trim();
            }
        }


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            fileName;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        /*
         * Give the browser time to start
         * reading the Blob before revoking it.
         */

        setTimeout(
            function () {

                URL.revokeObjectURL(
                    url
                );
            },
            1000
        );


    } catch (error) {

        console.error(
            "Receipt Download Error:",
            error
        );


        showAdminPaymentsMessage(
            error.message ||
            "Unable to download the receipt.",
            "error"
        );


    } finally {

        adminReceiptDownloadInProgress =
            false;


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Receipt";
        }
    }
}


/* =========================================================
   PAYMENT ID
   ========================================================= */

function getAdminPaymentId(
    record
) {

    const payment =
        record?.payment ||
        {};


    return (

        payment.paymentId ||

        payment.PaymentId ||

        payment.id ||

        payment.Id ||

        null
    );
}


/* =========================================================
   AMOUNT
   ========================================================= */

function getAdminPaymentAmount(
    record
) {

    const payment =
        record?.payment ||
        {};


    const booking =
        record?.booking ||
        {};


    const value =

        payment.amountDue ??

        payment.AmountDue ??

        payment.amount ??

        payment.Amount ??

        payment.totalAmount ??

        payment.TotalAmount ??

        booking.totalAmount ??

        booking.TotalAmount ??

        booking.amountDue ??

        booking.AmountDue ??

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
   REFERENCE
   ========================================================= */

function getAdminPaymentReference(
    record
) {

    const payment =
        record?.payment ||
        {};


    return String(

        payment.paymentReference ||

        payment.PaymentReference ||

        payment.reference ||

        payment.Reference ||

        payment.transactionReference ||

        payment.TransactionReference ||

        ""
    );
}


/* =========================================================
   PAYMENT DATE
   ========================================================= */

function getAdminPaymentDate(
    record
) {

    const payment =
        record?.payment ||
        {};


    return (

        payment.paymentDate ||

        payment.PaymentDate ||

        payment.paidAt ||

        payment.PaidAt ||

        payment.createdAt ||

        payment.CreatedAt ||

        null
    );
}


/* =========================================================
   BOOKING HELPERS
   ========================================================= */

function getAdminPaymentBookingId(
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


function getAdminPaymentBookingNumber(
    booking
) {

    return String(

        booking?.bookingNumber ||

        booking?.BookingNumber ||

        `Booking #${getAdminPaymentBookingId(booking) || "-"}`
    );
}


function getAdminPaymentBookingStatus(
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


function getAdminPaymentBookingCreatedDate(
    booking
) {

    return (

        booking?.createdAt ||

        booking?.CreatedAt ||

        booking?.bookingDate ||

        booking?.BookingDate ||

        null
    );
}


/* =========================================================
   CUSTOMER HELPERS
   ========================================================= */

function getAdminPaymentCustomerId(
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


function getAdminPaymentCustomerName(
    booking
) {

    return String(

        booking?.customerName ||

        booking?.CustomerName ||

        booking?.customer?.name ||

        booking?.customer?.fullName ||

        `Customer #${getAdminPaymentCustomerId(booking) || "-"}`
    );
}


function getAdminPaymentCustomerEmail(
    booking
) {

    return String(

        booking?.customerEmail ||

        booking?.CustomerEmail ||

        booking?.customer?.email ||

        ""
    );
}


/* =========================================================
   EVENT HELPERS
   ========================================================= */

function getAdminPaymentEventId(
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


function getAdminPaymentEventName(
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
   CURRENCY
   ========================================================= */

function formatAdminPaymentCurrency(
    value
) {

    return new Intl.NumberFormat(
        "en-LK",
        {
            style:
                "currency",

            currency:
                "LKR",

            minimumFractionDigits:
                2
        }
    ).format(
        Number(value) ||
        0
    );
}


/* =========================================================
   DATE
   ========================================================= */

function formatAdminPaymentDateTime(
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
   UI STATE
   ========================================================= */

function showAdminPaymentsContent() {

    document
        .getElementById(
            "adminPaymentsNoEvent"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminPaymentsContent"
        )
        ?.classList.remove(
            "hidden"
        );
}


function showAdminPaymentsNoEvent() {

    document
        .getElementById(
            "adminPaymentsContent"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminPaymentsNoEvent"
        )
        ?.classList.remove(
            "hidden"
        );


    setAdminPaymentText(
        "adminPaymentSelectedEventName",
        "-"
    );
}


/* =========================================================
   LOADING
   ========================================================= */

function showAdminPaymentsLoading(
    message =
        "Loading payment information..."
) {

    setAdminPaymentsLoadingText(
        message
    );


    document
        .getElementById(
            "adminPaymentsLoading"
        )
        ?.classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "adminPaymentsTableContainer"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminPaymentsEmpty"
        )
        ?.classList.add(
            "hidden"
        );
}


function setAdminPaymentsLoadingText(
    message
) {

    setAdminPaymentText(
        "adminPaymentsLoadingText",
        message
    );
}


function hideAdminPaymentsLoading() {

    document
        .getElementById(
            "adminPaymentsLoading"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   TEXT
   ========================================================= */

function setAdminPaymentText(
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
   MESSAGE
   ========================================================= */

function showAdminPaymentsMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminPaymentsMessage"
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


function clearAdminPaymentsMessage() {

    const element =
        document.getElementById(
            "adminPaymentsMessage"
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
   ESCAPE
   ========================================================= */

function escapeAdminPaymentHtml(
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
