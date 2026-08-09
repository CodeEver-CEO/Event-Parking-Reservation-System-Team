/* =========================================================
   Event & Parking Reservation System
   Customer Seat Selection
   ========================================================= */


let seatSelectionEventId = null;

let currentEvent = null;

let allSeats = [];

let selectedSeats = [];


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeSeatSelectionPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeSeatSelectionPage() {

    if (!validateSeatCustomerAccess()) {
        return;
    }


    seatSelectionEventId =
        getSeatEventIdFromUrl();


    initializeSeatNavigation();


    if (!seatSelectionEventId) {

        hideSeatPageLoading();

        showSeatEventNotFound();

        return;
    }


    await loadSeatSelectionData();
}


/* =========================================================
   CUSTOMER AUTH CHECK
   ========================================================= */

function validateSeatCustomerAccess() {

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

function getSeatEventIdFromUrl() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        "eventId"
    );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeSeatNavigation() {

    const backButton =
        document.getElementById(
            "backToEventButton"
        );


    const continueButton =
        document.getElementById(
            "continueToParkingButton"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                if (!seatSelectionEventId) {

                    window.location.href =
                        "events.html";

                    return;
                }


                window.location.href =
                    `event-details.html?id=${encodeURIComponent(
                        seatSelectionEventId
                    )}`;
            }
        );
    }


    if (continueButton) {

        continueButton.addEventListener(
            "click",
            continueToParking
        );
    }
}


/* =========================================================
   LOAD EVENT + SEATS
   ========================================================= */

async function loadSeatSelectionData() {

    clearSeatPageMessage();

    showSeatPageLoading();


    try {

        /*
         * BRD:
         *
         * GET /api/events/{id}
         *
         * GET /api/events/{eventId}/seats
         */

        const responses =
            await Promise.all([

                apiGet(
                    `/events/${encodeURIComponent(
                        seatSelectionEventId
                    )}`
                ),

                apiGet(
                    `/events/${encodeURIComponent(
                        seatSelectionEventId
                    )}/seats`
                )

            ]);


        currentEvent =
            normalizeSeatObject(
                responses[0]
            );


        allSeats =
            normalizeSeatArray(
                responses[1]
            );


        if (!currentEvent) {

            hideSeatPageLoading();

            showSeatEventNotFound();

            return;
        }


        renderSeatEventInformation();

        renderSeatMap();

        updateSeatSelectionSummary();


        hideSeatPageLoading();

        showSeatPageContent();


    } catch (error) {

        console.error(
            "Seat Page Error:",
            error
        );


        hideSeatPageLoading();


        if (
            error.status === 404
        ) {

            showSeatEventNotFound();

            return;
        }


        showSeatPageMessage(
            error.message ||
            "Unable to load the seat map."
        );
    }
}


/* =========================================================
   NORMALIZE EVENT
   ========================================================= */

function normalizeSeatObject(response) {

    if (!response) {
        return null;
    }


    return response.data || response;
}


/* =========================================================
   NORMALIZE SEATS
   ========================================================= */

function normalizeSeatArray(response) {

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
        Array.isArray(response.seats)
    ) {

        return response.seats;
    }


    return [];
}


/* =========================================================
   EVENT INFORMATION
   ========================================================= */

function renderSeatEventInformation() {

    const eventName =
        getSeatEventName(
            currentEvent
        );


    const ticketPrice =
        getSeatEventTicketPrice(
            currentEvent
        );


    setSeatText(
        "seatEventName",
        eventName
    );


    setSeatText(
        "summaryEventName",
        eventName
    );


    setSeatText(
        "summaryTicketPrice",
        formatSeatCurrency(
            ticketPrice
        )
    );
}


/* =========================================================
   RENDER SEAT MAP
   ========================================================= */

function renderSeatMap() {

    const seatMap =
        document.getElementById(
            "seatMap"
        );


    const noSeatMap =
        document.getElementById(
            "noSeatMap"
        );


    if (
        !seatMap ||
        !noSeatMap
    ) {
        return;
    }


    seatMap.innerHTML =
        "";


    if (allSeats.length === 0) {

        seatMap.classList.add(
            "hidden"
        );


        noSeatMap.classList.remove(
            "hidden"
        );


        return;
    }


    seatMap.classList.remove(
        "hidden"
    );


    noSeatMap.classList.add(
        "hidden"
    );


    const rows =
        groupSeatsByRow(
            allSeats
        );


    Object.keys(rows)
        .sort()
        .forEach(
            function (rowName) {

                const rowElement =
                    createSeatRow(
                        rowName,
                        rows[rowName]
                    );


                seatMap.appendChild(
                    rowElement
                );
            }
        );
}


/* =========================================================
   GROUP BY ROW
   ========================================================= */

function groupSeatsByRow(seats) {

    const rows = {};


    seats.forEach(
        function (seat) {

            const row =
                getSeatRow(
                    seat
                );


            if (!rows[row]) {

                rows[row] = [];
            }


            rows[row].push(
                seat
            );
        }
    );


    /*
     * Sort seats inside each row
     */

    Object.keys(rows)
        .forEach(
            function (row) {

                rows[row].sort(
                    compareSeats
                );
            }
        );


    return rows;
}


/* =========================================================
   COMPARE SEATS
   ========================================================= */

function compareSeats(a, b) {

    const first =
        getSeatOrderNumber(a);


    const second =
        getSeatOrderNumber(b);


    return first - second;
}


/* =========================================================
   CREATE ROW
   ========================================================= */

function createSeatRow(
    rowName,
    seats
) {

    const rowElement =
        document.createElement(
            "div"
        );


    rowElement.className =
        "seat-row";


    const rowLabel =
        document.createElement(
            "span"
        );


    rowLabel.className =
        "seat-row-label";


    rowLabel.textContent =
        rowName;


    rowElement.appendChild(
        rowLabel
    );


    seats.forEach(
        function (seat) {

            rowElement.appendChild(
                createSeatButton(
                    seat
                )
            );
        }
    );


    return rowElement;
}


/* =========================================================
   CREATE SEAT
   ========================================================= */

function createSeatButton(seat) {

    const seatButton =
        document.createElement(
            "button"
        );


    seatButton.type =
        "button";


    seatButton.className =
        "seat-button";


    const seatNumber =
        getSeatNumber(
            seat
        );


    seatButton.textContent =
        seatNumber;


    seatButton.title =
        seatNumber;


    const status =
        getSeatStatus(
            seat
        );


    /*
     * Booked / unavailable
     */

    if (status === "booked") {

        seatButton.classList.add(
            "booked"
        );


        seatButton.disabled =
            true;


        return seatButton;
    }


    /*
     * Available
     */

    seatButton.classList.add(
        "available"
    );


    seatButton.addEventListener(
        "click",
        function () {

            toggleSeatSelection(
                seat,
                seatButton
            );
        }
    );


    return seatButton;
}


/* =========================================================
   TOGGLE SEAT
   ========================================================= */

function toggleSeatSelection(
    seat,
    button
) {

    const seatId =
        getSeatId(
            seat
        );


    if (!seatId) {
        return;
    }


    const existingIndex =
        selectedSeats.findIndex(
            function (selectedSeat) {

                return String(
                    getSeatId(
                        selectedSeat
                    )
                ) === String(seatId);
            }
        );


    /*
     * Already selected -> remove
     */

    if (existingIndex !== -1) {

        selectedSeats.splice(
            existingIndex,
            1
        );


        button.classList.remove(
            "selected"
        );


        button.classList.add(
            "available"
        );


    } else {

        /*
         * Add selection
         */

        selectedSeats.push(
            seat
        );


        button.classList.remove(
            "available"
        );


        button.classList.add(
            "selected"
        );
    }


    updateSeatSelectionSummary();
}


/* =========================================================
   UPDATE SUMMARY
   ========================================================= */

function updateSeatSelectionSummary() {

    const selectedContainer =
        document.getElementById(
            "selectedSeatsContainer"
        );


    const continueButton =
        document.getElementById(
            "continueToParkingButton"
        );


    setSeatText(
        "selectedSeatCount",
        selectedSeats.length
    );


    if (selectedContainer) {

        selectedContainer.innerHTML =
            "";


        if (
            selectedSeats.length === 0
        ) {

            const emptyText =
                document.createElement(
                    "span"
                );


            emptyText.className =
                "no-selected-seat-text";


            emptyText.textContent =
                "No seats selected";


            selectedContainer.appendChild(
                emptyText
            );


        } else {

            selectedSeats
                .sort(
                    compareSeats
                )
                .forEach(
                    function (seat) {

                        const chip =
                            document.createElement(
                                "span"
                            );


                        chip.className =
                            "selected-seat-chip";


                        chip.textContent =
                            getSeatNumber(
                                seat
                            );


                        selectedContainer.appendChild(
                            chip
                        );
                    }
                );
        }
    }


    const total =
        calculateSelectedSeatTotal();


    setSeatText(
        "seatTotalPrice",
        formatSeatCurrency(total)
    );


    if (continueButton) {

        continueButton.disabled =
            selectedSeats.length === 0;
    }
}


/* =========================================================
   CALCULATE TOTAL
   ========================================================= */

function calculateSelectedSeatTotal() {

    const defaultPrice =
        Number(
            getSeatEventTicketPrice(
                currentEvent
            )
        ) || 0;


    return selectedSeats.reduce(
        function (total, seat) {

            /*
             * BRD allows optional
             * seat type / price tier.
             *
             * If seat has its own price,
             * use it. Otherwise use event
             * ticket price.
             */

            const seatPrice =
                getIndividualSeatPrice(
                    seat
                );


            return (
                total +
                (
                    seatPrice !== null
                        ? seatPrice
                        : defaultPrice
                )
            );
        },
        0
    );
}


/* =========================================================
   CONTINUE TO PARKING
   ========================================================= */

function continueToParking() {

    if (
        selectedSeats.length === 0
    ) {

        showSeatPageMessage(
            "Please select at least one seat before continuing."
        );

        return;
    }


    /*
     * Store temporary reservation
     * information for next page.
     */

    const seatSelectionData = {

        eventId:
            seatSelectionEventId,

        eventName:
            getSeatEventName(
                currentEvent
            ),

        ticketPrice:
            getSeatEventTicketPrice(
                currentEvent
            ),

        seats:
            selectedSeats.map(
                function (seat) {

                    return {

                        seatId:
                            getSeatId(seat),

                        seatNumber:
                            getSeatNumber(seat),

                        price:
                            getEffectiveSeatPrice(
                                seat
                            )
                    };
                }
            ),

        seatTotal:
            calculateSelectedSeatTotal()
    };


    sessionStorage.setItem(
        "eventParkingSeatSelection",
        JSON.stringify(
            seatSelectionData
        )
    );


    /*
     * Parking is next step.
     */

    window.location.href =
        `parking-selection.html?eventId=${encodeURIComponent(
            seatSelectionEventId
        )}`;
}


/* =========================================================
   EVENT HELPERS
   ========================================================= */

function getSeatEventName(eventData) {

    return (
        eventData?.name ||
        eventData?.eventName ||
        eventData?.EventName ||
        eventData?.Name ||
        "Event"
    );
}


function getSeatEventTicketPrice(
    eventData
) {

    return Number(
        eventData?.ticketPrice ??
        eventData?.TicketPrice ??
        eventData?.price ??
        eventData?.Price ??
        0
    );
}


/* =========================================================
   SEAT HELPERS
   ========================================================= */

function getSeatId(seat) {

    return (
        seat.id ||
        seat.seatId ||
        seat.SeatId ||
        seat.Id ||
        null
    );
}


function getSeatNumber(seat) {

    return String(
        seat.seatNumber ||
        seat.SeatNumber ||
        seat.number ||
        seat.Number ||
        "-"
    );
}


/* =========================================================
   ROW
   ========================================================= */

function getSeatRow(seat) {

    const explicitRow =
        seat.row ||
        seat.rowName ||
        seat.Row ||
        seat.RowName;


    if (explicitRow) {

        return String(
            explicitRow
        ).toUpperCase();
    }


    /*
     * If seat number = A12,
     * row = A
     */

    const seatNumber =
        getSeatNumber(
            seat
        );


    const match =
        seatNumber.match(
            /^[A-Za-z]+/
        );


    if (match) {

        return match[0]
            .toUpperCase();
    }


    return "ROW";
}


/* =========================================================
   ORDER NUMBER
   ========================================================= */

function getSeatOrderNumber(seat) {

    const explicitNumber =
        seat.column ??
        seat.columnNumber ??
        seat.Column ??
        seat.ColumnNumber;


    if (
        explicitNumber !== undefined &&
        explicitNumber !== null
    ) {

        return (
            Number(explicitNumber) ||
            0
        );
    }


    const seatNumber =
        getSeatNumber(
            seat
        );


    const match =
        seatNumber.match(
            /(\d+)$/
        );


    return match
        ? Number(match[1])
        : 0;
}


/* =========================================================
   STATUS
   ========================================================= */

function getSeatStatus(seat) {

    const status =
        String(
            seat.status ||
            seat.Status ||
            ""
        )
            .trim()
            .toLowerCase();


    /*
     * Backend may return:
     *
     * Available
     * Booked
     * Occupied
     * Reserved
     */

    if (
        status === "booked" ||
        status === "occupied" ||
        status === "reserved" ||
        seat.isBooked === true ||
        seat.IsBooked === true ||
        seat.available === false ||
        seat.isAvailable === false
    ) {

        return "booked";
    }


    return "available";
}


/* =========================================================
   INDIVIDUAL SEAT PRICE
   ========================================================= */

function getIndividualSeatPrice(seat) {

    const rawPrice =
        seat.price ??
        seat.Price ??
        seat.seatPrice ??
        seat.SeatPrice ??
        null;


    if (
        rawPrice === null ||
        rawPrice === undefined
    ) {

        return null;
    }


    const value =
        Number(rawPrice);


    return Number.isNaN(value)
        ? null
        : value;
}


/* =========================================================
   EFFECTIVE SEAT PRICE
   ========================================================= */

function getEffectiveSeatPrice(seat) {

    const seatPrice =
        getIndividualSeatPrice(
            seat
        );


    if (seatPrice !== null) {

        return seatPrice;
    }


    return getSeatEventTicketPrice(
        currentEvent
    );
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatSeatCurrency(value) {

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

function setSeatText(
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
   LOADING
   ========================================================= */

function showSeatPageLoading() {

    const loading =
        document.getElementById(
            "seatPageLoading"
        );


    const content =
        document.getElementById(
            "seatPageContent"
        );


    const notFound =
        document.getElementById(
            "seatEventNotFound"
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


    if (notFound) {

        notFound.classList.add(
            "hidden"
        );
    }
}


function hideSeatPageLoading() {

    const loading =
        document.getElementById(
            "seatPageLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


function showSeatPageContent() {

    const content =
        document.getElementById(
            "seatPageContent"
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

function showSeatEventNotFound() {

    const notFound =
        document.getElementById(
            "seatEventNotFound"
        );


    const content =
        document.getElementById(
            "seatPageContent"
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

function showSeatPageMessage(message) {

    const element =
        document.getElementById(
            "seatPageMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-error";
}


function clearSeatPageMessage() {

    const element =
        document.getElementById(
            "seatPageMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.className =
        "alert hidden";
}
