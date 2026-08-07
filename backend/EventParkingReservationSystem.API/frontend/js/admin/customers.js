/* =========================================================
   Event & Parking Reservation System
   Admin Customer Management
   ========================================================= */


let adminCustomers = [];

let adminCustomerSearchTimer = null;

let adminCustomerActionInProgress = false;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeAdminCustomersPage();
    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeAdminCustomersPage() {

    if (!validateAdminCustomersAccess()) {
        return;
    }


    await loadCustomersAdminSidebar();


    displayCustomersAdminInformation();


    initializeAdminCustomerControls();


    await loadAdminCustomers();
}


/* =========================================================
   ACCESS
   ========================================================= */

function validateAdminCustomersAccess() {

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
   LOAD ADMIN SIDEBAR
   ========================================================= */

async function loadCustomersAdminSidebar() {

    await loadComponent(
        "adminSidebarContainer",
        "components/admin-sidebar.html"
    );


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
                "customers"
            ) {

                link.classList.add(
                    "active"
                );
            }
        }
    );


    initializeCustomersAdminLogout();


    displayCustomersAdminInformation();
}


/* =========================================================
   ADMIN INFORMATION
   ========================================================= */

function displayCustomersAdminInformation() {

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
                "Invalid administrator data.",
                error
            );
        }
    }


    setAdminCustomerText(
        "adminHeaderName",
        name
    );


    setAdminCustomerText(
        "adminSidebarName",
        name
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function initializeCustomersAdminLogout() {

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

function initializeAdminCustomerControls() {

    const form =
        document.getElementById(
            "adminCustomerSearchForm"
        );


    const searchInput =
        document.getElementById(
            "adminCustomerSearch"
        );


    const statusFilter =
        document.getElementById(
            "adminCustomerStatusFilter"
        );


    const clearButton =
        document.getElementById(
            "clearAdminCustomerFilters"
        );


    const emptyClearButton =
        document.getElementById(
            "adminCustomersEmptyClearButton"
        );


    /*
     * Search button / Enter
     */

    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                await runAdminCustomerSearch();
            }
        );
    }


    /*
     * Small debounce while typing.
     */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                clearTimeout(
                    adminCustomerSearchTimer
                );


                adminCustomerSearchTimer =
                    setTimeout(
                        function () {

                            runAdminCustomerSearch();

                        },
                        400
                    );
            }
        );
    }


    /*
     * Status filter is frontend-side.
     */

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyAdminCustomerStatusFilter
        );
    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearAdminCustomerFilters
        );
    }


    if (emptyClearButton) {

        emptyClearButton.addEventListener(
            "click",
            clearAdminCustomerFilters
        );
    }
}


/* =========================================================
   SEARCH
   ========================================================= */

async function runAdminCustomerSearch() {

    const search =
        document
            .getElementById(
                "adminCustomerSearch"
            )
            ?.value
            .trim() ||
        "";


    await loadAdminCustomers(
        search
    );
}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

async function clearAdminCustomerFilters() {

    const search =
        document.getElementById(
            "adminCustomerSearch"
        );


    const status =
        document.getElementById(
            "adminCustomerStatusFilter"
        );


    if (search) {

        search.value =
            "";
    }


    if (status) {

        status.value =
            "";
    }


    await loadAdminCustomers();
}


/* =========================================================
   LOAD CUSTOMERS
   ========================================================= */

async function loadAdminCustomers(
    search = ""
) {

    clearAdminCustomersMessage();

    showAdminCustomersLoading();


    let endpoint =
        "/customers";


    /*
     * BRD:
     * GET /api/customers?search=
     *
     * Admin-only name/email search.
     */

    if (search) {

        const query =
            new URLSearchParams();


        query.set(
            "search",
            search
        );


        endpoint +=
            `?${query.toString()}`;
    }


    try {

        const response =
            await apiGet(
                endpoint
            );


        adminCustomers =
            normalizeAdminCustomersResponse(
                response
            );


        sortAdminCustomers();


        renderAdminCustomerSummary();


        hideAdminCustomersLoading();


        applyAdminCustomerStatusFilter();


    } catch (error) {

        console.error(
            "Admin Customers Error:",
            error
        );


        hideAdminCustomersLoading();


        showAdminCustomersMessage(
            error.message ||
            "Unable to load customers.",
            "error"
        );
    }
}


/* =========================================================
   NORMALIZE RESPONSE
   ========================================================= */

function normalizeAdminCustomersResponse(
    response
) {

    if (
        Array.isArray(response)
    ) {

        return response;
    }


    if (
        response &&
        Array.isArray(response.data)
    ) {

        return response.data;
    }


    if (
        response &&
        Array.isArray(response.items)
    ) {

        return response.items;
    }


    if (
        response &&
        Array.isArray(response.customers)
    ) {

        return response.customers;
    }


    return [];
}


/* =========================================================
   SORT
   ========================================================= */

function sortAdminCustomers() {

    adminCustomers.sort(
        function (a, b) {

            return getAdminCustomerName(a)
                .localeCompare(
                    getAdminCustomerName(b)
                );
        }
    );
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderAdminCustomerSummary() {

    const total =
        adminCustomers.length;


    const active =
        adminCustomers.filter(
            function (customer) {

                return getAdminCustomerIsActive(
                    customer
                );
            }
        ).length;


    const inactive =
        total -
        active;


    setAdminCustomerText(
        "adminCustomerTotalCount",
        total
    );


    setAdminCustomerText(
        "adminCustomerActiveCount",
        active
    );


    setAdminCustomerText(
        "adminCustomerInactiveCount",
        inactive
    );


    const summary =
        document.getElementById(
            "adminCustomerSummary"
        );


    if (summary) {

        summary.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   STATUS FILTER
   ========================================================= */

function applyAdminCustomerStatusFilter() {

    const status =
        document
            .getElementById(
                "adminCustomerStatusFilter"
            )
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    let filtered =
        [...adminCustomers];


    if (status === "active") {

        filtered =
            filtered.filter(
                function (customer) {

                    return getAdminCustomerIsActive(
                        customer
                    );
                }
            );
    }


    if (status === "inactive") {

        filtered =
            filtered.filter(
                function (customer) {

                    return !getAdminCustomerIsActive(
                        customer
                    );
                }
            );
    }


    renderAdminCustomers(
        filtered
    );
}


/* =========================================================
   RENDER
   ========================================================= */

function renderAdminCustomers(
    customers
) {

    const tableContainer =
        document.getElementById(
            "adminCustomersTableContainer"
        );


    const body =
        document.getElementById(
            "adminCustomersTableBody"
        );


    const empty =
        document.getElementById(
            "adminCustomersEmpty"
        );


    if (
        !tableContainer ||
        !body ||
        !empty
    ) {

        return;
    }


    body.innerHTML =
        "";


    updateAdminCustomerResultCount(
        customers.length
    );


    if (
        customers.length === 0
    ) {

        tableContainer.classList.add(
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


    tableContainer.classList.remove(
        "hidden"
    );


    customers.forEach(
        function (customer) {

            body.appendChild(
                createAdminCustomerRow(
                    customer
                )
            );
        }
    );
}


/* =========================================================
   CREATE CUSTOMER ROW
   ========================================================= */

function createAdminCustomerRow(
    customer
) {

    const customerId =
        getAdminCustomerId(
            customer
        );


    const name =
        getAdminCustomerName(
            customer
        );


    const email =
        getAdminCustomerEmail(
            customer
        );


    const phone =
        getAdminCustomerPhone(
            customer
        );


    const isActive =
        getAdminCustomerIsActive(
            customer
        );


    const isVerified =
        getAdminCustomerEmailVerified(
            customer
        );


    const row =
        document.createElement(
            "tr"
        );


    row.innerHTML = `

        <td>

            <div class="admin-customer-name-cell">

                <div class="admin-customer-avatar">

                    ${escapeAdminCustomerHtml(
                        getAdminCustomerInitial(
                            name
                        )
                    )}

                </div>


                <div>

                    <strong>

                        ${escapeAdminCustomerHtml(
                            name
                        )}

                    </strong>

                    <span>

                        ID:
                        ${escapeAdminCustomerHtml(
                            customerId || "-"
                        )}

                    </span>

                </div>

            </div>

        </td>


        <td>

            ${escapeAdminCustomerHtml(
                email
            )}

        </td>


        <td>

            ${escapeAdminCustomerHtml(
                phone || "-"
            )}

        </td>


        <td>

            <span class="admin-email-status ${
                isVerified
                    ? "verified"
                    : "unverified"
            }">

                ${
                    isVerified
                        ? "Verified"
                        : "Not Verified"
                }

            </span>

        </td>


        <td>

            <span class="admin-customer-status ${
                isActive
                    ? "active"
                    : "inactive"
            }">

                ${
                    isActive
                        ? "Active"
                        : "Inactive"
                }

            </span>

        </td>


        <td>

            <div class="admin-customer-actions">


                ${
                    customerId
                        ? `
                            <a
                                href="customer-details.html?id=${encodeURIComponent(
                                    customerId
                                )}"
                                class="btn btn-outline"
                            >
                                View
                            </a>
                          `
                        : ""
                }


                ${
                    customerId &&
                    isActive
                        ? `
                            <button
                                type="button"
                                class="btn btn-danger"
                                data-deactivate-customer-id="${escapeAdminCustomerHtml(
                                    customerId
                                )}"
                                data-customer-name="${escapeAdminCustomerHtml(
                                    name
                                )}"
                            >
                                Deactivate
                            </button>
                          `
                        : ""
                }


                ${
                    customerId &&
                    !isActive
                        ? `
                            <button
                                type="button"
                                class="btn btn-primary"
                                data-reactivate-customer-id="${escapeAdminCustomerHtml(
                                    customerId
                                )}"
                                data-customer-name="${escapeAdminCustomerHtml(
                                    name
                                )}"
                            >
                                Reactivate
                            </button>
                          `
                        : ""
                }


            </div>

        </td>
    `;


    initializeAdminCustomerRowActions(
        row
    );


    return row;
}


/* =========================================================
   ROW ACTIONS
   ========================================================= */

function initializeAdminCustomerRowActions(
    row
) {

    const deactivateButton =
        row.querySelector(
            "[data-deactivate-customer-id]"
        );


    const reactivateButton =
        row.querySelector(
            "[data-reactivate-customer-id]"
        );


    if (deactivateButton) {

        deactivateButton.addEventListener(
            "click",
            async function () {

                await confirmAdminCustomerDeactivation(
                    this.dataset
                        .deactivateCustomerId,
                    this.dataset
                        .customerName,
                    this
                );
            }
        );
    }


    if (reactivateButton) {

        reactivateButton.addEventListener(
            "click",
            async function () {

                await confirmAdminCustomerReactivation(
                    this.dataset
                        .reactivateCustomerId,
                    this.dataset
                        .customerName,
                    this
                );
            }
        );
    }
}


/* =========================================================
   CONFIRM DEACTIVATION
   ========================================================= */

async function confirmAdminCustomerDeactivation(
    customerId,
    customerName,
    button
) {

    if (adminCustomerActionInProgress) {

        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Deactivate Customer",

            message:
                `Deactivate ${customerName}? The customer will not be able to log in, browse events or create new bookings until the account is reactivated.`,

            confirmText:
                "Deactivate",

            cancelText:
                "Keep Active"
        });


    if (!confirmed) {

        return;
    }


    await deactivateAdminCustomer(
        customerId,
        button
    );
}


/* =========================================================
   DEACTIVATE
   ========================================================= */

async function deactivateAdminCustomer(
    customerId,
    button
) {

    adminCustomerActionInProgress =
        true;


    clearAdminCustomersMessage();


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Deactivating...";
    }


    try {

        /*
         * BRD:
         *
         * DELETE /api/customers/{id}
         *
         * This is ACCOUNT DEACTIVATION,
         * not physical record deletion.
         */

        await apiDelete(
            `/customers/${encodeURIComponent(
                customerId
            )}`
        );


        showAdminCustomersMessage(
            "Customer account was deactivated successfully.",
            "success"
        );


        await reloadAdminCustomersWithCurrentSearch();


    } catch (error) {

        console.error(
            "Customer Deactivation Error:",
            error
        );


        showAdminCustomersMessage(
            getAdminCustomerActionError(
                error,
                "deactivate"
            ),
            "error"
        );


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Deactivate";
        }


    } finally {

        adminCustomerActionInProgress =
            false;
    }
}


/* =========================================================
   CONFIRM REACTIVATION
   ========================================================= */

async function confirmAdminCustomerReactivation(
    customerId,
    customerName,
    button
) {

    if (adminCustomerActionInProgress) {

        return;
    }


    const confirmed =
        await openConfirmationModal({

            title:
                "Reactivate Customer",

            message:
                `Reactivate ${customerName}? Normal customer access will be restored.`,

            confirmText:
                "Reactivate",

            cancelText:
                "Cancel"
        });


    if (!confirmed) {

        return;
    }


    await reactivateAdminCustomer(
        customerId,
        button
    );
}


/* =========================================================
   REACTIVATE
   ========================================================= */

async function reactivateAdminCustomer(
    customerId,
    button
) {

    adminCustomerActionInProgress =
        true;


    clearAdminCustomersMessage();


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "Reactivating...";
    }


    try {

        /*
         * BRD:
         *
         * POST /api/customers/{id}/reactivate
         */

        await apiPost(
            `/customers/${encodeURIComponent(
                customerId
            )}/reactivate`
        );


        showAdminCustomersMessage(
            "Customer account was reactivated successfully.",
            "success"
        );


        await reloadAdminCustomersWithCurrentSearch();


    } catch (error) {

        console.error(
            "Customer Reactivation Error:",
            error
        );


        showAdminCustomersMessage(
            getAdminCustomerActionError(
                error,
                "reactivate"
            ),
            "error"
        );


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "Reactivate";
        }


    } finally {

        adminCustomerActionInProgress =
            false;
    }
}


/* =========================================================
   RELOAD CURRENT SEARCH
   ========================================================= */

async function reloadAdminCustomersWithCurrentSearch() {

    const search =
        document
            .getElementById(
                "adminCustomerSearch"
            )
            ?.value
            .trim() ||
        "";


    await loadAdminCustomers(
        search
    );
}


/* =========================================================
   API ERROR
   ========================================================= */

function getAdminCustomerActionError(
    error,
    action
) {

    /*
     * Active future bookings.
     *
     * BRD requires deactivation to
     * be rejected in this situation.
     */

    if (
        action === "deactivate" &&
        (
            error.status === 400 ||
            error.status === 409
        )
    ) {

        return (
            getAdminCustomerValidationMessage(
                error
            ) ||
            "This customer cannot be deactivated because they have active future bookings. Cancel or transfer those bookings first."
        );
    }


    if (error.status === 403) {

        return (
            error.message ||
            "Administrator permission is required for this action."
        );
    }


    if (error.status === 404) {

        return (
            error.message ||
            "The customer account could not be found."
        );
    }


    return (
        getAdminCustomerValidationMessage(
            error
        ) ||
        error.message ||
        `Unable to ${action} this customer.`
    );
}


/* =========================================================
   ASP.NET VALIDATION ERRORS
   ========================================================= */

function getAdminCustomerValidationMessage(
    error
) {

    if (
        !error?.data?.errors
    ) {

        return null;
    }


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


    return messages.length > 0
        ? messages.join(" ")
        : null;
}


/* =========================================================
   CUSTOMER ID
   ========================================================= */

function getAdminCustomerId(
    customer
) {

    return (

        customer.customerId ||

        customer.CustomerId ||

        customer.id ||

        customer.Id ||

        null
    );
}


/* =========================================================
   NAME
   ========================================================= */

function getAdminCustomerName(
    customer
) {

    return String(

        customer.name ||

        customer.Name ||

        customer.fullName ||

        customer.FullName ||

        "Customer"
    );
}


/* =========================================================
   EMAIL
   ========================================================= */

function getAdminCustomerEmail(
    customer
) {

    return String(

        customer.email ||

        customer.Email ||

        ""
    );
}


/* =========================================================
   PHONE
   ========================================================= */

function getAdminCustomerPhone(
    customer
) {

    return String(

        customer.phone ||

        customer.Phone ||

        customer.phoneNumber ||

        customer.PhoneNumber ||

        ""
    );
}


/* =========================================================
   ACTIVE STATUS
   ========================================================= */

function getAdminCustomerIsActive(
    customer
) {

    if (
        customer.isActive !== undefined
    ) {

        return Boolean(
            customer.isActive
        );
    }


    if (
        customer.IsActive !== undefined
    ) {

        return Boolean(
            customer.IsActive
        );
    }


    if (
        customer.active !== undefined
    ) {

        return Boolean(
            customer.active
        );
    }


    const status =
        String(
            customer.status ||
            customer.Status ||
            "Active"
        )
            .trim()
            .toLowerCase();


    return !(
        status === "inactive" ||
        status === "deactivated" ||
        status === "disabled"
    );
}


/* =========================================================
   EMAIL VERIFIED
   ========================================================= */

function getAdminCustomerEmailVerified(
    customer
) {

    const value =

        customer.emailVerified ??

        customer.EmailVerified ??

        customer.isEmailVerified ??

        customer.IsEmailVerified ??
        false;


    if (
        typeof value === "string"
    ) {

        return (
            value.toLowerCase() ===
            "true"
        );
    }


    return Boolean(value);
}


/* =========================================================
   INITIAL
   ========================================================= */

function getAdminCustomerInitial(
    name
) {

    const cleanName =
        String(name || "")
            .trim();


    return cleanName
        ? cleanName
            .charAt(0)
            .toUpperCase()
        : "C";
}


/* =========================================================
   RESULT COUNT
   ========================================================= */

function updateAdminCustomerResultCount(
    count
) {

    const element =
        document.getElementById(
            "adminCustomerResultCount"
        );


    if (!element) {

        return;
    }


    element.textContent =
        count === 1
            ? "1 customer"
            : `${count} customers`;
}


/* =========================================================
   TEXT
   ========================================================= */

function setAdminCustomerText(
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

function showAdminCustomersLoading() {

    const loading =
        document.getElementById(
            "adminCustomersLoading"
        );


    const table =
        document.getElementById(
            "adminCustomersTableContainer"
        );


    const empty =
        document.getElementById(
            "adminCustomersEmpty"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );
    }


    if (table) {

        table.classList.add(
            "hidden"
        );
    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );
    }
}


function hideAdminCustomersLoading() {

    const loading =
        document.getElementById(
            "adminCustomersLoading"
        );


    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showAdminCustomersMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "adminCustomersMessage"
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


function clearAdminCustomersMessage() {

    const element =
        document.getElementById(
            "adminCustomersMessage"
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

function escapeAdminCustomerHtml(
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
