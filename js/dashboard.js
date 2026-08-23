/**
 * ==========================================================================
 * ADHYAYN LIBRARY - ADMIN CORE
 * ==========================================================================
 *
 * DEVELOPMENT VERSION
 *
 * Current login:
 * Admin Email + Password
 *
 * No:
 * - Library ID
 * - Student Login
 * - Attendance
 * - Manager Login
 *
 * Firebase Authentication = real authentication
 * Firestore = Admin profile / library data
 *
 * EMAIL VERIFICATION:
 * Temporarily disabled for development.
 * Enable before production.
 * ==========================================================================
 */

"use strict";


/* ==========================================================================
   1. FIREBASE CONFIG
   ========================================================================== */

const firebaseConfig = {

    apiKey:
        "AIzaSyCUe84QnEA5DY31DXtzM-7M4Xu5bSa8xO8",

    authDomain:
        "appointment-app-cb979.firebaseapp.com",

    projectId:
        "appointment-app-cb979",

    storageBucket:
        "appointment-app-cb979.firebasestorage.app",

    messagingSenderId:
        "596931961212",

    appId:
        "1:596931961212:web:432f3a7cfd1f65b19104f9"

};


/* ==========================================================================
   2. FIREBASE INITIALIZATION
   ========================================================================== */

(function initializeFirebase() {

    if (
        typeof firebase === "undefined"
    ) {

        console.error(
            "[Adhyayn] Firebase SDK not loaded."
        );

        return;

    }


    try {

        if (
            !firebase.apps.length
        ) {

            firebase.initializeApp(
                firebaseConfig
            );

        }


        window.db =
            firebase.firestore();


        window.auth =
            firebase.auth();


        window.auth.setPersistence(
            firebase.auth.Auth.Persistence.LOCAL
        )
        .catch(
            function (error) {

                console.error(
                    "[Adhyayn] Auth persistence error:",
                    error
                );

            }
        );


        window.firebaseConfig =
            firebaseConfig;


        console.log(
            "[Adhyayn] Firebase initialized successfully."
        );

    }
    catch (error) {

        console.error(
            "[Adhyayn] Firebase initialization error:",
            error
        );

    }

})();


/* ==========================================================================
   3. APPLICATION SETTINGS
   ========================================================================== */

/*
 * Temporary development library.
 *
 * This is NOT shown to the Admin.
 *
 * Later, when the final library structure is ready,
 * this can be replaced by the real library configuration.
 */

const ADHYAYN_LIBRARY_ID =
    "ADHYAYN_MAIN";


const ADHYAYN_LIBRARY_COLLECTION =
    "adhyayn_libraries";


const ADHYAYN_ADMIN_COLLECTION =
    "admins";


/* ==========================================================================
   4. SESSION KEYS
   ========================================================================== */

const SESSION_KEYS = {

    role:
        "adhyayn_role",

    adminUID:
        "adhyayn_admin_uid",

    adminEmail:
        "adhyayn_admin_email",

    libraryId:
        "adhyayn_library_id",

    libraryName:
        "adhyayn_library_name"

};


/* ==========================================================================
   5. SESSION HELPERS
   ========================================================================== */

function getCurrentSession() {

    return {

        role:
            localStorage.getItem(
                SESSION_KEYS.role
            ),

        adminUID:
            localStorage.getItem(
                SESSION_KEYS.adminUID
            ),

        adminEmail:
            localStorage.getItem(
                SESSION_KEYS.adminEmail
            ),

        libraryId:
            localStorage.getItem(
                SESSION_KEYS.libraryId
            ),

        libraryName:
            localStorage.getItem(
                SESSION_KEYS.libraryName
            )

    };

}


window.getCurrentSession =
    getCurrentSession;


/* ==========================================================================
   6. CLEAR SESSION
   ========================================================================== */

function clearAdminSession() {

    Object.keys(
        SESSION_KEYS
    )
    .forEach(
        function (key) {

            localStorage.removeItem(
                SESSION_KEYS[key]
            );

        }
    );

}


window.clearAdminSession =
    clearAdminSession;


/* ==========================================================================
   7. ADMIN FIRESTORE REFERENCE
   ========================================================================== */

function adminReference(
    uid
) {

    if (
        !window.db
    ) {

        throw new Error(
            "Firestore is not initialized."
        );

    }


    if (!uid) {

        throw new Error(
            "Admin UID is missing."
        );

    }


    return window.db
        .collection(
            ADHYAYN_LIBRARY_COLLECTION
        )
        .doc(
            ADHYAYN_LIBRARY_ID
        )
        .collection(
            ADHYAYN_ADMIN_COLLECTION
        )
        .doc(
            uid
        );

}


/* ==========================================================================
   8. LIBRARY REFERENCE
   ========================================================================== */

function libraryReference() {

    if (
        !window.db
    ) {

        throw new Error(
            "Firestore is not initialized."
        );

    }


    return window.db
        .collection(
            ADHYAYN_LIBRARY_COLLECTION
        )
        .doc(
            ADHYAYN_LIBRARY_ID
        );

}


/* ==========================================================================
   9. WAIT FOR AUTH USER
   ========================================================================== */

function waitForFirebaseAuthUser(
    timeout = 10000
) {

    return new Promise(
        function (resolve) {

            if (
                typeof firebase ===
                "undefined" ||
                !firebase.auth
            ) {

                resolve(null);

                return;

            }


            let finished =
                false;


            let unsubscribe =
                null;


            const timer =
                setTimeout(
                    function () {

                        if (finished) {
                            return;
                        }


                        finished =
                            true;


                        if (
                            typeof unsubscribe ===
                            "function"
                        ) {

                            unsubscribe();

                        }


                        resolve(
                            firebase
                                .auth()
                                .currentUser ||
                            null
                        );

                    },
                    timeout
                );


            unsubscribe =
                firebase
                    .auth()
                    .onAuthStateChanged(
                        function (user) {

                            if (finished) {
                                return;
                            }


                            finished =
                                true;


                            clearTimeout(
                                timer
                            );


                            if (
                                typeof unsubscribe ===
                                "function"
                            ) {

                                unsubscribe();

                            }


                            resolve(
                                user ||
                                null
                            );

                        }
                    );

        }
    );

}


window.waitForFirebaseAuthUser =
    waitForFirebaseAuthUser;


/* ==========================================================================
   10. ADMIN LOGIN
   ========================================================================== */

async function adminLogin(
    email,
    password
) {

    const normalizedEmail =
        String(
            email || ""
        )
        .trim()
        .toLowerCase();


    const normalizedPassword =
        String(
            password || ""
        );


    if (
        !normalizedEmail ||
        !normalizedPassword
    ) {

        return {

            success: false,

            message:
                "Please enter Admin Email and Password."

        };

    }


    if (
        !window.auth
    ) {

        return {

            success: false,

            message:
                "Firebase Authentication is unavailable."

        };

    }


    try {

        /*
         * ------------------------------------------------------
         * Firebase Authentication
         * ------------------------------------------------------
         */

        const result =
            await window.auth
                .signInWithEmailAndPassword(
                    normalizedEmail,
                    normalizedPassword
                );


        const user =
            result.user;


        if (!user) {

            throw new Error(
                "Authentication failed."
            );

        }


        /*
         * ------------------------------------------------------
         * DEVELOPMENT MODE
         * ------------------------------------------------------
         *
         * Email verification is intentionally NOT checked here.
         *
         * FINAL VERSION:
         *
         * if (!user.emailVerified) {
         *     ...
         * }
         *
         * ------------------------------------------------------
         */


        /*
         * ------------------------------------------------------
         * Admin Firestore profile
         * ------------------------------------------------------
         */

        let adminData =
            {};


        try {

            const adminSnapshot =
                await adminReference(
                    user.uid
                )
                .get();


            if (
                adminSnapshot.exists
            ) {

                adminData =
                    adminSnapshot.data() ||
                    {};

            }

        }
        catch (profileError) {

            console.warn(
                "[Adhyayn] Admin profile not found yet:",
                profileError
            );

        }


        /*
         * ------------------------------------------------------
         * Create local session
         * ------------------------------------------------------
         */

        clearAdminSession();


        localStorage.setItem(
            SESSION_KEYS.role,
            "admin"
        );


        localStorage.setItem(
            SESSION_KEYS.adminUID,
            user.uid
        );


        localStorage.setItem(
            SESSION_KEYS.adminEmail,
            user.email ||
            normalizedEmail
        );


        localStorage.setItem(
            SESSION_KEYS.libraryId,
            ADHYAYN_LIBRARY_ID
        );


        localStorage.setItem(
            SESSION_KEYS.libraryName,
            adminData.libraryName ||
            "Adhyayn Library"
        );


        return {

            success: true,

            user:
                user,

            admin:
                adminData

        };

    }
    catch (error) {

        console.error(
            "[Adhyayn] Admin login error:",
            error
        );


        let message =
            "Login failed. Please try again.";


        if (
            error.code ===
            "auth/invalid-credential"
        ) {

            message =
                "Invalid email or password.";

        }
        else if (
            error.code ===
            "auth/user-not-found"
        ) {

            message =
                "Invalid email or password.";

        }
        else if (
            error.code ===
            "auth/wrong-password"
        ) {

            message =
                "Invalid email or password.";

        }
        else if (
            error.code ===
            "auth/too-many-requests"
        ) {

            message =
                "Too many login attempts. Please try again later.";

        }
        else if (
            error.code ===
            "auth/network-request-failed"
        ) {

            message =
                "Network error. Please check your internet connection.";

        }
        else if (
            error.code ===
            "auth/user-disabled"
        ) {

            message =
                "This Firebase account has been disabled.";

        }
        else if (
            error.code ===
            "auth/operation-not-allowed"
        ) {

            message =
                "Email/password authentication is not enabled in Firebase.";

        }


        return {

            success: false,

            message:
                message,

            error:
                error

        };

    }

}


window.adminLogin =
    adminLogin;


/* ==========================================================================
   11. FORGOT PASSWORD
   ========================================================================== */

async function sendAdminPasswordReset(
    email
) {

    const normalizedEmail =
        String(
            email || ""
        )
        .trim()
        .toLowerCase();


    if (!normalizedEmail) {

        return {

            success: false,

            message:
                "Please enter your Admin email address."

        };

    }


    try {

        await window.auth
            .sendPasswordResetEmail(
                normalizedEmail
            );


        return {

            success: true,

            message:
                "Password reset email sent. Please check your email."

        };

    }
    catch (error) {

        console.error(
            "[Adhyayn] Password reset error:",
            error
        );


        return {

            success: false,

            message:
                "Unable to send password reset email.",

            error:
                error

        };

    }

}


window.sendAdminPasswordReset =
    sendAdminPasswordReset;


/* ==========================================================================
   12. ADMIN SESSION PROTECTION
   ========================================================================== */

async function requireAdminSession() {

    const user =
        await waitForFirebaseAuthUser();


    if (!user) {

        clearAdminSession();

        window.location.href =
            "index.html";

        return false;

    }


    const session =
        getCurrentSession();


    if (
        session.role !==
        "admin"
    ) {

        clearAdminSession();

        window.location.href =
            "index.html";

        return false;

    }


    /*
     * Development mode:
     *
     * Email verification is currently not required.
     *
     * Final production version will check:
     *
     * user.emailVerified
     */


    return true;

}


window.requireAdminSession =
    requireAdminSession;


/* ==========================================================================
   13. ADMIN LOGOUT
   ========================================================================== */

async function logoutAdmin() {

    try {

        if (
            window.auth
        ) {

            await window.auth
                .signOut();

        }

    }
    catch (error) {

        console.error(
            "[Adhyayn] Logout error:",
            error
        );

    }


    clearAdminSession();


    window.location.href =
        "index.html";

}


window.logoutAdmin =
    logoutAdmin;


/* ==========================================================================
   14. LOGIN FORM
   ========================================================================== */

function bindAdminLoginForm() {

    const form =
        document.getElementById(
            "admin-login-form"
        );


    if (
        !form ||
        form.dataset.bound ===
        "true"
    ) {

        return;

    }


    form.dataset.bound =
        "true";


    const emailInput =
        document.getElementById(
            "admin-email"
        );


    const passwordInput =
        document.getElementById(
            "admin-password"
        );


    const messageBox =
        document.getElementById(
            "login-message"
        );


    const loginButton =
        form.querySelector(
            'button[type="submit"]'
        );


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (loginButton) {

                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "Signing In...";

            }


            if (messageBox) {

                messageBox.textContent =
                    "";

            }


            const result =
                await adminLogin(

                    emailInput
                        ? emailInput.value
                        : "",

                    passwordInput
                        ? passwordInput.value
                        : ""

                );


            if (!result.success) {

                if (messageBox) {

                    messageBox.textContent =
                        result.message;

                }
                else {

                    alert(
                        result.message
                    );

                }


                if (loginButton) {

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "Admin Login";

                }


                return;

            }


            /*
             * Login successful.
             */

            window.location.href =
                "admin/admin-dashboard.html";

        }
    );

}

/* =========================================================
   DEVELOPMENT DEMO LOGIN
   ========================================================= */

if (emailInput) {

    emailInput.value =
        "demo@adhyayn.com";

}


if (passwordInput) {

    passwordInput.value =
        "Demo@12345";

}
/* ==========================================================================
   15. FORGOT PASSWORD BUTTON
   ========================================================================== */

function bindForgotPassword() {

    const button =
        document.getElementById(
            "forgot-password-btn"
        );


    if (
        !button ||
        button.dataset.bound ===
        "true"
    ) {

        return;

    }


    button.dataset.bound =
        "true";


    button.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "admin-email"
                );


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";


            if (!email) {

                alert(
                    "Please enter your Admin email address first."
                );


                if (emailInput) {

                    emailInput.focus();

                }


                return;

            }


            const result =
                await sendAdminPasswordReset(
                    email
                );


            alert(
                result.message
            );

        }
    );

}


/* ==========================================================================
   16. AUTO LOGIN REDIRECTION
   ========================================================================== */

async function checkExistingAdminSession() {

    const user =
        await waitForFirebaseAuthUser(
            3000
        );


    if (!user) {

        return;

    }


    const session =
        getCurrentSession();


    if (
        session.role ===
        "admin"
    ) {

        window.location.href =
            "admin/admin-dashboard.html";

    }

}


/* ==========================================================================
   17. DOM READY
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        bindAdminLoginForm();

        bindForgotPassword();

        checkExistingAdminSession();

    }
);


/* ==========================================================================
   18. GLOBAL CORE OBJECT
   ========================================================================== */

window.AdhyaynCore = {

    login:
        adminLogin,

    logout:
        logoutAdmin,

    session:
        getCurrentSession,

    requireAdmin:
        requireAdminSession,

    passwordReset:
        sendAdminPasswordReset,

    libraryReference:
        libraryReference,

    adminReference:
        adminReference

};


/* ==========================================================================
   19. STATUS
   ========================================================================== */

console.log(
    "[Adhyayn] Fresh Admin Core loaded."
);

console.log(
    "[Adhyayn] Development email-verification bypass is ACTIVE."
);

console.log(
    "[Adhyayn] Admin login uses Firebase Authentication."
);
