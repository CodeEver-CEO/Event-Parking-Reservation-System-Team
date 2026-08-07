/* =========================================================
   Event & Parking Reservation System
   Booking Summary
   ========================================================= */


let bookingSummaryEventId = null;

let bookingSummaryEvent = null;

let bookingSeatSelection = null;

let bookingParkingSelection = null;

let bookingRequestInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeBookingSummaryPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeBookingSummaryPage() {

    if (!validateBookingCustomerAccess()) {
        return;
    }


    bookingSummaryEventId =
        getBookingSummaryEventId();


    bookingSeatSelection =
        getBookingSessionData(
            "eventParkingSeatSelection"
        );


    bookingParkingSelection =
        getBookingSessionData(
            "eventParkingParkingSelection"
        );


    initializeBookingSummaryButtons();


    if (
        !validateBookingSelections()
    ) {

        hideBookingSummaryLoading();

        showMissingBookingSelection();

        return;
    }


    await loadBookingSummaryEvent();
}


/* =========================================================
   AUTH CHECK
   ========================================================= */

function validateBookingCustomerAccess() {

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
   EVENT ID
   ========================================================= */

function getBookingSummaryEventId() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        "eventId"
    );
}


/* =========================================================
   SESSION DATA
   ========================================================= */

function getBookingSessionData(key) {

    const stored =
        sessionStorage.getItem(
            key
        );


    if (!stored) {
        return null;
    }


    try {

        return JSON.parse(
            stored
        );


    } catch (error) {

        console.error(
            `Invalid session data: ${key}`,
            error
        );


        return null;
    }
}


/* =========================================================
   VALIDATE SELECTIONS
   ========================================================= */

function validateBookingSelections() {

    if (!bookingSummaryEventId) {
        return false;
    }


    if (!bookingSeatSelection) {
        return false;
    }


    if (
        String(
            bookingSeatSelection.eventId
        ) !==
        String(
            bookingSummaryEventId
        )
    ) {
        return false;
    }


    if (
        !Array.isArray(
            bookingSeatSelection.seats
        ) ||
        bookingSeatSelection.seats.length === 0
    ) {
        return false;
    }


    /*
     * Parking data should exist even
     * when parkingSelected = false.
     */

    if (!bookingParkingSelection) {
        return false;
    }


    if (
        String(
            bookingParkingSelection.eventId
        ) !==
        String(
            bookingSummaryEventId
        )
    ) {
        return false;
    }


    return true;
}


/* =========================================================
   BUTTONS
   ========================================================= */

function initializeBookingSummaryButtons() {

    const backButton =
        document.getElementById(
            "backToParkingButton"
        );


    const confirmButton =
        document.getElementById(
            "confirmBookingButton"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                if (!bookingSummaryEventId) {

                    window.location.href =
                        "events.html";

                    return;
                }


                window.location.href =
                    `parking-selection.html?eventId=${encodeURIComponent(
                        bookingSummaryEventId
                    )}`;
            }
        );
    }


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            confirmBooking
        );
    }
}


/* =========================================================
   LOAD EVENT
   ========================================================= */

async function loadBookingSummaryEvent() {

    clearBookingSummaryMessage();

    showBookingSummaryLoading();


    try {

        bookingSummaryEvent =
            await apiGet(
                `/events/${encodeURIComponent(
                    bookingSummaryEventId
                )}`
            );


        if (
            bookingSummaryEvent?.data
        ) {

            bookingSummaryEvent =
                bookingSummaryEvent.data;
        }


        if (!bookingSummaryEvent) {

            hideBookingSummaryLoading();

            showMissingBookingSelection();

            return;
        }


        renderBookingSummary();


        hideBookingSummaryLoading();

        showBookingSummaryContent();


    } catch (error) {

        console.error(
            "Booking Summary Error:",
            error
        );


        hideBookingSummaryLoading();


        showBookingSummaryMessage(
            error.message ||
            "Unable to prepare your booking."
        );
    }
}


/* =========================================================
   RENDER SUMMARY
   ========================================================= */

function renderBookingSummary() {

    const eventName =
        getBookingEventName();


    const eventDate =
        getBookingEventDate();


    const eventTime =
        getBookingEventTime();


    const venue =
        getBookingEventVenue();


    const seatTotal =
        Number(
            bookingSeatSelection?.seatTotal ||
            0
        );


    const parkingFee =
        bookingParkingSelection
            ?.parkingSelected
            ? Number(
                bookingParkingSelection
                    .parkingFee || 0
            )
            : 0;


    const grandTotal =
        seatTotal +
        parkingFee;


    setBookingText(
        "bookingEventName",
        eventName
    );


    setBookingText(
        "bookingEventDate",
        formatBookingDate(
            eventDate
        )
    );


    setBookingText(
        "bookingEventTime",
        eventTime ||
        "Time not available"
    );


    setBookingText(
        "bookingEventVenue",
        venue
    );


    setBookingText(
        "bookingSeatTotal",
        formatBookingCurrency(
            seatTotal
        )
    );


    setBookingText(
        "finalSeatAmount",
        formatBookingCurrency(
            seatTotal
        )
    );


    setBookingText(
        "bookingParkingFee",
        formatBookingCurrency(
            parkingFee
        )
    );


    setBookingText(
        "finalParkingAmount",
        formatBookingCurrency(
            parkingFee
        )
    );


    setBookingText(
        "bookingGrandTotal",
        formatBookingCurrency(
            grandTotal
        )
    );


    renderBookingSeats();

    renderBookingParking();
}


/* =========================================================
   RENDER SEATS
   ========================================================= */

function renderBookingSeats() {

    const container =
        document.getElementById(
            "bookingSelectedSeats"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    bookingSeatSelection
        .seats
        .forEach(
            function (seat) {

                const item =
                    document.createElement(
                        "span"
                    );


                item.className =
                    "booking-seat-item";


                item.textContent =
                    seat.seatNumber ||
                    "-";


                container.appendChild(
                    item
                );
            }
        );
}


/* =========================================================
   RENDER PARKING
   ========================================================= */

function renderBookingParking() {

    const parkingSelected =
        document.getElementById(
            "bookingParkingSelected"
        );


    const noParking =
        document.getElementById(
            "bookingNoParking"
        );


    if (
        bookingParkingSelection
            .parkingSelected
    ) {

        if (parkingSelected) {

            parkingSelected.classList.remove(
                "hidden"
            );
        }


        if (noParking) {

            noParking.classList.add(
                "hidden"
            );
        }


        setBookingText(
            "bookingParkingSlot",
            bookingParkingSelection
                .slotNumber || "-"
        );


        setBookingText(
            "bookingParkingZone",
            bookingParkingSelection
                .zone || "-"
        );


    } else {

        if (parkingSelected) {

            parkingSelected.classList.add(
                "hidden"
            );
        }


        if (noParking) {

            noParking.classList.remove(
                "hidden"
            );
        }
    }
}


/* =========================================================
   CONFIRM BOOKING
   ========================================================= */

async function confirmBooking() {

    if (bookingRequestInProgress) {
        return;
    }


    clearBookingSummaryMessage();


    const confirmed =
        await openConfirmationModal({

            title:
                "Confirm Booking",

            message:
                "Confirm this booking? Your selected seats and optional parking slot will be temporarily held while you complete payment.",

            confirmText:
                "Confirm Booking",

            cancelText:
                "Review Again"
        });


    if (!confirmed) {
        return;
    }


    await createBooking();
}


/* =========================================================
   CREATE BOOKING
   ========================================================= */

async function createBooking() {

    const customerId =
        getBookingCustomerId();


    if (!customerId) {

        showBookingSummaryMessage(
            "Customer information is unavailable. Please login again."
        );

        return;
    }


    const seatIds =
        bookingSeatSelection
            .seats
            .map(
                function (seat) {

                    return seat.seatId;
                }
            )
            .filter(
                function (seatId) {

                    return (
                        seatId !== null &&
                        seatId !== undefined
                    );
                }
            );


    if (seatIds.length === 0) {

        showBookingSummaryMessage(
            "At least one valid seat is required."
        );

        return;
    }


    /*
     * Frontend request DTO assumption.
     *
     * Adjust these property names if your
     * backend Swagger uses different names.
     */

    const requestData = {

        customerId:
            normalizeBookingId(
                customerId
            ),

        eventId:
            normalizeBookingId(
                bookingSummaryEventId
            ),

        seatIds:
            seatIds.map(
                normalizeBookingId
            ),

        parkingSlotId:
            bookingParkingSelection
                .parkingSelected
                ? normalizeBookingId(
                    bookingParkingSelection
                        .slotId
                )
                : null
    };


    setBookingCreatingState(true);


    try {

        /*
         * BRD:
         *
         * POST /api/bookings
         *
         * Creates:
         * - Booking
         * - Selected Seats
         * - Optional Parking
         * - Pending Status
         * - Temporary Hold
         */

        const response =
            await apiPost(
                "/bookings",
                requestData
            );


        handleBookingCreated(
            response
        );


    } catch (error) {

        console.error(
            "Booking Creation Error:",
            error
        );


        handleBookingCreationError(
            error
        );


    } finally {

        setBookingCreatingState(false);
    }
}


/* =========================================================
   BOOKING SUCCESS
   ========================================================= */

function handleBookingCreated(response) {

    const data =
        response?.data ||
        response ||
        {};


    const bookingId =
        data.bookingId ||
        data.id ||
        data.BookingId ||
        data.Id ||
        null;


    const bookingNumber =
        data.bookingNumber ||
        data.BookingNumber ||
        null;


    const holdExpiresAt =
        data.holdExpiresAt ||
        data.HoldExpiresAt ||
        null;


    if (!bookingId) {

        showBookingSummaryMessage(
            "The booking was created, but the server did not return a booking ID. Please check the backend response."
        );

        console.error(
            "Booking response:",
            response
        );

        return;
    }


    /*
     * Save pending booking for
     * payment / hold timer page.
     */

    const pendingBooking = {

        bookingId:
            bookingId,

        bookingNumber:
            bookingNumber,

        holdExpiresAt:
            holdExpiresAt,

        eventId:
            bookingSummaryEventId
    };


    sessionStorage.setItem(
        "eventParkingPendingBooking",
        JSON.stringify(
            pendingBooking
        )
    );


    /*
     * Old selection has now become
     * an actual server booking.
     */

    sessionStorage.removeItem(
        "eventParkingSeatSelection"
    );


    sessionStorage.removeItem(
        "eventParkingParkingSelection"
    );


    showBookingSummarySuccess(
        bookingNumber
    );


    setTimeout(
        function () {

            window.location.href =
                `payment.html?bookingId=${encodeURIComponent(
                    bookingId
                )}`;

        },
        1200
    );
}


/* =========================================================
   SUCCESS MESSAGE
   ========================================================= */

function showBookingSummarySuccess(
    bookingNumber
) {

    const element =
        document.getElementById(
            "bookingSummaryMessage"
        );


    if (!element) {
        return;
    }


    element.className =
        "alert alert-success";


    element.textContent =
        bookingNumber
            ? `Booking ${bookingNumber} created successfully. Redirecting to payment...`
            : "Booking created successfully. Redirecting to payment...";
}


/* =========================================================
   ERROR HANDLING
   ========================================================= */

function handleBookingCreationError(error) {

    let message =
        getBookingApiErrorMessage(
            error
        );


    /*
     * Concurrency Conflict
     *
     * Seat or parking slot may have
     * been taken just before submit.
     */

    if (error.status === 409) {

        message =
            error.message ||
            "One of your selected seats or the parking slot was just taken by another customer. Please return and choose another available option.";
    }


    /*
     * Validation
     */

    if (error.status === 400) {

        message =
            getBookingApiErrorMessage(
                error
            ) ||
            "The booking could not be created. Please check your selection.";
    }


    /*
     * Customer not allowed
     * e.g. unverified/deactivated.
     */

    if (error.status === 403) {

        message =
            error.message ||
            "Your account is not allowed to create this booking.";
    }


    showBookingSummaryMessage(
        message
    );
}


/* =========================================================
   ASP.NET VALIDATION ERROR
   ========================================================= */

function getBookingApiErrorMessage(error) {

    if (
        error?.data?.errors
    ) {

        const messages = [];


        Object.values(
            error.data.errors
        )
            .forEach(
                function (errorList) {

                    if (
                        Array.isArray(
                            errorList
                        )
                    ) {

                        messages.push(
                            ...errorList
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
        "Unable to create your booking."
    );
}


/* =========================================================
   CUSTOMER ID
   ========================================================= */

function getBookingCustomerId() {

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
   NORMALIZE ID
   ========================================================= */

function normalizeBookingId(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;
    }


    const number =
        Number(value);


    /*
     * Numeric IDs become numbers.
     * GUID/string IDs remain strings.
     */

    return Number.isNaN(number)
        ? value
        : number;
}


/* =========================================================
   EVENT HELPERS
   ========================================================= */

function getBookingEventName() {

    return (
        bookingSummaryEvent?.name ||
        bookingSummaryEvent?.eventName ||
        bookingSummaryEvent?.EventName ||
        bookingSummaryEvent?.Name ||
        bookingSeatSelection?.eventName ||
        "Event"
    );
}


function getBookingEventDate() {

    return (
        bookingSummaryEvent?.date ||
        bookingSummaryEvent?.eventDate ||
        bookingSummaryEvent?.EventDate ||
        bookingSummaryEvent?.startDate ||
        null
    );
}


function getBookingEventTime() {

    const start =
        bookingSummaryEvent?.startTime ||
        bookingSummaryEvent?.StartTime ||
        bookingSummaryEvent?.time ||
        "";


    const end =
        bookingSummaryEvent?.endTime ||
        bookingSummaryEvent?.EndTime ||
        "";


    if (
        start &&
        end
    ) {

        return `${start} - ${end}`;
    }


    return start;
}


function getBookingEventVenue() {

    return (
        bookingSummaryEvent?.venueName ||
        bookingSummaryEvent?.VenueName ||
        bookingSummaryEvent?.venue?.name ||
        bookingSummaryEvent?.Venue?.Name ||
        "Venue not available"
    );
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatBookingDate(value) {

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

function formatBookingCurrency(value) {

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

function setBookingText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value ?? "";
    }
}


/* =========================================================
   CREATING STATE
   ========================================================= */

function setBookingCreatingState(
    creating
) {

    bookingRequestInProgress =
        creating;


    const button =
        document.getElementById(
            "confirmBookingButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        creating;


    button.textContent =
        creating
            ? "Creating Booking..."
            : "Confirm Booking";
}


/* =========================================================
   LOADING
   ========================================================= */

function showBookingSummaryLoading() {

    const loading =
        document.getElementById(
            "bookingSummaryLoading"
        );


    const content =
        document.getElementById(
            "bookingSummaryContent"
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


function hideBookingSummaryLoading() {

    const loading =
        document.getElementById(
            "bookingSummaryLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


function showBookingSummaryContent() {

    const content =
        document.getElementById(
            "bookingSummaryContent"
        );


    const missing =
        document.getElementById(
            "bookingSelectionMissing"
        );


    if (missing) {

        missing.classList.add(
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
   MISSING STATE
   ========================================================= */

function showMissingBookingSelection() {

    const content =
        document.getElementById(
            "bookingSummaryContent"
        );


    const missing =
        document.getElementById(
            "bookingSelectionMissing"
        );


    if (content) {

        content.classList.add(
            "hidden"
        );
    }


    if (missing) {

        missing.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function showBookingSummaryMessage(message) {

    const element =
        document.getElementById(
            "bookingSummaryMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-error";
}


function clearBookingSummaryMessage() {

    const element =
        document.getElementById(
            "bookingSummaryMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.className =
        "alert hidden";
}
