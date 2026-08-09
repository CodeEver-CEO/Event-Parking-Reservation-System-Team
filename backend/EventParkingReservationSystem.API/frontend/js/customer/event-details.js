/* =========================================================
   Event & Parking Reservation System
   Event Details
   ========================================================= */


let selectedEventId = null;


document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeEventDetailsPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeEventDetailsPage() {

    selectedEventId =
        getEventIdFromUrl();


    initializeSelectSeatsButton();


    if (!selectedEventId) {

        hideEventDetailsLoading();

        showEventNotFound();

        return;
    }


    await loadEventDetails(
        selectedEventId
    );
}


/* =========================================================
   GET EVENT ID
   ========================================================= */

function getEventIdFromUrl() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        "id"
    );
}


/* =========================================================
   LOAD EVENT
   ========================================================= */

async function loadEventDetails(
    eventId
) {

    clearEventDetailsMessage();

    showEventDetailsLoading();


    try {

        /*
         * BRD Endpoint:
         *
         * GET /api/events/{id}
         */

        const response =
            await apiGet(
                `/events/${encodeURIComponent(eventId)}`
            );


        const eventData =
            normalizeEventDetailsResponse(
                response
            );


        if (!eventData) {

            hideEventDetailsLoading();

            showEventNotFound();

            return;
        }


        renderEventDetails(
            eventData
        );


        hideEventDetailsLoading();

        showEventDetailsContent();


    } catch (error) {

        console.error(
            "Event Details Error:",
            error
        );


        hideEventDetailsLoading();


        if (
            error.status === 404
        ) {

            showEventNotFound();

            return;
        }


        showEventDetailsMessage(
            error.message ||
            "Unable to load event details."
        );
    }
}


/* =========================================================
   NORMALIZE RESPONSE
   ========================================================= */

function normalizeEventDetailsResponse(
    response
) {

    if (!response) {
        return null;
    }


    if (response.data) {
        return response.data;
    }


    return response;
}


/* =========================================================
   RENDER
   ========================================================= */

function renderEventDetails(
    eventData
) {

    const name =
        getEventDetailsName(
            eventData
        );


    const category =
        getEventDetailsCategory(
            eventData
        );


    const venue =
        getEventDetailsVenue(
            eventData
        );


    const address =
        getEventDetailsVenueAddress(
            eventData
        );


    const date =
        getEventDetailsDate(
            eventData
        );


    const time =
        getEventDetailsTime(
            eventData
        );


    const price =
        getEventDetailsPrice(
            eventData
        );


    const capacity =
        getEventDetailsCapacity(
            eventData
        );


    const dateParts =
        getEventDetailsDateParts(
            date
        );


    setEventText(
        "eventName",
        name
    );


    setEventText(
        "eventCategory",
        category
    );


    setEventText(
        "eventCategoryName",
        category
    );


    setEventText(
        "eventVenue",
        venue
    );


    setEventText(
        "eventVenueName",
        venue
    );


    setEventText(
        "eventVenueAddress",
        address
    );


    setEventText(
        "eventFullDate",
        formatEventDetailsDate(
            date
        )
    );


    setEventText(
        "eventFullTime",
        time || "Time not available"
    );


    setEventText(
        "eventCapacity",
        capacity
    );


    setEventText(
        "eventTicketPrice",
        formatEventDetailsPrice(
            price
        )
    );


    setEventText(
        "eventMonth",
        dateParts.month
    );


    setEventText(
        "eventDay",
        dateParts.day
    );


    setEventText(
        "eventYear",
        dateParts.year
    );
}


/* =========================================================
   SELECT SEATS BUTTON
   ========================================================= */

function initializeSelectSeatsButton() {

    const button =
        document.getElementById(
            "selectSeatsButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            if (!selectedEventId) {
                return;
            }


            /*
             * Customer must be logged in
             * before starting reservation.
             */

            const token =
                localStorage.getItem(
                    APP_CONFIG.STORAGE_KEYS.TOKEN
                );


            const role =
                localStorage.getItem(
                    APP_CONFIG.STORAGE_KEYS.ROLE
                );


            if (
                !token ||
                !role
            ) {

                /*
                 * Save intended event so we
                 * can optionally restore it
                 * after login later.
                 */

                sessionStorage.setItem(
                    "pendingEventId",
                    selectedEventId
                );


                window.location.href =
                    "../auth/login.html";

                return;
            }


            if (
                role.toLowerCase() !==
                "customer"
            ) {

                showEventDetailsMessage(
                    "Only customer accounts can create event bookings."
                );

                return;
            }


            window.location.href =
                `seat-selection.html?eventId=${encodeURIComponent(selectedEventId)}`;
        }
    );
}


/* =========================================================
   HELPERS
   ========================================================= */

function getEventDetailsName(
    eventData
) {

    return (
        eventData.name ||
        eventData.eventName ||
        eventData.EventName ||
        eventData.Name ||
        "Event"
    );
}


function getEventDetailsCategory(
    eventData
) {

    return (
        eventData.categoryName ||
        eventData.CategoryName ||
        eventData.category?.name ||
        eventData.category?.categoryName ||
        eventData.Category?.Name ||
        "Event"
    );
}


function getEventDetailsVenue(
    eventData
) {

    return (
        eventData.venueName ||
        eventData.VenueName ||
        eventData.venue?.name ||
        eventData.venue?.venueName ||
        eventData.Venue?.Name ||
        "Venue not available"
    );
}


function getEventDetailsVenueAddress(
    eventData
) {

    return (
        eventData.venueAddress ||
        eventData.VenueAddress ||
        eventData.venue?.address ||
        eventData.Venue?.Address ||
        ""
    );
}


function getEventDetailsDate(
    eventData
) {

    return (
        eventData.date ||
        eventData.eventDate ||
        eventData.EventDate ||
        eventData.startDate ||
        eventData.StartDate ||
        null
    );
}


function getEventDetailsTime(
    eventData
) {

    const startTime =
        eventData.startTime ||
        eventData.StartTime ||
        eventData.time ||
        eventData.eventTime ||
        eventData.EventTime ||
        "";


    const endTime =
        eventData.endTime ||
        eventData.EndTime ||
        "";


    if (
        startTime &&
        endTime
    ) {

        return `${startTime} - ${endTime}`;
    }


    return startTime;
}


function getEventDetailsPrice(
    eventData
) {

    return (
        eventData.ticketPrice ??
        eventData.TicketPrice ??
        eventData.price ??
        eventData.Price ??
        0
    );
}


function getEventDetailsCapacity(
    eventData
) {

    return (
        eventData.capacity ??
        eventData.Capacity ??
        eventData.eventCapacity ??
        eventData.EventCapacity ??
        "-"
    );
}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatEventDetailsDate(
    value
) {

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
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


function getEventDetailsDateParts(
    value
) {

    if (!value) {

        return {
            month: "---",
            day: "--",
            year: "----"
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
            day: "--",
            year: "----"
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
            ),

        year:
            String(
                date.getFullYear()
            )
    };
}


/* =========================================================
   PRICE FORMAT
   ========================================================= */

function formatEventDetailsPrice(
    value
) {

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
   TEXT HELPER
   ========================================================= */

function setEventText(
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

function showEventDetailsLoading() {

    const loading =
        document.getElementById(
            "eventDetailsLoading"
        );


    const content =
        document.getElementById(
            "eventDetailsContent"
        );


    const notFound =
        document.getElementById(
            "eventNotFound"
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


function hideEventDetailsLoading() {

    const loading =
        document.getElementById(
            "eventDetailsLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


function showEventDetailsContent() {

    const content =
        document.getElementById(
            "eventDetailsContent"
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

function showEventNotFound() {

    const content =
        document.getElementById(
            "eventDetailsContent"
        );


    const notFound =
        document.getElementById(
            "eventNotFound"
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
   ERROR MESSAGE
   ========================================================= */

function showEventDetailsMessage(
    message
) {

    const element =
        document.getElementById(
            "eventDetailsMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-error";
}


function clearEventDetailsMessage() {

    const element =
        document.getElementById(
            "eventDetailsMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.className =
        "alert hidden";
}
