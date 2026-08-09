/* =========================================================
   Event & Parking Reservation System
   Login
   ========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeLoginForm();

        initializeLoginPasswordToggle();

        initializeResendVerification();

        checkExistingLogin();
    }
);


/* =========================================================
   INITIALIZE LOGIN FORM
   ========================================================= */

function initializeLoginForm() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );


    if (!loginForm) {
        return;
    }


    loginForm.addEventListener(
        "submit",
        handleLogin
    );
}


/* =========================================================
   HANDLE LOGIN
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    clearLoginMessage();

    hideVerificationWarning();

    clearLoginValidationErrors();


    /* Get Values */

    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    const rememberMe =
        document
            .getElementById("rememberMe")
            .checked;



    /* Validate */

    const valid =
        validateLoginForm(
            email,
            password
        );


    if (!valid) {
        return;
    }



    const loginData = {

        email: email,

        password: password
    };


    setLoginLoading(true);


    try {

        /*
         * IMPORTANT:
         * Backend endpoint must match your API.
         *
         * Expected:
         * POST /api/auth/login
         */

        const response =
            await apiPost(
                "/auth/login",
                loginData
            );


        processSuccessfulLogin(
            response,
            rememberMe
        );


    } catch (error) {

        handleLoginError(
            error,
            email
        );


    } finally {

        setLoginLoading(false);
    }
}


/* =========================================================
   VALIDATE LOGIN
   ========================================================= */

function validateLoginForm(
    email,
    password
) {

    let valid = true;


    /* Email */

    if (!email) {

        showLoginFieldError(
            "email",
            "emailError",
            "Email address is required."
        );

        valid = false;

    } else if (!isLoginEmailValid(email)) {

        showLoginFieldError(
            "email",
            "emailError",
            "Please enter a valid email address."
        );

        valid = false;
    }


    /* Password */

    if (!password) {

        showLoginFieldError(
            "password",
            "passwordError",
            "Password is required."
        );

        valid = false;
    }


    return valid;
}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isLoginEmailValid(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return emailPattern.test(
        email
    );
}


/* =========================================================
   SUCCESSFUL LOGIN
   ========================================================= */

function processSuccessfulLogin(
    response,
    rememberMe
) {

    /*
     * Backend response property names may differ.
     *
     * This frontend accepts common names:
     *
     * token
     * accessToken
     *
     * role
     * userRole
     *
     * customerId
     * userId
     *
     * name
     * fullName
     */


    const token =
        response?.token ||
        response?.accessToken ||
        response?.data?.token ||
        response?.data?.accessToken;


    const role =
        response?.role ||
        response?.userRole ||
        response?.data?.role ||
        response?.data?.userRole;


    const customerId =
        response?.customerId ||
        response?.userId ||
        response?.data?.customerId ||
        response?.data?.userId ||
        null;


    const name =
        response?.name ||
        response?.fullName ||
        response?.data?.name ||
        response?.data?.fullName ||
        "User";


    const email =
        response?.email ||
        response?.data?.email ||
        document
            .getElementById("email")
            .value
            .trim();



    /*
     * A token is required for authenticated API calls.
     */

    if (!token) {

        showLoginMessage(
            "Login response did not contain an authentication token. Please check the backend login response.",
            "error"
        );

        console.error(
            "Login response:",
            response
        );

        return;
    }



    /*
     * Role is required for Customer/Admin redirect.
     */

    if (!role) {

        showLoginMessage(
            "Login succeeded but no user role was returned. Please check the backend login response.",
            "error"
        );

        console.error(
            "Login response:",
            response
        );

        return;
    }



    /* Store Token */

    localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.TOKEN,
        token
    );


    /* Store Role */

    localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.ROLE,
        role
    );


    /* Store Customer ID if available */

    if (customerId !== null) {

        localStorage.setItem(
            APP_CONFIG.STORAGE_KEYS.CUSTOMER_ID,
            customerId
        );

    } else {

        localStorage.removeItem(
            APP_CONFIG.STORAGE_KEYS.CUSTOMER_ID
        );
    }



    /* Store Basic User Details */

    const user = {

        name: name,

        email: email,

        customerId: customerId,

        role: role
    };


    localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.USER,
        JSON.stringify(user)
    );



    /*
     * Remember Me:
     *
     * At this stage authentication uses localStorage,
     * so browser refresh will preserve login anyway.
     *
     * We store this preference for future handling.
     */

    localStorage.setItem(
        "eventParkingRememberMe",
        rememberMe.toString()
    );



    showLoginMessage(
        "Login successful. Redirecting...",
        "success"
    );


    redirectUserByRole(
        role
    );
}


/* =========================================================
   ROLE BASED REDIRECT
   ========================================================= */

function redirectUserByRole(role) {

    const normalizedRole =
        String(role)
            .trim()
            .toLowerCase();


    setTimeout(
        function () {


            /* CUSTOMER */

            if (
                normalizedRole === "customer"
            ) {

                window.location.href =
                    "../customer/dashboard.html";

                return;
            }



            /* ADMIN */

            if (
                normalizedRole === "admin" ||
                normalizedRole === "administrator"
            ) {

                window.location.href =
                    "../admin/dashboard.html";

                return;
            }



            /*
             * Unknown Role
             */

            showLoginMessage(
                "Your account role is not recognized.",
                "error"
            );


        },
        700
    );
}


/* =========================================================
   LOGIN ERROR HANDLING
   ========================================================= */

function handleLoginError(
    error,
    email
) {

    console.error(
        "Login Error:",
        error
    );


    let message =
        error.message ||
        "Unable to login. Please try again.";



    /*
     * 401 Unauthorized
     *
     * Usually wrong email/password.
     */

    if (error.status === 401) {

        message =
            error.message ||
            "Invalid email or password.";
    }



    /*
     * 403 Forbidden
     *
     * BRD:
     * - Email not verified
     * - Customer account deactivated
     */

    if (error.status === 403) {

        const serverMessage =
            String(
                error.message || ""
            ).toLowerCase();


        /* Email not verified */

        if (
            serverMessage.includes("verify") ||
            serverMessage.includes("verified") ||
            serverMessage.includes("verification")
        ) {

            showVerificationWarning(
                email
            );


            showLoginMessage(
                error.message ||
                "Please verify your email before logging in.",
                "error"
            );


            return;
        }



        /* Deactivated account */

        if (
            serverMessage.includes("deactivated") ||
            serverMessage.includes("inactive") ||
            serverMessage.includes("disabled")
        ) {

            showLoginMessage(
                error.message ||
                "This account is currently deactivated. Please contact the administrator.",
                "error"
            );


            return;
        }



        message =
            error.message ||
            "You do not have permission to access this account.";
    }



    /*
     * 400 Bad Request
     */

    if (error.status === 400) {

        message =
            error.message ||
            "Please check your login details.";
    }



    showLoginMessage(
        message,
        "error"
    );
}


/* =========================================================
   FIELD ERROR
   ========================================================= */

function showLoginFieldError(
    inputId,
    errorId,
    message
) {

    const input =
        document.getElementById(
            inputId
        );


    const errorElement =
        document.getElementById(
            errorId
        );


    if (input) {

        input.classList.add(
            "input-error"
        );
    }


    if (errorElement) {

        errorElement.textContent =
            message;
    }
}


/* =========================================================
   CLEAR VALIDATION ERRORS
   ========================================================= */

function clearLoginValidationErrors() {

    const inputs = [
        "email",
        "password"
    ];


    inputs.forEach(
        function (inputId) {

            const input =
                document.getElementById(
                    inputId
                );


            if (input) {

                input.classList.remove(
                    "input-error"
                );
            }
        }
    );


    const errors = [
        "emailError",
        "passwordError"
    ];


    errors.forEach(
        function (errorId) {

            const errorElement =
                document.getElementById(
                    errorId
                );


            if (errorElement) {

                errorElement.textContent =
                    "";
            }
        }
    );
}


/* =========================================================
   LOGIN MESSAGE
   ========================================================= */

function showLoginMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "loginMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.className =
        "alert";


    if (type === "success") {

        messageElement.classList.add(
            "alert-success"
        );

    } else {

        messageElement.classList.add(
            "alert-error"
        );
    }


    messageElement.textContent =
        message;


    messageElement.classList.remove(
        "hidden"
    );
}


/* =========================================================
   CLEAR LOGIN MESSAGE
   ========================================================= */

function clearLoginMessage() {

    const messageElement =
        document.getElementById(
            "loginMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.textContent =
        "";


    messageElement.className =
        "alert hidden";
}


/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setLoginLoading(
    loading
) {

    const button =
        document.getElementById(
            "loginButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.textContent =
        loading
            ? "Logging in..."
            : "Login";
}


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

function initializeLoginPasswordToggle() {

    const passwordInput =
        document.getElementById(
            "password"
        );


    const toggleButton =
        document.getElementById(
            "passwordToggle"
        );


    if (
        !passwordInput ||
        !toggleButton
    ) {
        return;
    }


    toggleButton.addEventListener(
        "click",
        function () {

            const currentlyHidden =
                passwordInput.type ===
                "password";


            passwordInput.type =
                currentlyHidden
                    ? "text"
                    : "password";


            toggleButton.textContent =
                currentlyHidden
                    ? "Hide"
                    : "Show";
        }
    );
}


/* =========================================================
   VERIFICATION WARNING
   ========================================================= */

function showVerificationWarning(
    email
) {

    const warning =
        document.getElementById(
            "verificationWarning"
        );


    if (!warning) {
        return;
    }


    warning.dataset.email =
        email;


    warning.classList.remove(
        "hidden"
    );
}


function hideVerificationWarning() {

    const warning =
        document.getElementById(
            "verificationWarning"
        );


    if (!warning) {
        return;
    }


    warning.classList.add(
        "hidden"
    );
}


/* =========================================================
   RESEND VERIFICATION
   ========================================================= */

function initializeResendVerification() {

    const button =
        document.getElementById(
            "resendVerificationButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        resendVerificationEmail
    );
}


async function resendVerificationEmail() {

    const warning =
        document.getElementById(
            "verificationWarning"
        );


    const button =
        document.getElementById(
            "resendVerificationButton"
        );


    const email =
        warning?.dataset?.email;


    if (!email) {

        showLoginMessage(
            "Please enter your email address first.",
            "error"
        );

        return;
    }


    button.disabled = true;

    button.textContent =
        "Sending...";


    try {

        /*
         * BRD endpoint:
         *
         * POST /api/auth/resend-verification
         */

        await apiPost(
            "/auth/resend-verification",
            {
                email: email
            }
        );


        showLoginMessage(
            "Verification email sent. Please check your inbox.",
            "success"
        );


    } catch (error) {

        showLoginMessage(
            error.message ||
            "Unable to resend the verification email.",
            "error"
        );


    } finally {

        button.disabled = false;

        button.textContent =
            "Resend verification email";
    }
}


/* =========================================================
   CHECK EXISTING LOGIN
   ========================================================= */

function checkExistingLogin() {

    const token =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.TOKEN
        );


    const role =
        localStorage.getItem(
            APP_CONFIG.STORAGE_KEYS.ROLE
        );


    /*
     * User already logged in.
     *
     * Redirect away from login page.
     */

    if (
        token &&
        role
    ) {

        redirectUserByRole(
            role
        );
    }
}
