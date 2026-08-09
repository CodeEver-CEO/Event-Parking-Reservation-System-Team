/* =========================================================
   Event & Parking Reservation System
   Customer Booking Details
   ========================================================= */


let bookingDetailsId = null;

let bookingDetailsData = null;

let bookingPaymentData = null;

let bookingDetailsHoldInterval = null;

let bookingDetailsHoldExpiresAt = null;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeBookingDetailsPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeBookingDetailsPage() {

    if (!validateBookingDetailsAccess()) {
        return;
    }


    bookingDetailsId =
        getBookingDetailsIdFromUrl();


    initializeBookingDetailsButtons();


    if (!bookingDetailsId) {

        hideBookingDetailsLoading();

        showBookingDetailsNotFound();

        return;
    }


    await loadBookingDetails();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateBookingDetailsAccess() {

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
   BOOKING ID
   ========================================================= */

function getBookingDetailsIdFromUrl() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        "id"
    );
}


/* =========================================================
   BUTTONS
   ========================================================= */

function initializeBookingDetailsButtons() {

    const cancelButton =
        document.getElementById(
            "detailsCancelButton"
        );


    const receiptButton =
        document.getElementById(
            "detailsReceiptButton"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            confirmBookingDetailsCancellation
        );
    }


    if (receiptButton) {

        receiptButton.addEventListener(
            "click",
            downloadBookingReceipt
        );
    }
}


/* =========================================================
   LOAD BOOKING
   ========================================================= */

async function loadBookingDetails() {

    clearBookingDetailsMessage();

    showBookingDetailsLoading();


    try {

        /*
         * BRD:
         * GET /api/bookings/{id}
         */

        const response =
            await apiGet(
                `/bookings/${encodeURIComponent(
                    bookingDetailsId
                )}`
            );


        bookingDetailsData =
            response?.data ||
            response;


        if (!bookingDetailsData) {

            hideBookingDetailsLoading();

            showBookingDetailsNotFound();

            return;
        }


        renderBookingDetails();


        /*
         * Payment information is loaded
         * separately.
         */

        await loadBookingDetailsPayment();


        /*
         * Pending booking needs hold status.
         */

        if (
            getBookingDetailsStatus() ===
            "pending"
        ) {

            await loadBookingDetailsHold();
        }


        renderBookingDetailsActions();


        hideBookingDetailsLoading();

        showBookingDetailsContent();


    } catch (error) {

        console.error(
            "Booking Details Error:",
            error
        );


        hideBookingDetailsLoading();


        if (
            error.status === 404 ||
            error.status === 403
        ) {

            showBookingDetailsNotFound();

            return;
        }


        showBookingDetailsMessage(
            error.message ||
            "Unable to load booking details."
        );
    }
}


/* =========================================================
   RENDER BOOKING
   ========================================================= */

function renderBookingDetails() {

    const bookingNumber =
        getBookingDetailsNumber();


    const status =
        getBookingDetailsStatus();


    setBookingDetailsText(
        "detailsBookingNumber",
        bookingNumber
    );


    setBookingDetailsText(
        "actionBookingNumber",
        bookingNumber
    );


    setBookingDetailsText(
        "actionBookingStatus",
        formatBookingDetailsStatus(
            status
        )
    );


    updateBookingDetailsStatusBadge(
        status
    );


    setBookingDetailsText(
        "detailsEventName",
        getBookingDetailsEventName()
    );


    setBookingDetailsText(
        "detailsEventDate",
        formatBookingDetailsDate(
            getBookingDetailsEventDate()
        )
    );


    setBookingDetailsText(
        "detailsEventTime",
        getBookingDetailsEventTime()
    );


    setBookingDetailsText(
        "detailsVenue",
        getBookingDetailsVenue()
    );


    renderBookingDetailsSeats();

    renderBookingDetailsParking();
}


/* =========================================================
   SEATS
   ========================================================= */

function renderBookingDetailsSeats() {

    const container =
        document.getElementById(
            "detailsSeatsContainer"
        );


    const seats =
        getBookingDetailsSeats();


    setBookingDetailsText(
        "detailsSeatCount",
        seats.length === 1
            ? "1 seat"
            : `${seats.length} seats`
    );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (seats.length === 0) {

        container.textContent =
            "Seat information unavailable.";

        return;
    }


    seats.forEach(
        function (seat) {

            const chip =
                document.createElement(
                    "span"
                );


            chip.className =
                "booking-details-seat-chip";


            chip.textContent =
                getBookingDetailsSeatNumber(
                    seat
                );


            container.appendChild(
                chip
            );
        }
    );
}


/* =========================================================
   PARKING
   ========================================================= */

function renderBookingDetailsParking() {

    const selected =
        document.getElementById(
            "detailsParkingSelected"
        );


    const noParking =
        document.getElementById(
            "detailsNoParking"
        );


    const parking =
        getBookingDetailsParking();


    if (!parking) {

        if (selected) {

            selected.classList.add(
                "hidden"
            );
        }


        if (noParking) {

            noParking.classList.remove(
                "hidden"
            );
        }


        return;
    }


    if (noParking) {

        noParking.classList.add(
            "hidden"
        );
    }


    if (selected) {

        selected.classList.remove(
            "hidden"
        );
    }


    setBookingDetailsText(
        "detailsParkingSlot",
        getBookingDetailsParkingNumber(
            parking
        )
    );


    setBookingDetailsText(
        "detailsParkingZone",
        getBookingDetailsParkingZone(
            parking
        )
    );


    setBookingDetailsText(
        "detailsParkingFee",
        formatBookingDetailsCurrency(
            getBookingDetailsParkingFee(
                parking
            )
        )
    );
}


/* =========================================================
   PAYMENT INFORMATION
   ========================================================= */

async function loadBookingDetailsPayment() {

    try {

        /*
         * BRD:
         * GET /api/bookings/{id}/payment
         */

        const response =
            await apiGet(
                `/bookings/${encodeURIComponent(
                    bookingDetailsId
                )}/payment`
            );


        bookingPaymentData =
            response?.data ||
            response ||
            {};


        renderBookingDetailsPayment();


    } catch (error) {

        /*
         * Some backends may return 404 if
         * no payment record exists yet.
         */

        if (error.status === 404) {

            bookingPaymentData =
                null;


            renderNoBookingPayment();

            return;
        }


        console.error(
            "Payment Information Error:",
            error
        );


        renderNoBookingPayment();
    }
}


/* =========================================================
   RENDER PAYMENT
   ========================================================= */

function renderBookingDetailsPayment() {

    const status =
        getBookingDetailsPaymentStatus();


    const amount =
        getBookingDetailsPaymentAmount();


    setBookingDetailsText(
        "detailsPaymentStatus",
        status
    );


    setBookingDetailsText(
        "detailsTotalAmount",
        formatBookingDetailsCurrency(
            amount
        )
    );


    setBookingDetailsText(
        "actionBookingTotal",
        formatBookingDetailsCurrency(
            amount
        )
    );


    setBookingDetailsText(
        "detailsPaymentReference",
        getBookingDetailsPaymentReference()
    );


    setBookingDetailsText(
        "detailsPaymentDate",
        formatBookingDetailsDateTime(
            getBookingDetailsPaymentDate()
        )
    );
}


/* =========================================================
   NO PAYMENT
   ========================================================= */

function renderNoBookingPayment() {

    setBookingDetailsText(
        "detailsPaymentStatus",
        "Not Completed"
    );


    /*
     * Booking DTO might still contain
     * totalAmount.
     */

    const total =
        getBookingDetailsFallbackTotal();


    setBookingDetailsText(
        "detailsTotalAmount",
        formatBookingDetailsCurrency(
            total
        )
    );


    setBookingDetailsText(
        "actionBookingTotal",
        formatBookingDetailsCurrency(
            total
        )
    );


    setBookingDetailsText(
        "detailsPaymentReference",
        "-"
    );


    setBookingDetailsText(
        "detailsPaymentDate",
        "-"
    );
}


/* =========================================================
   HOLD STATUS
   ========================================================= */

async function loadBookingDetailsHold() {

    try {

        /*
         * BRD:
         * GET /api/bookings/{id}/hold-status
         */

        const response =
            await apiGet(
                `/bookings/${encodeURIComponent(
                    bookingDetailsId
                )}/hold-status`
            );


        const hold =
            response?.data ||
            response ||
            {};


        processBookingDetailsHold(
            hold
        );


    } catch (error) {

        console.error(
            "Booking Hold Error:",
            error
        );


        const holdCard =
            document.getElementById(
                "detailsHoldCard"
            );


        if (holdCard) {

            holdCard.classList.remove(
                "hidden"
            );
        }


        setBookingDetailsText(
            "detailsHoldText",
            "Unable to retrieve the current hold time."
        );


        setBookingDetailsText(
            "detailsHoldCountdown",
            "--:--"
        );
    }
}


/* =========================================================
   PROCESS HOLD
   ========================================================= */

function processBookingDetailsHold(hold) {

    const holdCard =
        document.getElementById(
            "detailsHoldCard"
        );


    const status =
        String(

            hold.status ||

            hold.bookingStatus ||

            hold.BookingStatus ||

            "Pending"
        )
            .trim()
            .toLowerCase();


    if (
        status === "expired" ||
        hold.isExpired === true ||
        hold.IsExpired === true
    ) {

        if (holdCard) {

            holdCard.classList.add(
                "hidden"
            );
        }


        return;
    }


    if (holdCard) {

        holdCard.classList.remove(
            "hidden"
        );
    }


    const expiresAt =

        hold.holdExpiresAt ||

        hold.HoldExpiresAt ||

        null;


    if (expiresAt) {

        const date =
            new Date(expiresAt);


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            bookingDetailsHoldExpiresAt =
                date;


            startBookingDetailsHoldTimer();

            return;
        }
    }


    const remaining =
        getBookingDetailsRemainingSeconds(
            hold
        );


    if (
        remaining !== null
    ) {

        bookingDetailsHoldExpiresAt =
            new Date(
                Date.now() +
                remaining * 1000
            );


        startBookingDetailsHoldTimer();

        return;
    }


    setBookingDetailsText(
        "detailsHoldText",
        "This booking is waiting for payment."
    );


    setBookingDetailsText(
        "detailsHoldCountdown",
        "--:--"
    );
}


/* =========================================================
   REMAINING SECONDS
   ========================================================= */

function getBookingDetailsRemainingSeconds(
    hold
) {

    const values = [

        hold.remainingSeconds,

        hold.RemainingSeconds,

        hold.secondsRemaining,

        hold.SecondsRemaining,

        hold.remainingTimeSeconds,

        hold.RemainingTimeSeconds

    ];


    for (const value of values) {

        if (
            value !== undefined &&
            value !== null
        ) {

            const number =
                Number(value);


            if (!Number.isNaN(number)) {

                return number;
            }
        }
    }


    return null;
}


/* =========================================================
   HOLD TIMER
   ========================================================= */

function startBookingDetailsHoldTimer() {

    stopBookingDetailsHoldTimer();


    updateBookingDetailsHoldTimer();


    bookingDetailsHoldInterval =
        setInterval(
            updateBookingDetailsHoldTimer,
            1000
        );
}


function updateBookingDetailsHoldTimer() {

    if (!bookingDetailsHoldExpiresAt) {

        return;
    }


    const seconds =
        Math.max(
            0,
            Math.ceil(
                (
                    bookingDetailsHoldExpiresAt.getTime() -
                    Date.now()
                ) / 1000
            )
        );


    if (seconds <= 0) {

        stopBookingDetailsHoldTimer();


        setBookingDetailsText(
            "detailsHoldCountdown",
            "00:00"
        );


        setBookingDetailsText(
            "detailsHoldText",
            "The hold may have expired. Open payment to verify the latest server status."
        );


        return;
    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    const remainder =
        seconds % 60;


    setBookingDetailsText(
        "detailsHoldCountdown",
        `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    );


    setBookingDetailsText(
        "detailsHoldText",
        "Complete payment before the reservation hold expires."
    );
}


function stopBookingDetailsHoldTimer() {

    if (bookingDetailsHoldInterval) {

        clearInterval(
            bookingDetailsHoldInterval
        );


        bookingDetailsHoldInterval =
            null;
    }
}


/* =========================================================
   ACTIONS
   ========================================================= */

function renderBookingDetailsActions() {

    const status =
        getBookingDetailsStatus();


    const paymentButton =
        document.getElementById(
            "detailsContinuePayment"
        );


    const cancelButton =
        document.getElementById(
            "detailsCancelButton"
        );


    const receiptButton =
        document.getElementById(
            "detailsReceiptButton"
        );


    /*
     * Pending → Continue Payment
     */

    if (
        paymentButton &&
        status === "pending"
    ) {

        paymentButton.href =
            `payment.html?bookingId=${encodeURIComponent(
                bookingDetailsId
            )}`;


        paymentButton.classList.remove(
            "hidden"
        );
    }


    /*
     * Cancel button:
     * hide only terminal statuses.
     *
     * Backend remains final authority.
     */

    if (
        cancelButton &&
        status !== "cancelled" &&
        status !== "expired"
    ) {

        cancelButton.classList.remove(
            "hidden"
        );
    }


    /*
     * Completed payment → receipt
     */

    if (
        receiptButton &&
        isBookingDetailsPaymentCompleted() &&
        getBookingDetailsPaymentId()
    ) {

        receiptButton.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   CANCEL CONFIRMATION
   ========================================================= */

async function confirmBookingDetailsCancellation() {

    const bookingNumber =
        getBookingDetailsNumber();


    const confirmed =
        await openConfirmationModal({

            title:
                "Cancel Booking",

            message:
                `Cancel ${bookingNumber}? Its reserved seats and parking slot, if any, will be released.`,

            confirmText:
                "Cancel Booking",

            cancelText:
                "Keep Booking"
        });


    if (!confirmed) {

        return;
    }


    await cancelBookingFromDetails();
}


/* =========================================================
   CANCEL
   ========================================================= */

async function cancelBookingFromDetails() {

    const button =
        document.getElementById(
            "detailsCancelButton"
        );


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Cancelling...";
    }


    try {

        /*
         * BRD:
         * DELETE /api/bookings/{id}
         */

        await apiDelete(
            `/bookings/${encodeURIComponent(
                bookingDetailsId
            )}`
        );


        stopBookingDetailsHoldTimer();


        clearBookingDetailsPendingSession();


        window.location.href =
            "my-bookings.html";


    } catch (error) {

        console.error(
            "Cancel Booking Error:",
            error
        );


        showBookingDetailsMessage(
            error.message ||
            "Unable to cancel this booking."
        );


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Cancel Booking";
        }
    }
}


/* =========================================================
   CLEAR PENDING SESSION
   ========================================================= */

function clearBookingDetailsPendingSession() {

    const stored =
        sessionStorage.getItem(
            "eventParkingPendingBooking"
        );


    if (!stored) {

        return;
    }


    try {

        const data =
            JSON.parse(stored);


        if (
            String(data.bookingId) ===
            String(bookingDetailsId)
        ) {

            sessionStorage.removeItem(
                "eventParkingPendingBooking"
            );
        }


    } catch (error) {

        sessionStorage.removeItem(
            "eventParkingPendingBooking"
        );
    }
}


/* =========================================================
   DOWNLOAD RECEIPT
   ========================================================= */

async function downloadBookingReceipt() {

    const paymentId =
        getBookingDetailsPaymentId();


    if (!paymentId) {

        showBookingDetailsMessage(
            "A completed payment is required before a receipt can be downloaded."
        );

        return;
    }


    const button =
        document.getElementById(
            "detailsReceiptButton"
        );


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Downloading...";
    }


    try {

        /*
         * BRD:
         * GET /api/payments/{id}/receipt
         *
         * Direct fetch is used because the
         * response may be a PDF/file Blob.
         */

        const token =
            localStorage.getItem(
                APP_CONFIG.STORAGE_KEYS.TOKEN
            );


        const response =
            await fetch(
                `${APP_CONFIG.API_BASE_URL}/payments/${encodeURIComponent(
                    paymentId
                )}/receipt`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            let message =
                "Unable to download the receipt.";


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

                const data =
                    await response.json();


                message =
                    data.message ||
                    data.title ||
                    message;

            } else {

                const text =
                    await response.text();


                if (text) {

                    message = text;
                }
            }


            throw new Error(
                message
            );
        }


        const blob =
            await response.blob();


        const objectUrl =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            objectUrl;


        link.download =
            getBookingReceiptFileName(
                response
            );


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            objectUrl
        );


    } catch (error) {

        console.error(
            "Receipt Error:",
            error
        );


        showBookingDetailsMessage(
            error.message ||
            "Unable to download the receipt."
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
   RECEIPT FILE NAME
   ========================================================= */

function getBookingReceiptFileName(
    response
) {

    const disposition =
        response.headers.get(
            "content-disposition"
        );


    if (disposition) {

        const match =
            disposition.match(
                /filename="?([^"]+)"?/i
            );


        if (
            match &&
            match[1]
        ) {

            return match[1];
        }
    }


    return (
        `Receipt-${getBookingDetailsNumber()}.pdf`
    );
}


/* =========================================================
   BOOKING NUMBER
   ========================================================= */

function getBookingDetailsNumber() {

    return String(

        bookingDetailsData?.bookingNumber ||

        bookingDetailsData?.BookingNumber ||

        `Booking #${bookingDetailsId}`
    );
}


/* =========================================================
   STATUS
   ========================================================= */

function getBookingDetailsStatus() {

    return String(

        bookingDetailsData?.status ||

        bookingDetailsData?.Status ||

        "pending"
    )
        .trim()
        .toLowerCase();
}


function formatBookingDetailsStatus(
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


/* =========================================================
   STATUS BADGE
   ========================================================= */

function updateBookingDetailsStatusBadge(
    status
) {

    const badge =
        document.getElementById(
            "detailsBookingStatus"
        );


    if (!badge) {

        return;
    }


    badge.textContent =
        formatBookingDetailsStatus(
            status
        );


    badge.className =
        "badge";


    if (status === "confirmed") {

        badge.classList.add(
            "badge-success"
        );

        return;
    }


    if (
        status === "cancelled" ||
        status === "expired"
    ) {

        badge.classList.add(
            "badge-danger"
        );

        return;
    }


    badge.classList.add(
        "badge-warning"
    );
}


/* =========================================================
   EVENT
   ========================================================= */

function getBookingDetailsEventName() {

    return String(

        bookingDetailsData?.eventName ||

        bookingDetailsData?.EventName ||

        bookingDetailsData?.event?.name ||

        bookingDetailsData?.event?.eventName ||

        "Event"
    );
}


function getBookingDetailsEventDate() {

    return (

        bookingDetailsData?.eventDate ||

        bookingDetailsData?.EventDate ||

        bookingDetailsData?.event?.date ||

        bookingDetailsData?.event?.eventDate ||

        null
    );
}


function getBookingDetailsEventTime() {

    const start =

        bookingDetailsData?.startTime ||

        bookingDetailsData?.StartTime ||

        bookingDetailsData?.event?.startTime ||

        bookingDetailsData?.event?.time ||

        "";


    const end =

        bookingDetailsData?.endTime ||

        bookingDetailsData?.EndTime ||

        bookingDetailsData?.event?.endTime ||

        "";


    if (
        start &&
        end
    ) {

        return `${start} - ${end}`;
    }


    return (
        start ||
        "Time not available"
    );
}


function getBookingDetailsVenue() {

    return String(

        bookingDetailsData?.venueName ||

        bookingDetailsData?.VenueName ||

        bookingDetailsData?.event?.venueName ||

        bookingDetailsData?.event?.venue?.name ||

        "Venue not available"
    );
}


/* =========================================================
   SEATS
   ========================================================= */

function getBookingDetailsSeats() {

    const seats =

        bookingDetailsData?.seats ||

        bookingDetailsData?.Seats ||

        bookingDetailsData?.bookingSeats ||

        bookingDetailsData?.BookingSeats ||

        [];


    return Array.isArray(seats)
        ? seats
        : [];
}


function getBookingDetailsSeatNumber(
    seat
) {

    return String(

        seat?.seatNumber ||

        seat?.SeatNumber ||

        seat?.seat?.seatNumber ||

        seat?.Seat?.SeatNumber ||

        seat?.number ||

        "-"
    );
}


/* =========================================================
   PARKING
   ========================================================= */

function getBookingDetailsParking() {

    return (

        bookingDetailsData
            ?.parkingReservation ||

        bookingDetailsData
            ?.ParkingReservation ||

        bookingDetailsData
            ?.parking ||

        bookingDetailsData
            ?.Parking ||

        null
    );
}


function getBookingDetailsParkingNumber(
    parking
) {

    return String(

        parking?.slotNumber ||

        parking?.SlotNumber ||

        parking?.parkingSlotNumber ||

        parking?.ParkingSlotNumber ||

        parking?.slot?.slotNumber ||

        "-"
    );
}


function getBookingDetailsParkingZone(
    parking
) {

    return String(

        parking?.zone ||

        parking?.Zone ||

        parking?.zoneName ||

        parking?.ZoneName ||

        parking?.slot?.zone ||

        "-"
    );
}


function getBookingDetailsParkingFee(
    parking
) {

    const amount = Number(

        parking?.fee ??

        parking?.Fee ??

        parking?.parkingFee ??

        parking?.ParkingFee ??

        0
    );


    return Number.isNaN(amount)
        ? 0
        : amount;
}


/* =========================================================
   PAYMENT HELPERS
   ========================================================= */

function getBookingDetailsPaymentStatus() {

    if (
        isBookingDetailsPaymentCompleted()
    ) {

        return "Completed";
    }


    return String(

        bookingPaymentData?.paymentStatus ||

        bookingPaymentData?.PaymentStatus ||

        bookingPaymentData?.status ||

        bookingPaymentData?.Status ||

        "Pending"
    );
}


function isBookingDetailsPaymentCompleted() {

    if (!bookingPaymentData) {

        return false;
    }


    if (
        bookingPaymentData.isPaid === true ||
        bookingPaymentData.IsPaid === true ||
        bookingPaymentData.isCompleted === true ||
        bookingPaymentData.IsCompleted === true
    ) {

        return true;
    }


    const status =
        String(

            bookingPaymentData.paymentStatus ||

            bookingPaymentData.PaymentStatus ||

            bookingPaymentData.status ||

            bookingPaymentData.Status ||

            ""
        )
            .trim()
            .toLowerCase();


    return (
        status === "completed" ||
        status === "paid" ||
        status === "successful" ||
        status === "success"
    );
}


function getBookingDetailsPaymentAmount() {

    const amount =
        Number(

            bookingPaymentData?.amountDue ??

            bookingPaymentData?.AmountDue ??

            bookingPaymentData?.totalAmount ??

            bookingPaymentData?.TotalAmount ??

            bookingPaymentData?.amount ??

            bookingPaymentData?.Amount ??

            0
        );


    return Number.isNaN(amount)
        ? 0
        : amount;
}


function getBookingDetailsPaymentId() {

    return (

        bookingPaymentData?.paymentId ||

        bookingPaymentData?.PaymentId ||

        bookingPaymentData?.id ||

        bookingPaymentData?.Id ||

        null
    );
}


function getBookingDetailsPaymentReference() {

    if (!bookingPaymentData) {

        return "-";
    }


    return String(

        bookingPaymentData
            ?.paymentReference ||

        bookingPaymentData
            ?.PaymentReference ||

        bookingPaymentData
            ?.reference ||

        bookingPaymentData
            ?.Reference ||

        getBookingDetailsPaymentId() ||

        "-"
    );
}


function getBookingDetailsPaymentDate() {

    return (

        bookingPaymentData?.paymentDate ||

        bookingPaymentData?.PaymentDate ||

        bookingPaymentData?.paidAt ||

        bookingPaymentData?.PaidAt ||

        bookingPaymentData?.createdAt ||

        bookingPaymentData?.CreatedAt ||

        null
    );
}


/* =========================================================
   FALLBACK TOTAL
   ========================================================= */

function getBookingDetailsFallbackTotal() {

    const amount =
        Number(

            bookingDetailsData?.totalAmount ??

            bookingDetailsData?.TotalAmount ??

            bookingDetailsData?.amount ??

            0
        );


    return Number.isNaN(amount)
        ? 0
        : amount;
}


/* =========================================================
   DATE
   ========================================================= */

function formatBookingDetailsDate(
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
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


function formatBookingDetailsDateTime(
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
   CURRENCY
   ========================================================= */

function formatBookingDetailsCurrency(
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
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2
        }
    ).format(amount);
}


/* =========================================================
   TEXT
   ========================================================= */

function setBookingDetailsText(
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

function showBookingDetailsLoading() {

    const loading =
        document.getElementById(
            "bookingDetailsLoading"
        );


    const content =
        document.getElementById(
            "bookingDetailsContent"
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


function hideBookingDetailsLoading() {

    const loading =
        document.getElementById(
            "bookingDetailsLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


function showBookingDetailsContent() {

    const content =
        document.getElementById(
            "bookingDetailsContent"
        );


    const notFound =
        document.getElementById(
            "bookingDetailsNotFound"
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

function showBookingDetailsNotFound() {

    const content =
        document.getElementById(
            "bookingDetailsContent"
        );


    const notFound =
        document.getElementById(
            "bookingDetailsNotFound"
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

function showBookingDetailsMessage(
    message
) {

    const element =
        document.getElementById(
            "bookingDetailsMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-error";
}


function clearBookingDetailsMessage() {

    const element =
        document.getElementById(
            "bookingDetailsMessage"
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
   CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    function () {

        stopBookingDetailsHoldTimer();
    }
);