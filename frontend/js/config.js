/* =========================================================
   Event & Parking Reservation System
   Frontend Configuration
   ========================================================= */

const APP_CONFIG = {

    // Backend API Base URL
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
