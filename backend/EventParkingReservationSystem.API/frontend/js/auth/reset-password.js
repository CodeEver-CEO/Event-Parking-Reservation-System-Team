/* =========================================================
   Event & Parking Reservation System
   Reset Password
   ========================================================= */


let resetToken = null;


document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeResetPasswordPage();

        initializeResetPasswordForm();

        initializeResetPasswordToggles();
    }
);


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

function initializeResetPasswordPage() {

    resetToken =
        getResetPasswordToken();


    /*
     * User opened page without reset token
     */

    if (!resetToken) {

        showResetTokenError(
            "No password reset token was provided. Please request a new password reset link."
        );
    }
}


/* =========================================================
   GET TOKEN FROM URL
   ========================================================= */

function getResetPasswordToken() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );


    return parameters.get(
        "token"
    );
}


/* =========================================================
   INITIALIZE FORM
   ========================================================= */

function initializeResetPasswordForm() {

    const form =
        document.getElementById(
            "resetPasswordForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        handleResetPassword
    );
}


/* =========================================================
   HANDLE RESET PASSWORD
   ========================================================= */

async function handleResetPassword(
    event
) {

    event.preventDefault();


    clearResetPasswordMessage();

    clearResetPasswordValidation();


    /*
     * Token required
     */

    if (!resetToken) {

        showResetTokenError(
            "This password reset link is invalid."
        );

        return;
    }


    const newPassword =
        document
            .getElementById(
                "newPassword"
            )
            .value;


    const confirmPassword =
        document
            .getElementById(
                "confirmNewPassword"
            )
            .value;



    const valid =
        validateResetPassword(
            newPassword,
            confirmPassword
        );


    if (!valid) {
        return;
    }


    setResetPasswordLoading(true);


    try {

        /*
         * BRD Endpoint:
         *
         * POST /api/auth/reset-password
         *
         * Frontend assumes backend DTO:
         *
         * {
         *     token: "...",
         *     newPassword: "..."
         * }
         */

        await apiPost(
            "/auth/reset-password",
            {
                token: resetToken,

                newPassword: newPassword
            }
        );


        showResetPasswordSuccess();


    } catch (error) {

        console.error(
            "Reset Password Error:",
            error
        );


        handleResetPasswordError(
            error
        );


    } finally {

        setResetPasswordLoading(false);
    }
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateResetPassword(
    newPassword,
    confirmPassword
) {

    let valid = true;


    /* New Password */

    if (!newPassword) {

        showResetFieldError(
            "newPassword",
            "newPasswordError",
            "New password is required."
        );

        valid = false;

    } else if (
        newPassword.length < 8
    ) {

        showResetFieldError(
            "newPassword",
            "newPasswordError",
            "Password must contain at least 8 characters."
        );

        valid = false;
    }


    /* Confirm Password */

    if (!confirmPassword) {

        showResetFieldError(
            "confirmNewPassword",
            "confirmNewPasswordError",
            "Please confirm your new password."
        );

        valid = false;

    } else if (
        newPassword !==
        confirmPassword
    ) {

        showResetFieldError(
            "confirmNewPassword",
            "confirmNewPasswordError",
            "Passwords do not match."
        );

        valid = false;
    }


    return valid;
}


/* =========================================================
   FIELD ERROR
   ========================================================= */

function showResetFieldError(
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
   CLEAR VALIDATION
   ========================================================= */

function clearResetPasswordValidation() {

    const inputs = [
        "newPassword",
        "confirmNewPassword"
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
        "newPasswordError",
        "confirmNewPasswordError"
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
   RESET PASSWORD ERROR HANDLING
   ========================================================= */

function handleResetPasswordError(
    error
) {

    let message =
        error.message ||
        "Unable to reset your password.";


    /*
     * Invalid / Expired token
     */

    if (
        error.status === 400 ||
        error.status === 404 ||
        error.status === 409
    ) {

        showResetTokenError(
            message
        );

        return;
    }


    showResetPasswordMessage(
        message,
        "error"
    );
}


/* =========================================================
   FORM MESSAGE
   ========================================================= */

function showResetPasswordMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "resetPasswordMessage"
        );


    if (!element) {
        return;
    }


    element.className =
        "alert";


    if (
        type === "success"
    ) {

        element.classList.add(
            "alert-success"
        );

    } else {

        element.classList.add(
            "alert-error"
        );
    }


    element.textContent =
        message;


    element.classList.remove(
        "hidden"
    );
}


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

function clearResetPasswordMessage() {

    const element =
        document.getElementById(
            "resetPasswordMessage"
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
   SUCCESS STATE
   ========================================================= */

function showResetPasswordSuccess() {

    const formSection =
        document.getElementById(
            "resetPasswordFormSection"
        );


    const successSection =
        document.getElementById(
            "resetPasswordSuccess"
        );


    const tokenErrorSection =
        document.getElementById(
            "resetPasswordTokenError"
        );


    if (formSection) {

        formSection.classList.add(
            "hidden"
        );
    }


    if (tokenErrorSection) {

        tokenErrorSection.classList.add(
            "hidden"
        );
    }


    if (successSection) {

        successSection.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   TOKEN ERROR STATE
   ========================================================= */

function showResetTokenError(
    message
) {

    const formSection =
        document.getElementById(
            "resetPasswordFormSection"
        );


    const successSection =
        document.getElementById(
            "resetPasswordSuccess"
        );


    const tokenErrorSection =
        document.getElementById(
            "resetPasswordTokenError"
        );


    const messageElement =
        document.getElementById(
            "resetTokenErrorMessage"
        );


    if (formSection) {

        formSection.classList.add(
            "hidden"
        );
    }


    if (successSection) {

        successSection.classList.add(
            "hidden"
        );
    }


    if (messageElement) {

        messageElement.textContent =
            message;
    }


    if (tokenErrorSection) {

        tokenErrorSection.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   BUTTON LOADING
   ========================================================= */

function setResetPasswordLoading(
    loading
) {

    const button =
        document.getElementById(
            "resetPasswordButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.textContent =
        loading
            ? "Resetting Password..."
            : "Reset Password";
}


/* =========================================================
   PASSWORD TOGGLES
   ========================================================= */

function initializeResetPasswordToggles() {

    setupResetPasswordToggle(
        "newPassword",
        "newPasswordToggle"
    );


    setupResetPasswordToggle(
        "confirmNewPassword",
        "confirmNewPasswordToggle"
    );
}


function setupResetPasswordToggle(
    inputId,
    buttonId
) {

    const input =
        document.getElementById(
            inputId
        );


    const button =
        document.getElementById(
            buttonId
        );


    if (
        !input ||
        !button
    ) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            const hidden =
                input.type ===
                "password";


            input.type =
                hidden
                    ? "text"
                    : "password";


            button.textContent =
                hidden
                    ? "Hide"
                    : "Show";
        }
    );
}
