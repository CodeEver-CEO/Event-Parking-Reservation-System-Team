/* =========================================================
   Event & Parking Reservation System
   Frontend Configuration
   ========================================================= */

const APP_CONFIG = {

    // Backend API Base URL
    // Must match the backend's launch URL (Properties/launchSettings.json).
    // Default https profile: https://localhost:7239  (http profile: http://localhost:5197)
    API_BASE_URL: "https://localhost:7239/api",

    // Application Name
    APP_NAME: "Event & Parking Reservation System",

    // Booking Hold Time
    BOOKING_HOLD_MINUTES: 15,

    // Local Storage Keys
    STORAGE_KEYS: {
        TOKEN: "eventParkingToken",
        USER: "eventParkingUser",
        ROLE: "eventParkingRole",
        CUSTOMER_ID: "eventParkingCustomerId"
    }
};
