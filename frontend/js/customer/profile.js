/* =========================================================
   Event & Parking Reservation System
   Customer Profile
   ========================================================= */


   let customerProfileId = null;

   let originalCustomerProfile = null;
   
   let profileEditMode = false;
   
   
   /* =========================================================
      START
      ========================================================= */
   
   document.addEventListener(
       "DOMContentLoaded",
       function () {
   
           initializeCustomerProfilePage();
       }
   );
   
   
   /* =========================================================
      INITIALIZE
      ========================================================= */
   
   async function initializeCustomerProfilePage() {
   
       if (!validateProfileAccess()) {
           return;
       }
   
   
       initializeProfileButtons();
   
   
       /*
        * Customer ID is NOT required to load
        * the profile because backend uses:
        *
        * GET /api/customers/me
        */
   
       customerProfileId =
           getProfileCustomerId();
   
   
       await loadCustomerProfile();
   }
   
   
   /* =========================================================
      ACCESS
      ========================================================= */
   
   function validateProfileAccess() {
   
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
   
   
       if (normalizedRole !== "customer") {
   
           window.location.href =
               "../auth/login.html";
   
           return false;
       }
   
   
       return true;
   }
   
   
   /* =========================================================
      CUSTOMER ID
      ========================================================= */
   
   function getProfileCustomerId() {
   
       const directId =
           localStorage.getItem(
               APP_CONFIG.STORAGE_KEYS.CUSTOMER_ID
           );
   
   
       if (directId) {
   
           return directId;
       }
   
   
       const storedUser =
           localStorage.getItem(
               APP_CONFIG.STORAGE_KEYS.USER
           );
   
   
       if (!storedUser) {
   
           return null;
       }
   
   
       try {
   
           const user =
               JSON.parse(
                   storedUser
               );
   
   
           return (
               user.customerId ||
               user.userId ||
               user.id ||
               null
           );
   
   
       } catch (error) {
   
           console.error(
               "Unable to read stored customer ID.",
               error
           );
   
   
           return null;
       }
   }
   
   
   /* =========================================================
      INITIALIZE BUTTONS
      ========================================================= */
   
   function initializeProfileButtons() {
   
       const editButton =
           document.getElementById(
               "editProfileButton"
           );
   
   
       const cancelButton =
           document.getElementById(
               "cancelProfileEditButton"
           );
   
   
       const form =
           document.getElementById(
               "profileForm"
           );
   
   
       if (editButton) {
   
           editButton.addEventListener(
               "click",
               enableProfileEdit
           );
       }
   
   
       if (cancelButton) {
   
           cancelButton.addEventListener(
               "click",
               cancelProfileEdit
           );
       }
   
   
       if (form) {
   
           form.addEventListener(
               "submit",
               updateCustomerProfile
           );
       }
   }
   
   
   /* =========================================================
      LOAD PROFILE
      ========================================================= */
   
   async function loadCustomerProfile() {
   
       clearProfileMessage();
   
       showProfileLoading();
   
   
       try {
   
           /*
            * Actual Backend Endpoint:
            *
            * GET /api/customers/me
            */
   
           const response =
               await apiGet(
                   "/customers/me"
               );
   
   
           originalCustomerProfile =
               normalizeCustomerProfile(
                   response
               );
   
   
           if (!originalCustomerProfile) {
   
               hideProfileLoading();
   
               showProfileNotFound();
   
               return;
           }
   
   
           /*
            * Get authoritative customer ID
            * from backend response.
            */
   
           customerProfileId =
               getCustomerProfileId(
                   originalCustomerProfile
               );
   
   
           saveCustomerId(
               customerProfileId
           );
   
   
           renderCustomerProfile(
               originalCustomerProfile
           );
   
   
           updateStoredCustomerProfile(
               originalCustomerProfile
           );
   
   
           disableProfileEdit();
   
   
           hideProfileLoading();
   
           showProfileContent();
   
   
       } catch (error) {
   
           console.error(
               "Profile Loading Error:",
               error
           );
   
   
           hideProfileLoading();
   
   
           if (error.status === 401) {
   
               showProfileMessage(
                   "Your session has expired. Please sign in again.",
                   "error"
               );
   
               return;
           }
   
   
           if (error.status === 403) {
   
               showProfileMessage(
                   "You are not authorized to view this profile.",
                   "error"
               );
   
               return;
           }
   
   
           if (error.status === 404) {
   
               showProfileNotFound();
   
               return;
           }
   
   
           showProfileMessage(
               error.message ||
               "Unable to load your profile.",
               "error"
           );
       }
   }
   
   
   /* =========================================================
      NORMALIZE PROFILE
      ========================================================= */
   
   function normalizeCustomerProfile(
       response
   ) {
   
       if (!response) {
   
           return null;
       }
   
   
       return (
           response.data ||
           response.customer ||
           response.profile ||
           response
       );
   }
   
   
   /* =========================================================
      RENDER PROFILE
      ========================================================= */
   
   function renderCustomerProfile(
       profile
   ) {
   
       const name =
           getCustomerProfileName(
               profile
           );
   
   
       const email =
           getCustomerProfileEmail(
               profile
           );
   
   
       const phone =
           getCustomerProfilePhone(
               profile
           );
   
   
       setProfileInputValue(
           "profileName",
           name
       );
   
   
       setProfileInputValue(
           "profileEmail",
           email
       );
   
   
       setProfileInputValue(
           "profilePhone",
           phone
       );
   
   
       setProfileText(
           "profileDisplayName",
           name
       );
   
   
       setProfileText(
           "profileDisplayEmail",
           email
       );
   
   
       setProfileText(
           "profileCustomerId",
           getCustomerProfileId(
               profile
           )
       );
   
   
       setProfileText(
           "profileAccountStatus",
           getCustomerAccountStatus(
               profile
           )
       );
   
   
       setProfileText(
           "profileEmailVerification",
           getCustomerEmailVerificationText(
               profile
           )
       );
   
   
       updateProfileAvatar(
           name
       );
   }
   
   
   /* =========================================================
      ENABLE EDIT
      ========================================================= */
   
   function enableProfileEdit() {
   
       profileEditMode =
           true;
   
   
       clearProfileValidation();
   
       clearProfileMessage();
   
   
       setProfileInputsDisabled(
           false
       );
   
   
       const editButton =
           document.getElementById(
               "editProfileButton"
           );
   
   
       const actions =
           document.getElementById(
               "profileFormActions"
           );
   
   
       if (editButton) {
   
           editButton.classList.add(
               "hidden"
           );
       }
   
   
       if (actions) {
   
           actions.classList.remove(
               "hidden"
           );
       }
   
   
       const nameInput =
           document.getElementById(
               "profileName"
           );
   
   
       if (nameInput) {
   
           nameInput.focus();
       }
   }
   
   
   /* =========================================================
      DISABLE EDIT
      ========================================================= */
   
   function disableProfileEdit() {
   
       profileEditMode =
           false;
   
   
       setProfileInputsDisabled(
           true
       );
   
   
       const editButton =
           document.getElementById(
               "editProfileButton"
           );
   
   
       const actions =
           document.getElementById(
               "profileFormActions"
           );
   
   
       if (editButton) {
   
           editButton.classList.remove(
               "hidden"
           );
       }
   
   
       if (actions) {
   
           actions.classList.add(
               "hidden"
           );
       }
   }
   
   
   /* =========================================================
      INPUT DISABLED
      ========================================================= */
   
   function setProfileInputsDisabled(
       disabled
   ) {
   
       const nameInput =
           document.getElementById(
               "profileName"
           );
   
   
       const emailInput =
           document.getElementById(
               "profileEmail"
           );
   
   
       const phoneInput =
           document.getElementById(
               "profilePhone"
           );
   
   
       /*
        * Name can be edited.
        */
   
       if (nameInput) {
   
           nameInput.disabled =
               disabled;
       }
   
   
       /*
        * Email is always read-only.
        *
        * Current backend profile update DTO
        * does not allow email changes.
        */
   
       if (emailInput) {
   
           emailInput.disabled =
               true;
       }
   
   
       /*
        * Phone can be edited.
        */
   
       if (phoneInput) {
   
           phoneInput.disabled =
               disabled;
       }
   }
   
   
   /* =========================================================
      CANCEL EDIT
      ========================================================= */
   
   function cancelProfileEdit() {
   
       if (!originalCustomerProfile) {
   
           return;
       }
   
   
       renderCustomerProfile(
           originalCustomerProfile
       );
   
   
       clearProfileValidation();
   
       clearProfileMessage();
   
   
       disableProfileEdit();
   }
   
   
   /* =========================================================
      UPDATE PROFILE
      ========================================================= */
   
   async function updateCustomerProfile(
       event
   ) {
   
       event.preventDefault();
   
   
       if (!profileEditMode) {
   
           return;
       }
   
   
       clearProfileMessage();
   
       clearProfileValidation();
   
   
       const nameInput =
           document.getElementById(
               "profileName"
           );
   
   
       const phoneInput =
           document.getElementById(
               "profilePhone"
           );
   
   
       if (
           !nameInput ||
           !phoneInput
       ) {
   
           showProfileMessage(
               "Profile form could not be loaded correctly.",
               "error"
           );
   
           return;
       }
   
   
       const name =
           nameInput.value.trim();
   
   
       const phone =
           phoneInput.value.trim();
   
   
       const valid =
           validateCustomerProfileForm(
               name,
               phone
           );
   
   
       if (!valid) {
   
           return;
       }
   
   
       const confirmed =
           await openConfirmationModal({
   
               title:
                   "Update Profile",
   
               message:
                   "Save these changes to your customer profile?",
   
               confirmText:
                   "Save Changes",
   
               cancelText:
                   "Review Again"
           });
   
   
       if (!confirmed) {
   
           return;
       }
   
   
       await submitCustomerProfileUpdate(
           name,
           phone
       );
   }
   
   
   /* =========================================================
      SUBMIT UPDATE
      ========================================================= */
   
   async function submitCustomerProfileUpdate(
       name,
       phone
   ) {
   
       setProfileSavingState(
           true
       );
   
   
       try {
   
           /*
            * Actual Backend Endpoint:
            *
            * PUT /api/customers/me
            *
            * Request:
            *
            * {
            *     name,
            *     phone
            * }
            */
   
           const response =
               await apiPut(
                   "/customers/me",
                   {
                       name:
                           name,
   
                       phone:
                           phone
                   }
               );
   
   
           /*
            * Some APIs may return updated
            * customer object.
            *
            * Some may return no content.
            */
   
           let updatedProfile =
               normalizeCustomerProfile(
                   response
               );
   
   
           /*
            * Re-fetch backend authoritative
            * profile if PUT returned no object.
            */
   
           if (!updatedProfile) {
   
               const refreshed =
                   await apiGet(
                       "/customers/me"
                   );
   
   
               updatedProfile =
                   normalizeCustomerProfile(
                       refreshed
                   );
           }
   
   
           /*
            * Safe fallback.
            */
   
           if (!updatedProfile) {
   
               updatedProfile = {
   
                   ...originalCustomerProfile,
   
                   name:
                       name,
   
                   phone:
                       phone
               };
           }
   
   
           originalCustomerProfile =
               updatedProfile;
   
   
           customerProfileId =
               getCustomerProfileId(
                   updatedProfile
               );
   
   
           saveCustomerId(
               customerProfileId
           );
   
   
           renderCustomerProfile(
               updatedProfile
           );
   
   
           updateStoredCustomerProfile(
               updatedProfile
           );
   
   
           disableProfileEdit();
   
   
           showProfileMessage(
               "Your profile was updated successfully.",
               "success"
           );
   
   
       } catch (error) {
   
           console.error(
               "Profile Update Error:",
               error
           );
   
   
           handleCustomerProfileUpdateError(
               error
           );
   
   
       } finally {
   
           setProfileSavingState(
               false
           );
       }
   }
   
   
   /* =========================================================
      VALIDATION
      ========================================================= */
   
   function validateCustomerProfileForm(
       name,
       phone
   ) {
   
       let valid =
           true;
   
   
       /* -------------------------
          Name
          ------------------------- */
   
       if (!name) {
   
           showProfileFieldError(
               "profileName",
               "profileNameError",
               "Full name is required."
           );
   
   
           valid =
               false;
   
       } else if (
           name.length < 2
       ) {
   
           showProfileFieldError(
               "profileName",
               "profileNameError",
               "Full name must contain at least 2 characters."
           );
   
   
           valid =
               false;
       }
   
   
       /* -------------------------
          Phone
          ------------------------- */
   
       const cleanedPhone =
           String(phone || "")
               .replace(
                   /[\s-]/g,
                   ""
               );
   
   
       const phonePattern =
           /^\+?[0-9]{9,15}$/;
   
   
       if (!phone) {
   
           showProfileFieldError(
               "profilePhone",
               "profilePhoneError",
               "Phone number is required."
           );
   
   
           valid =
               false;
   
       } else if (
           !phonePattern.test(
               cleanedPhone
           )
       ) {
   
           showProfileFieldError(
               "profilePhone",
               "profilePhoneError",
               "Please enter a valid phone number."
           );
   
   
           valid =
               false;
       }
   
   
       return valid;
   }
   
   
   /* =========================================================
      FIELD ERROR
      ========================================================= */
   
   function showProfileFieldError(
       inputId,
       errorId,
       message
   ) {
   
       const input =
           document.getElementById(
               inputId
           );
   
   
       const error =
           document.getElementById(
               errorId
           );
   
   
       if (input) {
   
           input.classList.add(
               "input-error"
           );
       }
   
   
       if (error) {
   
           error.textContent =
               message;
       }
   }
   
   
   /* =========================================================
      CLEAR VALIDATION
      ========================================================= */
   
   function clearProfileValidation() {
   
       const inputIds = [
   
           "profileName",
   
           "profilePhone"
   
       ];
   
   
       inputIds.forEach(
           function (id) {
   
               const input =
                   document.getElementById(
                       id
                   );
   
   
               if (input) {
   
                   input.classList.remove(
                       "input-error"
                   );
               }
           }
       );
   
   
       const errorIds = [
   
           "profileNameError",
   
           "profilePhoneError",
   
           "profileEmailError"
   
       ];
   
   
       errorIds.forEach(
           function (id) {
   
               const error =
                   document.getElementById(
                       id
                   );
   
   
               if (error) {
   
                   error.textContent =
                       "";
               }
           }
       );
   }
   
   
   /* =========================================================
      UPDATE ERROR
      ========================================================= */
   
   function handleCustomerProfileUpdateError(
       error
   ) {
   
       let message =
           getProfileApiErrorMessage(
               error
           );
   
   
       if (error.status === 400) {
   
           message =
               getProfileApiErrorMessage(
                   error
               );
       }
   
   
       if (error.status === 401) {
   
           message =
               "Your session has expired. Please login again.";
       }
   
   
       if (error.status === 403) {
   
           message =
               "You are not allowed to update this customer profile.";
       }
   
   
       if (error.status === 404) {
   
           message =
               "Customer profile could not be found.";
       }
   
   
       showProfileMessage(
           message,
           "error"
       );
   }
   
   
   /* =========================================================
      ASP.NET VALIDATION ERRORS
      ========================================================= */
   
   function getProfileApiErrorMessage(
       error
   ) {
   
       if (
           error?.data?.errors
       ) {
   
           const messages =
               [];
   
   
           Object.values(
               error.data.errors
           )
               .forEach(
                   function (items) {
   
                       if (
                           Array.isArray(
                               items
                           )
                       ) {
   
                           messages.push(
                               ...items
                           );
                       }
                   }
               );
   
   
           if (
               messages.length > 0
           ) {
   
               return messages.join(
                   " "
               );
           }
       }
   
   
       return (
           error?.message ||
           "Unable to update your profile."
       );
   }
   
   
   /* =========================================================
      SAVE CUSTOMER ID
      ========================================================= */
   
   function saveCustomerId(
       customerId
   ) {
   
       if (
           !customerId ||
           customerId === "-"
       ) {
   
           return;
       }
   
   
       localStorage.setItem(
           APP_CONFIG.STORAGE_KEYS.CUSTOMER_ID,
           customerId
       );
   }
   
   
   /* =========================================================
      UPDATE LOCAL STORAGE
      ========================================================= */
   
   function updateStoredCustomerProfile(
       profile
   ) {
   
       if (!profile) {
   
           return;
       }
   
   
       const key =
           APP_CONFIG.STORAGE_KEYS.USER;
   
   
       const stored =
           localStorage.getItem(
               key
           );
   
   
       let user = {};
   
   
       if (stored) {
   
           try {
   
               user =
                   JSON.parse(
                       stored
                   );
   
           } catch (error) {
   
               user = {};
           }
       }
   
   
       const name =
           getCustomerProfileName(
               profile
           );
   
   
       const email =
           getCustomerProfileEmail(
               profile
           );
   
   
       const id =
           getCustomerProfileId(
               profile
           );
   
   
       user.name =
           name;
   
   
       user.email =
           email;
   
   
       user.customerId =
           id;
   
   
       user.id =
           id;
   
   
       user.role =
           "Customer";
   
   
       localStorage.setItem(
           key,
           JSON.stringify(
               user
           )
       );
   
   
       /*
        * Update navbar immediately.
        */
   
       const navbarName =
           document.getElementById(
               "customerNavbarName"
           );
   
   
       if (navbarName) {
   
           navbarName.textContent =
               name;
       }
   }
   
   
   /* =========================================================
      PROFILE HELPERS
      ========================================================= */
   
   function getCustomerProfileId(
       profile
   ) {
   
       return (
           profile?.customerId ||
           profile?.CustomerId ||
           profile?.id ||
           profile?.Id ||
           customerProfileId ||
           "-"
       );
   }
   
   
   function getCustomerProfileName(
       profile
   ) {
   
       return String(
           profile?.name ||
           profile?.Name ||
           profile?.fullName ||
           profile?.FullName ||
           "Customer"
       );
   }
   
   
   function getCustomerProfileEmail(
       profile
   ) {
   
       return String(
           profile?.email ||
           profile?.Email ||
           ""
       );
   }
   
   
   function getCustomerProfilePhone(
       profile
   ) {
   
       return String(
           profile?.phone ||
           profile?.Phone ||
           profile?.phoneNumber ||
           profile?.PhoneNumber ||
           ""
       );
   }
   
   
   /* =========================================================
      ACCOUNT STATUS
      ========================================================= */
   
   function getCustomerAccountStatus(
       profile
   ) {
   
       if (
           profile?.isActive === false ||
           profile?.IsActive === false
       ) {
   
           return "Inactive";
       }
   
   
       const status =
           profile?.status ||
           profile?.Status;
   
   
       if (status) {
   
           return String(
               status
           );
       }
   
   
       return "Active";
   }
   
   
   /* =========================================================
      EMAIL VERIFICATION
      ========================================================= */
   
   function getCustomerEmailVerificationText(
       profile
   ) {
   
       const verified =
   
           profile?.emailVerified ??
   
           profile?.EmailVerified ??
   
           profile?.isEmailVerified ??
   
           profile?.IsEmailVerified ??
   
           null;
   
   
       if (verified === true) {
   
           return "Verified";
       }
   
   
       if (verified === false) {
   
           return "Not Verified";
       }
   
   
       return "Not available";
   }
   
   
   /* =========================================================
      AVATAR
      ========================================================= */
   
   function updateProfileAvatar(
       name
   ) {
   
       const element =
           document.getElementById(
               "profileAvatarInitial"
           );
   
   
       if (!element) {
   
           return;
       }
   
   
       const cleanedName =
           String(name || "")
               .trim();
   
   
       element.textContent =
           cleanedName
               ? cleanedName
                   .charAt(0)
                   .toUpperCase()
               : "C";
   }
   
   
   /* =========================================================
      SAVING
      ========================================================= */
   
   function setProfileSavingState(
       saving
   ) {
   
       const button =
           document.getElementById(
               "saveProfileButton"
           );
   
   
       if (!button) {
   
           return;
       }
   
   
       button.disabled =
           saving;
   
   
       button.textContent =
           saving
               ? "Saving Changes..."
               : "Save Changes";
   }
   
   
   /* =========================================================
      INPUT VALUE
      ========================================================= */
   
   function setProfileInputValue(
       id,
       value
   ) {
   
       const input =
           document.getElementById(
               id
           );
   
   
       if (input) {
   
           input.value =
               value ?? "";
       }
   }
   
   
   /* =========================================================
      TEXT
      ========================================================= */
   
   function setProfileText(
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
   
   function showProfileLoading() {
   
       const loading =
           document.getElementById(
               "profileLoading"
           );
   
   
       const content =
           document.getElementById(
               "profileContent"
           );
   
   
       const notFound =
           document.getElementById(
               "profileNotFound"
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
   
   
       if (notFound) {
   
           notFound.classList.add(
               "hidden"
           );
       }
   }
   
   
   function hideProfileLoading() {
   
       const loading =
           document.getElementById(
               "profileLoading"
           );
   
   
       if (loading) {
   
           loading.classList.add(
               "hidden"
           );
       }
   }
   
   
   function showProfileContent() {
   
       const content =
           document.getElementById(
               "profileContent"
           );
   
   
       const notFound =
           document.getElementById(
               "profileNotFound"
           );
   
   
       if (notFound) {
   
           notFound.classList.add(
               "hidden"
           );
       }
   
   
       if (content) {
   
           content.classList.remove(
               "hidden"
           );
       }
   }
   
   
   /* =========================================================
      NOT FOUND
      ========================================================= */
   
   function showProfileNotFound() {
   
       const content =
           document.getElementById(
               "profileContent"
           );
   
   
       const notFound =
           document.getElementById(
               "profileNotFound"
           );
   
   
       if (content) {
   
           content.classList.add(
               "hidden"
           );
       }
   
   
       if (notFound) {
   
           notFound.classList.remove(
               "hidden"
           );
       }
   }
   
   
   /* =========================================================
      MESSAGE
      ========================================================= */
   
   function showProfileMessage(
       message,
       type
   ) {
   
       const element =
           document.getElementById(
               "profileMessage"
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
   
   
   function clearProfileMessage() {
   
       const element =
           document.getElementById(
               "profileMessage"
           );
   
   
       if (!element) {
   
           return;
       }
   
   
       element.textContent =
           "";
   
   
       element.className =
           "alert hidden";
   }