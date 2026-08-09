/* =========================================================
   Event & Parking Reservation System
   Administrator Dashboard
   ========================================================= */


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminDashboard();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminDashboard() {

    if (!validateAdminDashboardAccess()) {
        return;
    }


    await loadAdminSidebar();


    displayAdminInformation();


    await loadAdminDashboardStatistics();
}


/* =========================================================
   ACCESS CHECK
   ========================================================= */

function validateAdminDashboardAccess() {

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


    const normalizedRole =
        String(role || "")
            .trim()
            .toLowerCase();


    if (
        normalizedRole !== "admin" &&
        normalizedRole !== "administrator"
    ) {

        window.location.href =
            "../auth/login.html";

        return false;
    }


    return true;
}


/* =========================================================
   LOAD SIDEBAR
   ========================================================= */

async function loadAdminSidebar() {

    await loadComponent(
        "adminSidebarContainer",
        "components/admin-sidebar.html"
    );


    setActiveAdminSidebarPage(
        "dashboard"
    );


    initializeAdminSidebarLogout();


    displayAdminInformation();
}


/* =========================================================
   ACTIVE SIDEBAR PAGE
   ========================================================= */

function setActiveAdminSidebarPage(
    page
) {

    const links =
        document.querySelectorAll(
            "[data-admin-page]"
        );


    links.forEach(
        function (link) {

            link.classList.remove(
                "active"
            );


            if (
                link.dataset.adminPage ===
                page
            ) {

                link.classList.add(
                    "active"
                );
            }
        }
    );
}


/* =========================================================
   SIDEBAR LOGOUT
   ========================================================= */

function initializeAdminSidebarLogout() {

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
   ADMIN INFORMATION
   ========================================================= */

function displayAdminInformation() {

    const storedUser =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.USER
        );


    let name =
        "Administrator";


    if (storedUser) {

        try {

            const user =
                JSON.parse(storedUser);


            name =

                user.name ||

                user.fullName ||

                user.username ||

                "Administrator";


        } catch (error) {

            console.error(
                "Invalid admin user data.",
                error
            );
        }
    }


    setAdminDashboardText(
        "adminHeaderName",
        name
    );


    setAdminDashboardText(
        "adminSidebarName",
        name
    );
}


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadAdminDashboardStatistics() {

    clearAdminDashboardMessage();

    showAdminDashboardLoading();


    try {

        /*
         * IMPORTANT:
         *
         * The BRD defines the required
         * dashboard statistics, but it does
         * not define a specific REST endpoint
         * for the dashboard.
         *
         * For this frontend we use:
         *
         * GET /api/dashboard/admin
         *
         * Match this route with the actual
         * backend Swagger implementation.
         */

        const response =
            await apiGet(
                "/dashboard/admin"
            );


        const dashboardData =
            normalizeAdminDashboardResponse(
                response
            );


        renderAdminDashboardStatistics(
            dashboardData
        );


        hideAdminDashboardLoading();

        showAdminDashboardContent();


    } catch (error) {

        console.error(
            "Admin Dashboard Error:",
            error
        );


        hideAdminDashboardLoading();


        /*
         * Do not invent fake statistics
         * when backend dashboard data is
         * unavailable.
         */

        showAdminDashboardContent();


        if (error.status === 404) {

            showAdminDashboardMessage(
                "The admin dashboard API endpoint was not found. Check your Swagger route for the dashboard statistics endpoint."
            );


            return;
        }


        showAdminDashboardMessage(
            error.message ||
            "Unable to load dashboard statistics."
        );
    }
}


/* =========================================================
   NORMALIZE RESPONSE
   ========================================================= */

function normalizeAdminDashboardResponse(
    response
) {

    if (!response) {

        return {};
    }


    return (

        response.data ||

        response.dashboard ||

        response.statistics ||

        response
    );
}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function renderAdminDashboardStatistics(
    data
) {

    setAdminDashboardText(
        "adminTotalEvents",
        getAdminTotalEvents(data)
    );


    setAdminDashboardText(
        "adminTotalBookings",
        getAdminTotalBookings(data)
    );


    setAdminDashboardText(
        "adminAvailableSeats",
        getAdminAvailableSeats(data)
    );


    setAdminDashboardText(
        "adminOccupiedParking",
        getAdminOccupiedParking(data)
    );


    setAdminDashboardText(
        "adminTotalRevenue",
        formatAdminCurrency(
            getAdminTotalRevenue(data)
        )
    );


    setAdminDashboardText(
        "adminTotalCustomers",
        getAdminTotalCustomers(data)
    );
}


/* =========================================================
   METRIC HELPERS
   ========================================================= */

function getAdminTotalEvents(data) {

    return normalizeAdminNumber(

        data.totalEvents ??

        data.TotalEvents ??

        data.eventCount ??

        data.EventCount ??

        0
    );
}


function getAdminTotalBookings(data) {

    return normalizeAdminNumber(

        data.totalBookings ??

        data.TotalBookings ??

        data.bookingCount ??

        data.BookingCount ??

        0
    );
}


function getAdminAvailableSeats(data) {

    return normalizeAdminNumber(

        data.availableSeats ??

        data.AvailableSeats ??

        data.totalAvailableSeats ??

        data.TotalAvailableSeats ??

        0
    );
}


function getAdminOccupiedParking(data) {

    return normalizeAdminNumber(

        data.occupiedParkingSlots ??

        data.OccupiedParkingSlots ??

        data.occupiedParking ??

        data.OccupiedParking ??

        data.reservedParkingSlots ??

        data.ReservedParkingSlots ??

        0
    );
}


function getAdminTotalRevenue(data) {

    return normalizeAdminNumber(

        data.totalRevenue ??

        data.TotalRevenue ??

        data.revenue ??

        data.Revenue ??

        data.totalRevenueCollected ??

        data.TotalRevenueCollected ??

        0
    );
}


function getAdminTotalCustomers(data) {

    return normalizeAdminNumber(

        data.totalCustomers ??

        data.TotalCustomers ??

        data.customerCount ??

        data.CustomerCount ??

        0
    );
}


/* =========================================================
   NUMBER
   ========================================================= */

function normalizeAdminNumber(value) {

    const number =
        Number(value);


    return Number.isNaN(number)
        ? 0
        : number;
}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatAdminCurrency(value) {

    const amount =
        Number(value);


    if (Number.isNaN(amount)) {

        return "LKR 0.00";
    }


    return new Intl.NumberFormat(
        "en-LK",
        {
            style:
                "currency",

            currency:
                "LKR",

            minimumFractionDigits:
                2
        }
    ).format(amount);
}


/* =========================================================
   TEXT
   ========================================================= */

function setAdminDashboardText(
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

function showAdminDashboardLoading() {

    const loading =
        document.getElementById(
            "adminDashboardLoading"
        );


    const content =
        document.getElementById(
            "adminDashboardContent"
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
}


function hideAdminDashboardLoading() {

    const loading =
        document.getElementById(
            "adminDashboardLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


function showAdminDashboardContent() {

    const content =
        document.getElementById(
            "adminDashboardContent"
        );


    if (content) {

        content.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showAdminDashboardMessage(
    message
) {

    const element =
        document.getElementById(
            "adminDashboardMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        message;


    element.className =
        "alert alert-error";
}


function clearAdminDashboardMessage() {

    const element =
        document.getElementById(
            "adminDashboardMessage"
        );


    if (!element) {

        return;
    }


    element.textContent =
        "";


    element.className =
        "alert hidden";
}