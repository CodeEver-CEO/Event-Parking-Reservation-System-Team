/* =========================================================
   Event & Parking Reservation System
   Admin Venue Management
   ========================================================= */


let adminVenues = [];

let selectedVenueDetails = null;

let venueSaveInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminVenuesPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminVenuesPage() {

    if (!validateAdminVenueAccess()) {
        return;
    }


    await loadVenueAdminSidebar();


    initializeVenueControls();


    await loadAdminVenues();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateAdminVenueAccess() {

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

async function loadVenueAdminSidebar() {

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
                    "venues"
                ) {

                    link.classList.add(
                        "active"
                    );
                }
            }
        );


    initializeVenueAdminLogout();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function initializeVenueAdminLogout() {

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

function initializeVenueControls() {

    const addButton =
        document.getElementById(
            "addVenueButton"
        );


    const emptyAddButton =
        document.getElementById(
            "emptyAddVenueButton"
        );


    const closeForm =
        document.getElementById(
            "closeVenueFormButton"
        );


    const cancelForm =
        document.getElementById(
            "cancelVenueFormButton"
        );


    const form =
        document.getElementById(
            "venueForm"
        );


    const search =
        document.getElementById(
            "venueSearchInput"
        );


    const clearSearch =
        document.getElementById(
            "clearVenueSearchButton"
        );


    const closeDetails =
        document.getElementById(
            "closeVenueDetailsButton"
        );


    const closeDetailsAction =
        document.getElementById(
            "closeVenueDetailsActionButton"
        );


    const editFromDetails =
        document.getElementById(
            "editVenueFromDetailsButton"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            openAddVenueModal
        );
    }


    if (emptyAddButton) {

        emptyAddButton.addEventListener(
            "click",
            openAddVenueModal
        );
    }


    if (closeForm) {

        closeForm.addEventListener(
            "click",
            closeVenueFormModal
        );
    }


    if (cancelForm) {

        cancelForm.addEventListener(
            "click",
            closeVenueFormModal
        );
    }


    if (form) {

        form.addEventListener(
            "submit",
            saveAdminVenue
        );
    }


    if (search) {

        search.addEventListener(
            "input",
            applyVenueSearch
        );
    }


    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            function () {

                if (search) {
                    search.value = "";
                }


                applyVenueSearch();
            }
        );
    }


    if (closeDetails) {

        closeDetails.addEventListener(
            "click",
            closeVenueDetailsModal
        );
    }


    if (closeDetailsAction) {

        closeDetailsAction.addEventListener(
            "click",
            closeVenueDetailsModal
        );
    }


    if (editFromDetails) {

        editFromDetails.addEventListener(
            "click",
            function () {

                if (!selectedVenueDetails) {
                    return;
                }


                closeVenueDetailsModal();


                openEditVenueModal(
                    selectedVenueDetails
                );
            }
        );
    }


    initializeVenueModalBackgroundClose();
}


/* =========================================================
   BACKGROUND CLOSE
   ========================================================= */

function initializeVenueModalBackgroundClose() {

    const formModal =
        document.getElementById(
            "venueFormModal"
        );


    const detailsModal =
        document.getElementById(
            "venueDetailsModal"
        );


    if (formModal) {

        formModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    formModal
                ) {

                    closeVenueFormModal();
                }
            }
        );
    }


    if (detailsModal) {

        detailsModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    detailsModal
                ) {

                    closeVenueDetailsModal();
                }
            }
        );
    }
}


/* =========================================================
   LOAD VENUES
   ========================================================= */

async function loadAdminVenues() {

    clearVenueMessage();

    showVenuesLoading();


    try {

        /*
         * BRD:
         *
         * GET /api/venues
         */

        const response =
            await apiGet(
                "/venues"
            );


        adminVenues =
            normalizeVenueResponse(
                response
            );


        sortVenues();


        renderVenueSummary();


        hideVenuesLoading();


        applyVenueSearch();


    } catch (error) {

        console.error(
            "Load Venues Error:",
            error
        );


        hideVenuesLoading();


        showVenueMessage(
            error.message ||
            "Unable to load venues.",
            "error"
        );
    }
}


/* =========================================================
   NORMALIZE
   ========================================================= */

function normalizeVenueResponse(
    response
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
            response?.venues
        )
    ) {

        return response.venues;
    }


    return [];
}


/* =========================================================
   SORT
   ========================================================= */

function sortVenues() {

    adminVenues.sort(
        function (a, b) {

            return getVenueName(a)
                .localeCompare(
                    getVenueName(b)
                );
        }
    );
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderVenueSummary() {

    const totalVenues =
        adminVenues.length;


    const totalCapacity =
        adminVenues.reduce(
            function (total, venue) {

                return (
                    total +
                    getVenueCapacity(venue)
                );
            },
            0
        );


    const largest =
        adminVenues.reduce(
            function (largestCapacity, venue) {

                return Math.max(
                    largestCapacity,
                    getVenueCapacity(venue)
                );
            },
            0
        );


    setVenueText(
        "totalVenueCount",
        totalVenues
    );


    setVenueText(
        "totalVenueCapacity",
        totalCapacity.toLocaleString(
            "en-LK"
        )
    );


    setVenueText(
        "largestVenueCapacity",
        largest.toLocaleString(
            "en-LK"
        )
    );


    const summary =
        document.getElementById(
            "venueSummary"
        );


    if (summary) {

        summary.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   SEARCH
   ========================================================= */

function applyVenueSearch() {

    const search =
        document
            .getElementById(
                "venueSearchInput"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const filtered =
        adminVenues.filter(
            function (venue) {

                if (!search) {
                    return true;
                }


                return (
                    getVenueName(venue)
                        .toLowerCase()
                        .includes(search) ||

                    getVenueAddress(venue)
                        .toLowerCase()
                        .includes(search)
                );
            }
        );


    renderVenues(
        filtered
    );
}


/* =========================================================
   RENDER
   ========================================================= */

function renderVenues(
    venues
) {

    const table =
        document.getElementById(
            "venuesTableContainer"
        );


    const body =
        document.getElementById(
            "venuesTableBody"
        );


    const empty =
        document.getElementById(
            "venuesEmpty"
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


    setVenueText(
        "venueResultCount",
        venues.length === 1
            ? "1 venue"
            : `${venues.length} venues`
    );


    if (
        venues.length === 0
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


    venues.forEach(
        function (venue) {

            body.appendChild(
                createVenueRow(
                    venue
                )
            );
        }
    );
}


/* =========================================================
   ROW
   ========================================================= */

function createVenueRow(
    venue
) {

    const id =
        getVenueId(
            venue
        );


    const name =
        getVenueName(
            venue
        );


    const address =
        getVenueAddress(
            venue
        );


    const capacity =
        getVenueCapacity(
            venue
        );


    const row =
        document.createElement(
            "tr"
        );


    row.innerHTML = `

        <td>

            <div class="admin-venue-name">

                <div class="admin-venue-icon">
                    ⌂
                </div>

                <div>

                    <strong>
                        ${escapeVenueHtml(name)}
                    </strong>

                    <span>
                        ID: ${escapeVenueHtml(id || "-")}
                    </span>

                </div>

            </div>

        </td>


        <td>
            ${escapeVenueHtml(address)}
        </td>


        <td>

            <span class="admin-venue-capacity">

                ${capacity.toLocaleString("en-LK")}

            </span>

        </td>


        <td>

            <div class="admin-venue-actions">


                <button
                    type="button"
                    class="btn btn-outline"
                    data-view-venue-id="${escapeVenueHtml(id)}"
                >
                    View
                </button>


                <button
                    type="button"
                    class="btn btn-primary"
                    data-edit-venue-id="${escapeVenueHtml(id)}"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="btn btn-danger"
                    data-delete-venue-id="${escapeVenueHtml(id)}"
                    data-venue-name="${escapeVenueHtml(name)}"
                >
                    Delete
                </button>


            </div>

        </td>
    `;


    initializeVenueRowActions(
        row
    );


    return row;
}


/* =========================================================
   ROW ACTIONS
   ========================================================= */

function initializeVenueRowActions(
    row
) {

    const viewButton =
        row.querySelector(
            "[data-view-venue-id]"
        );


    const editButton =
        row.querySelector(
            "[data-edit-venue-id]"
        );


    const deleteButton =
        row.querySelector(
            "[data-delete-venue-id]"
        );


    if (viewButton) {

        viewButton.addEventListener(
            "click",
            function () {

                viewVenueDetails(
                    this.dataset
                        .viewVenueId
                );
            }
        );
    }


    if (editButton) {

        editButton.addEventListener(
            "click",
            function () {

                loadVenueForEditing(
                    this.dataset
                        .editVenueId
                );
            }
        );
    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            function () {

                confirmVenueDeletion(
                    this.dataset
                        .deleteVenueId,

                    this.dataset
                        .venueName,

                    this
                );
            }
        );
    }
}


/* =========================================================
   ADD MODAL
   ========================================================= */

function openAddVenueModal() {

    clearVenueValidation();


    document.getElementById(
        "venueForm"
    )?.reset();


    setVenueInputValue(
        "venueId",
        ""
    );


    setVenueText(
        "venueFormTitle",
        "Add Venue"
    );


    setVenueText(
        "saveVenueButton",
        "Save Venue"
    );


    document
        .getElementById(
            "venueFormModal"
        )
        ?.classList.add(
            "active"
        );


    document
        .getElementById(
            "venueName"
        )
        ?.focus();
}


/* =========================================================
   EDIT LOAD
   ========================================================= */

async function loadVenueForEditing(
    venueId
) {

    clearVenueMessage();


    try {

        /*
         * BRD:
         * GET /api/venues/{id}
         */

        const response =
            await apiGet(
                `/venues/${encodeURIComponent(
                    venueId
                )}`
            );


        const venue =
            response?.data ||
            response?.venue ||
            response;


        openEditVenueModal(
            venue
        );


    } catch (error) {

        showVenueMessage(
            error.message ||
            "Unable to load this venue.",
            "error"
        );
    }
}


/* =========================================================
   EDIT MODAL
   ========================================================= */

function openEditVenueModal(
    venue
) {

    if (!venue) {
        return;
    }


    clearVenueValidation();


    setVenueText(
        "venueFormTitle",
        "Edit Venue"
    );


    setVenueInputValue(
        "venueId",
        getVenueId(venue)
    );


    setVenueInputValue(
        "venueName",
        getVenueName(venue)
    );


    setVenueInputValue(
        "venueAddress",
        getVenueAddress(venue)
    );


    setVenueInputValue(
        "venueCapacity",
        getVenueCapacity(venue)
    );


    setVenueText(
        "saveVenueButton",
        "Update Venue"
    );


    document
        .getElementById(
            "venueFormModal"
        )
        ?.classList.add(
            "active"
        );
}


/* =========================================================
   CLOSE FORM
   ========================================================= */

function closeVenueFormModal() {

    if (venueSaveInProgress) {
        return;
    }


    document
        .getElementById(
            "venueFormModal"
        )
        ?.classList.remove(
            "active"
        );


    clearVenueValidation();
}


/* =========================================================
   SAVE
   ========================================================= */

async function saveAdminVenue(
    event
) {

    event.preventDefault();


    if (venueSaveInProgress) {
        return;
    }


    clearVenueValidation();

    clearVenueMessage();


    const venueId =
        document
            .getElementById(
                "venueId"
            )
            ?.value
            .trim() ||
        "";


    const name =
        document
            .getElementById(
                "venueName"
            )
            ?.value
            .trim() ||
        "";


    const address =
        document
            .getElementById(
                "venueAddress"
            )
            ?.value
            .trim() ||
        "";


    const capacityValue =
        document
            .getElementById(
                "venueCapacity"
            )
            ?.value
            .trim() ||
        "";


    if (
        !validateVenueForm(
            name,
            address,
            capacityValue
        )
    ) {

        return;
    }


    const capacity =
        Number(
            capacityValue
        );


    const requestData = {

        name:
            name,

        address:
            address,

        totalCapacity:
            capacity
    };


    setVenueSavingState(
        true,
        Boolean(venueId)
    );


    try {

        if (venueId) {

            /*
             * BRD:
             * PUT /api/venues/{id}
             */

            await apiPut(
                `/venues/${encodeURIComponent(
                    venueId
                )}`,
                requestData
            );


            closeVenueFormModalForce();


            showVenueMessage(
                "Venue updated successfully.",
                "success"
            );


        } else {

            /*
             * BRD:
             * POST /api/venues
             */

            await apiPost(
                "/venues",
                requestData
            );


            closeVenueFormModalForce();


            showVenueMessage(
                "Venue created successfully.",
                "success"
            );
        }


        await loadAdminVenues();


    } catch (error) {

        console.error(
            "Save Venue Error:",
            error
        );


        showVenueMessage(
            getVenueApiErrorMessage(
                error
            ),
            "error"
        );


    } finally {

        setVenueSavingState(
            false,
            Boolean(venueId)
        );
    }
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateVenueForm(
    name,
    address,
    capacity
) {

    let valid =
        true;


    if (!name) {

        showVenueFieldError(
            "venueName",
            "venueNameError",
            "Venue name is required."
        );


        valid =
            false;

    } else if (
        name.length < 2
    ) {

        showVenueFieldError(
            "venueName",
            "venueNameError",
            "Venue name must contain at least 2 characters."
        );


        valid =
            false;
    }


    if (!address) {

        showVenueFieldError(
            "venueAddress",
            "venueAddressError",
            "Venue address is required."
        );


        valid =
            false;
    }


    const numericCapacity =
        Number(capacity);


    if (
        !capacity ||
        Number.isNaN(
            numericCapacity
        ) ||
        numericCapacity <= 0 ||
        !Number.isInteger(
            numericCapacity
        )
    ) {

        showVenueFieldError(
            "venueCapacity",
            "venueCapacityError",
            "Total capacity must be a positive whole number."
        );


        valid =
            false;
    }


    return valid;
}


/* =========================================================
   FIELD ERROR
   ========================================================= */

function showVenueFieldError(
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


/* =========================================================
   CLEAR VALIDATION
   ========================================================= */

function clearVenueValidation() {

    [
        "venueName",
        "venueAddress",
        "venueCapacity"
    ]
        .forEach(
            function (id) {

                document
                    .getElementById(id)
                    ?.classList.remove(
                        "input-error"
                    );
            }
        );


    [
        "venueNameError",
        "venueAddressError",
        "venueCapacityError"
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
   SAVING STATE
   ========================================================= */

function setVenueSavingState(
    saving,
    editing
) {

    venueSaveInProgress =
        saving;


    const button =
        document.getElementById(
            "saveVenueButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        saving;


    if (saving) {

        button.textContent =
            editing
                ? "Updating..."
                : "Saving...";

    } else {

        button.textContent =
            editing
                ? "Update Venue"
                : "Save Venue";
    }
}


/* =========================================================
   FORCE CLOSE
   ========================================================= */

function closeVenueFormModalForce() {

    document
        .getElementById(
            "venueFormModal"
        )
        ?.classList.remove(
            "active"
        );
}


/* =========================================================
   VIEW DETAILS
   ========================================================= */

async function viewVenueDetails(
    venueId
) {

    clearVenueMessage();


    try {

        /*
         * BRD:
         * GET /api/venues/{id}
         */

        const response =
            await apiGet(
                `/venues/${encodeURIComponent(
                    venueId
                )}`
            );


        selectedVenueDetails =
            response?.data ||
            response?.venue ||
            response;


        if (!selectedVenueDetails) {

            throw new Error(
                "Venue details were not returned."
            );
        }


        setVenueText(
            "venueDetailsName",
            getVenueName(
                selectedVenueDetails
            )
        );


        setVenueText(
            "venueDetailsId",
            getVenueId(
                selectedVenueDetails
            )
        );


        setVenueText(
            "venueDetailsAddress",
            getVenueAddress(
                selectedVenueDetails
            )
        );


        setVenueText(
            "venueDetailsCapacity",
            getVenueCapacity(
                selectedVenueDetails
            ).toLocaleString(
                "en-LK"
            )
        );


        document
            .getElementById(
                "venueDetailsModal"
            )
            ?.classList.add(
                "active"
            );


    } catch (error) {

        showVenueMessage(
            error.message ||
            "Unable to load venue details.",
            "error"
        );
    }
}


/* =========================================================
   CLOSE DETAILS
   ========================================================= */

function closeVenueDetailsModal() {

    document
        .getElementById(
            "venueDetailsModal"
        )
        ?.classList.remove(
            "active"
        );
}


/* =========================================================
   DELETE CONFIRMATION
   ========================================================= */

async function confirmVenueDeletion(
    venueId,
    venueName,
    button
) {

    const confirmed =
        await openConfirmationModal({

            title:
                "Delete Venue",

            message:
                `Delete ${venueName}? This action will only succeed if the venue has no protected upcoming event dependencies.`,

            confirmText:
                "Delete Venue",

            cancelText:
                "Keep Venue"
        });


    if (!confirmed) {

        return;
    }


    await deleteAdminVenue(
        venueId,
        button
    );
}


/* =========================================================
   DELETE VENUE
   ========================================================= */

async function deleteAdminVenue(
    venueId,
    button
) {

    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Deleting...";
    }


    clearVenueMessage();


    try {

        /*
         * BRD:
         * DELETE /api/venues/{id}
         */

        await apiDelete(
            `/venues/${encodeURIComponent(
                venueId
            )}`
        );


        showVenueMessage(
            "Venue deleted successfully.",
            "success"
        );


        await loadAdminVenues();


    } catch (error) {

        console.error(
            "Delete Venue Error:",
            error
        );


        if (
            error.status === 400 ||
            error.status === 409
        ) {

            showVenueMessage(
                getVenueApiErrorMessage(
                    error
                ) ||
                "This venue cannot be deleted because upcoming events are scheduled at it.",
                "error"
            );


        } else {

            showVenueMessage(
                getVenueApiErrorMessage(
                    error
                ),
                "error"
            );
        }


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Delete";
        }
    }
}


/* =========================================================
   API ERROR
   ========================================================= */

function getVenueApiErrorMessage(
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
            messages.length > 0
        ) {

            return messages.join(
                " "
            );
        }
    }


    return (
        error?.message ||
        "Unable to complete the venue operation."
    );
}


/* =========================================================
   HELPERS
   ========================================================= */

function getVenueId(
    venue
) {

    return (

        venue?.venueId ||

        venue?.VenueId ||

        venue?.id ||

        venue?.Id ||

        null
    );
}


function getVenueName(
    venue
) {

    return String(

        venue?.name ||

        venue?.Name ||

        venue?.venueName ||

        venue?.VenueName ||

        "Venue"
    );
}


function getVenueAddress(
    venue
) {

    return String(

        venue?.address ||

        venue?.Address ||

        ""
    );
}


function getVenueCapacity(
    venue
) {

    const value =
        Number(

            venue?.totalCapacity ??

            venue?.TotalCapacity ??

            venue?.capacity ??

            venue?.Capacity ??

            0
        );


    return Number.isNaN(value)
        ? 0
        : value;
}


/* =========================================================
   INPUT
   ========================================================= */

function setVenueInputValue(
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
   TEXT
   ========================================================= */

function setVenueText(
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

function showVenuesLoading() {

    document
        .getElementById(
            "venuesLoading"
        )
        ?.classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "venuesTableContainer"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "venuesEmpty"
        )
        ?.classList.add(
            "hidden"
        );
}


function hideVenuesLoading() {

    document
        .getElementById(
            "venuesLoading"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showVenueMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminVenuesMessage"
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


function clearVenueMessage() {

    const element =
        document.getElementById(
            "adminVenuesMessage"
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

function escapeVenueHtml(
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
