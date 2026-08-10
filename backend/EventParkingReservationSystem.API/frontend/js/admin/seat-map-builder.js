/* =========================================================
   Event & Parking Reservation System
   Admin Seat Map Builder
   ========================================================= */


let seatMapEvents = [];

let selectedSeatMapEventId = null;

let selectedSeatMapEvent = null;

let adminSeatMapSeats = [];

let selectedAdminSeat = null;

let seatMapGenerateInProgress = false;

let seatActionInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminSeatMapBuilder();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminSeatMapBuilder() {

    if (!validateSeatMapAdminAccess()) {
        return;
    }


    await loadSeatMapAdminSidebar();


    initializeSeatMapControls();


    await loadSeatMapEvents();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateSeatMapAdminAccess() {

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

async function loadSeatMapAdminSidebar() {

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
                    "seat-map"
                ) {

                    link.classList.add(
                        "active"
                    );
                }
            }
        );


    const logout =
        document.getElementById(
            "adminSidebarLogoutButton"
        );


    if (logout) {

        logout.addEventListener(
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

function initializeSeatMapControls() {

    const eventSelect =
        document.getElementById(
            "seatMapEventSelect"
        );


    const addRowButton =
        document.getElementById(
            "addSeatRowButton"
        );


    const suggestButton =
        document.getElementById(
            "suggestSeatRowsButton"
        );


    const generateButton =
        document.getElementById(
            "generateSeatMapButton"
        );


    const refreshButton =
        document.getElementById(
            "refreshSeatMapButton"
        );


    const closeEditButton =
        document.getElementById(
            "closeEditSeatButton"
        );


    const cancelEditButton =
        document.getElementById(
            "cancelEditSeatButton"
        );


    const editForm =
        document.getElementById(
            "editSeatForm"
        );


    const deleteButton =
        document.getElementById(
            "deleteSeatButton"
        );


    if (eventSelect) {

        eventSelect.addEventListener(
            "change",
            async function () {

                await selectSeatMapEvent(
                    this.value
                );
            }
        );
    }


    if (addRowButton) {

        addRowButton.addEventListener(
            "click",
            function () {

                addSeatConfigurationRow(
                    1,
                    getSelectedEventTicketPrice()
                );


                updateSeatConfigurationTotal();
            }
        );
    }


    if (suggestButton) {

        suggestButton.addEventListener(
            "click",
            createSuggestedSeatRows
        );
    }


    if (generateButton) {

        generateButton.addEventListener(
            "click",
            generateAdminSeatMap
        );
    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async function () {

                if (
                    selectedSeatMapEventId
                ) {

                    await loadSelectedEventAndSeatMap();
                }
            }
        );
    }


    if (closeEditButton) {

        closeEditButton.addEventListener(
            "click",
            closeSeatEditModal
        );
    }


    if (cancelEditButton) {

        cancelEditButton.addEventListener(
            "click",
            closeSeatEditModal
        );
    }


    if (editForm) {

        editForm.addEventListener(
            "submit",
            updateAdminSeat
        );
    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            confirmDeleteAdminSeat
        );
    }


    initializeSeatEditModalBackground();
}


/* =========================================================
   MODAL BACKGROUND
   ========================================================= */

function initializeSeatEditModalBackground() {

    const modal =
        document.getElementById(
            "editSeatModal"
        );


    if (!modal) {
        return;
    }


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                closeSeatEditModal();
            }
        }
    );
}


/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadSeatMapEvents() {

    try {

        const response =
            await apiGet(
                "/events"
            );


        seatMapEvents =
            normalizeSeatMapArray(
                response,
                "events"
            );


        populateSeatMapEventSelect();


        const params =
            new URLSearchParams(
                window.location.search
            );


        const urlEventId =
            params.get(
                "eventId"
            );


        if (urlEventId) {

            const select =
                document.getElementById(
                    "seatMapEventSelect"
                );


            if (select) {

                select.value =
                    urlEventId;
            }


            await selectSeatMapEvent(
                urlEventId
            );
        }


    } catch (error) {

        showSeatMapMessage(
            error.message ||
            "Unable to load events.",
            "error"
        );
    }
}


/* =========================================================
   POPULATE EVENTS
   ========================================================= */

function populateSeatMapEventSelect() {

    const select =
        document.getElementById(
            "seatMapEventSelect"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">Select an event</option>`;


    seatMapEvents.forEach(
        function (event) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                getSeatMapEventId(
                    event
                );


            option.textContent =
                getSeatMapEventName(
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

async function selectSeatMapEvent(
    eventId
) {

    clearSeatMapMessage();


    if (!eventId) {

        selectedSeatMapEventId =
            null;


        selectedSeatMapEvent =
            null;


        adminSeatMapSeats =
            [];


        showSeatMapNoEvent();


        return;
    }


    selectedSeatMapEventId =
        eventId;


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


    await loadSelectedEventAndSeatMap();
}


/* =========================================================
   LOAD EVENT + SEATS
   ========================================================= */

async function loadSelectedEventAndSeatMap() {

    showSeatMapLoading();


    try {

        const results =
            await Promise.all([

                apiGet(
                    `/events/${encodeURIComponent(
                        selectedSeatMapEventId
                    )}`
                ),

                apiGet(
                    `/events/${encodeURIComponent(
                        selectedSeatMapEventId
                    )}/seats`
                )

            ]);


        selectedSeatMapEvent =
            results[0]?.data ||
            results[0]?.event ||
            results[0];


        adminSeatMapSeats =
            normalizeSeatMapArray(
                results[1],
                "seats"
            );


        renderSeatMapEventInformation();

        renderSeatMapSummary();

        renderAdminSeatVisualMap();

        configureSeatMapGenerator();


        hideSeatMapLoading();

        showSeatMapContent();


    } catch (error) {

        console.error(
            "Seat Map Load Error:",
            error
        );


        hideSeatMapLoading();


        /*
         * Some backends may return 404
         * when a seat map has not yet
         * been generated.
         */

        if (
            error.status === 404 &&
            selectedSeatMapEventId
        ) {

            try {

                const eventResponse =
                    await apiGet(
                        `/events/${encodeURIComponent(
                            selectedSeatMapEventId
                        )}`
                    );


                selectedSeatMapEvent =
                    eventResponse?.data ||
                    eventResponse?.event ||
                    eventResponse;


                adminSeatMapSeats =
                    [];


                renderSeatMapEventInformation();

                renderSeatMapSummary();

                renderAdminSeatVisualMap();

                configureSeatMapGenerator();


                showSeatMapContent();


                return;

            } catch (eventError) {

                console.error(
                    eventError
                );
            }
        }


        showSeatMapMessage(
            error.message ||
            "Unable to load the seat map.",
            "error"
        );
    }
}


/* =========================================================
   NORMALIZE ARRAY
   ========================================================= */

function normalizeSeatMapArray(
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


    /*
     * Some seat-map APIs return:
     *
     * {
     *   seats: [...]
     * }
     */

    if (
        collectionName === "seats" &&
        Array.isArray(
            response?.seatMap?.seats
        )
    ) {

        return response.seatMap.seats;
    }


    return [];
}


/* =========================================================
   EVENT INFO
   ========================================================= */

function renderSeatMapEventInformation() {

    setSeatMapText(
        "seatMapSelectedEventName",
        getSeatMapEventName(
            selectedSeatMapEvent
        )
    );


    const capacity =
        getSeatMapEventCapacity(
            selectedSeatMapEvent
        );


    setSeatMapText(
        "seatMapEventCapacity",
        capacity
    );


    setSeatMapText(
        "seatRequiredCapacity",
        capacity
    );
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderSeatMapSummary() {

    const available =
        adminSeatMapSeats.filter(
            function (seat) {

                return (
                    getAdminSeatStatus(
                        seat
                    ) ===
                    "available"
                );
            }
        ).length;


    const protectedCount =
        adminSeatMapSeats.length -
        available;


    setSeatMapText(
        "seatMapCreatedCount",
        adminSeatMapSeats.length
    );


    setSeatMapText(
        "seatMapAvailableCount",
        available
    );


    setSeatMapText(
        "seatMapBookedCount",
        protectedCount
    );
}


/* =========================================================
   GENERATOR STATE
   ========================================================= */

function configureSeatMapGenerator() {

    const existing =
        adminSeatMapSeats.length >
        0;


    const warning =
        document.getElementById(
            "existingSeatMapWarning"
        );


    const generateButton =
        document.getElementById(
            "generateSeatMapButton"
        );


    const addButton =
        document.getElementById(
            "addSeatRowButton"
        );


    const suggestButton =
        document.getElementById(
            "suggestSeatRowsButton"
        );


    if (warning) {

        warning.classList.toggle(
            "hidden",
            !existing
        );
    }


    if (generateButton) {

        generateButton.disabled =
            existing;
    }


    if (addButton) {

        addButton.disabled =
            existing;
    }


    if (suggestButton) {

        suggestButton.disabled =
            existing;
    }


    if (!existing) {

        createSuggestedSeatRows();

    } else {

        clearSeatConfigurationRows();

        updateSeatConfigurationTotal();
    }
}


/* =========================================================
   AUTO ROW ARRANGEMENT
   ========================================================= */

function createSuggestedSeatRows() {

    if (
        adminSeatMapSeats.length >
        0
    ) {

        return;
    }


    const capacity =
        getSeatMapEventCapacity(
            selectedSeatMapEvent
        );


    if (
        capacity <= 0
    ) {

        return;
    }


    clearSeatConfigurationRows();


    /*
     * Simple readable layout:
     * maximum 20 seats per row.
     *
     * Example:
     * Capacity 50
     * A = 20
     * B = 20
     * C = 10
     */

    const maximumPerRow =
        20;


    let remaining =
        capacity;


    const price =
        getSelectedEventTicketPrice();


    while (
        remaining > 0
    ) {

        const seatsInRow =
            Math.min(
                remaining,
                maximumPerRow
            );


        addSeatConfigurationRow(
            seatsInRow,
            price
        );


        remaining -=
            seatsInRow;
    }


    updateSeatConfigurationTotal();
}


/* =========================================================
   ADD CONFIG ROW
   ========================================================= */

function addSeatConfigurationRow(
    seatCount = 1,
    rowPrice = 0
) {

    const container =
        document.getElementById(
            "seatRowsContainer"
        );


    if (!container) {
        return;
    }


    const rowIndex =
        container.children.length;


    const rowLabel =
        convertSeatRowIndexToLabel(
            rowIndex
        );


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "admin-seat-row-config";


    row.innerHTML = `

        <div
            class="admin-seat-row-label"
            data-seat-row-label
        >
            ${escapeSeatMapHtml(rowLabel)}
        </div>


        <input
            type="number"
            class="form-control"
            data-seat-count
            min="1"
            step="1"
            value="${Number(seatCount) || 1}"
            aria-label="Seats in row ${escapeSeatMapHtml(rowLabel)}"
        >


        <input
            type="number"
            class="form-control"
            data-row-price
            min="0"
            step="0.01"
            value="${Number(rowPrice) || 0}"
            aria-label="Price for row ${escapeSeatMapHtml(rowLabel)}"
        >


        <button
            type="button"
            class="btn btn-danger admin-seat-remove-row"
        >
            Remove
        </button>
    `;


    row
        .querySelectorAll(
            "input"
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "input",
                    updateSeatConfigurationTotal
                );
            }
        );


    row
        .querySelector(
            ".admin-seat-remove-row"
        )
        ?.addEventListener(
            "click",
            function () {

                row.remove();


                refreshSeatRowLabels();

                updateSeatConfigurationTotal();
            }
        );


    container.appendChild(
        row
    );
}


/* =========================================================
   ROW LABELS
   ========================================================= */

function refreshSeatRowLabels() {

    document
        .querySelectorAll(
            "#seatRowsContainer .admin-seat-row-config"
        )
        .forEach(
            function (row, index) {

                const label =
                    convertSeatRowIndexToLabel(
                        index
                    );


                const element =
                    row.querySelector(
                        "[data-seat-row-label]"
                    );


                if (element) {

                    element.textContent =
                        label;
                }
            }
        );
}


/* =========================================================
   A, B, C ... Z, AA
   ========================================================= */

function convertSeatRowIndexToLabel(
    index
) {

    let value =
        Number(index) + 1;


    let result =
        "";


    while (
        value > 0
    ) {

        value--;


        result =
            String.fromCharCode(
                65 +
                (
                    value %
                    26
                )
            ) +
            result;


        value =
            Math.floor(
                value /
                26
            );
    }


    return result;
}


/* =========================================================
   CLEAR CONFIG ROWS
   ========================================================= */

function clearSeatConfigurationRows() {

    const container =
        document.getElementById(
            "seatRowsContainer"
        );


    if (container) {

        container.innerHTML =
            "";
    }
}


/* =========================================================
   CONFIGURED TOTAL
   ========================================================= */

function updateSeatConfigurationTotal() {

    const total =
        getConfiguredSeatRows()
            .reduce(
                function (
                    sum,
                    row
                ) {

                    return (
                        sum +
                        row.seatCount
                    );
                },
                0
            );


    const capacity =
        getSeatMapEventCapacity(
            selectedSeatMapEvent
        );


    setSeatMapText(
        "seatConfiguredCount",
        total
    );


    const status =
        document.getElementById(
            "seatCapacityMatchStatus"
        );


    if (!status) {
        return;
    }


    status.className =
        "admin-seat-capacity-status";


    if (
        total === capacity &&
        capacity > 0
    ) {

        status.textContent =
            "Exact Match ✓";


        status.classList.add(
            "match"
        );


    } else {

        const difference =
            capacity -
            total;


        if (
            difference > 0
        ) {

            status.textContent =
                `${difference} seats missing`;

        } else if (
            difference < 0
        ) {

            status.textContent =
                `${Math.abs(difference)} seats over capacity`;

        } else {

            status.textContent =
                "Configure rows";
        }


        status.classList.add(
            "invalid"
        );
    }
}


/* =========================================================
   GET ROW CONFIG
   ========================================================= */

function getConfiguredSeatRows() {

    return Array.from(
        document.querySelectorAll(
            "#seatRowsContainer .admin-seat-row-config"
        )
    )
        .map(
            function (row) {

                const count =
                    Number(
                        row
                            .querySelector(
                                "[data-seat-count]"
                            )
                            ?.value ||
                        0
                    );


                const price =
                    Number(
                        row
                            .querySelector(
                                "[data-row-price]"
                            )
                            ?.value ||
                        0
                    );


                return {

                    seatCount:
                        Number.isInteger(count)
                            ? count
                            : 0,

                    rowPrice:
                        Number.isNaN(price)
                            ? 0
                            : price
                };
            }
        );
}


/* =========================================================
   GENERATE MAP
   ========================================================= */

async function generateAdminSeatMap() {

    if (
        seatMapGenerateInProgress ||
        !selectedSeatMapEventId
    ) {

        return;
    }


    clearSeatMapMessage();


    if (
        adminSeatMapSeats.length >
        0
    ) {

        showSeatMapMessage(
            "A seat map already exists for this event.",
            "error"
        );


        return;
    }


    const rows =
        getConfiguredSeatRows();


    if (
        rows.length === 0
    ) {

        showSeatMapMessage(
            "Add at least one seat row.",
            "error"
        );


        return;
    }


    const invalidRow =
        rows.some(
            function (row) {

                return (
                    row.seatCount <= 0 ||
                    row.rowPrice < 0
                );
            }
        );


    if (invalidRow) {

        showSeatMapMessage(
            "Every row must contain at least one seat and the price cannot be negative.",
            "error"
        );


        return;
    }


    const configuredTotal =
        rows.reduce(
            function (total, row) {

                return (
                    total +
                    row.seatCount
                );
            },
            0
        );


    const capacity =
        getSeatMapEventCapacity(
            selectedSeatMapEvent
        );


    /*
     * BRD critical rule:
     * seat count MUST exactly equal
     * event capacity.
     */

    if (
        configuredTotal !==
        capacity
    ) {

        showSeatMapMessage(
            `Seat map cannot be generated. Event capacity is ${capacity}, but the configured rows contain ${configuredTotal} seats.`,
            "error"
        );


        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Generate Seat Map",

            message:
                `Generate ${configuredTotal} seats for ${getSeatMapEventName(selectedSeatMapEvent)}?`,

            confirmText:
                "Generate Seats",

            cancelText:
                "Review Rows"
        });


    if (!confirmed) {
        return;
    }


    seatMapGenerateInProgress =
        true;


    const button =
        document.getElementById(
            "generateSeatMapButton"
        );


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Generating...";
    }


    try {

        /*
         * The BRD specifies the endpoint
         * but not the POST JSON DTO.
         *
         * This frontend keeps the request
         * shape inside one adapter function.
         */

        const request =
            buildSeatMapGenerateRequest(
                rows
            );


        await apiPost(
            `/events/${encodeURIComponent(
                selectedSeatMapEventId
            )}/seats`,
            request
        );


        showSeatMapMessage(
            "Seat map generated successfully.",
            "success"
        );


        await loadSelectedEventAndSeatMap();


    } catch (error) {

        console.error(
            "Generate Seat Map Error:",
            error
        );


        showSeatMapMessage(
            getSeatMapApiError(
                error
            ),
            "error"
        );


    } finally {

        seatMapGenerateInProgress =
            false;


        if (button) {

            button.textContent =
                "Generate Seat Map";
        }
    }
}


/* =========================================================
   GENERATE REQUEST ADAPTER
   ========================================================= */

function buildSeatMapGenerateRequest(
    rows
) {

    /*
     * Row-based DTO:
     *
     * {
     *   rows: [
     *     {
     *       seatCount: 20,
     *       rowPrice: 2500
     *     }
     *   ]
     * }
     *
     * If Swagger uses a different DTO,
     * change ONLY this function.
     */

    return {

        rows:
            rows.map(
                function (row) {

                    return {

                        seatCount:
                            row.seatCount,

                        rowPrice:
                            row.rowPrice
                    };
                }
            )
    };
}


/* =========================================================
   VISUAL MAP
   ========================================================= */

function renderAdminSeatVisualMap() {

    const map =
        document.getElementById(
            "adminSeatVisualMap"
        );


    const empty =
        document.getElementById(
            "adminSeatMapEmpty"
        );


    if (
        !map ||
        !empty
    ) {

        return;
    }


    map.innerHTML =
        "";


    if (
        adminSeatMapSeats.length ===
        0
    ) {

        map.classList.add(
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


    map.classList.remove(
        "hidden"
    );


    const grouped =
        groupSeatsByRow(
            adminSeatMapSeats
        );


    Object.keys(grouped)
        .sort(
            function (a, b) {

                return String(a)
                    .localeCompare(
                        String(b),
                        undefined,
                        {
                            numeric:
                                true
                        }
                    );
            }
        )
        .forEach(
            function (rowLabel) {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "admin-seat-visual-row";


                const label =
                    document.createElement(
                        "div"
                    );


                label.className =
                    "admin-seat-visual-row-label";


                label.textContent =
                    rowLabel;


                const buttons =
                    document.createElement(
                        "div"
                    );


                buttons.className =
                    "admin-seat-row-buttons";


                grouped[rowLabel]
                    .sort(
                        function (a, b) {

                            return (
                                getAdminSeatColumn(a) -
                                getAdminSeatColumn(b)
                            );
                        }
                    )
                    .forEach(
                        function (seat) {

                            buttons.appendChild(
                                createAdminSeatButton(
                                    seat
                                )
                            );
                        }
                    );


                row.appendChild(
                    label
                );


                row.appendChild(
                    buttons
                );


                map.appendChild(
                    row
                );
            }
        );
}


/* =========================================================
   GROUP BY ROW
   ========================================================= */

function groupSeatsByRow(
    seats
) {

    const grouped =
        {};


    seats.forEach(
        function (seat) {

            const row =
                getAdminSeatRow(
                    seat
                ) ||
                "Other";


            if (!grouped[row]) {

                grouped[row] =
                    [];
            }


            grouped[row].push(
                seat
            );
        }
    );


    return grouped;
}


/* =========================================================
   SEAT BUTTON
   ========================================================= */

function createAdminSeatButton(
    seat
) {

    const status =
        getAdminSeatStatus(
            seat
        );


    const protectedSeat =
        isAdminSeatProtected(
            seat
        );


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        `admin-seat-button ${status}${
            protectedSeat
                ? " protected"
                : ""
        }`;


    button.textContent =
        getAdminSeatNumber(
            seat
        );


    button.title =
        `${getAdminSeatNumber(seat)} - ${formatAdminSeatStatus(status)}`;


    button.addEventListener(
        "click",
        function () {

            openAdminSeatEditModal(
                seat
            );
        }
    );


    return button;
}


/* =========================================================
   OPEN EDIT MODAL
   ========================================================= */

function openAdminSeatEditModal(
    seat
) {

    selectedAdminSeat =
        seat;


    const protectedSeat =
        isAdminSeatProtected(
            seat
        );


    setSeatMapInputValue(
        "editSeatId",
        getAdminSeatId(
            seat
        )
    );


    setSeatMapInputValue(
        "editSeatNumber",
        getAdminSeatNumber(
            seat
        )
    );


    setSeatMapInputValue(
        "editSeatRow",
        getAdminSeatRow(
            seat
        )
    );


    setSeatMapInputValue(
        "editSeatColumn",
        getAdminSeatColumn(
            seat
        )
    );


    setSeatMapInputValue(
        "editSeatPrice",
        getAdminSeatPrice(
            seat
        )
    );


    setSeatMapText(
        "editSeatStatus",
        formatAdminSeatStatus(
            getAdminSeatStatus(
                seat
            )
        )
    );


    [
        "editSeatNumber",
        "editSeatRow",
        "editSeatColumn",
        "editSeatPrice"
    ]
        .forEach(
            function (id) {

                const element =
                    document.getElementById(
                        id
                    );


                if (element) {

                    element.disabled =
                        protectedSeat;
                }
            }
        );


    const saveButton =
        document.getElementById(
            "saveSeatButton"
        );


    const deleteButton =
        document.getElementById(
            "deleteSeatButton"
        );


    if (saveButton) {

        saveButton.classList.toggle(
            "hidden",
            protectedSeat
        );
    }


    if (deleteButton) {

        deleteButton.classList.toggle(
            "hidden",
            protectedSeat
        );
    }


    document
        .getElementById(
            "protectedSeatMessage"
        )
        ?.classList.toggle(
            "hidden",
            !protectedSeat
        );


    document
        .getElementById(
            "editSeatModal"
        )
        ?.classList.add(
            "active"
        );
}


/* =========================================================
   CLOSE EDIT MODAL
   ========================================================= */

function closeSeatEditModal() {

    if (seatActionInProgress) {
        return;
    }


    selectedAdminSeat =
        null;


    document
        .getElementById(
            "editSeatModal"
        )
        ?.classList.remove(
            "active"
        );
}


/* =========================================================
   UPDATE SEAT
   ========================================================= */

async function updateAdminSeat(
    event
) {

    event.preventDefault();


    if (
        !selectedAdminSeat ||
        seatActionInProgress
    ) {

        return;
    }


    if (
        isAdminSeatProtected(
            selectedAdminSeat
        )
    ) {

        showSeatMapMessage(
            "A booked or protected seat cannot be modified.",
            "error"
        );


        return;
    }


    const seatId =
        getAdminSeatId(
            selectedAdminSeat
        );


    const seatNumber =
        document
            .getElementById(
                "editSeatNumber"
            )
            ?.value
            .trim() ||
        "";


    const rowLabel =
        document
            .getElementById(
                "editSeatRow"
            )
            ?.value
            .trim() ||
        "";


    const columnNumber =
        Number(
            document
                .getElementById(
                    "editSeatColumn"
                )
                ?.value ||
            0
        );


    const price =
        Number(
            document
                .getElementById(
                    "editSeatPrice"
                )
                ?.value ||
            0
        );


    if (!seatNumber) {

        showSeatMapMessage(
            "Seat number is required.",
            "error"
        );


        return;
    }


    if (
        columnNumber <= 0 ||
        !Number.isInteger(
            columnNumber
        )
    ) {

        showSeatMapMessage(
            "Column number must be a positive whole number.",
            "error"
        );


        return;
    }


    if (
        Number.isNaN(price) ||
        price < 0
    ) {

        showSeatMapMessage(
            "Seat price cannot be negative.",
            "error"
        );


        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Update Seat",

            message:
                `Save changes to seat ${getAdminSeatNumber(selectedAdminSeat)}?`,

            confirmText:
                "Save Changes",

            cancelText:
                "Cancel"
        });


    if (!confirmed) {
        return;
    }


    seatActionInProgress =
        true;


    const saveButton =
        document.getElementById(
            "saveSeatButton"
        );


    if (saveButton) {

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";
    }


    try {

        const request =
            buildSeatUpdateRequest({

                seatNumber:
                    seatNumber,

                rowLabel:
                    rowLabel,

                columnNumber:
                    columnNumber,

                price:
                    price
            });


        await apiPut(
            `/events/${encodeURIComponent(
                selectedSeatMapEventId
            )}/seats/${encodeURIComponent(
                seatId
            )}`,
            request
        );


        document
            .getElementById(
                "editSeatModal"
            )
            ?.classList.remove(
                "active"
            );


        selectedAdminSeat =
            null;


        showSeatMapMessage(
            "Seat updated successfully.",
            "success"
        );


        await loadSelectedEventAndSeatMap();


    } catch (error) {

        showSeatMapMessage(
            getSeatMapApiError(
                error
            ),
            "error"
        );


    } finally {

        seatActionInProgress =
            false;


        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Changes";
        }
    }
}


/* =========================================================
   UPDATE REQUEST ADAPTER
   ========================================================= */

function buildSeatUpdateRequest(
    values
) {

    /*
     * BRD does not define the exact
     * PUT request JSON.
     *
     * If Swagger uses another DTO,
     * change ONLY this function.
     */

    return {

        seatNumber:
            values.seatNumber,

        rowLabel:
            values.rowLabel,

        columnNumber:
            values.columnNumber,

        price:
            values.price
    };
}


/* =========================================================
   DELETE CONFIRM
   ========================================================= */

async function confirmDeleteAdminSeat() {

    if (
        !selectedAdminSeat ||
        seatActionInProgress
    ) {

        return;
    }


    if (
        isAdminSeatProtected(
            selectedAdminSeat
        )
    ) {

        showSeatMapMessage(
            "This seat cannot be deleted because it has an active booking or hold.",
            "error"
        );


        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Delete Seat",

            message:
                `Delete seat ${getAdminSeatNumber(selectedAdminSeat)}?`,

            confirmText:
                "Delete Seat",

            cancelText:
                "Keep Seat"
        });


    if (!confirmed) {
        return;
    }


    await deleteAdminSeat();
}


/* =========================================================
   DELETE SEAT
   ========================================================= */

async function deleteAdminSeat() {

    const seatId =
        getAdminSeatId(
            selectedAdminSeat
        );


    seatActionInProgress =
        true;


    const button =
        document.getElementById(
            "deleteSeatButton"
        );


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Deleting...";
    }


    try {

        /*
         * BRD:
         * DELETE /events/{eventId}/seats/{seatId}
         *
         * Backend must reject if booked.
         */

        await apiDelete(
            `/events/${encodeURIComponent(
                selectedSeatMapEventId
            )}/seats/${encodeURIComponent(
                seatId
            )}`
        );


        document
            .getElementById(
                "editSeatModal"
            )
            ?.classList.remove(
                "active"
            );


        selectedAdminSeat =
            null;


        showSeatMapMessage(
            "Seat deleted successfully.",
            "success"
        );


        await loadSelectedEventAndSeatMap();


    } catch (error) {

        showSeatMapMessage(
            getSeatMapApiError(
                error
            ),
            "error"
        );


    } finally {

        seatActionInProgress =
            false;


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Delete Seat";
        }
    }
}


/* =========================================================
   EVENT HELPERS
   ========================================================= */

function getSeatMapEventId(event) {

    return (
        event?.eventId ||
        event?.EventId ||
        event?.id ||
        event?.Id ||
        null
    );
}


function getSeatMapEventName(event) {

    return String(
        event?.name ||
        event?.Name ||
        event?.eventName ||
        event?.EventName ||
        "Event"
    );
}


function getSeatMapEventCapacity(event) {

    const number =
        Number(
            event?.capacity ??
            event?.Capacity ??
            event?.eventCapacity ??
            event?.EventCapacity ??
            0
        );


    return Number.isNaN(number)
        ? 0
        : number;
}


function getSelectedEventTicketPrice() {

    const number =
        Number(
            selectedSeatMapEvent?.ticketPrice ??
            selectedSeatMapEvent?.TicketPrice ??
            selectedSeatMapEvent?.price ??
            0
        );


    return Number.isNaN(number)
        ? 0
        : number;
}


/* =========================================================
   SEAT HELPERS
   ========================================================= */

function getAdminSeatId(seat) {

    return (
        seat?.seatId ||
        seat?.SeatId ||
        seat?.id ||
        seat?.Id ||
        null
    );
}


function getAdminSeatNumber(seat) {

    return String(
        seat?.seatNumber ||
        seat?.SeatNumber ||
        seat?.number ||
        "-"
    );
}


function getAdminSeatRow(seat) {

    return String(
        seat?.rowLabel ||
        seat?.RowLabel ||
        seat?.row ||
        ""
    );
}


function getAdminSeatColumn(seat) {

    const number =
        Number(
            seat?.columnNumber ??
            seat?.ColumnNumber ??
            seat?.column ??
            0
        );


    return Number.isNaN(number)
        ? 0
        : number;
}


function getAdminSeatPrice(seat) {

    const number =
        Number(
            seat?.price ??
            seat?.Price ??
            seat?.seatPrice ??
            0
        );


    return Number.isNaN(number)
        ? 0
        : number;
}


function getAdminSeatStatus(seat) {

    return String(
        seat?.status ||
        seat?.Status ||
        seat?.seatStatus ||
        "Available"
    )
        .trim()
        .toLowerCase();
}


/* =========================================================
   PROTECTED STATUS
   ========================================================= */

function isAdminSeatProtected(seat) {

    const status =
        getAdminSeatStatus(
            seat
        );


    return (
        status === "booked" ||
        status === "held" ||
        status === "reserved" ||
        status === "occupied"
    );
}


/* =========================================================
   STATUS DISPLAY
   ========================================================= */

function formatAdminSeatStatus(status) {

    if (!status) {

        return "Available";
    }


    return (
        status
            .charAt(0)
            .toUpperCase() +
        status.slice(1)
    );
}


/* =========================================================
   API ERRORS
   ========================================================= */

function getSeatMapApiError(error) {

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
            messages.length
        ) {

            return messages.join(
                " "
            );
        }
    }


    if (
        error.status === 409
    ) {

        return (
            error.message ||
            "The seat operation conflicts with an existing booking or seat."
        );
    }


    if (
        error.status === 400
    ) {

        return (
            error.message ||
            "The seat operation does not satisfy the seat-map rules."
        );
    }


    return (
        error.message ||
        "Unable to complete the seat operation."
    );
}


/* =========================================================
   UI STATES
   ========================================================= */

function showSeatMapContent() {

    document
        .getElementById(
            "seatMapNoEvent"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "seatMapContent"
        )
        ?.classList.remove(
            "hidden"
        );
}


function showSeatMapNoEvent() {

    document
        .getElementById(
            "seatMapContent"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "seatMapNoEvent"
        )
        ?.classList.remove(
            "hidden"
        );


    setSeatMapText(
        "seatMapSelectedEventName",
        "-"
    );
}


function showSeatMapLoading() {

    document
        .getElementById(
            "seatMapLoading"
        )
        ?.classList.remove(
            "hidden"
        );
}


function hideSeatMapLoading() {

    document
        .getElementById(
            "seatMapLoading"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   TEXT / INPUT
   ========================================================= */

function setSeatMapText(
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


function setSeatMapInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value ?? "";
    }
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showSeatMapMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminSeatMapMessage"
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


function clearSeatMapMessage() {

    const element =
        document.getElementById(
            "adminSeatMapMessage"
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

function escapeSeatMapHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}
