/* =========================================================
   Event & Parking Reservation System
   Admin Event Create / View / Edit
   ========================================================= */


let eventFormVenues = [];

let eventFormCategories = [];

let currentAdminEvent = null;

let currentAdminEventId = null;

let adminEventViewMode = false;

let eventFormSaving = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminEventFormPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminEventFormPage() {

    if (!validateAdminEventFormAccess()) {
        return;
    }


    const parameters =
        new URLSearchParams(
            window.location.search
        );


    currentAdminEventId =
        parameters.get("id");


    adminEventViewMode =
        parameters.get("mode") ===
        "view";


    await loadEventFormAdminSidebar();


    initializeAdminEventFormControls();


    await loadAdminEventFormMasterData();


    if (currentAdminEventId) {

        await loadExistingAdminEvent();

    } else {

        configureCreateEventMode();

        updateAdminEventFormSummary();
    }
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateAdminEventFormAccess() {

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

async function loadEventFormAdminSidebar() {

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

function initializeAdminEventFormControls() {

    const form =
        document.getElementById(
            "adminEventForm"
        );


    const checkButton =
        document.getElementById(
            "checkVenueAvailabilityButton"
        );


    if (form) {

        form.addEventListener(
            "submit",
            saveAdminEventForm
        );
    }


    if (checkButton) {

        checkButton.addEventListener(
            "click",
            async function () {

                clearAdminEventFormMessage();

                clearAdminEventFormValidation();


                const values =
                    getAdminEventFormValues();


                if (
                    !validateEventScheduleFields(
                        values
                    )
                ) {

                    return;
                }


                await checkSelectedVenueAvailability(
                    values,
                    true
                );
            }
        );
    }


    [
        "eventFormName",
        "eventFormVenue",
        "eventFormCategory",
        "eventFormDate",
        "eventFormStartTime",
        "eventFormEndTime",
        "eventFormTicketPrice",
        "eventFormCapacity"
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
                    id === "eventFormName" ||
                    id === "eventFormTicketPrice" ||
                    id === "eventFormCapacity"
                        ? "input"
                        : "change",
                    function () {

                        if (
                            id ===
                            "eventFormVenue"
                        ) {

                            updateSelectedVenueCapacity();
                        }


                        updateAdminEventFormSummary();
                    }
                );
            }
        );
}


/* =========================================================
   MASTER DATA
   ========================================================= */

async function loadAdminEventFormMasterData() {

    try {

        const results =
            await Promise.all([

                apiGet("/venues"),

                apiGet("/categories")

            ]);


        eventFormVenues =
            normalizeEventFormCollection(
                results[0],
                "venues"
            );


        eventFormCategories =
            normalizeEventFormCollection(
                results[1],
                "categories"
            );


        populateEventVenueDropdown();

        populateEventCategoryDropdown();


    } catch (error) {

        showAdminEventFormMessage(
            error.message ||
            "Unable to load venues or categories.",
            "error"
        );
    }
}


/* =========================================================
   NORMALIZE
   ========================================================= */

function normalizeEventFormCollection(
    response,
    name
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
            response?.[name]
        )
    ) {

        return response[name];
    }


    return [];
}


/* =========================================================
   VENUE DROPDOWN
   ========================================================= */

function populateEventVenueDropdown() {

    const select =
        document.getElementById(
            "eventFormVenue"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">Select Venue</option>`;


    eventFormVenues.forEach(
        function (venue) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                getEventFormVenueId(
                    venue
                );


            option.textContent =
                `${getEventFormVenueName(venue)} (${getEventFormVenueCapacity(venue).toLocaleString("en-LK")})`;


            select.appendChild(
                option
            );
        }
    );
}


/* =========================================================
   CATEGORY DROPDOWN
   ========================================================= */

function populateEventCategoryDropdown() {

    const select =
        document.getElementById(
            "eventFormCategory"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        `<option value="">Select Category</option>`;


    eventFormCategories.forEach(
        function (category) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                getEventFormCategoryId(
                    category
                );


            option.textContent =
                getEventFormCategoryName(
                    category
                );


            select.appendChild(
                option
            );
        }
    );
}


/* =========================================================
   LOAD EXISTING EVENT
   ========================================================= */

async function loadExistingAdminEvent() {

    showAdminEventFormLoading();


    try {

        /*
         * BRD:
         * GET /api/events/{id}
         */

        const response =
            await apiGet(
                `/events/${encodeURIComponent(
                    currentAdminEventId
                )}`
            );


        currentAdminEvent =
            response?.data ||
            response?.event ||
            response;


        if (!currentAdminEvent) {

            throw new Error(
                "Event details were not returned."
            );
        }


        fillAdminEventForm(
            currentAdminEvent
        );


        if (adminEventViewMode) {

            configureEventViewMode();

        } else {

            configureEditEventMode();
        }


        updateSelectedVenueCapacity();

        updateAdminEventFormSummary();


    } catch (error) {

        showAdminEventFormMessage(
            error.message ||
            "Unable to load this event.",
            "error"
        );


    } finally {

        hideAdminEventFormLoading();
    }
}


/* =========================================================
   FILL FORM
   ========================================================= */

function fillAdminEventForm(event) {

    setEventFormValue(
        "eventFormName",
        getExistingEventName(event)
    );


    setEventFormValue(
        "eventFormVenue",
        getExistingEventVenueId(event)
    );


    setEventFormValue(
        "eventFormCategory",
        getExistingEventCategoryId(event)
    );


    setEventFormValue(
        "eventFormDate",
        normalizeEventFormDate(
            getExistingEventDate(event)
        )
    );


    setEventFormValue(
        "eventFormStartTime",
        normalizeEventFormTime(
            getExistingEventStartTime(event)
        )
    );


    setEventFormValue(
        "eventFormEndTime",
        normalizeEventFormTime(
            getExistingEventEndTime(event)
        )
    );


    setEventFormValue(
        "eventFormTicketPrice",
        getExistingEventTicketPrice(
            event
        )
    );


    setEventFormValue(
        "eventFormCapacity",
        getExistingEventCapacity(
            event
        )
    );
}


/* =========================================================
   CREATE MODE
   ========================================================= */

function configureCreateEventMode() {

    setEventFormText(
        "adminEventFormPageTitle",
        "Create Event"
    );


    setEventFormText(
        "adminEventFormPageDescription",
        "Add a new event to the event catalogue."
    );


    setEventFormText(
        "saveAdminEventButton",
        "Create Event"
    );
}


/* =========================================================
   EDIT MODE
   ========================================================= */

function configureEditEventMode() {

    setEventFormText(
        "adminEventFormPageTitle",
        "Edit Event"
    );


    setEventFormText(
        "adminEventFormPageDescription",
        "Update the selected event details."
    );


    setEventFormText(
        "saveAdminEventButton",
        "Save Changes"
    );


    /*
     * BRD direct availability endpoint does
     * not define an event exclusion parameter.
     * PUT /events/{id} must perform the final
     * overlap check excluding this event.
     */

    setEventAvailabilityStatus(
        "For an existing event, final overlap validation will be performed by the update API.",
        "info"
    );
}


/* =========================================================
   VIEW MODE
   ========================================================= */

function configureEventViewMode() {

    setEventFormText(
        "adminEventFormPageTitle",
        "View Event"
    );


    setEventFormText(
        "adminEventFormPageDescription",
        "Review the selected event details."
    );


    document
        .querySelectorAll(
            "#adminEventForm input, #adminEventForm select"
        )
        .forEach(
            function (element) {

                element.disabled = true;
            }
        );


    document
        .getElementById(
            "saveAdminEventButton"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .getElementById(
            "checkVenueAvailabilityButton"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   VALUES
   ========================================================= */

function getAdminEventFormValues() {

    return {

        name:
            getEventFormValue(
                "eventFormName"
            ).trim(),

        venueId:
            getEventFormValue(
                "eventFormVenue"
            ),

        categoryId:
            getEventFormValue(
                "eventFormCategory"
            ),

        eventDate:
            getEventFormValue(
                "eventFormDate"
            ),

        startTime:
            getEventFormValue(
                "eventFormStartTime"
            ),

        endTime:
            getEventFormValue(
                "eventFormEndTime"
            ),

        ticketPrice:
            getEventFormValue(
                "eventFormTicketPrice"
            ),

        capacity:
            getEventFormValue(
                "eventFormCapacity"
            )
    };
}


/* =========================================================
   VALIDATE FORM
   ========================================================= */

function validateAdminEventForm(
    values
) {

    clearAdminEventFormValidation();


    let valid = true;


    if (!values.name) {

        showEventFormFieldError(
            "eventFormName",
            "eventFormNameError",
            "Event name is required."
        );

        valid = false;
    }


    if (!values.venueId) {

        showEventFormFieldError(
            "eventFormVenue",
            "eventFormVenueError",
            "Please select a venue."
        );

        valid = false;
    }


    if (!values.categoryId) {

        showEventFormFieldError(
            "eventFormCategory",
            "eventFormCategoryError",
            "Please select a category."
        );

        valid = false;
    }


    if (!values.eventDate) {

        showEventFormFieldError(
            "eventFormDate",
            "eventFormDateError",
            "Event date is required."
        );

        valid = false;
    }


    if (!values.startTime) {

        showEventFormFieldError(
            "eventFormStartTime",
            "eventFormStartTimeError",
            "Start time is required."
        );

        valid = false;
    }


    if (!values.endTime) {

        showEventFormFieldError(
            "eventFormEndTime",
            "eventFormEndTimeError",
            "End time is required."
        );

        valid = false;
    }


    if (
        values.startTime &&
        values.endTime &&
        values.endTime <=
        values.startTime
    ) {

        showEventFormFieldError(
            "eventFormEndTime",
            "eventFormEndTimeError",
            "End time must be later than start time."
        );

        valid = false;
    }


    const price =
        Number(
            values.ticketPrice
        );


    if (
        values.ticketPrice === "" ||
        Number.isNaN(price) ||
        price < 0
    ) {

        showEventFormFieldError(
            "eventFormTicketPrice",
            "eventFormTicketPriceError",
            "Ticket price must be zero or greater."
        );

        valid = false;
    }


    const capacity =
        Number(
            values.capacity
        );


    if (
        values.capacity === "" ||
        Number.isNaN(capacity) ||
        capacity <= 0 ||
        !Number.isInteger(capacity)
    ) {

        showEventFormFieldError(
            "eventFormCapacity",
            "eventFormCapacityError",
            "Event capacity must be a positive whole number."
        );

        valid = false;
    }


    /*
     * Client-side venue capacity validation.
     * Backend must validate this again.
     */

    if (
        values.venueId &&
        Number.isInteger(capacity) &&
        capacity > 0
    ) {

        const venue =
            findEventFormVenue(
                values.venueId
            );


        if (venue) {

            const venueCapacity =
                getEventFormVenueCapacity(
                    venue
                );


            if (
                capacity >
                venueCapacity
            ) {

                showEventFormFieldError(
                    "eventFormCapacity",
                    "eventFormCapacityError",
                    `Event capacity cannot exceed the venue capacity of ${venueCapacity}.`
                );


                valid = false;
            }
        }
    }


    return valid;
}


/* =========================================================
   SCHEDULE ONLY VALIDATION
   ========================================================= */

function validateEventScheduleFields(
    values
) {

    let valid = true;


    if (!values.venueId) {

        showEventFormFieldError(
            "eventFormVenue",
            "eventFormVenueError",
            "Select a venue first."
        );

        valid = false;
    }


    if (!values.eventDate) {

        showEventFormFieldError(
            "eventFormDate",
            "eventFormDateError",
            "Select an event date."
        );

        valid = false;
    }


    if (!values.startTime) {

        showEventFormFieldError(
            "eventFormStartTime",
            "eventFormStartTimeError",
            "Enter the start time."
        );

        valid = false;
    }


    if (!values.endTime) {

        showEventFormFieldError(
            "eventFormEndTime",
            "eventFormEndTimeError",
            "Enter the end time."
        );

        valid = false;
    }


    if (
        values.startTime &&
        values.endTime &&
        values.endTime <=
        values.startTime
    ) {

        showEventFormFieldError(
            "eventFormEndTime",
            "eventFormEndTimeError",
            "End time must be later than start time."
        );

        valid = false;
    }


    return valid;
}


/* =========================================================
   VENUE AVAILABILITY
   ========================================================= */

async function checkSelectedVenueAvailability(
    values,
    userRequested = false
) {

    /*
     * BRD availability endpoint has no
     * documented exclude-event parameter.
     *
     * On EDIT we therefore rely on the
     * PUT endpoint, which explicitly must
     * exclude the event being edited.
     */

    if (currentAdminEventId) {

        if (userRequested) {

            setEventAvailabilityStatus(
                "This is an existing event. The update API will perform the final venue-overlap validation while excluding this event.",
                "info"
            );
        }


        return null;
    }


    setEventAvailabilityStatus(
        "Checking venue availability...",
        "info"
    );


    try {

        const query =
            new URLSearchParams();


        query.set(
            "date",
            values.eventDate
        );


        query.set(
            "startTime",
            values.startTime
        );


        query.set(
            "endTime",
            values.endTime
        );


        query.set(
            "venueId",
            values.venueId
        );


        const response =
            await apiGet(
                `/venues/available?${query.toString()}`
            );


        const available =
            interpretVenueAvailabilityResponse(
                response,
                values.venueId
            );


        if (available === true) {

            setEventAvailabilityStatus(
                "Venue is available for the selected date and time.",
                "success"
            );


            return true;
        }


        if (available === false) {

            setEventAvailabilityStatus(
                "Venue is not available for the selected date and time.",
                "error"
            );


            return false;
        }


        /*
         * Unknown response shape.
         * Do not invent availability.
         * POST /events will still validate.
         */

        setEventAvailabilityStatus(
            "Availability response could not be interpreted. The event API will perform the final validation.",
            "info"
        );


        return null;


    } catch (error) {

        /*
         * Don't replace backend create/update
         * validation with a frontend failure.
         */

        setEventAvailabilityStatus(
            error.message ||
            "Unable to pre-check venue availability. The event API will still perform final validation.",
            "error"
        );


        return null;
    }
}


/* =========================================================
   INTERPRET AVAILABILITY
   ========================================================= */

function interpretVenueAvailabilityResponse(
    response,
    selectedVenueId
) {

    const data =
        response?.data ??
        response;


    if (
        typeof data ===
        "boolean"
    ) {

        return data;
    }


    if (
        data?.isAvailable !==
        undefined
    ) {

        return Boolean(
            data.isAvailable
        );
    }


    if (
        data?.IsAvailable !==
        undefined
    ) {

        return Boolean(
            data.IsAvailable
        );
    }


    if (
        data?.available !==
        undefined &&
        typeof data.available ===
        "boolean"
    ) {

        return data.available;
    }


    const venues =

        Array.isArray(data)
            ? data
            : Array.isArray(
                data?.venues
            )
                ? data.venues
                : Array.isArray(
                    data?.availableVenues
                )
                    ? data.availableVenues
                    : null;


    if (venues) {

        return venues.some(
            function (venue) {

                return (
                    String(
                        getEventFormVenueId(
                            venue
                        )
                    ) ===
                    String(
                        selectedVenueId
                    )
                );
            }
        );
    }


    return null;
}


/* =========================================================
   SAVE EVENT
   ========================================================= */

async function saveAdminEventForm(
    event
) {

    event.preventDefault();


    if (
        eventFormSaving ||
        adminEventViewMode
    ) {

        return;
    }


    clearAdminEventFormMessage();


    const values =
        getAdminEventFormValues();


    if (
        !validateAdminEventForm(
            values
        )
    ) {

        return;
    }


    /*
     * For CREATE, use the direct BRD
     * availability endpoint as a helpful
     * pre-check.
     */

    if (!currentAdminEventId) {

        const availability =
            await checkSelectedVenueAvailability(
                values
            );


        if (
            availability === false
        ) {

            showAdminEventFormMessage(
                "The selected venue is already booked for an overlapping period.",
                "error"
            );


            return;
        }
    }


    const confirmed =
        await openConfirmationModal({

            title:
                currentAdminEventId
                    ? "Update Event"
                    : "Create Event",

            message:
                currentAdminEventId
                    ? "Save the changes to this event?"
                    : "Create this event with the selected venue, category, schedule and capacity?",

            confirmText:
                currentAdminEventId
                    ? "Save Changes"
                    : "Create Event",

            cancelText:
                "Review"
        });


    if (!confirmed) {
        return;
    }


    /*
     * BRD request fields.
     *
     * Swagger remains final authority
     * for exact DTO property names.
     */

    const request = {

        name:
            values.name,

        venueId:
            Number(values.venueId),

        categoryId:
            Number(values.categoryId),

        eventDate:
            values.eventDate,

        startTime:
            values.startTime,

        endTime:
            values.endTime,

        ticketPrice:
            Number(
                values.ticketPrice
            ),

        capacity:
            Number(
                values.capacity
            )
    };


    setAdminEventFormSaving(
        true
    );


    try {

        if (currentAdminEventId) {

            /*
             * BRD:
             * PUT /api/events/{id}
             *
             * Server must:
             * - exclude current event when
             *   checking overlap
             * - enforce venue capacity
             * - prevent capacity below booked
             * - protect price if bookings exist
             */

            await apiPut(
                `/events/${encodeURIComponent(
                    currentAdminEventId
                )}`,
                request
            );


            window.location.href =
                "events.html";


        } else {

            /*
             * BRD:
             * POST /api/events
             */

            const response =
                await apiPost(
                    "/events",
                    request
                );


            const created =
                response?.data ||
                response;


            const createdId =
                created?.eventId ||
                created?.EventId ||
                created?.id ||
                null;


            if (createdId) {

                window.location.href =
                    `event-form.html?id=${encodeURIComponent(createdId)}&mode=view`;

            } else {

                window.location.href =
                    "events.html";
            }
        }


    } catch (error) {

        console.error(
            "Save Event Error:",
            error
        );


        showAdminEventFormMessage(
            getEventFormApiError(
                error
            ),
            "error"
        );


    } finally {

        setAdminEventFormSaving(
            false
        );
    }
}


/* =========================================================
   BACKEND ERROR
   ========================================================= */

function getEventFormApiError(error) {

    const validation =
        getEventFormValidationErrors(
            error
        );


    if (validation) {

        return validation;
    }


    if (error.status === 409) {

        return (
            error.message ||
            "The event conflicts with an existing venue schedule or another event rule."
        );
    }


    if (error.status === 400) {

        return (
            error.message ||
            "The event could not be saved because one or more business rules were not satisfied."
        );
    }


    return (
        error.message ||
        "Unable to save the event."
    );
}


function getEventFormValidationErrors(
    error
) {

    if (
        !error?.data?.errors
    ) {

        return null;
    }


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


    return messages.length
        ? messages.join(" ")
        : null;
}


/* =========================================================
   VENUE CAPACITY
   ========================================================= */

function updateSelectedVenueCapacity() {

    const venueId =
        getEventFormValue(
            "eventFormVenue"
        );


    const venue =
        findEventFormVenue(
            venueId
        );


    setEventFormText(
        "selectedVenueCapacity",
        venue
            ? getEventFormVenueCapacity(
                venue
            ).toLocaleString("en-LK")
            : "-"
    );
}


function findEventFormVenue(
    venueId
) {

    return eventFormVenues.find(
        function (venue) {

            return (
                String(
                    getEventFormVenueId(
                        venue
                    )
                ) ===
                String(venueId)
            );
        }
    ) || null;
}


/* =========================================================
   SUMMARY PREVIEW
   ========================================================= */

function updateAdminEventFormSummary() {

    const values =
        getAdminEventFormValues();


    const venue =
        findEventFormVenue(
            values.venueId
        );


    const category =
        eventFormCategories.find(
            function (item) {

                return (
                    String(
                        getEventFormCategoryId(
                            item
                        )
                    ) ===
                    String(
                        values.categoryId
                    )
                );
            }
        );


    setEventFormText(
        "eventFormSummaryName",
        values.name ||
        "New Event"
    );


    setEventFormText(
        "eventFormSummaryVenue",
        venue
            ? getEventFormVenueName(
                venue
            )
            : "-"
    );


    setEventFormText(
        "eventFormSummaryCategory",
        category
            ? getEventFormCategoryName(
                category
            )
            : "-"
    );


    setEventFormText(
        "eventFormSummaryDate",
        values.eventDate ||
        "-"
    );


    setEventFormText(
        "eventFormSummaryTime",
        values.startTime &&
        values.endTime
            ? `${values.startTime} - ${values.endTime}`
            : "-"
    );


    setEventFormText(
        "eventFormSummaryPrice",
        formatEventFormCurrency(
            values.ticketPrice
        )
    );


    setEventFormText(
        "eventFormSummaryCapacity",
        values.capacity ||
        "-"
    );
}


/* =========================================================
   AVAILABILITY UI
   ========================================================= */

function setEventAvailabilityStatus(
    message,
    type
) {

    const element =
        document.getElementById(
            "eventAvailabilityStatus"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `admin-event-availability-note ${type || ""}`;
}


/* =========================================================
   FIELD ERROR
   ========================================================= */

function showEventFormFieldError(
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

function clearAdminEventFormValidation() {

    [
        "eventFormName",
        "eventFormVenue",
        "eventFormCategory",
        "eventFormDate",
        "eventFormStartTime",
        "eventFormEndTime",
        "eventFormTicketPrice",
        "eventFormCapacity"
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
        "eventFormNameError",
        "eventFormVenueError",
        "eventFormCategoryError",
        "eventFormDateError",
        "eventFormStartTimeError",
        "eventFormEndTimeError",
        "eventFormTicketPriceError",
        "eventFormCapacityError"
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

function setAdminEventFormSaving(
    saving
) {

    eventFormSaving =
        saving;


    const button =
        document.getElementById(
            "saveAdminEventButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        saving;


    button.textContent =
        saving
            ? "Saving..."
            : currentAdminEventId
                ? "Save Changes"
                : "Create Event";
}


/* =========================================================
   EVENT DTO HELPERS
   ========================================================= */

function getExistingEventName(event) {

    return String(
        event?.name ||
        event?.Name ||
        event?.eventName ||
        event?.EventName ||
        event?.title ||
        ""
    );
}


function getExistingEventVenueId(event) {

    return (
        event?.venueId ||
        event?.VenueId ||
        event?.venue?.venueId ||
        event?.venue?.id ||
        ""
    );
}


function getExistingEventCategoryId(event) {

    return (
        event?.categoryId ||
        event?.CategoryId ||
        event?.eventCategoryId ||
        event?.category?.categoryId ||
        event?.category?.id ||
        ""
    );
}


function getExistingEventDate(event) {

    return (
        event?.eventDate ||
        event?.EventDate ||
        event?.date ||
        ""
    );
}


function getExistingEventStartTime(event) {

    return (
        event?.startTime ||
        event?.StartTime ||
        ""
    );
}


function getExistingEventEndTime(event) {

    return (
        event?.endTime ||
        event?.EndTime ||
        ""
    );
}


function getExistingEventTicketPrice(event) {

    return (
        event?.ticketPrice ??
        event?.TicketPrice ??
        event?.price ??
        0
    );
}


function getExistingEventCapacity(event) {

    return (
        event?.capacity ??
        event?.Capacity ??
        event?.eventCapacity ??
        0
    );
}


/* =========================================================
   MASTER DATA HELPERS
   ========================================================= */

function getEventFormVenueId(venue) {

    return (
        venue?.venueId ||
        venue?.VenueId ||
        venue?.id ||
        venue?.Id ||
        ""
    );
}


function getEventFormVenueName(venue) {

    return String(
        venue?.name ||
        venue?.Name ||
        venue?.venueName ||
        "Venue"
    );
}


function getEventFormVenueCapacity(venue) {

    const number =
        Number(
            venue?.totalCapacity ??
            venue?.TotalCapacity ??
            venue?.capacity ??
            venue?.Capacity ??
            0
        );


    return Number.isNaN(number)
        ? 0
        : number;
}


function getEventFormCategoryId(category) {

    return (
        category?.categoryId ||
        category?.CategoryId ||
        category?.id ||
        category?.Id ||
        ""
    );
}


function getEventFormCategoryName(category) {

    return String(
        category?.name ||
        category?.Name ||
        category?.categoryName ||
        "Category"
    );
}


/* =========================================================
   DATE/TIME NORMALIZE
   ========================================================= */

function normalizeEventFormDate(value) {

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


    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");
}


function normalizeEventFormTime(value) {

    if (!value) {
        return "";
    }


    const text =
        String(value);


    const match =
        text.match(
            /(\d{2}):(\d{2})/
        );


    return match
        ? `${match[1]}:${match[2]}`
        : "";
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatEventFormCurrency(value) {

    const number =
        Number(value);


    return new Intl.NumberFormat(
        "en-LK",
        {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2
        }
    ).format(
        Number.isNaN(number)
            ? 0
            : number
    );
}


/* =========================================================
   VALUE / TEXT
   ========================================================= */

function getEventFormValue(id) {

    return document
        .getElementById(id)
        ?.value ??
        "";
}


function setEventFormValue(
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


function setEventFormText(
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

function showAdminEventFormLoading() {

    document
        .getElementById(
            "adminEventFormLoading"
        )
        ?.classList.remove(
            "hidden"
        );
}


function hideAdminEventFormLoading() {

    document
        .getElementById(
            "adminEventFormLoading"
        )
        ?.classList.add(
            "hidden"
        );
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showAdminEventFormMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminEventFormMessage"
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


function clearAdminEventFormMessage() {

    const element =
        document.getElementById(
            "adminEventFormMessage"
        );


    if (!element) {
        return;
    }


    element.textContent = "";

    element.className =
        "alert hidden";
}