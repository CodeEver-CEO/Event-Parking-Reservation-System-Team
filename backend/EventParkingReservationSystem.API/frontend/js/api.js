/* =========================================================
   Event & Parking Reservation System
   Shared API Helper
   FINAL HARDENED VERSION
   ========================================================= */


/* =========================================================
   TOKEN
   ========================================================= */

function getAuthToken() {

    return localStorage.getItem(
        APP_CONFIG.STORAGE_KEYS.TOKEN
    );
}


/* =========================================================
   PUBLIC ENDPOINT CHECK
   ========================================================= */

function isPublicApiEndpoint(endpoint) {

    const cleanEndpoint =
        String(endpoint || "")
            .split("?")[0]
            .toLowerCase();


    const publicEndpoints = [

        "/auth/login",

        "/auth/verify-email",

        "/auth/resend-verification",

        "/auth/forgot-password",

        "/auth/reset-password",

        "/customers/register"

    ];


    return publicEndpoints.includes(
        cleanEndpoint
    );
}


/* =========================================================
   HEADERS
   ========================================================= */

function buildHeaders(
    endpoint,
    customHeaders = {},
    hasFormData = false
) {

    const headers = {
        ...customHeaders
    };


    if (!hasFormData) {

        headers["Content-Type"] =
            "application/json";
    }


    const token =
        getAuthToken();


    if (
        token &&
        !isPublicApiEndpoint(endpoint)
    ) {

        headers["Authorization"] =
            `Bearer ${token}`;
    }


    return headers;
}


/* =========================================================
   VALIDATION ERROR EXTRACTION
   ========================================================= */

function extractApiValidationErrors(data) {

    if (!data?.errors) {

        return null;
    }


    const messages =
        [];


    Object.values(
        data.errors
    )
        .forEach(
            function (items) {

                if (
                    Array.isArray(items)
                ) {

                    items.forEach(
                        function (message) {

                            if (message) {

                                messages.push(
                                    String(message)
                                );
                            }
                        }
                    );


                } else if (items) {

                    messages.push(
                        String(items)
                    );
                }
            }
        );


    return messages.length > 0
        ? messages.join(" ")
        : null;
}


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function getApiErrorMessage(
    data,
    status
) {

    const validationMessage =
        extractApiValidationErrors(
            data
        );


    if (validationMessage) {

        return validationMessage;
    }


    const serverMessage =

        data?.message ||

        data?.Message ||

        data?.title ||

        data?.Title ||

        data?.detail ||

        data?.Detail;


    if (serverMessage) {

        return String(
            serverMessage
        );
    }


    switch (status) {

        case 400:

            return (
                "The request contains invalid information. " +
                "Please review the entered details."
            );


        case 401:

            return (
                "Your session is not valid or has expired. " +
                "Please sign in again."
            );


        case 403:

            return (
                "You do not have permission to perform this action."
            );


        case 404:

            return (
                "The requested information could not be found."
            );


        case 409:

            return (
                "The request conflicts with the latest server data. " +
                "Please refresh and try again."
            );


        case 500:

            return (
                "The server encountered an error. " +
                "Please try again later."
            );


        default:

            return (
                "Something went wrong. Please try again."
            );
    }
}


/* =========================================================
   CLEAR AUTH ON 401
   ========================================================= */

function clearApiAuthentication() {

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
}


/* =========================================================
   HANDLE UNAUTHORIZED
   ========================================================= */

function handleApiUnauthorized() {

    clearApiAuthentication();


    /*
     * common.js provides the global
     * protected-route redirect handler.
     */

    if (
        typeof window.handleAppUnauthorized ===
        "function"
    ) {

        window.handleAppUnauthorized();


    } else {

        window.dispatchEvent(
            new CustomEvent(
                "app:unauthorized"
            )
        );
    }
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const cleanEndpoint =
        String(endpoint || "")
            .startsWith("/")
            ? String(endpoint)
            : `/${endpoint}`;


    const url =
        `${APP_CONFIG.API_BASE_URL}${cleanEndpoint}`;


    const isFormData =
        options.body instanceof FormData;


    const requestOptions = {

        ...options,

        headers:
            buildHeaders(
                cleanEndpoint,
                options.headers || {},
                isFormData
            )
    };


    try {

        const response =
            await fetch(
                url,
                requestOptions
            );


        /*
         * 204 No Content
         */

        if (
            response.status ===
            204
        ) {

            return null;
        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data =
            null;


        /*
         * JSON
         */

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            try {

                data =
                    await response.json();

            } catch (jsonError) {

                console.warn(
                    "API returned invalid JSON:",
                    jsonError
                );


                data =
                    null;
            }


        } else {

            /*
             * Plain text response
             */

            const text =
                await response.text();


            data =
                text
                    ? {
                        message:
                            text
                      }
                    : null;
        }


        /* =================================================
           ERROR RESPONSE
           ================================================= */

        if (!response.ok) {

            /*
             * 401
             *
             * Only clear an existing authenticated
             * session. A normal failed login should
             * simply return the login error.
             */

            if (
                response.status ===
                    401 &&
                getAuthToken() &&
                !isPublicApiEndpoint(
                    cleanEndpoint
                )
            ) {

                handleApiUnauthorized();
            }


            const errorMessage =
                getApiErrorMessage(
                    data,
                    response.status
                );


            const error =
                new Error(
                    errorMessage
                );


            error.status =
                response.status;


            error.data =
                data;


            error.endpoint =
                cleanEndpoint;


            throw error;
        }


        return data;


    } catch (error) {

        /*
         * Already an API HTTP error.
         */

        if (error.status) {

            console.error(
                `API ${error.status}:`,
                cleanEndpoint,
                error
            );


            throw error;
        }


        /*
         * Browser/network/CORS/server unavailable.
         */

        console.error(
            "API Network Error:",
            cleanEndpoint,
            error
        );


        const networkError =
            new Error(
                "Unable to connect to the server. " +
                "Check that the backend is running, " +
                "the API URL is correct, and CORS is configured."
            );


        networkError.status =
            0;


        networkError.originalError =
            error;


        throw networkError;
    }
}


/* =========================================================
   GET
   ========================================================= */

async function apiGet(
    endpoint
) {

    return apiRequest(
        endpoint,
        {
            method:
                "GET"
        }
    );
}


/* =========================================================
   POST
   ========================================================= */

async function apiPost(
    endpoint,
    data = null
) {

    return apiRequest(
        endpoint,
        {
            method:
                "POST",

            body:
                data !== null
                    ? JSON.stringify(
                        data
                    )
                    : null
        }
    );
}


/* =========================================================
   PUT
   ========================================================= */

async function apiPut(
    endpoint,
    data = null
) {

    return apiRequest(
        endpoint,
        {
            method:
                "PUT",

            body:
                data !== null
                    ? JSON.stringify(
                        data
                    )
                    : null
        }
    );
}


/* =========================================================
   DELETE
   ========================================================= */

async function apiDelete(
    endpoint
) {

    return apiRequest(
        endpoint,
        {
            method:
                "DELETE"
        }
    );
}