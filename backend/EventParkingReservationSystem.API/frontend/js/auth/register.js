/* =========================================================
   Event & Parking Reservation System
   Customer Registration
   ========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeRegisterForm();

        initializePasswordToggles();
    }
);


/* =========================================================
   INITIALIZE FORM
   ========================================================= */

function initializeRegisterForm() {

    const registerForm =
        document.getElementById(
            "registerForm"
        );

    if (!registerForm) {
        return;
    }


    registerForm.addEventListener(
        "submit",
        handleRegistration
    );
}


/* =========================================================
   HANDLE REGISTRATION
   ========================================================= */

async function handleRegistration(event) {

    event.preventDefault();


    clearRegisterMessage();

    clearValidationErrors();


    /* Get Form Values */

    const fullName =
        document.getElementById(
            "fullName"
        ).value.trim();


    const email =
        document.getElementById(
            "email"
        ).value.trim();


    const phone =
        document.getElementById(
            "phone"
        ).value.trim();


    const password =
        document.getElementById(
            "password"
        ).value;


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        ).value;



    /* Client-side Validation */

    const isValid =
        validateRegistrationForm(
            fullName,
            email,
            phone,
            password,
            confirmPassword
        );


    if (!isValid) {
        return;
    }



    /* Data sent to Backend */

    const registrationData = {

        name: fullName,

        email: email,

        phone: phone,

        password: password
    };


    setRegisterLoading(true);


    try {

        await apiPost(
            "/customers/register",
            registrationData
        );


        showRegisterMessage(
            "Account created successfully. Please check your email and verify your account before logging in.",
            "success"
        );


        document
            .getElementById(
                "registerForm"
            )
            .reset();


        /*
         * Give the customer time to read
         * the success message.
         */

        setTimeout(
            function () {

                window.location.href =
                    "login.html";

            },
            3000
        );


    } catch (error) {

        handleRegistrationError(
            error
        );

    } finally {

        setRegisterLoading(false);
    }
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateRegistrationForm(
    fullName,
    email,
    phone,
    password,
    confirmPassword
) {

    let isValid = true;


    /* -------------------------
       Full Name
       ------------------------- */

    if (!fullName) {

        showFieldError(
            "fullName",
            "fullNameError",
            "Full name is required."
        );

        isValid = false;

    } else if (fullName.length < 2) {

        showFieldError(
            "fullName",
            "fullNameError",
            "Please enter a valid name."
        );

        isValid = false;
    }


    /* -------------------------
       Email
       ------------------------- */

    if (!email) {

        showFieldError(
            "email",
            "emailError",
            "Email address is required."
        );

        isValid = false;

    } else if (!isValidEmail(email)) {

        showFieldError(
            "email",
            "emailError",
            "Please enter a valid email address."
        );

        isValid = false;
    }


    /* -------------------------
       Phone
       ------------------------- */

    if (!phone) {

        showFieldError(
            "phone",
            "phoneError",
            "Phone number is required."
        );

        isValid = false;

    } else if (!isValidPhone(phone)) {

        showFieldError(
            "phone",
            "phoneError",
            "Please enter a valid phone number."
        );

        isValid = false;
    }


    /* -------------------------
       Password
       ------------------------- */

    if (!password) {

        showFieldError(
            "password",
            "passwordError",
            "Password is required."
        );

        isValid = false;

    } else if (password.length < 8) {

        showFieldError(
            "password",
            "passwordError",
            "Password must contain at least 8 characters."
        );

        isValid = false;
    }


    /* -------------------------
       Confirm Password
       ------------------------- */

    if (!confirmPassword) {

        showFieldError(
            "confirmPassword",
            "confirmPasswordError",
            "Please confirm your password."
        );

        isValid = false;

    } else if (
        password !==
        confirmPassword
    ) {

        showFieldError(
            "confirmPassword",
            "confirmPasswordError",
            "Passwords do not match."
        );

        isValid = false;
    }


    return isValid;
}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return emailPattern.test(
        email
    );
}


/* =========================================================
   PHONE VALIDATION
   ========================================================= */

function isValidPhone(phone) {

    /*
       Allows:
       0771234567
       +94771234567
       numbers with spaces / hyphens
    */

    const cleanedPhone =
        phone.replace(
            /[\s-]/g,
            ""
        );


    const phonePattern =
        /^\+?[0-9]{9,15}$/;


    return phonePattern.test(
        cleanedPhone
    );
}


/* =========================================================
   DISPLAY FIELD ERROR
   ========================================================= */

function showFieldError(
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

function clearValidationErrors() {

    const fields = [
        "fullName",
        "email",
        "phone",
        "password",
        "confirmPassword"
    ];


    fields.forEach(
        function (fieldId) {

            const input =
                document.getElementById(
                    fieldId
                );


            if (input) {

                input.classList.remove(
                    "input-error"
                );

                input.classList.remove(
                    "input-success"
                );
            }
        }
    );


    const errors = [
        "fullNameError",
        "emailError",
        "phoneError",
        "passwordError",
        "confirmPasswordError"
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
   REGISTER MESSAGE
   ========================================================= */

function showRegisterMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "registerMessage"
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
   CLEAR REGISTER MESSAGE
   ========================================================= */

function clearRegisterMessage() {

    const messageElement =
        document.getElementById(
            "registerMessage"
        );


    if (!messageElement) {
        return;
    }


    messageElement.classList.add(
        "hidden"
    );


    messageElement.textContent =
        "";
}


/* =========================================================
   API ERROR HANDLING
   ========================================================= */

function handleRegistrationError(
    error
) {

    let message =
        error.message ||
        "Unable to create your account.";


    /*
       409 Conflict could be returned
       when email already exists.
    */

    if (error.status === 409) {

        message =
            error.message ||
            "An account with this email already exists.";
    }


    if (error.status === 400) {

        message =
            error.message ||
            "Please check your details and try again.";
    }


    showRegisterMessage(
        message,
        "error"
    );
}


/* =========================================================
   BUTTON LOADING STATE
   ========================================================= */

function setRegisterLoading(
    isLoading
) {

    const registerButton =
        document.getElementById(
            "registerButton"
        );


    if (!registerButton) {
        return;
    }


    registerButton.disabled =
        isLoading;


    registerButton.textContent =
        isLoading
            ? "Creating Account..."
            : "Create Account";
}


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

function initializePasswordToggles() {

    setupPasswordToggle(
        "password",
        "passwordToggle"
    );


    setupPasswordToggle(
        "confirmPassword",
        "confirmPasswordToggle"
    );
}


function setupPasswordToggle(
    inputId,
    buttonId
) {

    const passwordInput =
        document.getElementById(
            inputId
        );


    const toggleButton =
        document.getElementById(
            buttonId
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

            const hidden =
                passwordInput.type ===
                "password";


            passwordInput.type =
                hidden
                    ? "text"
                    : "password";


            toggleButton.textContent =
                hidden
                    ? "Hide"
                    : "Show";
        }
    );
}
