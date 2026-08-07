/* =========================================================
   Event & Parking Reservation System
   Customer - My Bookings
   ========================================================= */


let customerBookings = [];


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeMyBookingsPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeMyBookingsPage() {

    if (!validateMyBookingsAccess()) {
        return;
    }


    initializeMyBookingFilters();


    await loadCustomerBookings();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateMyBookingsAccess() {

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
   FILTER EVENTS
   ========================================================= */

function initializeMyBookingFilters() {

    const search =
        document.getElementById(
            "bookingSearch"
        );


    const status =
        document.getElementById(
            "bookingStatusFilter"
        );


    const clearButton =
        document.getElementById(
            "clearBookingFiltersButton"
        );


    if (search) {

        search.addEventListener(
            "input",
            applyMyBookingFilters
        );
    }


    if (status) {

        status.addEventListener(
            "change",
            applyMyBookingFilters
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


                if (status) {

                    status.value =
                        "";
                }


                applyMyBookingFilters();
            }
        );
    }
}


/* =========================================================
   CUSTOMER ID
   ========================================================= */

function getMyBookingsCustomerId() {

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
   LOAD BOOKINGS
   ========================================================= */

async function loadCustomerBookings() {

    clearMyBookingsMessage();

    showMyBookingsLoading();


    const customerId =
        getMyBookingsCustomerId();


    if (!customerId) {

        hideMyBookingsLoading();


        showMyBookingsMessage(
            "Customer information is unavailable. Please login again."
        );


        return;
    }


    try {

        /*
         * BRD:
         *
         * GET /api/bookings/customer/{customerId}
         */

        const response =
            await apiGet(
                `/bookings/customer/${encodeURIComponent(
                    customerId
                )}`
            );


        customerBookings =
            normalizeMyBookingsResponse(
                response
            );


        sortCustomerBookings();


        hideMyBookingsLoading();


        applyMyBookingFilters();


    } catch (error) {

        console.error(
            "My Bookings Error:",
            error
        );


        hideMyBookingsLoading();


        showMyBookingsMessage(
            error.message ||
            "Unable to load your bookings."
        );
    }
}


/* =========================================================
   NORMALIZE RESPONSE
   ========================================================= */

function normalizeMyBookingsResponse(
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
        Array.isArray(response.bookings)
    ) {

        return response.bookings;
    }


    return [];
}


/* =========================================================
   SORT BOOKINGS
   ========================================================= */

function sortCustomerBookings() {

    customerBookings.sort(
        function (a, b) {

            const first =
                new Date(
                    getMyBookingCreatedDate(a) ||
                    getMyBookingEventDate(a) ||
                    0
                );


            const second =
                new Date(
                    getMyBookingCreatedDate(b) ||
                    getMyBookingEventDate(b) ||
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
   APPLY FILTER
   ========================================================= */

function applyMyBookingFilters() {

    const search =
        document
            .getElementById(
                "bookingSearch"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const status =
        document
            .getElementById(
                "bookingStatusFilter"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const filtered =
        customerBookings.filter(
            function (booking) {

                const bookingNumber =
                    getMyBookingNumber(
                        booking
                    )
                        .toLowerCase();


                const eventName =
                    getMyBookingEventName(
                        booking
                    )
                        .toLowerCase();


                const bookingStatus =
                    getMyBookingStatus(
                        booking
                    );


                const matchesSearch =
                    !search ||
                    bookingNumber.includes(
                        search
                    ) ||
                    eventName.includes(
                        search
                    );


                const matchesStatus =
                    !status ||
                    bookingStatus ===
                        status;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    renderMyBookings(
        filtered
    );
}


/* =========================================================
   RENDER BOOKINGS
   ========================================================= */

function renderMyBookings(bookings) {

    const list =
        document.getElementById(
            "myBookingsList"
        );


    const empty =
        document.getElementById(
            "myBookingsEmpty"
        );


    if (
        !list ||
        !empty
    ) {

        return;
    }


    list.innerHTML =
        "";


    updateMyBookingResultCount(
        bookings.length
    );


    if (
        bookings.length === 0
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


    bookings.forEach(
        function (booking) {

            list.appendChild(
                createMyBookingCard(
                    booking
                )
            );
        }
    );
}


/* =========================================================
   CREATE CARD
   ========================================================= */

function createMyBookingCard(booking) {

    const bookingId =
        getMyBookingId(
            booking
        );


    const bookingNumber =
        getMyBookingNumber(
            booking
        );


    const eventName =
        getMyBookingEventName(
            booking
        );


    const eventDate =
        getMyBookingEventDate(
            booking
        );


    const venue =
        getMyBookingVenue(
            booking
        );


    const status =
        getMyBookingStatus(
            booking
        );


    const seats =
        getMyBookingSeats(
            booking
        );


    const parking =
        getMyBookingParkingNumber(
            booking
        );


    const createdAt =
        getMyBookingCreatedDate(
            booking
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "my-booking-card";


    card.innerHTML = `

        <div class="my-booking-card-header">

            <div>

                <span class="my-booking-number">
                    ${escapeMyBookingHtml(
                        bookingNumber
                    )}
                </span>

                <h3>
                    ${escapeMyBookingHtml(
                        eventName
                    )}
                </h3>

            </div>


            <span class="${getMyBookingBadgeClass(status)}">

                ${escapeMyBookingHtml(
                    formatMyBookingStatus(
                        status
                    )
                )}

            </span>

        </div>


        <div class="my-booking-card-body">


            <div class="my-booking-info-item">

                <span>
                    Event Date
                </span>

                <strong>
                    ${escapeMyBookingHtml(
                        formatMyBookingDate(
                            eventDate
                        )
                    )}
                </strong>

            </div>


            <div class="my-booking-info-item">

                <span>
                    Venue
                </span>

                <strong>
                    ${escapeMyBookingHtml(
                        venue
                    )}
                </strong>

            </div>


            <div class="my-booking-info-item">

                <span>
                    Seats
                </span>

                <div class="my-booking-seat-list">

                    ${createMyBookingSeatHtml(
                        seats
                    )}

                </div>

            </div>


            <div class="my-booking-info-item">

                <span>
                    Parking
                </span>

                <strong>
                    ${escapeMyBookingHtml(
                        parking ||
                        "No Parking"
                    )}
                </strong>

            </div>


        </div>


        <div class="my-booking-card-footer">

            <span class="my-booking-created">

                Booked:
                ${escapeMyBookingHtml(
                    formatMyBookingDate(
                        createdAt
                    )
                )}

            </span>


            <div class="my-booking-actions">

                ${
                    bookingId
                        ? `
                            <a
                                href="booking-details.html?id=${encodeURIComponent(
                                    bookingId
                                )}"
                                class="btn btn-outline"
                            >
                                View Details
                            </a>
                          `
                        : ""
                }


                ${
                    bookingId &&
                    status === "pending"
                        ? `
                            <a
                                href="payment.html?bookingId=${encodeURIComponent(
                                    bookingId
                                )}"
                                class="btn btn-primary"
                            >
                                Continue Payment
                            </a>
                          `
                        : ""
                }


                ${
                    bookingId &&
                    canCustomerCancelBooking(
                        status
                    )
                        ? `
                            <button
                                type="button"
                                class="btn btn-danger"
                                data-cancel-booking-id="${escapeMyBookingHtml(
                                    bookingId
                                )}"
                                data-booking-number="${escapeMyBookingHtml(
                                    bookingNumber
                                )}"
                            >
                                Cancel Booking
                            </button>
                          `
                        : ""
                }

            </div>

        </div>
    `;


    initializeBookingCardCancelButton(
        card
    );


    return card;
}


/* =========================================================
   SEAT HTML
   ========================================================= */

function createMyBookingSeatHtml(
    seats
) {

    if (
        seats.length === 0
    ) {

        return `
            <span class="my-booking-seat-chip">
                -
            </span>
        `;
    }


    return seats
        .map(
            function (seat) {

                return `

                    <span class="my-booking-seat-chip">

                        ${escapeMyBookingHtml(
                            getMyBookingSeatNumber(
                                seat
                            )
                        )}

                    </span>
                `;
            }
        )
        .join("");
}


/* =========================================================
   CANCEL BUTTON
   ========================================================= */

function initializeBookingCardCancelButton(
    card
) {

    const button =
        card.querySelector(
            "[data-cancel-booking-id]"
        );


    if (!button) {

        return;
    }


    button.addEventListener(
        "click",
        async function () {

            const bookingId =
                this.dataset
                    .cancelBookingId;


            const bookingNumber =
                this.dataset
                    .bookingNumber;


            await confirmAndCancelBooking(
                bookingId,
                bookingNumber,
                this
            );
        }
    );
}


/* =========================================================
   CAN CANCEL
   ========================================================= */

function canCustomerCancelBooking(status) {

    /*
     * BRD says customers can cancel a
     * booking but does not define an
     * additional frontend cancellation
     * deadline.
     *
     * Therefore the frontend only hides
     * cancel for terminal statuses.
     *
     * Backend remains the final authority.
     */

    return (
        status !== "cancelled" &&
        status !== "expired"
    );
}


/* =========================================================
   CONFIRM CANCELLATION
   ========================================================= */

async function confirmAndCancelBooking(
    bookingId,
    bookingNumber,
    button
) {

    const confirmed =
        await openConfirmationModal({

            title:
                "Cancel Booking",

            message:
                `Cancel ${bookingNumber}? The reserved seats and parking slot, if any, will be released.`,

            confirmText:
                "Cancel Booking",

            cancelText:
                "Keep Booking"
        });


    if (!confirmed) {

        return;
    }


    await cancelCustomerBooking(
        bookingId,
        button
    );
}


/* =========================================================
   DELETE BOOKING
   ========================================================= */

async function cancelCustomerBooking(
    bookingId,
    button
) {

    clearMyBookingsMessage();


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Cancelling...";
    }


    try {

        /*
         * BRD:
         *
         * DELETE /api/bookings/{id}
         *
         * Owner only.
         *
         * Backend must release:
         * - all booked seats
         * - reserved parking slot
         */

        await apiDelete(
            `/bookings/${encodeURIComponent(
                bookingId
            )}`
        );


        clearPendingBookingIfMatches(
            bookingId
        );


        showMyBookingsSuccess(
            "Booking cancelled successfully. Its reserved seats and parking have been released."
        );


        await loadCustomerBookings();


    } catch (error) {

        console.error(
            "Cancel Booking Error:",
            error
        );


        showMyBookingsMessage(
            getCancelBookingErrorMessage(
                error
            )
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
   CANCEL ERROR
   ========================================================= */

function getCancelBookingErrorMessage(
    error
) {

    if (error.status === 403) {

        return (
            error.message ||
            "You are not allowed to cancel this booking."
        );
    }


    if (error.status === 404) {

        return (
            error.message ||
            "This booking could not be found."
        );
    }


    if (error.status === 409) {

        return (
            error.message ||
            "This booking cannot be cancelled in its current state."
        );
    }


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


        if (
            messages.length > 0
        ) {

            return messages.join(
                " "
            );
        }
    }


    return (
        error.message ||
        "Unable to cancel this booking."
    );
}


/* =========================================================
   CLEAR PENDING SESSION
   ========================================================= */

function clearPendingBookingIfMatches(
    bookingId
) {

    const stored =
        sessionStorage.getItem(
            "eventParkingPendingBooking"
        );


    if (!stored) {

        return;
    }


    try {

        const pending =
            JSON.parse(stored);


        if (
            String(
                pending.bookingId
            ) ===
            String(
                bookingId
            )
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
   ID
   ========================================================= */

function getMyBookingId(booking) {

    return (

        booking.id ||

        booking.bookingId ||

        booking.BookingId ||

        booking.Id ||

        null
    );
}


/* =========================================================
   BOOKING NUMBER
   ========================================================= */

function getMyBookingNumber(booking) {

    return String(

        booking.bookingNumber ||

        booking.BookingNumber ||

        `Booking #${getMyBookingId(booking) || "-"}`
    );
}


/* =========================================================
   STATUS
   ========================================================= */

function getMyBookingStatus(booking) {

    return String(

        booking.status ||

        booking.Status ||

        "pending"
    )
        .trim()
        .toLowerCase();
}


function formatMyBookingStatus(status) {

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
   EVENT
   ========================================================= */

function getMyBookingEventName(booking) {

    return String(

        booking.eventName ||

        booking.EventName ||

        booking.event?.name ||

        booking.event?.eventName ||

        booking.Event?.Name ||

        "Event"
    );
}


function getMyBookingEventDate(booking) {

    return (

        booking.eventDate ||

        booking.EventDate ||

        booking.event?.date ||

        booking.event?.eventDate ||

        booking.Event?.Date ||

        null
    );
}


/* =========================================================
   VENUE
   ========================================================= */

function getMyBookingVenue(booking) {

    return String(

        booking.venueName ||

        booking.VenueName ||

        booking.event?.venueName ||

        booking.event?.venue?.name ||

        booking.Event?.Venue?.Name ||

        "Venue not available"
    );
}


/* =========================================================
   SEATS
   ========================================================= */

function getMyBookingSeats(booking) {

    const seats =

        booking.seats ||

        booking.Seats ||

        booking.bookingSeats ||

        booking.BookingSeats ||

        [];


    return Array.isArray(seats)
        ? seats
        : [];
}


function getMyBookingSeatNumber(seat) {

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

function getMyBookingParkingNumber(
    booking
) {

    const parking =

        booking.parkingReservation ||

        booking.ParkingReservation ||

        booking.parking ||

        booking.Parking ||

        null;


    if (parking) {

        return String(

            parking.slotNumber ||

            parking.SlotNumber ||

            parking.parkingSlotNumber ||

            parking.ParkingSlotNumber ||

            parking.slot?.slotNumber ||

            parking.parkingSlot?.slotNumber ||

            ""
        );
    }


    return String(

        booking.parkingSlotNumber ||

        booking.ParkingSlotNumber ||

        ""
    );
}


/* =========================================================
   CREATED DATE
   ========================================================= */

function getMyBookingCreatedDate(booking) {

    return (

        booking.createdAt ||

        booking.CreatedAt ||

        booking.bookingDate ||

        booking.BookingDate ||

        booking.createdDate ||

        null
    );
}


/* =========================================================
   BADGE
   ========================================================= */

function getMyBookingBadgeClass(
    status
) {

    if (
        status === "confirmed"
    ) {

        return "badge badge-success";
    }


    if (
        status === "cancelled" ||
        status === "expired"
    ) {

        return "badge badge-danger";
    }


    return "badge badge-warning";
}


/* =========================================================
   DATE
   ========================================================= */

function formatMyBookingDate(value) {

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
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================================
   RESULT COUNT
   ========================================================= */

function updateMyBookingResultCount(
    count
) {

    const element =
        document.getElementById(
            "bookingResultCount"
        );


    if (!element) {

        return;
    }


    element.textContent =
        count === 1
            ? "1 booking"
            : `${count} bookings`;
}


/* =========================================================
   LOADING
   ========================================================= */

function showMyBookingsLoading() {

    const loading =
        document.getElementById(
            "myBookingsLoading"
        );


    const list =
        document.getElementById(
            "myBookingsList"
        );


    const empty =
        document.getElementById(
            "myBookingsEmpty"
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


function hideMyBookingsLoading() {

    const loading =
        document.getElementById(
            "myBookingsLoading"
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

function showMyBookingsMessage(message) {

    const element =
        document.getElementById(
            "myBookingsMessage"
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
   SUCCESS MESSAGE
   ========================================================= */

function showMyBookingsSuccess(message) {

    const element =
        document.getElementById(
            "myBookingsMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-success";
}


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

function clearMyBookingsMessage() {

    const element =
        document.getElementById(
            "myBookingsMessage"
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

function escapeMyBookingHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}
