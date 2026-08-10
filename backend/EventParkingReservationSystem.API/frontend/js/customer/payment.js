/* =========================================================
   Event & Parking Reservation System
   Payment + Booking Hold
   ========================================================= */


let paymentBookingId = null;

let paymentBookingData = null;

let paymentInformationData = null;

let holdExpiresAt = null;

let holdCountdownInterval = null;

let holdServerSyncInterval = null;

let bookingAlreadyExpired = false;

let paymentAlreadyCompleted = false;

let paymentRequestInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializePaymentPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializePaymentPage() {

    if (!validatePaymentCustomerAccess()) {
        return;
    }


    paymentBookingId =
        getPaymentBookingId();


    initializePaymentButton();


    if (!paymentBookingId) {

        hidePaymentPageLoading();

        showPaymentBookingNotFound();

        return;
    }


    await loadPaymentPageData();
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function validatePaymentCustomerAccess() {

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

function getPaymentBookingId() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    const bookingId =
        parameters.get(
            "bookingId"
        );


    if (bookingId) {

        return bookingId;
    }


    const stored =
        sessionStorage.getItem(
            "eventParkingPendingBooking"
        );


    if (!stored) {

        return null;
    }


    try {

        const data =
            JSON.parse(stored);


        return (
            data.bookingId ||
            null
        );


    } catch (error) {

        return null;
    }
}


/* =========================================================
   PAYMENT BUTTON
   ========================================================= */

function initializePaymentButton() {

    const button =
        document.getElementById(
            "completePaymentButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        handleCompletePayment
    );
}


/* =========================================================
   LOAD PAGE
   ========================================================= */

async function loadPaymentPageData() {

    clearPaymentPageMessage();

    showPaymentPageLoading();


    try {

        /*
         * Booking details
         */

        const bookingResponse =
            await apiGet(
                `/bookings/${encodeURIComponent(
                    paymentBookingId
                )}`
            );


        paymentBookingData =
            bookingResponse?.data ||
            bookingResponse;


        if (!paymentBookingData) {

            hidePaymentPageLoading();

            showPaymentBookingNotFound();

            return;
        }


        renderPaymentBookingDetails();


        /*
         * Check reservation hold.
         */

        await refreshHoldStatus();


        if (bookingAlreadyExpired) {

            hidePaymentPageLoading();

            return;
        }


        /*
         * Backend-calculated amount.
         */

        await loadPaymentInformation();


        hidePaymentPageLoading();


        /*
         * Already paid booking.
         */

        if (paymentAlreadyCompleted) {

            showPaymentSuccessState(
                paymentInformationData
            );

            return;
        }


        showPaymentPageContent();


        updatePaymentButtonAvailability();


        startHoldServerSynchronization();


    } catch (error) {

        console.error(
            "Payment Page Error:",
            error
        );


        hidePaymentPageLoading();


        if (error.status === 404) {

            showPaymentBookingNotFound();

            return;
        }


        showPaymentPageMessage(
            error.message ||
            "Unable to load payment information."
        );
    }
}


/* =========================================================
   GET PAYMENT INFORMATION
   ========================================================= */

async function loadPaymentInformation() {

    /*
     * BRD:
     *
     * GET /api/bookings/{id}/payment
     *
     * Backend calculates:
     * seat prices + parking fee.
     */

    const response =
        await apiGet(
            `/bookings/${encodeURIComponent(
                paymentBookingId
            )}/payment`
        );


    paymentInformationData =
        response?.data ||
        response ||
        {};


    const amount =
        getPaymentAmountDue(
            paymentInformationData
        );


    setPaymentText(
        "paymentAmountDue",
        formatPaymentCurrency(
            amount
        )
    );


    const status =
        getPaymentInformationStatus(
            paymentInformationData
        );


    setPaymentText(
        "paymentStatusText",
        status
    );


    paymentAlreadyCompleted =
        isPaymentCompleted(
            paymentInformationData
        );


    if (paymentAlreadyCompleted) {

        stopHoldCountdown();

        stopHoldServerSynchronization();


        updatePaymentBookingStatus(
            "Confirmed"
        );
    }


    updatePaymentButtonAvailability();
}


/* =========================================================
   PAYMENT AMOUNT
   ========================================================= */

function getPaymentAmountDue(data) {

    const possibleAmount =

        data?.amountDue ??

        data?.AmountDue ??

        data?.totalAmount ??

        data?.TotalAmount ??

        data?.amount ??

        data?.Amount ??

        data?.paymentAmount ??

        data?.PaymentAmount ??

        0;


    const amount =
        Number(possibleAmount);


    return Number.isNaN(amount)
        ? 0
        : amount;
}


/* =========================================================
   PAYMENT STATUS
   ========================================================= */

function getPaymentInformationStatus(data) {

    if (
        isPaymentCompleted(data)
    ) {

        return "Completed";
    }


    return String(

        data?.paymentStatus ||

        data?.PaymentStatus ||

        data?.status ||

        data?.Status ||

        "Pending"
    );
}


/* =========================================================
   CHECK PAID
   ========================================================= */

function isPaymentCompleted(data) {

    if (
        data?.isPaid === true ||
        data?.IsPaid === true ||
        data?.isCompleted === true ||
        data?.IsCompleted === true
    ) {

        return true;
    }


    const status =
        String(

            data?.paymentStatus ||

            data?.PaymentStatus ||

            data?.status ||

            data?.Status ||

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


/* =========================================================
   COMPLETE PAYMENT
   ========================================================= */

async function handleCompletePayment() {

    clearPaymentPageMessage();


    if (
        paymentRequestInProgress ||
        paymentAlreadyCompleted ||
        bookingAlreadyExpired
    ) {

        return;
    }


    /*
     * Check backend again immediately
     * before payment.
     */

    await refreshHoldStatus();


    if (
        bookingAlreadyExpired
    ) {

        return;
    }


    /*
     * Prevent duplicate payment.
     */

    try {

        await loadPaymentInformation();

    } catch (error) {

        showPaymentPageMessage(
            error.message ||
            "Unable to verify payment status."
        );

        return;
    }


    if (paymentAlreadyCompleted) {

        showPaymentSuccessState(
            paymentInformationData
        );

        return;
    }


    const amount =
        getPaymentAmountDue(
            paymentInformationData
        );


    const confirmed =
        await openConfirmationModal({

            title:
                "Confirm Payment",

            message:
                `Complete the simulated payment of ${formatPaymentCurrency(amount)} for this booking?`,

            confirmText:
                "Complete Payment",

            cancelText:
                "Cancel"
        });


    if (!confirmed) {

        return;
    }


    await submitPayment();
}


/* =========================================================
   SUBMIT PAYMENT
   ========================================================= */

async function submitPayment() {

    setPaymentProcessingState(true);


    try {

        /*
         * BRD:
         *
         * POST /api/bookings/{id}/payment
         *
         * No card data is required.
         * This is payment simulation only.
         */

        const response =
            await apiPost(
                `/bookings/${encodeURIComponent(
                    paymentBookingId
                )}/payment`
            );


        processPaymentSuccess(
            response
        );


    } catch (error) {

        console.error(
            "Payment Error:",
            error
        );


        await handlePaymentError(
            error
        );


    } finally {

        setPaymentProcessingState(false);
    }
}


/* =========================================================
   PAYMENT SUCCESS
   ========================================================= */

function processPaymentSuccess(response) {

    paymentAlreadyCompleted =
        true;


    stopHoldCountdown();

    stopHoldServerSynchronization();


    const data =
        response?.data ||
        response ||
        {};


    const amount =
        getPaymentAmountDue(data) ||
        getPaymentAmountDue(
            paymentInformationData
        );


    const paymentId =
        getPaymentId(data);


    const paymentReference =
        getPaymentReference(
            data
        );


    /*
     * Store latest payment.
     */

    sessionStorage.setItem(
        "eventParkingLastPayment",
        JSON.stringify({

            bookingId:
                paymentBookingId,

            paymentId:
                paymentId,

            amount:
                amount,

            paymentReference:
                paymentReference
        })
    );


    /*
     * Pending booking pointer
     * no longer required.
     */

    sessionStorage.removeItem(
        "eventParkingPendingBooking"
    );


    paymentInformationData = {

        ...paymentInformationData,

        ...data,

        amountDue:
            amount,

        paymentId:
            paymentId,

        paymentReference:
            paymentReference,

        paymentStatus:
            "Completed",

        isPaid:
            true
    };


    updatePaymentBookingStatus(
        "Confirmed"
    );


    showPaymentSuccessState(
        paymentInformationData
    );
}


/* =========================================================
   PAYMENT ID
   ========================================================= */

function getPaymentId(data) {

    return (

        data?.paymentId ||

        data?.PaymentId ||

        data?.id ||

        data?.Id ||

        null
    );
}


/* =========================================================
   PAYMENT REFERENCE
   ========================================================= */

function getPaymentReference(data) {

    return String(

        data?.paymentReference ||

        data?.PaymentReference ||

        data?.reference ||

        data?.Reference ||

        data?.transactionReference ||

        data?.TransactionReference ||

        getPaymentId(data) ||

        "-"
    );
}


/* =========================================================
   PAYMENT ERROR
   ========================================================= */

async function handlePaymentError(error) {

    /*
     * Conflict:
     *
     * Common reasons:
     * - Payment already recorded
     * - Booking no longer payable
     */

    if (error.status === 409) {

        try {

            await loadPaymentInformation();


            if (paymentAlreadyCompleted) {

                showPaymentSuccessState(
                    paymentInformationData
                );

                return;
            }

        } catch (refreshError) {

            console.error(
                refreshError
            );
        }


        await refreshHoldStatus();


        if (bookingAlreadyExpired) {

            return;
        }


        showPaymentPageMessage(
            error.message ||
            "This booking cannot be paid at the moment."
        );


        return;
    }


    /*
     * Gone / Expired
     */

    if (error.status === 410) {

        handleBookingExpired();

        return;
    }


    /*
     * Bad request
     */

    if (error.status === 400) {

        const message =
            String(
                error.message ||
                ""
            ).toLowerCase();


        if (
            message.includes("expire") ||
            message.includes("hold")
        ) {

            handleBookingExpired();

            return;
        }
    }


    showPaymentPageMessage(
        getPaymentApiErrorMessage(
            error
        )
    );
}


/* =========================================================
   API VALIDATION MESSAGE
   ========================================================= */

function getPaymentApiErrorMessage(error) {

    if (
        error?.data?.errors
    ) {

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


        if (messages.length > 0) {

            return messages.join(
                " "
            );
        }
    }


    return (
        error?.message ||
        "Unable to complete payment."
    );
}


/* =========================================================
   BUTTON STATE
   ========================================================= */

function updatePaymentButtonAvailability() {

    const button =
        document.getElementById(
            "completePaymentButton"
        );


    const note =
        document.getElementById(
            "paymentButtonNote"
        );


    if (!button) {
        return;
    }


    if (bookingAlreadyExpired) {

        button.disabled = true;

        button.textContent =
            "Booking Expired";


        if (note) {

            note.textContent =
                "This booking can no longer be paid.";
        }


        return;
    }


    if (paymentAlreadyCompleted) {

        button.disabled = true;

        button.textContent =
            "Payment Completed";


        if (note) {

            note.textContent =
                "This booking has already been paid.";
        }


        return;
    }


    if (paymentRequestInProgress) {

        button.disabled = true;

        button.textContent =
            "Processing Payment...";


        return;
    }


    button.disabled =
        false;


    button.textContent =
        "Complete Payment";


    if (note) {

        note.textContent =
            "Simulated payment only — no real transaction will be made.";
    }
}


/* =========================================================
   PROCESSING STATE
   ========================================================= */

function setPaymentProcessingState(
    processing
) {

    paymentRequestInProgress =
        processing;


    updatePaymentButtonAvailability();
}


/* =========================================================
   PAYMENT SUCCESS UI
   ========================================================= */

function showPaymentSuccessState(data) {

    paymentAlreadyCompleted =
        true;


    stopHoldCountdown();

    stopHoldServerSynchronization();


    const content =
        document.getElementById(
            "paymentPageContent"
        );


    const success =
        document.getElementById(
            "paymentSuccessState"
        );


    const expired =
        document.getElementById(
            "paymentExpiredState"
        );


    const notFound =
        document.getElementById(
            "paymentBookingNotFound"
        );


    if (content) {

        content.classList.add(
            "hidden"
        );
    }


    if (expired) {

        expired.classList.add(
            "hidden"
        );
    }


    if (notFound) {

        notFound.classList.add(
            "hidden"
        );
    }


    setPaymentText(
        "paymentSuccessBookingNumber",
        getPaymentBookingNumber()
    );


    setPaymentText(
        "paymentSuccessAmount",
        formatPaymentCurrency(
            getPaymentAmountDue(data)
        )
    );


    setPaymentText(
        "paymentSuccessReference",
        getPaymentReference(data)
    );


    const bookingLink =
        document.getElementById(
            "viewConfirmedBookingLink"
        );


    if (bookingLink) {

        bookingLink.href =
            `booking-details.html?id=${encodeURIComponent(
                paymentBookingId
            )}`;
    }


    if (success) {

        success.classList.remove(
            "hidden"
        );
    }


    sessionStorage.removeItem(
        "eventParkingPendingBooking"
    );
}


/* =========================================================
   HOLD STATUS
   ========================================================= */

async function refreshHoldStatus() {

    if (
        bookingAlreadyExpired ||
        paymentAlreadyCompleted
    ) {

        return;
    }


    try {

        const response =
            await apiGet(
                `/bookings/${encodeURIComponent(
                    paymentBookingId
                )}/hold-status`
            );


        const holdData =
            response?.data ||
            response ||
            {};


        processHoldStatus(
            holdData
        );


    } catch (error) {

        console.error(
            "Hold Status Error:",
            error
        );


        if (
            error.status === 409 ||
            error.status === 410
        ) {

            handleBookingExpired();

            return;
        }


        stopHoldCountdown();


        setPaymentText(
            "holdCountdown",
            "--:--"
        );


        showPaymentPageMessage(
            error.message ||
            "Unable to verify booking hold time."
        );
    }
}


/* =========================================================
   PROCESS HOLD
   ========================================================= */

function processHoldStatus(holdData) {

    const status =
        String(

            holdData.status ||

            holdData.bookingStatus ||

            holdData.BookingStatus ||

            paymentBookingData?.status ||

            paymentBookingData?.Status ||

            "Pending"
        )
            .trim()
            .toLowerCase();


    /*
     * Payment completed /
     * booking confirmed.
     */

    if (
        status === "confirmed" ||
        status === "paid"
    ) {

        paymentAlreadyCompleted =
            true;


        stopHoldCountdown();

        stopHoldServerSynchronization();


        updatePaymentBookingStatus(
            "Confirmed"
        );


        setPaymentText(
            "holdCountdown",
            "00:00"
        );


        return;
    }


    /*
     * Booking expired.
     */

    if (
        status === "expired" ||
        status === "cancelled" ||
        holdData.isExpired === true ||
        holdData.IsExpired === true
    ) {

        handleBookingExpired();

        return;
    }


    updatePaymentBookingStatus(
        status
    );


    /*
     * Absolute expiry time.
     */

    const expiresAt =

        holdData.holdExpiresAt ||

        holdData.HoldExpiresAt ||

        paymentBookingData?.holdExpiresAt ||

        paymentBookingData?.HoldExpiresAt ||

        null;


    if (expiresAt) {

        const expiry =
            new Date(expiresAt);


        if (
            !Number.isNaN(
                expiry.getTime()
            )
        ) {

            holdExpiresAt =
                expiry;


            startHoldCountdown();

            return;
        }
    }


    /*
     * Remaining seconds.
     */

    const remainingSeconds =
        getRemainingHoldSeconds(
            holdData
        );


    if (
        remainingSeconds !== null
    ) {

        if (remainingSeconds <= 0) {

            handleBookingExpired();

            return;
        }


        holdExpiresAt =
            new Date(
                Date.now() +
                remainingSeconds * 1000
            );


        startHoldCountdown();
    }
}


/* =========================================================
   REMAINING SECONDS
   ========================================================= */

function getRemainingHoldSeconds(holdData) {

    const values = [

        holdData.remainingSeconds,

        holdData.RemainingSeconds,

        holdData.remainingTimeSeconds,

        holdData.RemainingTimeSeconds,

        holdData.secondsRemaining,

        holdData.SecondsRemaining

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
   COUNTDOWN
   ========================================================= */

function startHoldCountdown() {

    stopHoldCountdown();


    updateHoldCountdown();


    holdCountdownInterval =
        setInterval(
            updateHoldCountdown,
            1000
        );
}


function updateHoldCountdown() {

    if (
        !holdExpiresAt ||
        bookingAlreadyExpired ||
        paymentAlreadyCompleted
    ) {

        return;
    }


    const milliseconds =
        holdExpiresAt.getTime() -
        Date.now();


    const totalSeconds =
        Math.max(
            0,
            Math.ceil(
                milliseconds / 1000
            )
        );


    if (totalSeconds <= 0) {

        setPaymentText(
            "holdCountdown",
            "00:00"
        );


        stopHoldCountdown();


        /*
         * Backend final authority.
         */

        refreshHoldStatus();


        return;
    }


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    setPaymentText(
        "holdCountdown",
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    );


    updateHoldWarningStyle(
        totalSeconds
    );
}


/* =========================================================
   TIMER STYLE
   ========================================================= */

function updateHoldWarningStyle(
    seconds
) {

    const card =
        document.getElementById(
            "bookingHoldCard"
        );


    if (!card) {
        return;
    }


    card.classList.remove(
        "hold-warning",
        "hold-danger"
    );


    if (seconds <= 60) {

        card.classList.add(
            "hold-danger"
        );


        return;
    }


    if (seconds <= 300) {

        card.classList.add(
            "hold-warning"
        );
    }
}


/* =========================================================
   SERVER SYNC
   ========================================================= */

function startHoldServerSynchronization() {

    stopHoldServerSynchronization();


    holdServerSyncInterval =
        setInterval(
            async function () {

                if (
                    bookingAlreadyExpired ||
                    paymentAlreadyCompleted
                ) {

                    stopHoldServerSynchronization();

                    return;
                }


                await refreshHoldStatus();


                /*
                 * Another process may have
                 * completed payment.
                 */

                if (paymentAlreadyCompleted) {

                    try {

                        await loadPaymentInformation();

                    } catch (error) {

                        console.error(error);
                    }


                    showPaymentSuccessState(
                        paymentInformationData
                    );
                }

            },
            15000
        );
}


/* =========================================================
   STOP TIMER
   ========================================================= */

function stopHoldCountdown() {

    if (holdCountdownInterval) {

        clearInterval(
            holdCountdownInterval
        );


        holdCountdownInterval =
            null;
    }
}


function stopHoldServerSynchronization() {

    if (holdServerSyncInterval) {

        clearInterval(
            holdServerSyncInterval
        );


        holdServerSyncInterval =
            null;
    }
}


/* =========================================================
   EXPIRED
   ========================================================= */

function handleBookingExpired() {

    if (bookingAlreadyExpired) {

        return;
    }


    bookingAlreadyExpired =
        true;


    stopHoldCountdown();

    stopHoldServerSynchronization();


    setPaymentText(
        "holdCountdown",
        "00:00"
    );


    updatePaymentButtonAvailability();


    const content =
        document.getElementById(
            "paymentPageContent"
        );


    const success =
        document.getElementById(
            "paymentSuccessState"
        );


    const expired =
        document.getElementById(
            "paymentExpiredState"
        );


    if (content) {

        content.classList.add(
            "hidden"
        );
    }


    if (success) {

        success.classList.add(
            "hidden"
        );
    }


    if (expired) {

        expired.classList.remove(
            "hidden"
        );
    }


    sessionStorage.removeItem(
        "eventParkingPendingBooking"
    );
}


/* =========================================================
   BOOKING DETAILS
   ========================================================= */

function renderPaymentBookingDetails() {

    setPaymentText(
        "paymentBookingNumber",
        getPaymentBookingNumber()
    );


    setPaymentText(
        "paymentEventName",
        getPaymentEventName()
    );


    setPaymentText(
        "paymentEventDate",
        formatPaymentEventDate(
            getPaymentEventDate()
        )
    );


    setPaymentText(
        "paymentVenue",
        getPaymentVenue()
    );


    updatePaymentBookingStatus(
        getPaymentBookingStatus()
    );


    renderPaymentSeats();

    renderPaymentParking();
}


/* =========================================================
   SEATS
   ========================================================= */

function renderPaymentSeats() {

    const container =
        document.getElementById(
            "paymentSeatsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const seats =
        getPaymentSeats();


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
                "payment-seat-chip";


            chip.textContent =
                getPaymentSeatNumber(
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

function renderPaymentParking() {

    const container =
        document.getElementById(
            "paymentParkingContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const parking =
        getPaymentParking();


    if (!parking) {

        const noParking =
            document.createElement(
                "div"
            );


        noParking.className =
            "payment-no-parking";


        noParking.textContent =
            "No parking reserved for this booking.";


        container.appendChild(
            noParking
        );


        return;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "payment-parking-selected";


    wrapper.innerHTML = `

        <span>
            Reserved Parking
        </span>

        <strong>
            ${escapePaymentHtml(
                getPaymentParkingNumber(
                    parking
                )
            )}
        </strong>
    `;


    container.appendChild(
        wrapper
    );
}


/* =========================================================
   BOOKING HELPERS
   ========================================================= */

function getPaymentBookingNumber() {

    return (

        paymentBookingData?.bookingNumber ||

        paymentBookingData?.BookingNumber ||

        `Booking #${paymentBookingId}`
    );
}


function getPaymentBookingStatus() {

    return String(

        paymentBookingData?.status ||

        paymentBookingData?.Status ||

        "Pending"
    );
}


function getPaymentEventName() {

    return (

        paymentBookingData?.eventName ||

        paymentBookingData?.EventName ||

        paymentBookingData?.event?.name ||

        paymentBookingData?.event?.eventName ||

        paymentBookingData?.Event?.Name ||

        "Event"
    );
}


function getPaymentEventDate() {

    return (

        paymentBookingData?.eventDate ||

        paymentBookingData?.EventDate ||

        paymentBookingData?.event?.date ||

        paymentBookingData?.event?.eventDate ||

        null
    );
}


function getPaymentVenue() {

    return (

        paymentBookingData?.venueName ||

        paymentBookingData?.VenueName ||

        paymentBookingData?.event?.venueName ||

        paymentBookingData?.event?.venue?.name ||

        paymentBookingData?.Event?.Venue?.Name ||

        "Venue not available"
    );
}


/* =========================================================
   SEAT HELPERS
   ========================================================= */

function getPaymentSeats() {

    const seats =

        paymentBookingData?.seats ||

        paymentBookingData?.Seats ||

        paymentBookingData?.bookingSeats ||

        paymentBookingData?.BookingSeats ||

        [];


    return Array.isArray(seats)
        ? seats
        : [];
}


function getPaymentSeatNumber(seat) {

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
   PARKING HELPERS
   ========================================================= */

function getPaymentParking() {

    return (

        paymentBookingData
            ?.parkingReservation ||

        paymentBookingData
            ?.ParkingReservation ||

        paymentBookingData
            ?.parking ||

        paymentBookingData
            ?.Parking ||

        null
    );
}


function getPaymentParkingNumber(parking) {

    return String(

        parking?.slotNumber ||

        parking?.SlotNumber ||

        parking?.parkingSlotNumber ||

        parking?.ParkingSlotNumber ||

        parking?.slot?.slotNumber ||

        parking?.parkingSlot?.slotNumber ||

        "-"
    );
}


/* =========================================================
   BOOKING STATUS BADGE
   ========================================================= */

function updatePaymentBookingStatus(status) {

    const element =
        document.getElementById(
            "paymentBookingStatus"
        );


    if (!element) {
        return;
    }


    const normalized =
        String(status)
            .trim()
            .toLowerCase();


    element.textContent =
        normalized
            ? normalized.charAt(0)
                .toUpperCase() +
              normalized.slice(1)
            : "Pending";


    element.className =
        "badge";


    if (
        normalized === "confirmed" ||
        normalized === "paid"
    ) {

        element.classList.add(
            "badge-success"
        );

        return;
    }


    if (
        normalized === "expired" ||
        normalized === "cancelled"
    ) {

        element.classList.add(
            "badge-danger"
        );

        return;
    }


    element.classList.add(
        "badge-warning"
    );
}


/* =========================================================
   DATE
   ========================================================= */

function formatPaymentEventDate(value) {

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
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatPaymentCurrency(value) {

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

function setPaymentText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "";
    }
}


/* =========================================================
   PAGE LOADING
   ========================================================= */

function showPaymentPageLoading() {

    const loading =
        document.getElementById(
            "paymentPageLoading"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );
    }
}


function hidePaymentPageLoading() {

    const loading =
        document.getElementById(
            "paymentPageLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


function showPaymentPageContent() {

    const content =
        document.getElementById(
            "paymentPageContent"
        );


    if (content) {

        content.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   NOT FOUND
   ========================================================= */

function showPaymentBookingNotFound() {

    const content =
        document.getElementById(
            "paymentPageContent"
        );


    const notFound =
        document.getElementById(
            "paymentBookingNotFound"
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

function showPaymentPageMessage(message) {

    const element =
        document.getElementById(
            "paymentPageMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-error";
}


function clearPaymentPageMessage() {

    const element =
        document.getElementById(
            "paymentPageMessage"
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

function escapePaymentHtml(value) {

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

        stopHoldCountdown();

        stopHoldServerSynchronization();
    }
);
