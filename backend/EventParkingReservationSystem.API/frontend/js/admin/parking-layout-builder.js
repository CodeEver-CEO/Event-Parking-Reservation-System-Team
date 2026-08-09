/* =========================================================
   Event & Parking Reservation System
   Admin Parking Layout Builder
   ========================================================= */


let parkingBuilderEvents = [];

let selectedParkingEventId = null;

let selectedParkingEvent = null;

let adminParkingSlots = [];

let selectedParkingSlot = null;

let parkingGenerateInProgress = false;

let parkingSlotActionInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminParkingBuilder();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminParkingBuilder() {

    if (!validateParkingAdminAccess()) {
        return;
    }


    await loadParkingAdminSidebar();


    initializeParkingBuilderControls();


    await loadParkingBuilderEvents();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateParkingAdminAccess() {

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

async function loadParkingAdminSidebar() {

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
                    "parking"
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

function initializeParkingBuilderControls() {

    const eventSelect =
        document.getElementById(
            "parkingEventSelect"
        );


    const addZone =
        document.getElementById(
            "addParkingZoneButton"
        );


    const resetZones =
        document.getElementById(
            "resetParkingZonesButton"
        );


    const generate =
        document.getElementById(
            "generateParkingLayoutButton"
        );


    const refresh =
        document.getElementById(
            "refreshParkingLayoutButton"
        );


    const closeEdit =
        document.getElementById(
            "closeParkingSlotModalButton"
        );


    const cancelEdit =
        document.getElementById(
            "cancelParkingSlotModalButton"
        );


    const editForm =
        document.getElementById(
            "editParkingSlotForm"
        );


    const deleteButton =
        document.getElementById(
            "deleteParkingSlotButton"
        );


    if (eventSelect) {

        eventSelect.addEventListener(
            "change",
            async function () {

                await selectParkingEvent(
                    this.value
                );
            }
        );
    }


    if (addZone) {

        addZone.addEventListener(
            "click",
            function () {

                addParkingZoneRow();

                updateParkingConfiguredCount();
            }
        );
    }


    if (resetZones) {

        resetZones.addEventListener(
            "click",
            resetParkingZoneRows
        );
    }


    if (generate) {

        generate.addEventListener(
            "click",
            generateParkingLayout
        );
    }


    if (refresh) {

        refresh.addEventListener(
            "click",
            async function () {

                if (
                    selectedParkingEventId
                ) {

                    await loadSelectedParkingLayout();
                }
            }
        );
    }


    if (closeEdit) {

        closeEdit.addEventListener(
            "click",
            closeParkingSlotModal
        );
    }


    if (cancelEdit) {

        cancelEdit.addEventListener(
            "click",
            closeParkingSlotModal
        );
    }


    if (editForm) {

        editForm.addEventListener(
            "submit",
            updateParkingSlot
        );
    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            confirmDeleteParkingSlot
        );
    }


    initializeParkingModalBackgroundClose();
}


/* =========================================================
   MODAL BACKGROUND
   ========================================================= */

function initializeParkingModalBackgroundClose() {

    const modal =
        document.getElementById(
            "editParkingSlotModal"
        );


    if (!modal) {

        return;
    }


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeParkingSlotModal();
            }
        }
    );
}


/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadParkingBuilderEvents() {

    clearParkingMessage();


    try {

        const response =
            await apiGet(
                "/events"
            );


        parkingBuilderEvents =
            normalizeParkingArray(
                response,
                "events"
            );


        populateParkingEventSelect();


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
                    "parkingEventSelect"
                );


            if (select) {

                select.value =
                    eventId;
            }


            await selectParkingEvent(
                eventId
            );
        }


    } catch (error) {

        showParkingMessage(
            error.message ||
            "Unable to load events.",
            "error"
        );
    }
}


/* =========================================================
   EVENT DROPDOWN
   ========================================================= */

function populateParkingEventSelect() {

    const select =
        document.getElementById(
            "parkingEventSelect"
        );


    if (!select) {

        return;
    }


    select.innerHTML =
        `<option value="">Select an event</option>`;


    parkingBuilderEvents.forEach(
        function (event) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                getParkingEventId(
                    event
                );


            option.textContent =
                getParkingEventName(
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

async function selectParkingEvent(
    eventId
) {

    clearParkingMessage();


    if (!eventId) {

        selectedParkingEventId =
            null;


        selectedParkingEvent =
            null;


        adminParkingSlots =
            [];


        showParkingNoEvent();


        return;
    }


    selectedParkingEventId =
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


    await loadSelectedParkingLayout();
}


/* =========================================================
   LOAD EVENT + PARKING
   ========================================================= */

async function loadSelectedParkingLayout() {

    showParkingLoading();


    try {

        const results =
            await Promise.all([

                apiGet(
                    `/events/${encodeURIComponent(
                        selectedParkingEventId
                    )}`
                ),

                apiGet(
                    `/events/${encodeURIComponent(
                        selectedParkingEventId
                    )}/parking-slots`
                )

            ]);


        selectedParkingEvent =
            results[0]?.data ||
            results[0]?.event ||
            results[0];


        adminParkingSlots =
            normalizeParkingArray(
                results[1],
                "parkingSlots"
            );


        renderParkingEventInformation();

        renderParkingSummary();

        renderAdminParkingMap();

        configureParkingGenerator();


        hideParkingLoading();

        showParkingContent();


    } catch (error) {

        console.error(
            "Parking Layout Load Error:",
            error
        );


        /*
         * Some APIs may return 404 when
         * no parking layout exists yet.
         */

        if (
            error.status === 404 &&
            selectedParkingEventId
        ) {

            try {

                const eventResponse =
                    await apiGet(
                        `/events/${encodeURIComponent(
                            selectedParkingEventId
                        )}`
                    );


                selectedParkingEvent =
                    eventResponse?.data ||
                    eventResponse?.event ||
                    eventResponse;


                adminParkingSlots =
                    [];


                renderParkingEventInformation();

                renderParkingSummary();

                renderAdminParkingMap();

                configureParkingGenerator();


                hideParkingLoading();

                showParkingContent();


                return;

            } catch (eventError) {

                console.error(
                    eventError
                );
            }
        }


        hideParkingLoading();


        showParkingMessage(
            error.message ||
            "Unable to load the parking layout.",
            "error"
        );
    }
}


/* =========================================================
   NORMALIZE ARRAY
   ========================================================= */

function normalizeParkingArray(
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


    if (
        collectionName ===
        "parkingSlots" &&
        Array.isArray(
            response?.slots
        )
    ) {

        return response.slots;
    }


    return [];
}


/* =========================================================
   EVENT INFO
   ========================================================= */

function renderParkingEventInformation() {

    setParkingText(
        "parkingSelectedEventName",
        getParkingEventName(
            selectedParkingEvent
        )
    );
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderParkingSummary() {

    let available =
        0;


    let held =
        0;


    let reserved =
        0;


    adminParkingSlots.forEach(
        function (slot) {

            const status =
                getParkingSlotStatus(
                    slot
                );


            if (
                status ===
                "available"
            ) {

                available++;
            }


            if (
                status ===
                "held"
            ) {

                held++;
            }


            if (
                status === "reserved" ||
                status === "occupied"
            ) {

                reserved++;
            }
        }
    );


    setParkingText(
        "parkingTotalSlots",
        adminParkingSlots.length
    );


    setParkingText(
        "parkingAvailableSlots",
        available
    );


    setParkingText(
        "parkingHeldSlots",
        held
    );


    setParkingText(
        "parkingReservedSlots",
        reserved
    );
}


/* =========================================================
   GENERATOR
   ========================================================= */

function configureParkingGenerator() {

    const existing =
        adminParkingSlots.length >
        0;


    document
        .getElementById(
            "existingParkingLayoutWarning"
        )
        ?.classList.toggle(
            "hidden",
            !existing
        );


    [
        "addParkingZoneButton",
        "resetParkingZonesButton",
        "generateParkingLayoutButton"
    ]
        .forEach(
            function (id) {

                const element =
                    document.getElementById(
                        id
                    );


                if (element) {

                    element.disabled =
                        existing;
                }
            }
        );


    if (!existing) {

        resetParkingZoneRows();

    } else {

        clearParkingZoneRows();

        updateParkingConfiguredCount();
    }
}


/* =========================================================
   RESET ZONES
   ========================================================= */

function resetParkingZoneRows() {

    if (
        adminParkingSlots.length >
        0
    ) {

        return;
    }


    clearParkingZoneRows();


    addParkingZoneRow(
        "A",
        10,
        500
    );


    updateParkingConfiguredCount();
}


/* =========================================================
   ADD ZONE
   ========================================================= */

function addParkingZoneRow(
    zone = "",
    slotCount = 10,
    fee = 0
) {

    const container =
        document.getElementById(
            "parkingZonesContainer"
        );


    if (!container) {

        return;
    }


    const index =
        container.children.length;


    const defaultZone =
        zone ||
        convertParkingZoneIndexToLabel(
            index
        );


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "admin-parking-zone-row";


    row.innerHTML = `

        <input
            type="text"
            class="form-control"
            data-parking-zone
            value="${escapeParkingHtml(defaultZone)}"
            placeholder="A"
            maxlength="20"
        >


        <input
            type="number"
            class="form-control"
            data-parking-slot-count
            min="1"
            step="1"
            value="${Number(slotCount) || 1}"
        >


        <input
            type="number"
            class="form-control"
            data-parking-zone-fee
            min="0"
            step="0.01"
            value="${Number(fee) || 0}"
        >


        <button
            type="button"
            class="btn btn-danger"
            data-remove-parking-zone
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
                    updateParkingConfiguredCount
                );
            }
        );


    row
        .querySelector(
            "[data-remove-parking-zone]"
        )
        ?.addEventListener(
            "click",
            function () {

                row.remove();

                updateParkingConfiguredCount();
            }
        );


    container.appendChild(
        row
    );
}


/* =========================================================
   A B C ...
   ========================================================= */

function convertParkingZoneIndexToLabel(
    index
) {

    return String.fromCharCode(
        65 +
        (
            Number(index) %
            26
        )
    );
}


/* =========================================================
   CLEAR ZONES
   ========================================================= */

function clearParkingZoneRows() {

    const container =
        document.getElementById(
            "parkingZonesContainer"
        );


    if (container) {

        container.innerHTML =
            "";
    }
}


/* =========================================================
   ZONE CONFIG
   ========================================================= */

function getParkingZoneConfiguration() {

    return Array.from(
        document.querySelectorAll(
            "#parkingZonesContainer .admin-parking-zone-row"
        )
    )
        .map(
            function (row) {

                const zone =
                    row
                        .querySelector(
                            "[data-parking-zone]"
                        )
                        ?.value
                        .trim()
                        .toUpperCase() ||
                    "";


                const count =
                    Number(
                        row
                            .querySelector(
                                "[data-parking-slot-count]"
                            )
                            ?.value ||
                        0
                    );


                const fee =
                    Number(
                        row
                            .querySelector(
                                "[data-parking-zone-fee]"
                            )
                            ?.value ||
                        0
                    );


                return {

                    zone:
                        zone,

                    slotCount:
                        count,

                    fee:
                        fee
                };
            }
        );
}


/* =========================================================
   CONFIG COUNT
   ========================================================= */

function updateParkingConfiguredCount() {

    const total =
        getParkingZoneConfiguration()
            .reduce(
                function (
                    sum,
                    zone
                ) {

                    return (
                        sum +
                        (
                            Number.isInteger(
                                zone.slotCount
                            )
                                ? zone.slotCount
                                : 0
                        )
                    );
                },
                0
            );


    setParkingText(
        "parkingConfiguredSlotCount",
        total
    );
}


/* =========================================================
   GENERATE LAYOUT
   ========================================================= */

async function generateParkingLayout() {

    if (
        !selectedParkingEventId ||
        parkingGenerateInProgress
    ) {

        return;
    }


    clearParkingMessage();


    if (
        adminParkingSlots.length >
        0
    ) {

        showParkingMessage(
            "A parking layout already exists for this event.",
            "error"
        );


        return;
    }


    const zones =
        getParkingZoneConfiguration();


    if (
        zones.length === 0
    ) {

        showParkingMessage(
            "Add at least one parking zone.",
            "error"
        );


        return;
    }


    const invalidZone =
        zones.find(
            function (zone) {

                return (
                    !zone.zone ||
                    !Number.isInteger(
                        zone.slotCount
                    ) ||
                    zone.slotCount <= 0 ||
                    Number.isNaN(
                        zone.fee
                    ) ||
                    zone.fee < 0
                );
            }
        );


    if (invalidZone) {

        showParkingMessage(
            "Every zone needs a name, at least one slot and a non-negative parking fee.",
            "error"
        );


        return;
    }


    /*
     * Validate duplicate zone names.
     */

    const zoneNames =
        zones.map(
            function (zone) {

                return zone.zone;
            }
        );


    const uniqueZones =
        new Set(
            zoneNames
        );


    if (
        uniqueZones.size !==
        zoneNames.length
    ) {

        showParkingMessage(
            "Duplicate parking zone names are not allowed.",
            "error"
        );


        return;
    }


    const slots =
        buildParkingSlotsFromZones(
            zones
        );


    /*
     * Required by team parking scope:
     * duplicate slot numbers must be
     * validated before creating layout.
     */

    if (
        hasDuplicateParkingSlotNumbers(
            slots
        )
    ) {

        showParkingMessage(
            "Duplicate parking slot numbers were generated. Review the zone configuration.",
            "error"
        );


        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Generate Parking Layout",

            message:
                `Create ${slots.length} parking slots for ${getParkingEventName(selectedParkingEvent)}?`,

            confirmText:
                "Generate Layout",

            cancelText:
                "Review"
        });


    if (!confirmed) {

        return;
    }


    parkingGenerateInProgress =
        true;


    const button =
        document.getElementById(
            "generateParkingLayoutButton"
        );


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Generating...";
    }


    try {

        await submitParkingLayoutToServer(
            slots
        );


        showParkingMessage(
            "Parking layout created successfully.",
            "success"
        );


        await loadSelectedParkingLayout();


    } catch (error) {

        console.error(
            "Parking Layout Generation Error:",
            error
        );


        showParkingMessage(
            getParkingApiError(
                error
            ),
            "error"
        );


    } finally {

        parkingGenerateInProgress =
            false;


        if (button) {

            button.textContent =
                "Generate Parking Layout";
        }
    }
}


/* =========================================================
   BUILD SLOTS
   ========================================================= */

function buildParkingSlotsFromZones(
    zones
) {

    const slots =
        [];


    zones.forEach(
        function (zone) {

            const cleanZone =
                sanitizeParkingZoneForSlotNumber(
                    zone.zone
                );


            for (
                let i = 1;
                i <= zone.slotCount;
                i++
            ) {

                const number =
                    String(i)
                        .padStart(
                            2,
                            "0"
                        );


                slots.push({

                    slotNumber:
                        `${cleanZone}${number}`,

                    zone:
                        zone.zone,

                    parkingFee:
                        zone.fee,

                    status:
                        "Available"
                });
            }
        }
    );


    return slots;
}


/* =========================================================
   SANITIZE ZONE
   ========================================================= */

function sanitizeParkingZoneForSlotNumber(
    value
) {

    const clean =
        String(value || "")
            .toUpperCase()
            .replace(
                /[^A-Z0-9]/g,
                ""
            );


    return (
        clean ||
        "P"
    );
}


/* =========================================================
   DUPLICATE CHECK
   ========================================================= */

function hasDuplicateParkingSlotNumbers(
    slots
) {

    const numbers =
        slots.map(
            function (slot) {

                return slot.slotNumber
                    .toUpperCase();
            }
        );


    return (
        new Set(numbers).size !==
        numbers.length
    );
}


/* =========================================================
   SUBMIT PARKING LAYOUT
   ========================================================= */

async function submitParkingLayoutToServer(
    slots
) {

    /*
     * BRD defines:
     *
     * POST
     * /api/events/{eventId}/parking-slots
     *
     * but does not freeze the exact
     * request DTO structure.
     *
     * This implementation assumes the
     * API accepts one CreateParkingSlotRequest
     * per POST.
     *
     * If Swagger uses one bulk request,
     * only this function needs changing.
     */


    for (
        const slot of slots
    ) {

        await apiPost(
            `/events/${encodeURIComponent(
                selectedParkingEventId
            )}/parking-slots`,
            buildParkingSlotCreateRequest(
                slot
            )
        );
    }
}


/* =========================================================
   CREATE DTO ADAPTER
   ========================================================= */

function buildParkingSlotCreateRequest(
    slot
) {

    /*
     * Check Swagger.
     *
     * Current assumed DTO:
     *
     * {
     *   slotNumber,
     *   zone,
     *   parkingFee,
     *   status
     * }
     */

    return {

        slotNumber:
            slot.slotNumber,

        zone:
            slot.zone,

        parkingFee:
            slot.parkingFee,

        status:
            slot.status
    };
}


/* =========================================================
   VISUAL MAP
   ========================================================= */

function renderAdminParkingMap() {

    const map =
        document.getElementById(
            "adminParkingVisualMap"
        );


    const empty =
        document.getElementById(
            "adminParkingEmpty"
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
        adminParkingSlots.length ===
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
        groupParkingSlotsByZone(
            adminParkingSlots
        );


    Object.keys(grouped)
        .sort()
        .forEach(
            function (zone) {

                const block =
                    document.createElement(
                        "section"
                    );


                block.className =
                    "admin-parking-zone-block";


                const heading =
                    document.createElement(
                        "h3"
                    );


                heading.className =
                    "admin-parking-zone-title";


                heading.textContent =
                    `Zone ${zone}`;


                const slots =
                    document.createElement(
                        "div"
                    );


                slots.className =
                    "admin-parking-zone-slots";


                grouped[zone]
                    .sort(
                        function (a, b) {

                            return getParkingSlotNumber(a)
                                .localeCompare(
                                    getParkingSlotNumber(b),
                                    undefined,
                                    {
                                        numeric:
                                            true
                                    }
                                );
                        }
                    )
                    .forEach(
                        function (slot) {

                            slots.appendChild(
                                createParkingSlotButton(
                                    slot
                                )
                            );
                        }
                    );


                block.appendChild(
                    heading
                );


                block.appendChild(
                    slots
                );


                map.appendChild(
                    block
                );
            }
        );
}


/* =========================================================
   GROUP BY ZONE
   ========================================================= */

function groupParkingSlotsByZone(
    slots
) {

    const grouped =
        {};


    slots.forEach(
        function (slot) {

            const zone =
                getParkingSlotZone(
                    slot
                ) ||
                "Other";


            if (!grouped[zone]) {

                grouped[zone] =
                    [];
            }


            grouped[zone].push(
                slot
            );
        }
    );


    return grouped;
}


/* =========================================================
   SLOT BUTTON
   ========================================================= */

function createParkingSlotButton(
    slot
) {

    const status =
        getParkingSlotStatus(
            slot
        );


    const protectedSlot =
        isProtectedParkingSlot(
            slot
        );


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        `admin-parking-slot-button ${getParkingStatusCssClass(status)}${
            protectedSlot
                ? " protected"
                : ""
        }`;


    button.innerHTML = `

        <strong>
            ${escapeParkingHtml(
                getParkingSlotNumber(
                    slot
                )
            )}
        </strong>

        <small>
            ${escapeParkingHtml(
                formatParkingCurrency(
                    getParkingSlotFee(
                        slot
                    )
                )
            )}
        </small>
    `;


    button.title =
        `${getParkingSlotNumber(slot)} - ${formatParkingStatus(status)}`;


    button.addEventListener(
        "click",
        function () {

            openParkingSlotModal(
                slot
            );
        }
    );


    return button;
}


/* =========================================================
   OPEN EDIT MODAL
   ========================================================= */

function openParkingSlotModal(
    slot
) {

    selectedParkingSlot =
        slot;


    clearParkingSlotValidation();


    const protectedSlot =
        isProtectedParkingSlot(
            slot
        );


    setParkingInputValue(
        "editParkingSlotId",
        getParkingSlotId(
            slot
        )
    );


    setParkingInputValue(
        "editParkingSlotNumber",
        getParkingSlotNumber(
            slot
        )
    );


    setParkingInputValue(
        "editParkingZone",
        getParkingSlotZone(
            slot
        )
    );


    setParkingInputValue(
        "editParkingFee",
        getParkingSlotFee(
            slot
        )
    );


    const currentStatus =
        getParkingSlotStatus(
            slot
        );


    setParkingInputValue(
        "editParkingStatus",
        currentStatus ===
        "unavailable"
            ? "Unavailable"
            : "Available"
    );


    setParkingText(
        "editParkingCurrentStatus",
        formatParkingStatus(
            currentStatus
        )
    );


    [
        "editParkingSlotNumber",
        "editParkingZone",
        "editParkingFee",
        "editParkingStatus"
    ]
        .forEach(
            function (id) {

                const element =
                    document.getElementById(
                        id
                    );


                if (element) {

                    element.disabled =
                        protectedSlot;
                }
            }
        );


    const saveButton =
        document.getElementById(
            "saveParkingSlotButton"
        );


    const deleteButton =
        document.getElementById(
            "deleteParkingSlotButton"
        );


    if (saveButton) {

        saveButton.classList.toggle(
            "hidden",
            protectedSlot
        );
    }


    if (deleteButton) {

        deleteButton.classList.toggle(
            "hidden",
            protectedSlot
        );
    }


    document
        .getElementById(
            "protectedParkingSlotMessage"
        )
        ?.classList.toggle(
            "hidden",
            !protectedSlot
        );


    document
        .getElementById(
            "editParkingSlotModal"
        )
        ?.classList.add(
            "active"
        );
}


/* =========================================================
   CLOSE EDIT MODAL
   ========================================================= */

function closeParkingSlotModal() {

    if (
        parkingSlotActionInProgress
    ) {

        return;
    }


    selectedParkingSlot =
        null;


    document
        .getElementById(
            "editParkingSlotModal"
        )
        ?.classList.remove(
            "active"
        );
}


/* =========================================================
   UPDATE SLOT
   ========================================================= */

async function updateParkingSlot(
    event
) {

    event.preventDefault();


    if (
        !selectedParkingSlot ||
        parkingSlotActionInProgress
    ) {

        return;
    }


    if (
        isProtectedParkingSlot(
            selectedParkingSlot
        )
    ) {

        showParkingMessage(
            "Held or reserved parking slots cannot be modified from this screen.",
            "error"
        );


        return;
    }


    clearParkingSlotValidation();

    clearParkingMessage();


    const slotId =
        getParkingSlotId(
            selectedParkingSlot
        );


    const slotNumber =
        document
            .getElementById(
                "editParkingSlotNumber"
            )
            ?.value
            .trim()
            .toUpperCase() ||
        "";


    const zone =
        document
            .getElementById(
                "editParkingZone"
            )
            ?.value
            .trim()
            .toUpperCase() ||
        "";


    const fee =
        Number(
            document
                .getElementById(
                    "editParkingFee"
                )
                ?.value ||
            0
        );


    const status =
        document
            .getElementById(
                "editParkingStatus"
            )
            ?.value ||
        "Available";


    let valid =
        true;


    if (!slotNumber) {

        showParkingSlotFieldError(
            "editParkingSlotNumber",
            "editParkingSlotNumberError",
            "Slot number is required."
        );


        valid =
            false;
    }


    if (!zone) {

        showParkingSlotFieldError(
            "editParkingZone",
            "editParkingZoneError",
            "Parking zone is required."
        );


        valid =
            false;
    }


    if (
        Number.isNaN(fee) ||
        fee < 0
    ) {

        showParkingSlotFieldError(
            "editParkingFee",
            "editParkingFeeError",
            "Parking fee cannot be negative."
        );


        valid =
            false;
    }


    /*
     * Duplicate slot number validation.
     */

    const duplicate =
        adminParkingSlots.some(
            function (slot) {

                return (
                    String(
                        getParkingSlotId(
                            slot
                        )
                    ) !==
                    String(slotId) &&

                    getParkingSlotNumber(
                        slot
                    )
                        .toUpperCase() ===
                    slotNumber
                );
            }
        );


    if (duplicate) {

        showParkingSlotFieldError(
            "editParkingSlotNumber",
            "editParkingSlotNumberError",
            "This slot number already exists for the event."
        );


        valid =
            false;
    }


    if (!valid) {

        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Update Parking Slot",

            message:
                `Save changes to parking slot ${getParkingSlotNumber(selectedParkingSlot)}?`,

            confirmText:
                "Save Changes",

            cancelText:
                "Cancel"
        });


    if (!confirmed) {

        return;
    }


    parkingSlotActionInProgress =
        true;


    setParkingSlotSaveState(
        true
    );


    try {

        await apiPut(
            `/events/${encodeURIComponent(
                selectedParkingEventId
            )}/parking-slots/${encodeURIComponent(
                slotId
            )}`,
            buildParkingSlotUpdateRequest({

                slotNumber:
                    slotNumber,

                zone:
                    zone,

                parkingFee:
                    fee,

                status:
                    status
            })
        );


        document
            .getElementById(
                "editParkingSlotModal"
            )
            ?.classList.remove(
                "active"
            );


        selectedParkingSlot =
            null;


        showParkingMessage(
            "Parking slot updated successfully.",
            "success"
        );


        await loadSelectedParkingLayout();


    } catch (error) {

        showParkingMessage(
            getParkingApiError(
                error
            ),
            "error"
        );


    } finally {

        parkingSlotActionInProgress =
            false;


        setParkingSlotSaveState(
            false
        );
    }
}


/* =========================================================
   UPDATE DTO ADAPTER
   ========================================================= */

function buildParkingSlotUpdateRequest(
    values
) {

    /*
     * Check Swagger.
     *
     * Current assumed DTO:
     *
     * {
     *   slotNumber,
     *   zone,
     *   parkingFee,
     *   status
     * }
     */

    return {

        slotNumber:
            values.slotNumber,

        zone:
            values.zone,

        parkingFee:
            values.parkingFee,

        status:
            values.status
    };
}


/* =========================================================
   SAVE STATE
   ========================================================= */

function setParkingSlotSaveState(
    saving
) {

    const button =
        document.getElementById(
            "saveParkingSlotButton"
        );


    if (!button) {

        return;
    }


    button.disabled =
        saving;


    button.textContent =
        saving
            ? "Saving..."
            : "Save Changes";
}


/* =========================================================
   DELETE CONFIRMATION
   ========================================================= */

async function confirmDeleteParkingSlot() {

    if (
        !selectedParkingSlot ||
        parkingSlotActionInProgress
    ) {

        return;
    }


    if (
        isProtectedParkingSlot(
            selectedParkingSlot
        )
    ) {

        showParkingMessage(
            "This parking slot cannot be deleted because it is held or reserved.",
            "error"
        );


        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Delete Parking Slot",

            message:
                `Delete parking slot ${getParkingSlotNumber(selectedParkingSlot)}?`,

            confirmText:
                "Delete Slot",

            cancelText:
                "Keep Slot"
        });


    if (!confirmed) {

        return;
    }


    await deleteParkingSlot();
}


/* =========================================================
   DELETE SLOT
   ========================================================= */

async function deleteParkingSlot() {

    const slotId =
        getParkingSlotId(
            selectedParkingSlot
        );


    parkingSlotActionInProgress =
        true;


    const button =
        document.getElementById(
            "deleteParkingSlotButton"
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
         *
         * DELETE
         * /api/events/{eventId}/parking-slots/{slotId}
         *
         * Backend must reject active reservation.
         */

        await apiDelete(
            `/events/${encodeURIComponent(
                selectedParkingEventId
            )}/parking-slots/${encodeURIComponent(
                slotId
            )}`
        );


        document
            .getElementById(
                "editParkingSlotModal"
            )
            ?.classList.remove(
                "active"
            );


        selectedParkingSlot =
            null;


        showParkingMessage(
            "Parking slot deleted successfully.",
            "success"
        );


        await loadSelectedParkingLayout();


    } catch (error) {

        showParkingMessage(
            getParkingApiError(
                error
            ),
            "error"
        );


    } finally {

        parkingSlotActionInProgress =
            false;


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Delete Slot";
        }
    }
}


/* =========================================================
   SLOT VALIDATION
   ========================================================= */

function showParkingSlotFieldError(
    inputId,
    errorId,
    message
) {

    document
        .getElementById(
            inputId
        )
        ?.classList.add(
            "input-error"
        );


    const error =
        document.getElementById(
            errorId
        );


    if (error) {

        error.textContent =
            message;
    }
}


function clearParkingSlotValidation() {

    [
        "editParkingSlotNumber",
        "editParkingZone",
        "editParkingFee"
    ]
        .forEach(
            function (id) {

                document
                    .getElementById(
                        id
                    )
                    ?.classList.remove(
                        "input-error"
                    );
            }
        );


    [
        "editParkingSlotNumberError",
        "editParkingZoneError",
        "editParkingFeeError"
    ]
        .forEach(
            function (id) {

                const element =
                    document.getElementById(
                        id
                    );


                if (element) {

                    element.textContent =
                        "";
                }
            }
        );
}


/* =========================================================
   EVENT HELPERS
   ========================================================= */

function getParkingEventId(
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


function getParkingEventName(
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
   SLOT HELPERS
   ========================================================= */

function getParkingSlotId(
    slot
) {

    return (

        slot?.parkingSlotId ||

        slot?.ParkingSlotId ||

        slot?.slotId ||

        slot?.SlotId ||

        slot?.id ||

        slot?.Id ||

        null
    );
}


function getParkingSlotNumber(
    slot
) {

    return String(

        slot?.slotNumber ||

        slot?.SlotNumber ||

        slot?.number ||

        "-"
    );
}


function getParkingSlotZone(
    slot
) {

    return String(

        slot?.zone ||

        slot?.Zone ||

        ""
    );
}


function getParkingSlotFee(
    slot
) {

    const value =
        Number(

            slot?.parkingFee ??

            slot?.ParkingFee ??

            slot?.fee ??

            slot?.Fee ??

            slot?.currentFee ??

            slot?.CurrentFee ??

            slot?.feeOverride ??

            slot?.FeeOverride ??

            0
        );


    return Number.isNaN(value)
        ? 0
        : value;
}


/* =========================================================
   STATUS
   ========================================================= */

function getParkingSlotStatus(
    slot
) {

    return String(

        slot?.status ||

        slot?.Status ||

        slot?.parkingSlotStatus ||

        "Available"
    )
        .trim()
        .toLowerCase();
}


/* =========================================================
   PROTECTED SLOT
   ========================================================= */

function isProtectedParkingSlot(
    slot
) {

    const status =
        getParkingSlotStatus(
            slot
        );


    return (

        status === "held" ||

        status === "reserved" ||

        status === "occupied"
    );
}


/* =========================================================
   CSS STATUS
   ========================================================= */

function getParkingStatusCssClass(
    status
) {

    if (
        status === "held"
    ) {

        return "held";
    }


    if (
        status === "reserved"
    ) {

        return "reserved";
    }


    if (
        status === "occupied"
    ) {

        return "occupied";
    }


    if (
        status === "unavailable"
    ) {

        return "unavailable";
    }


    return "available";
}


/* =========================================================
   FORMAT STATUS
   ========================================================= */

function formatParkingStatus(
    status
) {

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
   CURRENCY
   ========================================================= */

function formatParkingCurrency(
    value
) {

    const amount =
        Number(value);


    return new Intl.NumberFormat(
        "en-LK",
        {
            style:
                "currency",

            currency:
                "LKR",

            minimumFractionDigits:
                0
        }
    ).format(
        Number.isNaN(amount)
            ? 0
            : amount
    );
}


/* =========================================================
   API ERRORS
   ========================================================= */

function getParkingApiError(
    error
) {

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
            messages.length >
            0
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
            "This parking operation conflicts with an existing reservation or slot number."
        );
    }


    if (
        error.status === 400
    ) {

        return (
            error.message ||
            "The parking operation does not satisfy the parking rules."
        );
    }


    return (
        error.message ||
        "Unable to complete the parking operation."
    );
}


/* =========================================================
   UI STATE
   ========================================================= */

function showParkingContent() {

    document
        .getElementById(
            "adminParkingNoEvent"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminParkingContent"
        )
        ?.classList.remove(
            "hidden"
        );
}


function showParkingNoEvent() {

    document
        .getElementById(
            "adminParkingContent"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminParkingNoEvent"
        )
        ?.classList.remove(
            "hidden"
        );


    setParkingText(
        "parkingSelectedEventName",
        "-"
    );
}


function showParkingLoading() {

    document
        .getElementById(
            "adminParkingLoading"
        )
        ?.classList.remove(
            "hidden"
        );
}


function hideParkingLoading() {

    document
        .getElementById(
            "adminParkingLoading"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   TEXT / INPUT
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


function setParkingInputValue(
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

function showParkingMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminParkingMessage"
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


function clearParkingMessage() {

    const element =
        document.getElementById(
            "adminParkingMessage"
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

function escapeParkingHtml(
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
