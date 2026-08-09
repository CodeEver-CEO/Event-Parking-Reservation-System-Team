/* =========================================================
   Event & Parking Reservation System
   Customer Parking Selection
   ========================================================= */


let parkingEventId = null;

let parkingEventData = null;

let seatSelectionData = null;

let parkingSlots = [];

let selectedParkingSlot = null;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeParkingSelectionPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeParkingSelectionPage() {

    if (!validateParkingCustomerAccess()) {
        return;
    }


    parkingEventId =
        getParkingEventIdFromUrl();


    seatSelectionData =
        getStoredSeatSelection();


    initializeParkingNavigation();


    /*
     * Event ID or Seat Selection Missing
     */

    if (
        !parkingEventId ||
        !seatSelectionData ||
        String(seatSelectionData.eventId) !==
            String(parkingEventId)
    ) {

        hideParkingPageLoading();

        showParkingEventNotFound();

        return;
    }


    await loadParkingData();
}


/* =========================================================
   CUSTOMER ACCESS
   ========================================================= */

function validateParkingCustomerAccess() {

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

function getParkingEventIdFromUrl() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        "eventId"
    );
}


/* =========================================================
   STORED SEATS
   ========================================================= */

function getStoredSeatSelection() {

    const storedData =
        sessionStorage.getItem(
            "eventParkingSeatSelection"
        );


    if (!storedData) {
        return null;
    }


    try {

        return JSON.parse(
            storedData
        );


    } catch (error) {

        console.error(
            "Invalid stored seat selection.",
            error
        );


        return null;
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeParkingNavigation() {

    const backButton =
        document.getElementById(
            "backToSeatsButton"
        );


    const withParkingButton =
        document.getElementById(
            "continueWithParkingButton"
        );


    const withoutParkingButton =
        document.getElementById(
            "continueWithoutParkingButton"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                if (!parkingEventId) {

                    window.location.href =
                        "events.html";

                    return;
                }


                window.location.href =
                    `seat-selection.html?eventId=${encodeURIComponent(
                        parkingEventId
                    )}`;
            }
        );
    }


    if (withParkingButton) {

        withParkingButton.addEventListener(
            "click",
            continueWithParking
        );
    }


    if (withoutParkingButton) {

        withoutParkingButton.addEventListener(
            "click",
            continueWithoutParking
        );
    }
}


/* =========================================================
   LOAD PARKING DATA
   ========================================================= */

async function loadParkingData() {

    clearParkingPageMessage();

    showParkingPageLoading();


    try {

        /*
         * BRD:
         *
         * GET /api/events/{eventId}
         *
         * GET /api/events/{eventId}/parking-slots
         */

        const responses =
            await Promise.all([

                apiGet(
                    `/events/${encodeURIComponent(
                        parkingEventId
                    )}`
                ),

                apiGet(
                    `/events/${encodeURIComponent(
                        parkingEventId
                    )}/parking-slots`
                )

            ]);


        parkingEventData =
            normalizeParkingObject(
                responses[0]
            );


        parkingSlots =
            normalizeParkingArray(
                responses[1]
            );


        if (!parkingEventData) {

            hideParkingPageLoading();

            showParkingEventNotFound();

            return;
        }


        renderParkingSummary();

        renderParkingMap();

        updateParkingSelectionSummary();


        hideParkingPageLoading();

        showParkingPageContent();


    } catch (error) {

        console.error(
            "Parking Page Error:",
            error
        );


        hideParkingPageLoading();


        if (error.status === 404) {

            showParkingEventNotFound();

            return;
        }


        showParkingPageMessage(
            error.message ||
            "Unable to load parking information."
        );
    }
}


/* =========================================================
   NORMALIZE EVENT
   ========================================================= */

function normalizeParkingObject(response) {

    if (!response) {
        return null;
    }


    return response.data || response;
}


/* =========================================================
   NORMALIZE PARKING ARRAY
   ========================================================= */

function normalizeParkingArray(response) {

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
        Array.isArray(response.parkingSlots)
    ) {
        return response.parkingSlots;
    }


    return [];
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderParkingSummary() {

    const eventName =
        seatSelectionData?.eventName ||
        getParkingEventName(
            parkingEventData
        );


    setParkingText(
        "parkingEventName",
        eventName
    );


    setParkingText(
        "parkingSummaryEventName",
        eventName
    );


    setParkingText(
        "parkingSeatTotal",
        formatParkingCurrency(
            seatSelectionData?.seatTotal || 0
        )
    );


    renderParkingSummarySeats();
}


/* =========================================================
   SUMMARY SEATS
   ========================================================= */

function renderParkingSummarySeats() {

    const container =
        document.getElementById(
            "parkingSummarySeats"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const seats =
        seatSelectionData?.seats || [];


    if (seats.length === 0) {

        container.textContent =
            "-";

        return;
    }


    seats.forEach(
        function (seat) {

            const chip =
                document.createElement(
                    "span"
                );


            chip.className =
                "parking-seat-chip";


            chip.textContent =
                seat.seatNumber ||
                "-";


            container.appendChild(
                chip
            );
        }
    );
}


/* =========================================================
   RENDER PARKING MAP
   ========================================================= */

function renderParkingMap() {

    const map =
        document.getElementById(
            "parkingMap"
        );


    const emptyState =
        document.getElementById(
            "noParkingLayout"
        );


    if (
        !map ||
        !emptyState
    ) {
        return;
    }


    map.innerHTML =
        "";


    if (parkingSlots.length === 0) {

        map.classList.add(
            "hidden"
        );


        emptyState.classList.remove(
            "hidden"
        );


        return;
    }


    map.classList.remove(
        "hidden"
    );


    emptyState.classList.add(
        "hidden"
    );


    const zones =
        groupParkingSlotsByZone(
            parkingSlots
        );


    Object.keys(zones)
        .sort()
        .forEach(
            function (zoneName) {

                const zone =
                    createParkingZone(
                        zoneName,
                        zones[zoneName]
                    );


                map.appendChild(
                    zone
                );
            }
        );
}


/* =========================================================
   GROUP BY ZONE
   ========================================================= */

function groupParkingSlotsByZone(slots) {

    const zones = {};


    slots.forEach(
        function (slot) {

            const zone =
                getParkingZone(
                    slot
                );


            if (!zones[zone]) {

                zones[zone] = [];
            }


            zones[zone].push(
                slot
            );
        }
    );


    Object.keys(zones)
        .forEach(
            function (zone) {

                zones[zone].sort(
                    compareParkingSlots
                );
            }
        );


    return zones;
}


/* =========================================================
   COMPARE SLOTS
   ========================================================= */

function compareParkingSlots(a, b) {

    return (
        getParkingSlotOrder(a) -
        getParkingSlotOrder(b)
    );
}


/* =========================================================
   CREATE ZONE
   ========================================================= */

function createParkingZone(
    zoneName,
    slots
) {

    const zone =
        document.createElement(
            "section"
        );


    zone.className =
        "parking-zone";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "parking-zone-title";


    title.textContent =
        `Zone ${zoneName}`;


    zone.appendChild(
        title
    );


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "parking-zone-grid";


    slots.forEach(
        function (slot) {

            grid.appendChild(
                createParkingSlotButton(
                    slot
                )
            );
        }
    );


    zone.appendChild(
        grid
    );


    return zone;
}


/* =========================================================
   CREATE SLOT BUTTON
   ========================================================= */

function createParkingSlotButton(slot) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "parking-slot";


    const slotNumber =
        getParkingSlotNumber(
            slot
        );


    const fee =
        getParkingFee(
            slot
        );


    const numberElement =
        document.createElement(
            "span"
        );


    numberElement.className =
        "parking-slot-number";


    numberElement.textContent =
        slotNumber;


    const feeElement =
        document.createElement(
            "span"
        );


    feeElement.className =
        "parking-slot-fee";


    feeElement.textContent =
        formatParkingCurrency(
            fee
        );


    button.appendChild(
        numberElement
    );


    button.appendChild(
        feeElement
    );


    const status =
        getParkingStatus(
            slot
        );


    /*
     * Occupied
     */

    if (status === "occupied") {

        button.classList.add(
            "occupied"
        );


        button.disabled =
            true;


        button.title =
            "This parking slot is occupied";


        return button;
    }


    /*
     * Available
     */

    button.classList.add(
        "available"
    );


    button.addEventListener(
        "click",
        function () {

            selectParkingSlot(
                slot,
                button
            );
        }
    );


    return button;
}


/* =========================================================
   SELECT PARKING SLOT
   ========================================================= */

function selectParkingSlot(
    slot,
    button
) {

    const slotId =
        getParkingSlotId(
            slot
        );


    if (!slotId) {
        return;
    }


    /*
     * Clicking selected slot again
     * will deselect it.
     */

    if (
        selectedParkingSlot &&
        String(
            getParkingSlotId(
                selectedParkingSlot
            )
        ) === String(slotId)
    ) {

        selectedParkingSlot =
            null;


        button.classList.remove(
            "selected"
        );


        button.classList.add(
            "available"
        );


        updateParkingSelectionSummary();

        return;
    }


    /*
     * Remove previous selection.
     *
     * This enforces:
     * Maximum one parking slot.
     */

    clearParkingVisualSelection();


    selectedParkingSlot =
        slot;


    button.classList.remove(
        "available"
    );


    button.classList.add(
        "selected"
    );


    updateParkingSelectionSummary();
}


/* =========================================================
   CLEAR OLD VISUAL SELECTION
   ========================================================= */

function clearParkingVisualSelection() {

    const selectedButtons =
        document.querySelectorAll(
            ".parking-slot.selected"
        );


    selectedButtons.forEach(
        function (button) {

            button.classList.remove(
                "selected"
            );


            button.classList.add(
                "available"
            );
        }
    );
}


/* =========================================================
   UPDATE SUMMARY
   ========================================================= */

function updateParkingSelectionSummary() {

    const display =
        document.getElementById(
            "selectedParkingDisplay"
        );


    const continueButton =
        document.getElementById(
            "continueWithParkingButton"
        );


    let parkingFee = 0;


    if (display) {

        display.innerHTML =
            "";


        if (!selectedParkingSlot) {

            const empty =
                document.createElement(
                    "span"
                );


            empty.className =
                "no-parking-selected";


            empty.textContent =
                "No parking selected";


            display.appendChild(
                empty
            );


        } else {

            parkingFee =
                getParkingFee(
                    selectedParkingSlot
                );


            const chip =
                document.createElement(
                    "div"
                );


            chip.className =
                "selected-parking-chip";


            chip.innerHTML = `

                <span>
                    ${escapeParkingHtml(
                        getParkingSlotNumber(
                            selectedParkingSlot
                        )
                    )}
                </span>

                <span>
                    ${escapeParkingHtml(
                        getParkingZone(
                            selectedParkingSlot
                        )
                    )}
                </span>
            `;


            display.appendChild(
                chip
            );
        }
    }


    setParkingText(
        "selectedParkingFee",
        formatParkingCurrency(
            parkingFee
        )
    );


    const seatTotal =
        Number(
            seatSelectionData?.seatTotal ||
            0
        );


    const grandTotal =
        seatTotal +
        Number(parkingFee || 0);


    setParkingText(
        "parkingGrandTotal",
        formatParkingCurrency(
            grandTotal
        )
    );


    if (continueButton) {

        continueButton.disabled =
            !selectedParkingSlot;
    }
}


/* =========================================================
   CONTINUE WITH PARKING
   ========================================================= */

function continueWithParking() {

    if (!selectedParkingSlot) {

        showParkingPageMessage(
            "Please select a parking slot or continue without parking."
        );

        return;
    }


    const parkingData = {

        eventId:
            parkingEventId,

        parkingSelected:
            true,

        slotId:
            getParkingSlotId(
                selectedParkingSlot
            ),

        slotNumber:
            getParkingSlotNumber(
                selectedParkingSlot
            ),

        zone:
            getParkingZone(
                selectedParkingSlot
            ),

        parkingFee:
            getParkingFee(
                selectedParkingSlot
            )
    };


    storeParkingSelection(
        parkingData
    );


    goToBookingSummary();
}


/* =========================================================
   CONTINUE WITHOUT PARKING
   ========================================================= */

function continueWithoutParking() {

    const parkingData = {

        eventId:
            parkingEventId,

        parkingSelected:
            false,

        slotId:
            null,

        slotNumber:
            null,

        zone:
            null,

        parkingFee:
            0
    };


    storeParkingSelection(
        parkingData
    );


    goToBookingSummary();
}


/* =========================================================
   STORE PARKING
   ========================================================= */

function storeParkingSelection(
    parkingData
) {

    sessionStorage.setItem(
        "eventParkingParkingSelection",
        JSON.stringify(
            parkingData
        )
    );
}


/* =========================================================
   GO TO BOOKING SUMMARY
   ========================================================= */

function goToBookingSummary() {

    window.location.href =
        `booking-summary.html?eventId=${encodeURIComponent(
            parkingEventId
        )}`;
}


/* =========================================================
   EVENT HELPERS
   ========================================================= */

function getParkingEventName(eventData) {

    return (
        eventData?.name ||
        eventData?.eventName ||
        eventData?.EventName ||
        eventData?.Name ||
        "Event"
    );
}


/* =========================================================
   SLOT ID
   ========================================================= */

function getParkingSlotId(slot) {

    return (
        slot.id ||
        slot.parkingSlotId ||
        slot.ParkingSlotId ||
        slot.slotId ||
        slot.Id ||
        null
    );
}


/* =========================================================
   SLOT NUMBER
   ========================================================= */

function getParkingSlotNumber(slot) {

    return String(
        slot.slotNumber ||
        slot.parkingSlotNumber ||
        slot.ParkingSlotNumber ||
        slot.number ||
        slot.Number ||
        "-"
    );
}


/* =========================================================
   ZONE
   ========================================================= */

function getParkingZone(slot) {

    const explicitZone =
        slot.zone ||
        slot.zoneName ||
        slot.Zone ||
        slot.ZoneName;


    if (explicitZone) {

        return String(
            explicitZone
        ).toUpperCase();
    }


    /*
     * Example:
     * A01 => Zone A
     */

    const slotNumber =
        getParkingSlotNumber(
            slot
        );


    const match =
        slotNumber.match(
            /^[A-Za-z]+/
        );


    if (match) {

        return match[0]
            .toUpperCase();
    }


    return "GENERAL";
}


/* =========================================================
   SLOT ORDER
   ========================================================= */

function getParkingSlotOrder(slot) {

    const explicitNumber =
        slot.position ??
        slot.slotOrder ??
        slot.SlotOrder;


    if (
        explicitNumber !== undefined &&
        explicitNumber !== null
    ) {

        return Number(
            explicitNumber
        ) || 0;
    }


    const slotNumber =
        getParkingSlotNumber(
            slot
        );


    const match =
        slotNumber.match(
            /(\d+)$/
        );


    return match
        ? Number(match[1])
        : 0;
}


/* =========================================================
   STATUS
   ========================================================= */

function getParkingStatus(slot) {

    const status =
        String(
            slot.status ||
            slot.Status ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        status === "occupied" ||
        status === "reserved" ||
        status === "booked" ||
        slot.isReserved === true ||
        slot.IsReserved === true ||
        slot.isOccupied === true ||
        slot.IsOccupied === true ||
        slot.available === false ||
        slot.isAvailable === false
    ) {

        return "occupied";
    }


    return "available";
}


/* =========================================================
   PARKING FEE
   ========================================================= */

function getParkingFee(slot) {

    /*
     * First use slot-specific fee.
     */

    const slotFee =
        slot?.fee ??
        slot?.parkingFee ??
        slot?.ParkingFee ??
        slot?.price ??
        slot?.Price ??
        null;


    if (
        slotFee !== null &&
        slotFee !== undefined
    ) {

        const value =
            Number(slotFee);


        if (!Number.isNaN(value)) {

            return value;
        }
    }


    /*
     * Otherwise use event parking fee.
     */

    const eventFee =
        parkingEventData?.parkingFee ??
        parkingEventData?.ParkingFee ??
        0;


    const value =
        Number(eventFee);


    return Number.isNaN(value)
        ? 0
        : value;
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatParkingCurrency(value) {

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

function setParkingText(
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

function showParkingPageLoading() {

    const loading =
        document.getElementById(
            "parkingPageLoading"
        );


    const content =
        document.getElementById(
            "parkingPageContent"
        );


    const notFound =
        document.getElementById(
            "parkingEventNotFound"
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


function hideParkingPageLoading() {

    const loading =
        document.getElementById(
            "parkingPageLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


function showParkingPageContent() {

    const content =
        document.getElementById(
            "parkingPageContent"
        );


    if (content) {

        content.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showParkingEventNotFound() {

    const content =
        document.getElementById(
            "parkingPageContent"
        );


    const notFound =
        document.getElementById(
            "parkingEventNotFound"
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

function showParkingPageMessage(message) {

    const element =
        document.getElementById(
            "parkingPageMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-error";
}


function clearParkingPageMessage() {

    const element =
        document.getElementById(
            "parkingPageMessage"
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

function escapeParkingHtml(value) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value ?? "";


    return element.innerHTML;
}
