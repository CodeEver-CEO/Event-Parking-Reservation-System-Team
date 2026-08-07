/* =========================================================
   Event & Parking Reservation System
   Customer Payment History
   ========================================================= */


let customerPaymentHistory = [];


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializePaymentHistoryPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializePaymentHistoryPage() {

    if (!validatePaymentHistoryAccess()) {
        return;
    }


    initializePaymentHistorySearch();


    await loadCustomerPaymentHistory();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validatePaymentHistoryAccess() {

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

function getPaymentHistoryCustomerId() {

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
            JSON.parse(storedUser);


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
   SEARCH
   ========================================================= */

function initializePaymentHistorySearch() {

    const search =
        document.getElementById(
            "paymentHistorySearch"
        );


    const clearButton =
        document.getElementById(
            "clearPaymentHistorySearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            applyPaymentHistoryFilter
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


                applyPaymentHistoryFilter();
            }
        );
    }
}


/* =========================================================
   LOAD PAYMENTS
   ========================================================= */

async function loadCustomerPaymentHistory() {

    clearPaymentHistoryMessage();

    showPaymentHistoryLoading();


    const customerId =
        getPaymentHistoryCustomerId();


    if (!customerId) {

        hidePaymentHistoryLoading();


        showPaymentHistoryMessage(
            "Customer information is unavailable. Please login again."
        );


        return;
    }


    try {

        /*
         * BRD:
         *
         * GET /api/payments/customer/{customerId}
         */

        const response =
            await apiGet(
                `/payments/customer/${encodeURIComponent(
                    customerId
                )}`
            );


        customerPaymentHistory =
            normalizePaymentHistoryResponse(
                response
            );


        sortPaymentHistory();


        renderPaymentHistorySummary();


        hidePaymentHistoryLoading();


        applyPaymentHistoryFilter();


    } catch (error) {

        console.error(
            "Payment History Error:",
            error
        );


        hidePaymentHistoryLoading();


        showPaymentHistoryMessage(
            error.message ||
            "Unable to load your payment history."
        );
    }
}


/* =========================================================
   NORMALIZE RESPONSE
   ========================================================= */

function normalizePaymentHistoryResponse(
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
        Array.isArray(response.payments)
    ) {

        return response.payments;
    }


    return [];
}


/* =========================================================
   SORT
   ========================================================= */

function sortPaymentHistory() {

    customerPaymentHistory.sort(
        function (a, b) {

            const first =
                new Date(
                    getPaymentHistoryDate(a) ||
                    0
                );


            const second =
                new Date(
                    getPaymentHistoryDate(b) ||
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

function renderPaymentHistorySummary() {

    const summary =
        document.getElementById(
            "paymentHistorySummary"
        );


    const totalPayments =
        customerPaymentHistory.length;


    const totalPaid =
        customerPaymentHistory.reduce(
            function (total, payment) {

                if (
                    !isPaymentHistoryCompleted(
                        payment
                    )
                ) {

                    return total;
                }


                return (
                    total +
                    getPaymentHistoryAmount(
                        payment
                    )
                );
            },
            0
        );


    const latestPayment =
        customerPaymentHistory.length > 0
            ? customerPaymentHistory[0]
            : null;


    setPaymentHistoryText(
        "paymentHistoryCount",
        totalPayments
    );


    setPaymentHistoryText(
        "paymentHistoryTotal",
        formatPaymentHistoryCurrency(
            totalPaid
        )
    );


    setPaymentHistoryText(
        "paymentHistoryLatestDate",
        latestPayment
            ? formatPaymentHistoryDate(
                getPaymentHistoryDate(
                    latestPayment
                )
            )
            : "-"
    );


    if (summary) {

        summary.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   FILTER
   ========================================================= */

function applyPaymentHistoryFilter() {

    const search =
        document
            .getElementById(
                "paymentHistorySearch"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const filtered =
        customerPaymentHistory.filter(
            function (payment) {

                if (!search) {

                    return true;
                }


                const bookingNumber =
                    getPaymentHistoryBookingNumber(
                        payment
                    )
                        .toLowerCase();


                const reference =
                    getPaymentHistoryReference(
                        payment
                    )
                        .toLowerCase();


                const eventName =
                    getPaymentHistoryEventName(
                        payment
                    )
                        .toLowerCase();


                return (

                    bookingNumber.includes(
                        search
                    ) ||

                    reference.includes(
                        search
                    ) ||

                    eventName.includes(
                        search
                    )
                );
            }
        );


    renderPaymentHistory(
        filtered
    );
}


/* =========================================================
   RENDER LIST
   ========================================================= */

function renderPaymentHistory(payments) {

    const list =
        document.getElementById(
            "paymentHistoryList"
        );


    const empty =
        document.getElementById(
            "paymentHistoryEmpty"
        );


    if (
        !list ||
        !empty
    ) {

        return;
    }


    list.innerHTML =
        "";


    updatePaymentHistoryResultCount(
        payments.length
    );


    if (
        payments.length === 0
    ) {

        list.classList.add(
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


    list.classList.remove(
        "hidden"
    );


    payments.forEach(
        function (payment) {

            const card =
                createPaymentHistoryCard(
                    payment
                );


            list.appendChild(
                card
            );
        }
    );
}


/* =========================================================
   CREATE PAYMENT CARD
   ========================================================= */

function createPaymentHistoryCard(
    payment
) {

    const paymentId =
        getPaymentHistoryId(
            payment
        );


    const bookingId =
        getPaymentHistoryBookingId(
            payment
        );


    const bookingNumber =
        getPaymentHistoryBookingNumber(
            payment
        );


    const eventName =
        getPaymentHistoryEventName(
            payment
        );


    const reference =
        getPaymentHistoryReference(
            payment
        );


    const date =
        getPaymentHistoryDate(
            payment
        );


    const amount =
        getPaymentHistoryAmount(
            payment
        );


    const status =
        getPaymentHistoryStatus(
            payment
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "payment-history-card";


    card.innerHTML = `

        <div class="payment-history-card-main">


            <span class="payment-history-reference">

                ${escapePaymentHistoryHtml(
                    reference
                )}

            </span>


            <h3>

                ${escapePaymentHistoryHtml(
                    eventName
                )}

            </h3>


            <div class="payment-history-details">


                <div class="payment-history-detail">

                    <span>
                        Booking Number
                    </span>

                    <strong>
                        ${escapePaymentHistoryHtml(
                            bookingNumber
                        )}
                    </strong>

                </div>


                <div class="payment-history-detail">

                    <span>
                        Payment Date
                    </span>

                    <strong>
                        ${escapePaymentHistoryHtml(
                            formatPaymentHistoryDateTime(
                                date
                            )
                        )}
                    </strong>

                </div>


                <div class="payment-history-detail">

                    <span>
                        Payment Status
                    </span>

                    <strong>
                        ${escapePaymentHistoryHtml(
                            formatPaymentHistoryStatus(
                                status
                            )
                        )}
                    </strong>

                </div>


            </div>


        </div>


        <div class="payment-history-card-action">


            <div>

                <span class="payment-history-amount-label">
                    Amount Paid
                </span>

                <strong class="payment-history-amount">

                    ${escapePaymentHistoryHtml(
                        formatPaymentHistoryCurrency(
                            amount
                        )
                    )}

                </strong>

            </div>


            <div class="payment-history-actions">


                ${
                    bookingId
                        ? `
                            <a
                                href="booking-details.html?id=${encodeURIComponent(
                                    bookingId
                                )}"
                                class="btn btn-outline"
                            >
                                View Booking
                            </a>
                          `
                        : ""
                }


                ${
                    paymentId &&
                    isPaymentHistoryCompleted(
                        payment
                    )
                        ? `
                            <button
                                type="button"
                                class="btn btn-primary"
                                data-receipt-payment-id="${escapePaymentHistoryHtml(
                                    paymentId
                                )}"
                                data-receipt-booking-number="${escapePaymentHistoryHtml(
                                    bookingNumber
                                )}"
                            >
                                Download Receipt
                            </button>
                          `
                        : ""
                }


            </div>


        </div>
    `;


    initializePaymentReceiptButton(
        card
    );


    return card;
}


/* =========================================================
   RECEIPT BUTTON
   ========================================================= */

function initializePaymentReceiptButton(
    card
) {

    const button =
        card.querySelector(
            "[data-receipt-payment-id]"
        );


    if (!button) {

        return;
    }


    button.addEventListener(
        "click",
        async function () {

            const paymentId =
                this.dataset
                    .receiptPaymentId;


            const bookingNumber =
                this.dataset
                    .receiptBookingNumber;


            await downloadPaymentHistoryReceipt(
                paymentId,
                bookingNumber,
                this
            );
        }
    );
}


/* =========================================================
   DOWNLOAD RECEIPT
   ========================================================= */

async function downloadPaymentHistoryReceipt(
    paymentId,
    bookingNumber,
    button
) {

    if (!paymentId) {

        showPaymentHistoryMessage(
            "Payment information is unavailable for this receipt."
        );


        return;
    }


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Downloading...";
    }


    try {

        /*
         * BRD:
         *
         * GET /api/payments/{id}/receipt
         *
         * apiGet() is not used because
         * the response may be a PDF/file.
         */

        const token =
            localStorage.getItem(
                APP_CONFIG.STORAGE_KEYS.TOKEN
            );


        const headers = {};


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;
        }


        const response =
            await fetch(
                `${APP_CONFIG.API_BASE_URL}/payments/${encodeURIComponent(
                    paymentId
                )}/receipt`,
                {
                    method:
                        "GET",

                    headers:
                        headers
                }
            );


        if (!response.ok) {

            throw new Error(
                await getReceiptDownloadError(
                    response
                )
            );
        }


        const blob =
            await response.blob();


        if (
            !blob ||
            blob.size === 0
        ) {

            throw new Error(
                "The server returned an empty receipt."
            );
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
            getPaymentReceiptFileName(
                response,
                bookingNumber
            );


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


    } catch (error) {

        console.error(
            "Receipt Download Error:",
            error
        );


        showPaymentHistoryMessage(
            error.message ||
            "Unable to download this receipt."
        );


    } finally {

        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Download Receipt";
        }
    }
}


/* =========================================================
   RECEIPT ERROR MESSAGE
   ========================================================= */

async function getReceiptDownloadError(
    response
) {

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

        try {

            const data =
                await response.json();


            return (

                data.message ||

                data.title ||

                "Unable to download this receipt."
            );


        } catch (error) {

            return (
                "Unable to download this receipt."
            );
        }
    }


    try {

        const text =
            await response.text();


        return (
            text ||
            "Unable to download this receipt."
        );


    } catch (error) {

        return (
            "Unable to download this receipt."
        );
    }
}


/* =========================================================
   RECEIPT FILE NAME
   ========================================================= */

function getPaymentReceiptFileName(
    response,
    bookingNumber
) {

    const disposition =
        response.headers.get(
            "content-disposition"
        );


    if (disposition) {

        const utfMatch =
            disposition.match(
                /filename\*=UTF-8''([^;]+)/i
            );


        if (
            utfMatch &&
            utfMatch[1]
        ) {

            return decodeURIComponent(
                utfMatch[1]
            );
        }


        const normalMatch =
            disposition.match(
                /filename="?([^";]+)"?/i
            );


        if (
            normalMatch &&
            normalMatch[1]
        ) {

            return normalMatch[1];
        }
    }


    const safeBookingNumber =
        String(
            bookingNumber ||
            "Payment"
        )
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            );


    return (
        `Receipt-${safeBookingNumber}.pdf`
    );
}


/* =========================================================
   PAYMENT ID
   ========================================================= */

function getPaymentHistoryId(
    payment
) {

    return (

        payment.paymentId ||

        payment.PaymentId ||

        payment.id ||

        payment.Id ||

        null
    );
}


/* =========================================================
   BOOKING ID
   ========================================================= */

function getPaymentHistoryBookingId(
    payment
) {

    return (

        payment.bookingId ||

        payment.BookingId ||

        payment.booking?.bookingId ||

        payment.booking?.id ||

        null
    );
}


/* =========================================================
   BOOKING NUMBER
   ========================================================= */

function getPaymentHistoryBookingNumber(
    payment
) {

    return String(

        payment.bookingNumber ||

        payment.BookingNumber ||

        payment.booking?.bookingNumber ||

        payment.Booking?.BookingNumber ||

        `Booking #${getPaymentHistoryBookingId(payment) || "-"}`
    );
}


/* =========================================================
   EVENT NAME
   ========================================================= */

function getPaymentHistoryEventName(
    payment
) {

    return String(

        payment.eventName ||

        payment.EventName ||

        payment.booking?.eventName ||

        payment.booking?.event?.name ||

        payment.Booking?.Event?.Name ||

        "Event Booking"
    );
}


/* =========================================================
   REFERENCE
   ========================================================= */

function getPaymentHistoryReference(
    payment
) {

    return String(

        payment.paymentReference ||

        payment.PaymentReference ||

        payment.reference ||

        payment.Reference ||

        payment.transactionReference ||

        payment.TransactionReference ||

        getPaymentHistoryId(payment) ||

        "-"
    );
}


/* =========================================================
   AMOUNT
   ========================================================= */

function getPaymentHistoryAmount(
    payment
) {

    const amount =
        Number(

            payment.amount ??

            payment.Amount ??

            payment.totalAmount ??

            payment.TotalAmount ??

            payment.amountPaid ??

            payment.AmountPaid ??

            0
        );


    return Number.isNaN(amount)
        ? 0
        : amount;
}


/* =========================================================
   PAYMENT DATE
   ========================================================= */

function getPaymentHistoryDate(
    payment
) {

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
   STATUS
   ========================================================= */

function getPaymentHistoryStatus(
    payment
) {

    return String(

        payment.paymentStatus ||

        payment.PaymentStatus ||

        payment.status ||

        payment.Status ||

        "Completed"
    )
        .trim()
        .toLowerCase();
}


/* =========================================================
   COMPLETED CHECK
   ========================================================= */

function isPaymentHistoryCompleted(
    payment
) {

    if (
        payment.isPaid === true ||
        payment.IsPaid === true ||
        payment.isCompleted === true ||
        payment.IsCompleted === true
    ) {

        return true;
    }


    const status =
        getPaymentHistoryStatus(
            payment
        );


    return (

        status === "completed" ||

        status === "paid" ||

        status === "successful" ||

        status === "success" ||

        status === "confirmed"
    );
}


/* =========================================================
   FORMAT STATUS
   ========================================================= */

function formatPaymentHistoryStatus(
    status
) {

    if (!status) {

        return "Completed";
    }


    return (
        status.charAt(0)
            .toUpperCase() +
        status.slice(1)
    );
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatPaymentHistoryCurrency(
    value
) {

    const amount =
        Number(value);


    if (Number.isNaN(amount)) {

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
                2
        }
    ).format(amount);
}


/* =========================================================
   DATE
   ========================================================= */

function formatPaymentHistoryDate(
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
   DATE + TIME
   ========================================================= */

function formatPaymentHistoryDateTime(
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

function updatePaymentHistoryResultCount(
    count
) {

    const element =
        document.getElementById(
            "paymentHistoryResultCount"
        );


    if (!element) {

        return;
    }


    element.textContent =
        count === 1
            ? "1 payment"
            : `${count} payments`;
}


/* =========================================================
   TEXT
   ========================================================= */

function setPaymentHistoryText(
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

function showPaymentHistoryLoading() {

    const loading =
        document.getElementById(
            "paymentHistoryLoading"
        );


    const list =
        document.getElementById(
            "paymentHistoryList"
        );


    const empty =
        document.getElementById(
            "paymentHistoryEmpty"
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

function hidePaymentHistoryLoading() {

    const loading =
        document.getElementById(
            "paymentHistoryLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function showPaymentHistoryMessage(
    message
) {

    const element =
        document.getElementById(
            "paymentHistoryMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-error";
}


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

function clearPaymentHistoryMessage() {

    const element =
        document.getElementById(
            "paymentHistoryMessage"
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

function escapePaymentHistoryHtml(
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
