/* =========================================================
   Event & Parking Reservation System
   Common Frontend Functions
   ========================================================= */


/* =========================================================
   GET FRONTEND ROOT PATH
   ========================================================= */

function getFrontendRoot() {

    const currentPath =
        window.location.pathname.replace(/\\/g, "/");

    /*
       index.html
       frontend/index.html
       -------------------
       Root = ""

       pages/customer/events.html
       pages/admin/events.html
       pages/auth/login.html
       -------------------
       Root = "../../"
    */

    if (currentPath.includes("/pages/")) {
        return "../../";
    }

    return "";
}


/* =========================================================
   LOAD HTML COMPONENT
   ========================================================= */

async function loadComponent(
    containerId,
    componentPath
) {

    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    try {

        const root =
            getFrontendRoot();

        const response =
            await fetch(
                `${root}${componentPath}`
            );

        if (!response.ok) {

            throw new Error(
                `Unable to load ${componentPath}`
            );
        }

        const html =
            await response.text();

        container.innerHTML = html;

    } catch (error) {

        console.error(
            "Component Loading Error:",
            error
        );
    }
}


/* =========================================================
   LOAD COMMON COMPONENTS
   ========================================================= */

async function loadCommonComponents() {

    await loadComponent(
        "navbarContainer",
        "components/navbar.html"
    );

    await loadComponent(
        "footerContainer",
        "components/footer.html"
    );

    await loadComponent(
        "confirmationModalContainer",
        "components/confirmation-modal.html"
    );


    initializeNavbar();

    initializeNavigation();

    initializeFooter();
}


/* =========================================================
   INITIALIZE NAVBAR
   ========================================================= */

function initializeNavbar() {

    const navbarToggle =
        document.getElementById(
            "navbarToggle"
        );

    const navbarMenu =
        document.getElementById(
            "navbarMenu"
        );


    /* Mobile Menu */

    if (
        navbarToggle &&
        navbarMenu
    ) {

        navbarToggle.addEventListener(
            "click",
            function () {

                navbarMenu.classList.toggle(
                    "active"
                );
            }
        );
    }


    /* Navigation Areas */

    const publicNavigation =
        document.getElementById(
            "publicNavigation"
        );

    const customerNavigation =
        document.getElementById(
            "customerNavigation"
        );

    const adminNavigation =
        document.getElementById(
            "adminNavigation"
        );


    if (
        !publicNavigation ||
        !customerNavigation ||
        !adminNavigation
    ) {
        return;
    }


    const token =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.TOKEN
        );

    const role =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.ROLE
        );


    /* Default */

    publicNavigation.classList.remove(
        "hidden"
    );

    customerNavigation.classList.add(
        "hidden"
    );

    adminNavigation.classList.add(
        "hidden"
    );


    /* Not Logged In */

    if (!token) {
        return;
    }


    /* Customer Logged In */

    if (
        role &&
        role.toLowerCase() === "customer"
    ) {

        publicNavigation.classList.add(
            "hidden"
        );

        customerNavigation.classList.remove(
            "hidden"
        );

        initializeCustomerMenu();

        return;
    }


    /* Admin Logged In */

    if (
        role &&
        (
            role.toLowerCase() === "admin" ||
            role.toLowerCase() === "administrator"
        )
    ) {

        publicNavigation.classList.add(
            "hidden"
        );

        adminNavigation.classList.remove(
            "hidden"
        );

        initializeAdminMenu();
    }
}


/* =========================================================
   CUSTOMER USER MENU
   ========================================================= */

function initializeCustomerMenu() {

    const customerButton =
        document.getElementById(
            "customerUserButton"
        );

    const customerDropdown =
        document.getElementById(
            "customerDropdown"
        );

    const customerLogoutButton =
        document.getElementById(
            "customerLogoutButton"
        );


    if (
        customerButton &&
        customerDropdown
    ) {

        customerButton.addEventListener(
            "click",
            function () {

                customerDropdown.classList.toggle(
                    "hidden"
                );
            }
        );
    }


    if (customerLogoutButton) {

        customerLogoutButton.addEventListener(
            "click",
            logoutUser
        );
    }


    /* Display Customer Name */

    const storedUser =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.USER
        );

    if (storedUser) {

        try {

            const user =
                JSON.parse(storedUser);

            const nameElement =
                document.getElementById(
                    "customerNavbarName"
                );

            if (
                nameElement &&
                user.name
            ) {

                nameElement.textContent =
                    user.name;
            }

        } catch (error) {

            console.error(
                "Invalid stored user data."
            );
        }
    }
}


/* =========================================================
   ADMIN USER MENU
   ========================================================= */

function initializeAdminMenu() {

    const adminButton =
        document.getElementById(
            "adminUserButton"
        );

    const adminDropdown =
        document.getElementById(
            "adminDropdown"
        );

    const adminLogoutButton =
        document.getElementById(
            "adminLogoutButton"
        );


    if (
        adminButton &&
        adminDropdown
    ) {

        adminButton.addEventListener(
            "click",
            function () {

                adminDropdown.classList.toggle(
                    "hidden"
                );
            }
        );
    }


    if (adminLogoutButton) {

        adminLogoutButton.addEventListener(
            "click",
            logoutUser
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {

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


    const root =
        getFrontendRoot();


    window.location.href =
        `${root}pages/auth/login.html`;
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const links =
        document.querySelectorAll(
            "[data-page]"
        );


    links.forEach(function (link) {

        link.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                const page =
                    this.dataset.page;

                navigateToPage(page);
            }
        );
    });
}


/* =========================================================
   PAGE ROUTES
   ========================================================= */

function navigateToPage(page) {

    const root =
        getFrontendRoot();


    const routes = {

        home:
            "index.html",

        events:
            "pages/customer/events.html",

        login:
            "pages/auth/login.html",

        register:
            "pages/auth/register.html",


        /* Customer */

        "customer-dashboard":
            "pages/customer/dashboard.html",

        "customer-events":
            "pages/customer/events.html",

        "my-bookings":
            "pages/customer/my-bookings.html",

        "payment-history":
            "pages/customer/payment-history.html",

        notifications:
            "pages/customer/notifications.html",

        profile:
            "pages/customer/profile.html",


        /* Admin */

        "admin-dashboard":
            "pages/admin/dashboard.html",

        "admin-events":
            "pages/admin/events.html",

        "admin-bookings":
            "pages/admin/bookings.html"
    };


    const destination =
        routes[page];


    if (!destination) {

        console.warn(
            `Route not found: ${page}`
        );

        return;
    }


    window.location.href =
        `${root}${destination}`;
}


/* =========================================================
   FOOTER
   ========================================================= */

function initializeFooter() {

    const currentYear =
        document.getElementById(
            "currentYear"
        );

    if (currentYear) {

        currentYear.textContent =
            new Date().getFullYear();
    }
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadCommonComponents
);
/* =========================================================
   REUSABLE CONFIRMATION MODAL
   ========================================================= */

function openConfirmationModal({
    title = "Confirm Action",
    message = "Are you sure you want to continue?",
    confirmText = "Confirm",
    cancelText = "Cancel"
} = {}) {

    return new Promise(function (resolve) {

        const modal =
            document.getElementById(
                "confirmationModal"
            );


        const titleElement =
            document.getElementById(
                "confirmationTitle"
            );


        const messageElement =
            document.getElementById(
                "confirmationMessage"
            );


        const confirmButton =
            document.getElementById(
                "confirmationConfirmButton"
            );


        const cancelButton =
            document.getElementById(
                "confirmationCancelButton"
            );


        /*
         * Fallback if modal component
         * has not loaded yet.
         */

        if (
            !modal ||
            !titleElement ||
            !messageElement ||
            !confirmButton ||
            !cancelButton
        ) {

            resolve(
                window.confirm(message)
            );

            return;
        }


        titleElement.textContent =
            title;


        messageElement.textContent =
            message;


        confirmButton.textContent =
            confirmText;


        cancelButton.textContent =
            cancelText;


        modal.classList.add(
            "active"
        );


        function closeModal(result) {

            modal.classList.remove(
                "active"
            );


            confirmButton.onclick =
                null;


            cancelButton.onclick =
                null;


            modal.onclick =
                null;


            document.removeEventListener(
                "keydown",
                handleEscape
            );


            resolve(result);
        }


        function handleEscape(event) {

            if (event.key === "Escape") {

                closeModal(false);
            }
        }


        confirmButton.onclick =
            function () {

                closeModal(true);
            };


        cancelButton.onclick =
            function () {

                closeModal(false);
            };


        modal.onclick =
            function (event) {

                if (event.target === modal) {

                    closeModal(false);
                }
            };


        document.addEventListener(
            "keydown",
            handleEscape
        );
    });
}
/* =========================================================
   FINAL FRONTEND ROUTE / SESSION GUARD
   ========================================================= */


/*
 * Customer pages that require authentication.
 *
 * events.html + event-details.html intentionally
 * remain outside this list so users may browse
 * events before beginning the protected booking flow.
 */

const FRONTEND_PROTECTED_CUSTOMER_PAGES =
    new Set([

        "dashboard.html",

        "seat-selection.html",

        "parking-selection.html",

        "booking-summary.html",

        "payment.html",

        "my-bookings.html",

        "booking-details.html",

        "profile.html",

        "payment-history.html",

        "notifications.html"
    ]);


/* =========================================================
   CURRENT FILE
   ========================================================= */

function frontendGuardCurrentFileName() {

    const path =
        window.location.pathname;


    return (
        path
            .split("/")
            .pop()
            .toLowerCase() ||
        "index.html"
    );
}


/* =========================================================
   CURRENT ROLE
   ========================================================= */

function frontendGuardStoredRole() {

    return String(
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.ROLE
        ) || ""
    )
        .trim()
        .toLowerCase();
}


/* =========================================================
   TOKEN
   ========================================================= */

function frontendGuardToken() {

    return localStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.TOKEN
    );
}


/* =========================================================
   JWT PAYLOAD
   ========================================================= */

function frontendGuardDecodeJwt(
    token
) {

    if (!token) {

        return null;
    }


    try {

        const parts =
            token.split(".");


        /*
         * If backend uses an opaque token
         * instead of JWT, don't treat it
         * as expired.
         */

        if (
            parts.length !==
            3
        ) {

            return null;
        }


        let payload =
            parts[1]
                .replace(
                    /-/g,
                    "+"
                )
                .replace(
                    /_/g,
                    "/"
                );


        while (
            payload.length %
            4
        ) {

            payload += "=";
        }


        const json =
            decodeURIComponent(

                atob(payload)
                    .split("")
                    .map(
                        function (character) {

                            return (
                                "%" +
                                (
                                    "00" +
                                    character
                                        .charCodeAt(0)
                                        .toString(16)
                                )
                                    .slice(-2)
                            );
                        }
                    )
                    .join("")
            );


        return JSON.parse(
            json
        );


    } catch (error) {

        console.warn(
            "JWT could not be decoded on the client.",
            error
        );


        return null;
    }
}


/* =========================================================
   TOKEN EXPIRED?
   ========================================================= */

function frontendGuardTokenExpired(
    token
) {

    const payload =
        frontendGuardDecodeJwt(
            token
        );


    if (
        !payload ||
        !payload.exp
    ) {

        return false;
    }


    return (
        Date.now() >=
        Number(payload.exp) *
        1000
    );
}


/* =========================================================
   CLEAR SESSION
   ========================================================= */

function frontendGuardClearSession() {

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


    /*
     * Booking-selection information should
     * not survive an expired/invalid login.
     */

    sessionStorage.removeItem(
        "eventParkingSeatSelection"
    );


    sessionStorage.removeItem(
        "eventParkingParkingSelection"
    );


    sessionStorage.removeItem(
        "eventParkingPendingBooking"
    );
}


/* =========================================================
   PROTECTED PAGE?
   ========================================================= */

function frontendGuardIsProtectedPage() {

    const path =
        window.location.pathname
            .toLowerCase();


    const fileName =
        frontendGuardCurrentFileName();


    /*
     * Every admin page is protected.
     */

    if (
        path.includes(
            "/pages/admin/"
        )
    ) {

        return true;
    }


    /*
     * Selected customer pages only.
     */

    if (
        path.includes(
            "/pages/customer/"
        ) &&
        FRONTEND_PROTECTED_CUSTOMER_PAGES
            .has(fileName)
    ) {

        return true;
    }


    return false;
}


/* =========================================================
   GET FRONTEND ROOT PATH
   ========================================================= */

function frontendGuardBasePath() {

    const pathname =
        window.location.pathname;


    const pagesIndex =
        pathname.indexOf(
            "/pages/"
        );


    if (
        pagesIndex !==
        -1
    ) {

        return pathname.substring(
            0,
            pagesIndex + 1
        );
    }


    const lastSlash =
        pathname.lastIndexOf(
            "/"
        );


    return pathname.substring(
        0,
        lastSlash + 1
    );
}


/* =========================================================
   LOGIN URL
   ========================================================= */

function frontendGuardLoginUrl() {

    return (
        frontendGuardBasePath() +
        "pages/auth/login.html"
    );
}


/* =========================================================
   CUSTOMER DASHBOARD
   ========================================================= */

function frontendGuardCustomerDashboardUrl() {

    return (
        frontendGuardBasePath() +
        "pages/customer/dashboard.html"
    );
}


/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

function frontendGuardAdminDashboardUrl() {

    return (
        frontendGuardBasePath() +
        "pages/admin/dashboard.html"
    );
}


/* =========================================================
   REDIRECT LOGIN
   ========================================================= */

function frontendGuardRedirectToLogin() {

    const loginUrl =
        frontendGuardLoginUrl();


    if (
        !window.location.pathname
            .toLowerCase()
            .endsWith(
                "/pages/auth/login.html"
            )
    ) {

        window.location.replace(
            loginUrl
        );
    }
}


/* =========================================================
   UNAUTHORIZED API RESPONSE
   ========================================================= */

function handleAppUnauthorized() {

    const protectedPage =
        frontendGuardIsProtectedPage();


    frontendGuardClearSession();


    if (protectedPage) {

        frontendGuardRedirectToLogin();
    }
}


window.handleAppUnauthorized =
    handleAppUnauthorized;


window.addEventListener(
    "app:unauthorized",
    handleAppUnauthorized
);


/* =========================================================
   PAGE ROUTE PROTECTION
   ========================================================= */

function enforceFrontendRouteProtection() {

    const path =
        window.location.pathname
            .toLowerCase();


    const fileName =
        frontendGuardCurrentFileName();


    const token =
        frontendGuardToken();


    const role =
        frontendGuardStoredRole();


    const expired =
        token
            ? frontendGuardTokenExpired(
                token
            )
            : false;


    /*
     * Expired JWT
     */

    if (expired) {

        frontendGuardClearSession();


        if (
            frontendGuardIsProtectedPage()
        ) {

            frontendGuardRedirectToLogin();
        }


        return;
    }


    /* =====================================================
       ADMIN
       ===================================================== */

    if (
        path.includes(
            "/pages/admin/"
        )
    ) {

        if (!token) {

            frontendGuardRedirectToLogin();

            return;
        }


        if (
            role !== "admin" &&
            role !== "administrator"
        ) {

            if (
                role === "customer"
            ) {

                window.location.replace(
                    frontendGuardCustomerDashboardUrl()
                );


            } else {

                frontendGuardRedirectToLogin();
            }


            return;
        }
    }


    /* =====================================================
       PROTECTED CUSTOMER
       ===================================================== */

    if (
        path.includes(
            "/pages/customer/"
        ) &&
        FRONTEND_PROTECTED_CUSTOMER_PAGES
            .has(fileName)
    ) {

        if (!token) {

            frontendGuardRedirectToLogin();

            return;
        }


        if (
            role !== "customer"
        ) {

            if (
                role === "admin" ||
                role === "administrator"
            ) {

                window.location.replace(
                    frontendGuardAdminDashboardUrl()
                );


            } else {

                frontendGuardRedirectToLogin();
            }


            return;
        }
    }
}


/* =========================================================
   RUN GUARD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    enforceFrontendRouteProtection
);