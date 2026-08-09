/* =========================================================
   Event & Parking Reservation System
   Customer Event Listing
   ========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeEventsPage();
    }
);


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

async function initializeEventsPage() {

    initializeEventFilters();

    initializeFilterResetButtons();


    /*
     * Load filter dropdowns and events.
     */

    await Promise.all([
        loadVenueFilter(),
        loadCategoryFilter()
    ]);


    await loadEvents();
}


/* =========================================================
   INITIALIZE FILTER FORM
   ========================================================= */

function initializeEventFilters() {

    const filterForm =
        document.getElementById(
            "eventFilterForm"
        );


    if (!filterForm) {
        return;
    }


    filterForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            loadEvents();
        }
    );
}


/* =========================================================
   RESET FILTER BUTTONS
   ========================================================= */

function initializeFilterResetButtons() {

    const resetButton =
        document.getElementById(
            "resetFiltersButton"
        );


    const emptyResetButton =
        document.getElementById(
            "emptyResetButton"
        );


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetEventFilters
        );
    }


    if (emptyResetButton) {

        emptyResetButton.addEventListener(
            "click",
            resetEventFilters
        );
    }
}


/* =========================================================
   RESET FILTERS
   ========================================================= */

async function resetEventFilters() {

    const searchInput =
        document.getElementById(
            "eventSearch"
        );


    const dateInput =
        document.getElementById(
            "eventDate"
        );


    const venueSelect =
        document.getElementById(
            "venueFilter"
        );


    const categorySelect =
        document.getElementById(
            "categoryFilter"
        );


    if (searchInput) {
        searchInput.value = "";
    }


    if (dateInput) {
        dateInput.value = "";
    }


    if (venueSelect) {
        venueSelect.value = "";
    }


    if (categorySelect) {
        categorySelect.value = "";
    }


    await loadEvents();
}


/* =========================================================
   LOAD VENUES
   ========================================================= */

async function loadVenueFilter() {

    const venueSelect =
        document.getElementById(
            "venueFilter"
        );


    if (!venueSelect) {
        return;
    }


    try {

        /*
         * BRD Endpoint:
         * GET /api/venues
         */

        const response =
            await apiGet(
                "/venues"
            );


        const venues =
            normalizeEventArray(
                response
            );


        venues.forEach(
            function (venue) {

                const venueId =
                    getVenueId(
                        venue
                    );


                const venueName =
                    getVenueName(
                        venue
                    );


                if (!venueId) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    venueId;


                option.textContent =
                    venueName;


                venueSelect.appendChild(
                    option
                );
            }
        );


    } catch (error) {

        console.error(
            "Unable to load venues:",
            error
        );
    }
}


/* =========================================================
   LOAD CATEGORIES
   ========================================================= */

async function loadCategoryFilter() {

    const categorySelect =
        document.getElementById(
            "categoryFilter"
        );


    if (!categorySelect) {
        return;
    }


    try {

        /*
         * BRD Endpoint:
         * GET /api/categories
         */

        const response =
            await apiGet(
                "/categories"
            );


        const categories =
            normalizeEventArray(
                response
            );


        categories.forEach(
            function (category) {

                const categoryId =
                    getCategoryId(
                        category
                    );


                const categoryName =
                    getCategoryName(
                        category
                    );


                if (!categoryId) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    categoryId;


                option.textContent =
                    categoryName;


                categorySelect.appendChild(
                    option
                );
            }
        );


    } catch (error) {

        console.error(
            "Unable to load categories:",
            error
        );
    }
}


/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadEvents() {

    clearEventsMessage();

    showEventsLoading();


    const search =
        document
            .getElementById(
                "eventSearch"
            )
            ?.value
            .trim() || "";


    const date =
        document
            .getElementById(
                "eventDate"
            )
            ?.value || "";


    const venueId =
        document
            .getElementById(
                "venueFilter"
            )
            ?.value || "";


    const categoryId =
        document
            .getElementById(
                "categoryFilter"
            )
            ?.value || "";



    /*
     * Build query parameters.
     */

    const query =
        new URLSearchParams();


    if (search) {

        query.append(
            "name",
            search
        );
    }


    if (date) {

        query.append(
            "date",
            date
        );
    }


    if (venueId) {

        query.append(
            "venueId",
            venueId
        );
    }


    if (categoryId) {

        query.append(
            "categoryId",
            categoryId
        );
    }



    let endpoint =
        "/events";


    const queryString =
        query.toString();


    if (queryString) {

        endpoint +=
            `?${queryString}`;
    }



    try {

        /*
         * BRD Endpoint:
         * GET /api/events
         *
         * Searchable/filterable by:
         * - name
         * - date
         * - venue
         * - category
         */

        const response =
            await apiGet(
                endpoint
            );


        const events =
            normalizeEventArray(
                response
            );


        hideEventsLoading();


        renderEvents(
            events
        );


    } catch (error) {

        console.error(
            "Event Loading Error:",
            error
        );


        hideEventsLoading();


        showEventsMessage(
            error.message ||
            "Unable to load events. Please try again."
        );


        updateEventResultText(
            0
        );
    }
}


/* =========================================================
   NORMALIZE ARRAY
   ========================================================= */

function normalizeEventArray(
    response
) {

    if (
        Array.isArray(response)
    ) {

        return response;
    }


    if (
        response &&
        Array.isArray(
            response.data
        )
    ) {

        return response.data;
    }


    if (
        response &&
        Array.isArray(
            response.items
        )
    ) {

        return response.items;
    }


    if (
        response &&
        Array.isArray(
            response.results
        )
    ) {

        return response.results;
    }


    return [];
}


/* =========================================================
   RENDER EVENTS
   ========================================================= */

function renderEvents(events) {

    const eventsGrid =
        document.getElementById(
            "eventsGrid"
        );


    const emptyState =
        document.getElementById(
            "eventsEmptyState"
        );


    if (
        !eventsGrid ||
        !emptyState
    ) {
        return;
    }


    eventsGrid.innerHTML =
        "";


    updateEventResultText(
        events.length
    );


    /*
     * No events
     */

    if (
        events.length === 0
    ) {

        eventsGrid.classList.add(
            "hidden"
        );


        emptyState.classList.remove(
            "hidden"
        );


        return;
    }



    /*
     * Events available
     */

    emptyState.classList.add(
        "hidden"
    );


    eventsGrid.classList.remove(
        "hidden"
    );


    events.forEach(
        function (eventItem) {

            const card =
                createEventCard(
                    eventItem
                );


            eventsGrid.appendChild(
                card
            );
        }
    );
}


/* =========================================================
   CREATE EVENT CARD
   ========================================================= */

function createEventCard(
    eventItem
) {

    const eventId =
        getEventId(
            eventItem
        );


    const name =
        getEventNameValue(
            eventItem
        );


    const category =
        getEventCategoryValue(
            eventItem
        );


    const venue =
        getEventVenueValue(
            eventItem
        );


    const eventDate =
        getEventDateValue(
            eventItem
        );


    const eventTime =
        getEventTimeValue(
            eventItem
        );


    const price =
        getEventPriceValue(
            eventItem
        );


    const capacity =
        getEventCapacityValue(
            eventItem
        );


    const dateParts =
        getEventDateParts(
            eventDate
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "event-card";


    card.innerHTML = `

        <div class="event-card-top">

            <span class="event-category-badge">
                ${escapeEventHtml(category)}
            </span>


            <div class="event-date-box">

                <span class="event-date-month">
                    ${escapeEventHtml(dateParts.month)}
                </span>

                <span class="event-date-day">
                    ${escapeEventHtml(dateParts.day)}
                </span>

            </div>

        </div>


        <div class="event-card-content">

            <h3 class="event-card-title">
                ${escapeEventHtml(name)}
            </h3>


            <div class="event-card-details">


                <div class="event-card-detail">

                    <span class="event-detail-icon">
                        ◷
                    </span>

                    <span>
                        ${escapeEventHtml(
                            formatEventDate(eventDate)
                        )}
                        ${
                            eventTime
                                ? ` • ${escapeEventHtml(eventTime)}`
                                : ""
                        }
                    </span>

                </div>


                <div class="event-card-detail">

                    <span class="event-detail-icon">
                        ⌖
                    </span>

                    <span>
                        ${escapeEventHtml(venue)}
                    </span>

                </div>


                <div class="event-card-detail">

                    <span class="event-detail-icon">
                        ♙
                    </span>

                    <span>
                        Capacity:
                        ${escapeEventHtml(capacity)}
                    </span>

                </div>


            </div>

        </div>


        <div class="event-card-footer">

            <div>

                <span class="event-price-label">
                    Ticket Price
                </span>

                <strong class="event-price">
                    ${escapeEventHtml(
                        formatEventPrice(price)
                    )}
                </strong>

            </div>


            ${
                eventId
                    ? `
                        <a
                            href="event-details.html?id=${encodeURIComponent(eventId)}"
                            class="btn btn-primary event-details-button"
                        >
                            View Event
                        </a>
                      `
                    : ""
            }

        </div>
    `;


    return card;
}


/* =========================================================
   EVENT HELPERS
   ========================================================= */

function getEventId(eventItem) {

    return (
        eventItem.id ||
        eventItem.eventId ||
        eventItem.EventId ||
        eventItem.Id ||
        null
    );
}


function getEventNameValue(eventItem) {

    return (
        eventItem.name ||
        eventItem.eventName ||
        eventItem.EventName ||
        eventItem.Name ||
        "Event"
    );
}


function getEventDateValue(eventItem) {

    return (
        eventItem.date ||
        eventItem.eventDate ||
        eventItem.EventDate ||
        eventItem.startDate ||
        eventItem.StartDate ||
        null
    );
}


function getEventTimeValue(eventItem) {

    return (
        eventItem.time ||
        eventItem.eventTime ||
        eventItem.EventTime ||
        eventItem.startTime ||
        eventItem.StartTime ||
        ""
    );
}


function getEventPriceValue(eventItem) {

    return (
        eventItem.ticketPrice ??
        eventItem.TicketPrice ??
        eventItem.price ??
        eventItem.Price ??
        0
    );
}


function getEventCapacityValue(eventItem) {

    return (
        eventItem.capacity ??
        eventItem.Capacity ??
        eventItem.eventCapacity ??
        eventItem.EventCapacity ??
        "-"
    );
}


function getEventVenueValue(eventItem) {

    return (
        eventItem.venueName ||
        eventItem.VenueName ||
        eventItem.venue?.name ||
        eventItem.venue?.venueName ||
        eventItem.Venue?.Name ||
        "Venue not available"
    );
}


function getEventCategoryValue(eventItem) {

    return (
        eventItem.categoryName ||
        eventItem.CategoryName ||
        eventItem.category?.name ||
        eventItem.category?.categoryName ||
        eventItem.Category?.Name ||
        "Event"
    );
}


/* =========================================================
   VENUE HELPERS
   ========================================================= */

function getVenueId(venue) {

    return (
        venue.id ||
        venue.venueId ||
        venue.VenueId ||
        venue.Id ||
        null
    );
}


function getVenueName(venue) {

    return (
        venue.name ||
        venue.venueName ||
        venue.VenueName ||
        venue.Name ||
        "Venue"
    );
}


/* =========================================================
   CATEGORY HELPERS
   ========================================================= */

function getCategoryId(category) {

    return (
        category.id ||
        category.categoryId ||
        category.CategoryId ||
        category.Id ||
        null
    );
}


function getCategoryName(category) {

    return (
        category.name ||
        category.categoryName ||
        category.CategoryName ||
        category.Name ||
        "Category"
    );
}


/* =========================================================
   DATE
   ========================================================= */

function formatEventDate(value) {

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


function getEventDateParts(value) {

    if (!value) {

        return {
            month: "---",
            day: "--"
        };
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return {
            month: "---",
            day: "--"
        };
    }


    return {

        month:
            date.toLocaleDateString(
                "en-US",
                {
                    month: "short"
                }
            ),

        day:
            String(
                date.getDate()
            )
    };
}


/* =========================================================
   PRICE
   ========================================================= */

function formatEventPrice(value) {

    const price =
        Number(value);


    if (
        Number.isNaN(price)
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
    ).format(price);
}


/* =========================================================
   RESULT TEXT
   ========================================================= */

function updateEventResultText(count) {

    const resultText =
        document.getElementById(
            "eventResultText"
        );


    if (!resultText) {
        return;
    }


    if (count === 0) {

        resultText.textContent =
            "No matching events found.";

        return;
    }


    if (count === 1) {

        resultText.textContent =
            "1 event available.";

        return;
    }


    resultText.textContent =
        `${count} events available.`;
}


/* =========================================================
   LOADING
   ========================================================= */

function showEventsLoading() {

    const loading =
        document.getElementById(
            "eventsLoading"
        );


    const eventsGrid =
        document.getElementById(
            "eventsGrid"
        );


    const emptyState =
        document.getElementById(
            "eventsEmptyState"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );
    }


    if (eventsGrid) {

        eventsGrid.classList.add(
            "hidden"
        );
    }


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );
    }
}


function hideEventsLoading() {

    const loading =
        document.getElementById(
            "eventsLoading"
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

function showEventsMessage(message) {

    const element =
        document.getElementById(
            "eventsMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-error";
}


function clearEventsMessage() {

    const element =
        document.getElementById(
            "eventsMessage"
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

function escapeEventHtml(value) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value ?? "";


    return element.innerHTML;
}
