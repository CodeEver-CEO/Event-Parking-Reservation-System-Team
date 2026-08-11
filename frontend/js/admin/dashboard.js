/* =========================================================
   Event & Parking Reservation System
   Administrator Dashboard
   ========================================================= */

   document.addEventListener(
    "DOMContentLoaded",
    initializeAdminDashboard
);


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

async function initializeAdminDashboard() {

    if (!validateAdminDashboardAccess()) {
        return;
    }

    try {

        await loadAdminSidebar();

        displayAdminInformation();

        await loadAdminDashboardStatistics();

    } catch (error) {

        console.error(
            "Admin dashboard initialization error:",
            error
        );

        showAdminDashboardMessage(
            "Unable to initialize the admin dashboard."
        );
    }
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


    const isAdmin =
        normalizedRole === "admin" ||
        normalizedRole === "administrator";


    if (!isAdmin) {

        window.location.href =
            "../auth/login.html";

        return false;
    }


    return true;
}


/* =========================================================
   LOAD ADMIN SIDEBAR
   ========================================================= */

async function loadAdminSidebar() {

    try {

        await loadComponent(
            "adminSidebarContainer",
            "components/admin-sidebar.html"
        );


        setActiveAdminSidebarPage(
            "dashboard"
        );


        initializeAdminSidebarLogout();


        displayAdminInformation();

    } catch (error) {

        console.error(
            "Unable to load admin sidebar:",
            error
        );
    }
}


/* =========================================================
   ACTIVE SIDEBAR PAGE
   ========================================================= */

function setActiveAdminSidebarPage(page) {

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
   ADMIN SIDEBAR LOGOUT
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
   DISPLAY ADMIN INFORMATION
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
                JSON.parse(
                    storedUser
                );


            name =
                user.name ||
                user.fullName ||
                user.username ||
                "Administrator";

        } catch (error) {

            console.error(
                "Invalid admin user data:",
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
   LOAD DASHBOARD STATISTICS
   ========================================================= */

async function loadAdminDashboardStatistics() {

    clearAdminDashboardMessage();

    showAdminDashboardLoading();


    try {

        /*
         * Backend Endpoint:
         *
         * GET /api/Dashboard/admin
         *
         * apiGet() automatically uses API_BASE_URL,
         * therefore only /dashboard/admin is required here.
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
            "Admin Dashboard API Error:",
            error
        );


        hideAdminDashboardLoading();

        showAdminDashboardContent();


        if (error.status === 401) {

            showAdminDashboardMessage(
                "Your session has expired. Please login again."
            );

            return;
        }


        if (error.status === 403) {

            showAdminDashboardMessage(
                "You are not authorized to access the admin dashboard."
            );

            return;
        }


        if (error.status === 404) {

            showAdminDashboardMessage(
                "The admin dashboard API endpoint was not found."
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
   NORMALIZE API RESPONSE
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
   RENDER DASHBOARD STATISTICS
   ========================================================= */

function renderAdminDashboardStatistics(
    data
) {

    setAdminDashboardText(
        "adminTotalEvents",
        getAdminTotalEvents(
            data
        )
    );


    setAdminDashboardText(
        "adminTotalBookings",
        getAdminTotalBookings(
            data
        )
    );


    setAdminDashboardText(
        "adminAvailableSeats",
        getAdminAvailableSeats(
            data
        )
    );


    setAdminDashboardText(
        "adminOccupiedParking",
        getAdminOccupiedParking(
            data
        )
    );


    setAdminDashboardText(
        "adminTotalRevenue",
        formatAdminCurrency(
            getAdminTotalRevenue(
                data
            )
        )
    );


    setAdminDashboardText(
        "adminTotalCustomers",
        getAdminTotalCustomers(
            data
        )
    );
}


/* =========================================================
   TOTAL EVENTS
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


/* =========================================================
   TOTAL BOOKINGS
   ========================================================= */

function getAdminTotalBookings(data) {

    return normalizeAdminNumber(

        data.totalBookings ??

        data.TotalBookings ??

        data.bookingCount ??

        data.BookingCount ??

        0
    );
}


/* =========================================================
   AVAILABLE SEATS
   ========================================================= */

function getAdminAvailableSeats(data) {

    return normalizeAdminNumber(

        data.availableSeats ??

        data.AvailableSeats ??

        data.totalAvailableSeats ??

        data.TotalAvailableSeats ??

        0
    );
}


/* =========================================================
   OCCUPIED PARKING
   ========================================================= */

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


/* =========================================================
   TOTAL REVENUE
   ========================================================= */

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


/* =========================================================
   TOTAL CUSTOMERS
   ========================================================= */

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
   NORMALIZE NUMBER
   ========================================================= */

function normalizeAdminNumber(value) {

    const number =
        Number(
            value
        );


    if (
        Number.isNaN(
            number
        )
    ) {

        return 0;
    }


    return number;
}


/* =========================================================
   FORMAT CURRENCY
   ========================================================= */

function formatAdminCurrency(value) {

    const amount =
        Number(
            value
        );


    if (
        Number.isNaN(
            amount
        )
    ) {

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
                2,

            maximumFractionDigits:
                2
        }
    ).format(
        amount
    );
}


/* =========================================================
   SET TEXT
   ========================================================= */

function setAdminDashboardText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";
}


/* =========================================================
   SHOW LOADING
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


/* =========================================================
   HIDE LOADING
   ========================================================= */

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


/* =========================================================
   SHOW CONTENT
   ========================================================= */

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
   SHOW ERROR MESSAGE
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


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

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