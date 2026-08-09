/* =========================================================
   Event & Parking Reservation System
   Forgot Password
   ========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeForgotPasswordForm();
    }
);


/* =========================================================
   INITIALIZE FORM
   ========================================================= */

function initializeForgotPasswordForm() {

    const form =
        document.getElementById(
            "forgotPasswordForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        handleForgotPassword
    );
}


/* =========================================================
   HANDLE SUBMIT
   ========================================================= */

async function handleForgotPassword(event) {

    event.preventDefault();


    clearForgotPasswordMessage();

    clearForgotPasswordValidation();


    const email =
        document
            .getElementById(
                "email"
            )
            .value
            .trim();


    if (!validateForgotPasswordEmail(email)) {
        return;
    }


    setForgotPasswordLoading(true);


    try {

        /*
         * BRD Endpoint:
         *
         * POST /api/auth/forgot-password
         */

        await apiPost(
            "/auth/forgot-password",
            {
                email: email
            }
        );


        /*
         * IMPORTANT SECURITY RULE:
         *
         * Same generic message whether
         * email exists or not.
         */

        showForgotPasswordMessage(
            "If an account exists for this email address, a password reset link has been sent.",
            "success"
        );


        document
            .getElementById(
                "forgotPasswordForm"
            )
            .reset();


    } catch (error) {

        /*
         * For normal API/network failures
         * we can still show a generic
         * technical error.
         */

        showForgotPasswordMessage(
            error.message ||
            "Unable to process your request. Please try again.",
            "error"
        );


    } finally {

        setForgotPasswordLoading(false);
    }
}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function validateForgotPasswordEmail(email) {

    const input =
        document.getElementById(
            "email"
        );


    const errorElement =
        document.getElementById(
            "emailError"
        );


    if (!email) {

        input.classList.add(
            "input-error"
        );


        errorElement.textContent =
            "Email address is required.";


        return false;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

        input.classList.add(
            "input-error"
        );


        errorElement.textContent =
            "Please enter a valid email address.";


        return false;
    }


    return true;
}


/* =========================================================
   CLEAR VALIDATION
   ========================================================= */

function clearForgotPasswordValidation() {

    const input =
        document.getElementById(
            "email"
        );


    const errorElement =
        document.getElementById(
            "emailError"
        );


    if (input) {

        input.classList.remove(
            "input-error"
        );
    }


    if (errorElement) {

        errorElement.textContent =
            "";
    }
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showForgotPasswordMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "forgotPasswordMessage"
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
   CLEAR MESSAGE
   ========================================================= */

function clearForgotPasswordMessage() {

    const messageElement =
        document.getElementById(
            "forgotPasswordMessage"
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

function setForgotPasswordLoading(
    loading
) {

    const button =
        document.getElementById(
            "forgotPasswordButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.textContent =
        loading
            ? "Sending..."
            : "Send Reset Link";
}
