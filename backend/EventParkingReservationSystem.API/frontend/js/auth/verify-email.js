/* =========================================================
   Event & Parking Reservation System
   Email Verification
   ========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeVerificationPage();

        initializeResendForm();
    }
);


/* =========================================================
   START VERIFICATION
   ========================================================= */

function initializeVerificationPage() {

    initializeVerificationButtons();


    const token =
        getVerificationToken();


    /*
     * No token in URL
     */

    if (!token) {

        showVerificationError(
            "No verification token was provided. Please use the verification link sent to your email."
        );

        return;
    }


    verifyEmailToken(
        token
    );
}


/* =========================================================
   GET TOKEN FROM URL
   ========================================================= */

function getVerificationToken() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        "token"
    );
}


/* =========================================================
   VERIFY EMAIL
   ========================================================= */

async function verifyEmailToken(
    token
) {

    showVerificationLoading();


    try {

        /*
         * BRD Endpoint:
         *
         * GET /api/auth/verify-email?token=
         */

        await apiGet(
            `/auth/verify-email?token=${encodeURIComponent(token)}`
        );


        showVerificationSuccess();


    } catch (error) {

        console.error(
            "Email Verification Error:",
            error
        );


        handleVerificationError(
            error
        );
    }
}


/* =========================================================
   ERROR HANDLING
   ========================================================= */

function handleVerificationError(
    error
) {

    let message =
        error.message ||
        "This verification link is invalid or has expired.";


    /*
     * Common backend validation responses
     */

    if (error.status === 400) {

        message =
            error.message ||
            "This verification link is invalid or has expired.";
    }


    if (error.status === 404) {

        message =
            error.message ||
            "The verification token could not be found.";
    }


    if (error.status === 409) {

        message =
            error.message ||
            "This verification link has already been used.";
    }


    showVerificationError(
        message
    );
}


/* =========================================================
   STATE MANAGEMENT
   ========================================================= */

function hideAllVerificationStates() {

    const stateIds = [

        "verificationLoading",

        "verificationSuccess",

        "verificationError",

        "resendVerificationSection"
    ];


    stateIds.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.classList.add(
                    "hidden"
                );
            }
        }
    );
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function showVerificationLoading() {

    hideAllVerificationStates();


    const loading =
        document.getElementById(
            "verificationLoading"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   SUCCESS STATE
   ========================================================= */

function showVerificationSuccess() {

    hideAllVerificationStates();


    const success =
        document.getElementById(
            "verificationSuccess"
        );


    if (success) {

        success.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showVerificationError(
    message
) {

    hideAllVerificationStates();


    const errorSection =
        document.getElementById(
            "verificationError"
        );


    const errorMessage =
        document.getElementById(
            "verificationErrorMessage"
        );


    if (errorMessage) {

        errorMessage.textContent =
            message;
    }


    if (errorSection) {

        errorSection.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   BUTTONS
   ========================================================= */

function initializeVerificationButtons() {

    const showResendButton =
        document.getElementById(
            "showResendButton"
        );


    const backButton =
        document.getElementById(
            "backToVerificationError"
        );


    if (showResendButton) {

        showResendButton.addEventListener(
            "click",
            showResendVerificationForm
        );
    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                showVerificationError(
                    "This verification link may be invalid or expired."
                );
            }
        );
    }
}


/* =========================================================
   SHOW RESEND FORM
   ========================================================= */

function showResendVerificationForm() {

    hideAllVerificationStates();


    clearResendMessage();

    clearResendValidation();


    const section =
        document.getElementById(
            "resendVerificationSection"
        );


    if (section) {

        section.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   INITIALIZE RESEND FORM
   ========================================================= */

function initializeResendForm() {

    const form =
        document.getElementById(
            "resendVerificationForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        handleResendVerification
    );
}


/* =========================================================
   RESEND VERIFICATION
   ========================================================= */

async function handleResendVerification(
    event
) {

    event.preventDefault();


    clearResendMessage();

    clearResendValidation();


    const email =
        document
            .getElementById(
                "resendEmail"
            )
            .value
            .trim();


    if (!validateResendEmail(email)) {
        return;
    }


    setResendLoading(true);


    try {

        /*
         * BRD Endpoint:
         *
         * POST /api/auth/resend-verification
         */

        await apiPost(
            "/auth/resend-verification",
            {
                email: email
            }
        );


        showResendMessage(
            "A new verification email has been sent. Please check your inbox.",
            "success"
        );


        document
            .getElementById(
                "resendVerificationForm"
            )
            .reset();


    } catch (error) {

        showResendMessage(
            error.message ||
            "Unable to send a new verification email. Please try again.",
            "error"
        );


    } finally {

        setResendLoading(false);
    }
}


/* =========================================================
   VALIDATE EMAIL
   ========================================================= */

function validateResendEmail(
    email
) {

    const input =
        document.getElementById(
            "resendEmail"
        );


    const errorElement =
        document.getElementById(
            "resendEmailError"
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

function clearResendValidation() {

    const input =
        document.getElementById(
            "resendEmail"
        );


    const errorElement =
        document.getElementById(
            "resendEmailError"
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
   RESEND MESSAGE
   ========================================================= */

function showResendMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "resendMessage"
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
   CLEAR RESEND MESSAGE
   ========================================================= */

function clearResendMessage() {

    const messageElement =
        document.getElementById(
            "resendMessage"
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
   RESEND BUTTON LOADING
   ========================================================= */

function setResendLoading(
    loading
) {

    const button =
        document.getElementById(
            "resendButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.textContent =
        loading
            ? "Sending..."
            : "Send Verification Email";
}
