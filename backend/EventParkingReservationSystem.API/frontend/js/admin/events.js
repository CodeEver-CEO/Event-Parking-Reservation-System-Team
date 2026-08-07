/* =========================================================
   Event & Parking Reservation System
   Admin Event Management - Event List
   ========================================================= */


let adminEvents = [];

let adminEventVenues = [];

let adminEventCategories = [];

let eventDeleteInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminEventsPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminEventsPage() {

    if (!validateAdminEventsAccess()) {
        return;
    }


    await loadEventsAdminSidebar();


    initializeAdminEventFilters();


    await loadAdminEventPageData();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateAdminEventsAccess() {

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

async function loadEventsAdminSidebar() {

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
                    "events"
                ) {

                    link.classList.add(
                        "active"
                    );
                }
            }
        );


    initializeEventsAdminLogout();
}


/* =========================================================
   LOGOUT
   ========================================================= */

function initializeEventsAdminLogout() {

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
   LOAD PAGE DATA
   ========================================================= */

async function loadAdminEventPageData() {

    clearAdminEventsMessage();

    showAdminEventsLoading();


    try {

        const results =
            await Promise.all([

                apiGet("/events"),

                apiGet("/venues"),

                apiGet("/categories")

            ]);


        adminEvents =
            normalizeAdminEventArray(
                results[0],
                "events"
            );


        adminEventVenues =
            normalizeAdminEventArray(
                results[1],
                "venues"
            );


        adminEventCategories =
            normalizeAdminEventArray(
                results[2],
                "categories"
            );


        sortAdminEvents();


        populateAdminEventVenueFilter();

        populateAdminEventCategoryFilter();

        renderAdminEventSummary();


        hideAdminEventsLoading();


        applyAdminEventFilters();


    } catch (error) {

        console.error(
            "Admin Events Error:",
            error
        );


        hideAdminEventsLoading();


        showAdminEventsMessage(
            error.message ||
            "Unable to load event information.",
            "error"
        );
    }
}


/* =========================================================
   NORMALIZE ARRAY
   ========================================================= */

function normalizeAdminEventArray(
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


    return [];
}


/* =========================================================
   SORT EVENTS
   ========================================================= */

function sortAdminEvents() {

    adminEvents.sort(
        function (a, b) {

            return (
                new Date(
                    getAdminEventDate(a) ||
                    0
                ) -
                new Date(
                    getAdminEventDate(b) ||
                    0
                )
            );
        }
    );
}


/* =========================================================
   FILTER CONTROLS
   ========================================================= */

function initializeAdminEventFilters() {

    [
        "adminEventSearch",
        "adminEventDateFilter",
        "adminEventVenueFilter",
        "adminEventCategoryFilter"
    ]
        .forEach(
            function (id) {

                const element =
                    document.getElementById(
                        id
                    );


                if (!element) {
                    return;
                }


                element.addEventListener(
                    id === "adminEventSearch"
                        ? "input"
                        : "change",
                    applyAdminEventFilters
                );
            }
        );


    const clear =
        document.getElementById(
            "clearAdminEventFilters"
        );


    if (clear) {

        clear.addEventListener(
            "click",
            function () {

                setAdminEventInputValue(
                    "adminEventSearch",
                    ""
                );


                setAdminEventInputValue(
                    "adminEventDateFilter",
                    ""
                );


                setAdminEventInputValue(
                    "adminEventVenueFilter",
                    ""
                );


                setAdminEventInputValue(
                    "adminEventCategoryFilter",
                    ""
                );


                applyAdminEventFilters();
            }
        );
    }
}


/* =========================================================
   VENUE FILTER
   ========================================================= */

function populateAdminEventVenueFilter() {

    const select =
        document.getElementById(
            "adminEventVenueFilter"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">All Venues</option>`;


    adminEventVenues.forEach(
        function (venue) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                getAdminVenueId(
                    venue
                );


            option.textContent =
                getAdminVenueName(
                    venue
                );


            select.appendChild(
                option
            );
        }
    );
}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function populateAdminEventCategoryFilter() {

    const select =
        document.getElementById(
            "adminEventCategoryFilter"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">All Categories</option>`;


    adminEventCategories.forEach(
        function (category) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                getAdminCategoryId(
                    category
                );


            option.textContent =
                getAdminCategoryName(
                    category
                );


            select.appendChild(
                option
            );
        }
    );
}


/* =========================================================
   FILTER
   ========================================================= */

function applyAdminEventFilters() {

    const search =
        document
            .getElementById(
                "adminEventSearch"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const date =
        document
            .getElementById(
                "adminEventDateFilter"
            )
            ?.value ||
        "";


    const venueId =
        document
            .getElementById(
                "adminEventVenueFilter"
            )
            ?.value ||
        "";


    const categoryId =
        document
            .getElementById(
                "adminEventCategoryFilter"
            )
            ?.value ||
        "";


    const filtered =
        adminEvents.filter(
            function (event) {

                const matchesSearch =
                    !search ||
                    getAdminEventName(event)
                        .toLowerCase()
                        .includes(search);


                const matchesDate =
                    !date ||
                    normalizeAdminEventDate(
                        getAdminEventDate(event)
                    ) === date;


                const matchesVenue =
                    !venueId ||
                    String(
                        getAdminEventVenueId(event)
                    ) ===
                    String(venueId);


                const matchesCategory =
                    !categoryId ||
                    String(
                        getAdminEventCategoryId(event)
                    ) ===
                    String(categoryId);


                return (
                    matchesSearch &&
                    matchesDate &&
                    matchesVenue &&
                    matchesCategory
                );
            }
        );


    renderAdminEvents(
        filtered
    );
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderAdminEventSummary() {

    const now =
        new Date();


    const upcoming =
        adminEvents.filter(
            function (event) {

                const date =
                    new Date(
                        getAdminEventDate(event)
                    );


                return (
                    !Number.isNaN(
                        date.getTime()
                    ) &&
                    date >=
                    new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate()
                    )
                );
            }
        ).length;


    const totalCapacity =
        adminEvents.reduce(
            function (total, event) {

                return (
                    total +
                    getAdminEventCapacity(
                        event
                    )
                );
            },
            0
        );


    setAdminEventText(
        "adminEventTotalCount",
        adminEvents.length
    );


    setAdminEventText(
        "adminUpcomingEventCount",
        upcoming
    );


    setAdminEventText(
        "adminEventTotalCapacity",
        totalCapacity.toLocaleString(
            "en-LK"
        )
    );


    document
        .getElementById(
            "adminEventSummary"
        )
        ?.classList.remove(
            "hidden"
        );
}


/* =========================================================
   RENDER EVENTS
   ========================================================= */

function renderAdminEvents(
    events
) {

    const table =
        document.getElementById(
            "adminEventsTableContainer"
        );


    const body =
        document.getElementById(
            "adminEventsTableBody"
        );


    const empty =
        document.getElementById(
            "adminEventsEmpty"
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


    setAdminEventText(
        "adminEventResultCount",
        events.length === 1
            ? "1 event"
            : `${events.length} events`
    );


    if (
        events.length === 0
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


    events.forEach(
        function (event) {

            body.appendChild(
                createAdminEventRow(
                    event
                )
            );
        }
    );
}


/* =========================================================
   EVENT ROW
   ========================================================= */

function createAdminEventRow(
    event
) {

    const id =
        getAdminEventId(
            event
        );


    const name =
        getAdminEventName(
            event
        );


    const row =
        document.createElement(
            "tr"
        );


    row.innerHTML = `

        <td>

            <div class="admin-event-name-cell">

                <div class="admin-event-icon">
                    ★
                </div>

                <div>

                    <strong>
                        ${escapeAdminEventHtml(name)}
                    </strong>

                    <span>
                        ID:
                        ${escapeAdminEventHtml(id || "-")}
                    </span>

                </div>

            </div>

        </td>


        <td>

            <strong class="admin-event-table-main-text">

                ${escapeAdminEventHtml(
                    formatAdminEventDate(
                        getAdminEventDate(
                            event
                        )
                    )
                )}

            </strong>

            <span class="admin-event-table-sub-text">

                ${escapeAdminEventHtml(
                    formatAdminEventTimeRange(
                        event
                    )
                )}

            </span>

        </td>


        <td>

            ${escapeAdminEventHtml(
                getAdminEventVenueName(
                    event
                )
            )}

        </td>


        <td>

            <span class="admin-event-category-badge">

                ${escapeAdminEventHtml(
                    getAdminEventCategoryName(
                        event
                    )
                )}

            </span>

        </td>


        <td>

            <strong>

                ${escapeAdminEventHtml(
                    formatAdminEventCurrency(
                        getAdminEventTicketPrice(
                            event
                        )
                    )
                )}

            </strong>

        </td>


        <td>

            ${getAdminEventCapacity(
                event
            ).toLocaleString("en-LK")}

        </td>


        <td>

            <div class="admin-event-actions">


                <a
                    href="event-form.html?id=${encodeURIComponent(id)}&mode=view"
                    class="btn btn-outline"
                >
                    View
                </a>


                <a
                    href="event-form.html?id=${encodeURIComponent(id)}"
                    class="btn btn-primary"
                >
                    Edit
                </a>


                <a
                    href="seat-map-builder.html?eventId=${encodeURIComponent(id)}"
                    class="btn btn-outline"
                >
                    Seats
                </a>


                <a
                    href="parking-layout-builder.html?eventId=${encodeURIComponent(id)}"
                    class="btn btn-outline"
                >
                    Parking
                </a>


                <button
                    type="button"
                    class="btn btn-danger"
                    data-delete-event-id="${escapeAdminEventHtml(id)}"
                    data-event-name="${escapeAdminEventHtml(name)}"
                >
                    Delete
                </button>


            </div>

        </td>
    `;


    const deleteButton =
        row.querySelector(
            "[data-delete-event-id]"
        );


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            async function () {

                await confirmAdminEventDeletion(
                    this.dataset.deleteEventId,
                    this.dataset.eventName,
                    this
                );
            }
        );
    }


    return row;
}


/* =========================================================
   DELETE CONFIRM
   ========================================================= */

async function confirmAdminEventDeletion(
    eventId,
    eventName,
    button
) {

    if (eventDeleteInProgress) {
        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Delete Event",

            message:
                `Delete ${eventName}? The operation should only succeed if the event has no protected active bookings.`,

            confirmText:
                "Delete Event",

            cancelText:
                "Keep Event"
        });


    if (!confirmed) {
        return;
    }


    await deleteAdminEvent(
        eventId,
        button
    );
}


/* =========================================================
   DELETE EVENT
   ========================================================= */

async function deleteAdminEvent(
    eventId,
    button
) {

    eventDeleteInProgress =
        true;


    clearAdminEventsMessage();


    if (button) {

        button.disabled = true;

        button.textContent =
            "Deleting...";
    }


    try {

        /*
         * BRD:
         * DELETE /api/events/{id}
         */

        await apiDelete(
            `/events/${encodeURIComponent(
                eventId
            )}`
        );


        showAdminEventsMessage(
            "Event deleted successfully.",
            "success"
        );


        await loadAdminEventPageData();


    } catch (error) {

        console.error(
            "Delete Event Error:",
            error
        );


        if (
            error.status === 400 ||
            error.status === 409
        ) {

            showAdminEventsMessage(
                getAdminEventApiError(
                    error
                ) ||
                "This event cannot be deleted because active bookings exist.",
                "error"
            );


        } else {

            showAdminEventsMessage(
                getAdminEventApiError(
                    error
                ),
                "error"
            );
        }


        if (button) {

            button.disabled = false;

            button.textContent =
                "Delete";
        }


    } finally {

        eventDeleteInProgress =
            false;
    }
}


/* =========================================================
   EVENT HELPERS
   ========================================================= */

function getAdminEventId(event) {

    return (
        event?.eventId ||
        event?.EventId ||
        event?.id ||
        event?.Id ||
        null
    );
}


function getAdminEventName(event) {

    return String(
        event?.name ||
        event?.Name ||
        event?.eventName ||
        event?.EventName ||
        event?.title ||
        "Event"
    );
}


function getAdminEventDate(event) {

    return (
        event?.eventDate ||
        event?.EventDate ||
        event?.date ||
        event?.Date ||
        null
    );
}


function getAdminEventStartTime(event) {

    return String(
        event?.startTime ||
        event?.StartTime ||
        ""
    );
}


function getAdminEventEndTime(event) {

    return String(
        event?.endTime ||
        event?.EndTime ||
        ""
    );
}


function getAdminEventTicketPrice(event) {

    const number =
        Number(
            event?.ticketPrice ??
            event?.TicketPrice ??
            event?.price ??
            0
        );


    return Number.isNaN(number)
        ? 0
        : number;
}


function getAdminEventCapacity(event) {

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


/* =========================================================
   VENUE HELPERS
   ========================================================= */

function getAdminEventVenueId(event) {

    return (
        event?.venueId ||
        event?.VenueId ||
        event?.venue?.venueId ||
        event?.venue?.id ||
        null
    );
}


function getAdminEventVenueName(event) {

    return String(
        event?.venueName ||
        event?.VenueName ||
        event?.venue?.name ||
        getVenueNameFromAdminList(
            getAdminEventVenueId(event)
        ) ||
        "Venue"
    );
}


function getVenueNameFromAdminList(
    venueId
) {

    const venue =
        adminEventVenues.find(
            function (item) {

                return (
                    String(
                        getAdminVenueId(item)
                    ) ===
                    String(venueId)
                );
            }
        );


    return venue
        ? getAdminVenueName(venue)
        : "";
}


function getAdminVenueId(venue) {

    return (
        venue?.venueId ||
        venue?.VenueId ||
        venue?.id ||
        venue?.Id ||
        null
    );
}


function getAdminVenueName(venue) {

    return String(
        venue?.name ||
        venue?.Name ||
        venue?.venueName ||
        "Venue"
    );
}


/* =========================================================
   CATEGORY HELPERS
   ========================================================= */

function getAdminEventCategoryId(event) {

    return (
        event?.categoryId ||
        event?.CategoryId ||
        event?.eventCategoryId ||
        event?.category?.categoryId ||
        event?.category?.id ||
        null
    );
}


function getAdminEventCategoryName(event) {

    return String(
        event?.categoryName ||
        event?.CategoryName ||
        event?.category?.name ||
        getCategoryNameFromAdminList(
            getAdminEventCategoryId(event)
        ) ||
        "Category"
    );
}


function getCategoryNameFromAdminList(
    categoryId
) {

    const category =
        adminEventCategories.find(
            function (item) {

                return (
                    String(
                        getAdminCategoryId(item)
                    ) ===
                    String(categoryId)
                );
            }
        );


    return category
        ? getAdminCategoryName(category)
        : "";
}


function getAdminCategoryId(category) {

    return (
        category?.categoryId ||
        category?.CategoryId ||
        category?.id ||
        category?.Id ||
        null
    );
}


function getAdminCategoryName(category) {

    return String(
        category?.name ||
        category?.Name ||
        category?.categoryName ||
        "Category"
    );
}


/* =========================================================
   DATE / TIME
   ========================================================= */

function normalizeAdminEventDate(
    value
) {

    if (!value) {
        return "";
    }


    const text =
        String(value);


    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            text
        )
    ) {

        return text;
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


function formatAdminEventDate(
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
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


function formatAdminEventTimeRange(
    event
) {

    const start =
        getAdminEventStartTime(
            event
        );


    const end =
        getAdminEventEndTime(
            event
        );


    if (
        start &&
        end
    ) {

        return `${start} - ${end}`;
    }


    return start || "-";
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatAdminEventCurrency(
    value
) {

    return new Intl.NumberFormat(
        "en-LK",
        {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    );
}


/* =========================================================
   ERROR
   ========================================================= */

function getAdminEventApiError(error) {

    if (
        error?.data?.errors
    ) {

        const messages = [];


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

            return messages.join(" ");
        }
    }


    return (
        error?.message ||
        "Unable to complete the event operation."
    );
}


/* =========================================================
   INPUT / TEXT
   ========================================================= */

function setAdminEventInputValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value ?? "";
    }
}


function setAdminEventText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "";
    }
}


/* =========================================================
   LOADING
   ========================================================= */

function showAdminEventsLoading() {

    document
        .getElementById(
            "adminEventsLoading"
        )
        ?.classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "adminEventsTableContainer"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "adminEventsEmpty"
        )
        ?.classList.add(
            "hidden"
        );
}


function hideAdminEventsLoading() {

    document
        .getElementById(
            "adminEventsLoading"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showAdminEventsMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminEventsMessage"
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


function clearAdminEventsMessage() {

    const element =
        document.getElementById(
            "adminEventsMessage"
        );


    if (!element) {
        return;
    }


    element.textContent = "";

    element.className =
        "alert hidden";
}


/* =========================================================
   ESCAPE
   ========================================================= */

function escapeAdminEventHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}
