/**
 * ==========================================================================
 * ADHYAYN LIBRARY - ADMIN CORE
 * ==========================================================================
 *
 * DEVELOPMENT VERSION
 *
 * ADMIN LOGIN:
 * Email + Password
 *
 * REMOVED:
 * - Library ID login
 * - Student Login
 * - Attendance
 * - Manager Login
 * - Notice system
 *
 * CURRENT:
 * - Firebase Authentication
 * - Admin session
 * - Single personal library
 * - Students
 * - Student History
 * - Seats
 * - Notifications
 *
 * EMAIL VERIFICATION:
 * Temporarily disabled during development.
 *
 * IMPORTANT:
 * Before production, enable email verification in:
 * adminLogin()
 * requireAdminSession()
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


        window.auth
            .setPersistence(
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
   3. APPLICATION CONFIGURATION
   ========================================================================== */

/*
 * This is the internal library document.
 *
 * Admin does NOT enter this ID.
 *
 * This is only used internally so the personal
 * Adhyayn Library data remains separated.
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
            ) ||
            ADHYAYN_LIBRARY_ID,

        libraryName:
            localStorage.getItem(
                SESSION_KEYS.libraryName
            ) ||
            "Adhyayn Library"

    };

}


window.getCurrentSession =
    getCurrentSession;


/* ==========================================================================
   6. LIBRARY ID NORMALIZER
   ========================================================================== */

function normalizeLibraryId(
    value
) {

    return String(
        value ||
        ADHYAYN_LIBRARY_ID
    )
        .trim()
        .toUpperCase();

}


window.normalizeLibraryId =
    normalizeLibraryId;


/* ==========================================================================
   7. CLEAR ADMIN SESSION
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
   8. ADMIN FIRESTORE REFERENCE
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


window.adminReference =
    adminReference;


/* ==========================================================================
   9. LIBRARY REFERENCE
   ========================================================================== */

function libraryReference(
    libraryId
) {

    if (
        !window.db
    ) {

        throw new Error(
            "Firestore is not initialized."
        );

    }


    const id =
        normalizeLibraryId(
            libraryId
        );


    return window.db
        .collection(
            ADHYAYN_LIBRARY_COLLECTION
        )
        .doc(
            id
        );

}


window.libraryReference =
    libraryReference;


/*
 * Compatibility alias.
 *
 * Existing dashboard pages may use libraryRef().
 */

function libraryRef(
    libraryId
) {

    return libraryReference(
        libraryId
    );

}


window.libraryRef =
    libraryRef;


/* ==========================================================================
   10. LIBMANAGE DATABASE API
   ========================================================================== */

window.LibManageDB = {

    library:
        function (libraryId) {

            return libraryReference(
                libraryId
            );

        },


    students:
        function (libraryId) {

            return libraryReference(
                libraryId
            )
            .collection(
                "students"
            );

        },


    student:
        function (
            libraryId,
            studentCode
        ) {

            return libraryReference(
                libraryId
            )
            .collection(
                "students"
            )
            .doc(
                String(
                    studentCode
                )
                .trim()
                .toUpperCase()
            );

        },


    studentHistory:
        function (libraryId) {

            return libraryReference(
                libraryId
            )
            .collection(
                "student_history"
            );

        },


    seats:
        function (libraryId) {

            return libraryReference(
                libraryId
            )
            .collection(
                "seats"
            );

        },


    seat:
        function (
            libraryId,
            seatId
        ) {

            return libraryReference(
                libraryId
            )
            .collection(
                "seats"
            )
            .doc(
                String(
                    seatId
                )
            );

        },


    notifications:
        function (libraryId) {

            return libraryReference(
                libraryId
            )
            .collection(
                "notifications"
            );

        }

};


console.log(
    "[Adhyayn] LibManageDB initialized."
);


/* ==========================================================================
   11. WAIT FOR FIREBASE AUTH USER
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
   12. ADMIN AUTHORIZATION
   ========================================================================== */

async function getAdminAuthorization(
    user,
    libraryId
) {

    if (!user) {

        return {

            authorized: false,

            reason:
                "Admin user is not authenticated."

        };

    }


    const normalizedLibraryId =
        normalizeLibraryId(
            libraryId
        );


    /*
     * Personal library:
     *
     * The authenticated Firebase account itself
     * is the Admin account.
     */

    if (
        normalizedLibraryId !==
        ADHYAYN_LIBRARY_ID
    ) {

        return {

            authorized: false,

            reason:
                "Invalid library context."

        };

    }


    try {

        const adminSnapshot =
            await adminReference(
                user.uid
            )
            .get();


        /*
         * If an Admin profile exists,
         * verify that it belongs to this library.
         */

        if (
            adminSnapshot.exists
        ) {

            const adminData =
                adminSnapshot.data() ||
                {};


            if (
                adminData.libraryId &&
                normalizeLibraryId(
                    adminData.libraryId
                ) !==
                normalizedLibraryId
            ) {

                return {

                    authorized: false,

                    reason:
                        "Admin is not authorized for this library."

                };

            }

        }


        return {

            authorized: true,

            admin:
                adminSnapshot.exists
                    ? adminSnapshot.data() || {}
                    : {}

        };

    }
    catch (error) {

        console.error(
            "[Adhyayn] Admin authorization error:",
            error
        );


        /*
         * During development, Firebase Authentication
         * is the primary Admin authentication.
         */

        return {

            authorized: true,

            admin: {}

        };

    }

}


window.getAdminAuthorization =
    getAdminAuthorization;


/* ==========================================================================
   13. ADMIN LOGIN
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
         * ======================================================
         * DEVELOPMENT MODE
         * ======================================================
         *
         * Email verification is intentionally NOT required.
         *
         * Production:
         *
         * if (!user.emailVerified) {
         *     throw new Error(
         *         "Please verify your Admin email first."
         *     );
         * }
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
                "[Adhyayn] Admin profile could not be loaded:",
                profileError
            );

        }


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
   14. FORGOT PASSWORD
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
   15. ADMIN SESSION PROTECTION
   ========================================================================== */

async function requireAdminSession() {

    const user =
        await waitForFirebaseAuthUser();


    if (!user) {

        clearAdminSession();


        window.location.href =
            "../index.html";


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
            "../index.html";


        return false;

    }


    /*
     * Development mode:
     *
     * Email verification is currently disabled.
     *
     * Production:
     *
     * if (!user.emailVerified) {
     *     clearAdminSession();
     *     await window.auth.signOut();
     *     window.location.href = "../index.html";
     *     return false;
     * }
     */


    return true;

}


window.requireAdminSession =
    requireAdminSession;


/* ==========================================================================
   16. ADMIN LOGOUT
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
        "../index.html";

}


window.logoutAdmin =
    logoutAdmin;


/* ==========================================================================
   17. LAYOUT COMPONENT LOADER
   ========================================================================== */

async function loadSaaSLayoutComponent(
    containerId,
    componentPath
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {

        return;

    }


    try {

        const response =
            await fetch(
                componentPath,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load component: " +
                response.status
            );

        }


        container.innerHTML =
            await response.text();

    }
    catch (error) {

        console.error(
            "[Adhyayn] Layout component error:",
            error
        );

    }

}


window.loadSaaSLayoutComponent =
    loadSaaSLayoutComponent;


/* ==========================================================================
   18. LIBRARY NAVIGATION
   ========================================================================== */

function initializeLibraryNavigation() {

    const session =
        getCurrentSession();


    const libraryName =
        session.libraryName ||
        "Adhyayn Library";


    document
        .querySelectorAll(
            "[data-library-name]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    libraryName;

            }
        );


    document
        .querySelectorAll(
            ".sidebar-menu .menu-link"
        )
        .forEach(
            function (link) {

                const currentPage =
                    window.location.pathname
                        .split("/")
                        .pop()
                        .toLowerCase();


                const linkPage =
                    String(
                        link.getAttribute(
                            "href"
                        ) ||
                        ""
                    )
                    .split("/")
                    .pop()
                    .toLowerCase();


                if (
                    currentPage &&
                    linkPage ===
                    currentPage
                ) {

                    link
                        .closest(
                            ".menu-item"
                        )
                        ?.classList
                        .add(
                            "active"
                        );

                }

            }
        );

}


window.initializeLibraryNavigation =
    initializeLibraryNavigation;


/* ==========================================================================
   19. LOGIN FORM
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


    /*
     * --------------------------------------------------------------
     * DEVELOPMENT DEMO LOGIN
     * --------------------------------------------------------------
     *
     * IMPORTANT:
     * This does NOT create a Firebase account.
     *
     * The account must exist in Firebase Authentication.
     *
     * These values only pre-fill the login form.
     */

    if (emailInput) {

        emailInput.value =
            "demo@adhyayn.com";

    }


    if (passwordInput) {

        passwordInput.value =
            "Demo@12345";

    }


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


/* ==========================================================================
   20. FORGOT PASSWORD BUTTON
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
   21. AUTO LOGIN REDIRECTION
   ========================================================================== */

async function checkExistingAdminSession() {

    /*
     * Do not run this on Admin pages.
     */

    const currentFile =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (
        currentFile !==
        "index.html" &&
        currentFile !==
        ""
    ) {

        return;

    }


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
   22. DOM READY
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
   23. GLOBAL CORE OBJECT
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
   24. STATUS
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

console.log(
    "[Adhyayn] Attendance and Notice systems are removed."
);
