/**
 * ==========================================================================
 * ADHYAYN LIBRARY - ADMIN CORE
 * ==========================================================================
 *
 * DEVELOPMENT VERSION
 *
 * ADMIN:
 * - Email + Password
 * - Demo Admin can be created through Cloud Function
 * - No Library ID entered by Admin
 * - No Student Login
 * - No Attendance
 * - No Manager Login
 * - No Notice system
 *
 * FIREBASE:
 * - Authentication = Admin authentication
 * - Firestore = Library/Admin/Student data
 *
 * EMAIL VERIFICATION:
 * Disabled during development.
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
   2. INTERNAL LIBRARY CONFIGURATION
   ========================================================================== */

const ADHYAYN_LIBRARY_ID =
    "ADHYAYN_MAIN";


const ADHYAYN_LIBRARY_COLLECTION =
    "adhyayn_libraries";


const ADHYAYN_ADMIN_COLLECTION =
    "admins";


/* ==========================================================================
   3. FIREBASE INITIALIZATION
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
            "[Adhyayn] Firebase initialized."
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
   5. SESSION
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
   6. NORMALIZE LIBRARY ID
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
   7. CLEAR SESSION
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
   8. LIBRARY REFERENCE
   ========================================================================== */

function libraryRef(
    libraryId
) {

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
            normalizeLibraryId(
                libraryId
            )
        );

}


window.libraryRef =
    libraryRef;


/* ==========================================================================
   9. ADMIN REFERENCE
   ========================================================================== */

function adminReference(
    uid
) {

    if (
        !uid
    ) {

        throw new Error(
            "Admin UID is missing."
        );

    }


    return libraryRef(
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
   10. WAIT FOR AUTH USER
   ========================================================================== */

function waitForFirebaseAuthUser(
    timeout = 10000
) {

    return new Promise(
        function (resolve) {

            if (
                !window.auth
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
                            window.auth.currentUser ||
                            null
                        );

                    },
                    timeout
                );


            unsubscribe =
                window.auth
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
   11. ADMIN AUTHORIZATION
   ========================================================================== */

async function getAdminAuthorization(
    user,
    libraryId
) {

    if (!user) {

        return {

            authorized: false

        };

    }


    if (
        normalizeLibraryId(
            libraryId
        ) !==
        ADHYAYN_LIBRARY_ID
    ) {

        return {

            authorized: false

        };

    }


    return {

        authorized: true

    };

}


window.getAdminAuthorization =
    getAdminAuthorization;


/* ==========================================================================
   12. DEMO ADMIN SETUP
   ========================================================================== */

async function setupDemoAdmin() {

    if (
        !window.auth ||
        !firebase.functions
    ) {

        return {

            success: false,

            message:
                "Firebase Functions is unavailable."

        };

    }


    try {

        const setupFunction =
            firebase
                .functions()
                .httpsCallable(
                    "setupDemoAdmin"
                );


        const result =
            await setupFunction({});


        if (
            !result ||
            !result.data ||
            result.data.success !== true
        ) {

            throw new Error(
                "Demo Admin setup failed."
            );

        }


        return {

            success: true,

            data:
                result.data

        };

    }
    catch (error) {

        console.error(
            "[Adhyayn] Demo Admin setup error:",
            error
        );


        return {

            success: false,

            message:
                error.message ||
                "Unable to setup Demo Admin.",

            error:
                error

        };

    }

}


window.setupDemoAdmin =
    setupDemoAdmin;


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
         * DEVELOPMENT:
         * Email verification is intentionally skipped.
         *
         * PRODUCTION:
         *
         * if (!user.emailVerified) {
         *     throw new Error(
         *         "Please verify your Admin email first."
         *     );
         * }
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
            "Adhyayn Library"
        );


        /*
         * Try to read Admin profile.
         */

        try {

            const snapshot =
                await adminReference(
                    user.uid
                )
                .get();


            if (
                snapshot.exists
            ) {

                const adminData =
                    snapshot.data() ||
                    {};


                if (
                    adminData.libraryName
                ) {

                    localStorage.setItem(
                        SESSION_KEYS.libraryName,
                        adminData.libraryName
                    );

                }

            }

        }
        catch (profileError) {

            console.warn(
                "[Adhyayn] Admin profile read failed:",
                profileError
            );

        }


        return {

            success: true,

            user:
                user

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
            "auth/invalid-credential" ||
            error.code ===
            "auth/user-not-found" ||
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
   15. REQUIRE ADMIN SESSION
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
     * DEVELOPMENT:
     * Email verification disabled.
     *
     * PRODUCTION:
     *
     * if (!user.emailVerified) {
     *
     *     await window.auth.signOut();
     *
     *     clearAdminSession();
     *
     *     window.location.href =
     *         "../index.html";
     *
     *     return false;
     *
     * }
     */


    return true;

}


window.requireAdminSession =
    requireAdminSession;


/* ==========================================================================
   16. LOGOUT
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
                "Unable to load component."
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


    document
        .querySelectorAll(
            "[data-library-name]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    session.libraryName ||
                    "Adhyayn Library";

            }
        );


    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    document
        .querySelectorAll(
            ".sidebar-menu .menu-link"
        )
        .forEach(
            function (link) {

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
                    currentPage ===
                    linkPage
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
   19. ADMIN LOGIN FORM
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
     * DEVELOPMENT DEMO CREDENTIALS
     * --------------------------------------------------------------
     *
     * These are only placed into the form.
     *
     * The actual Firebase account is created by
     * setupDemoAdmin Cloud Function.
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


            window.location.href =
                "admin/admin-dashboard.html";

        }
    );

}


/* ==========================================================================
   20. FORGOT PASSWORD
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


                emailInput?.focus();

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
   21. DEMO ADMIN INITIALIZATION
   ========================================================================== */

async function initializeDemoAdmin() {

    /*
     * Only run on the main login page.
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


    /*
     * Do not create the account every time.
     *
     * Firebase Function itself safely checks whether
     * the account already exists.
     */

    try {

        const result =
            await setupDemoAdmin();


        if (
            result.success
        ) {

            console.log(
                "[Adhyayn] Demo Admin is ready:",
                result.data.email
            );

        }
        else {

            console.warn(
                "[Adhyayn] Demo Admin setup was not completed:",
                result.message
            );

        }

    }
    catch (error) {

        console.warn(
            "[Adhyayn] Demo Admin initialization skipped:",
            error
        );

    }

}


/* ==========================================================================
   22. EXISTING ADMIN SESSION
   ========================================================================== */

async function checkExistingAdminSession() {

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
   23. DOM READY
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        bindAdminLoginForm();

        bindForgotPassword();


        /*
         * First ensure the development Admin exists.
         */

        await initializeDemoAdmin();


        /*
         * Then check whether an Admin is
         * already logged in.
         */

        await checkExistingAdminSession();

    }
);


/* ==========================================================================
   24. GLOBAL CORE
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

    setupDemoAdmin:
        setupDemoAdmin,

    libraryReference:
        libraryRef,

    adminReference:
        adminReference

};


/* ==========================================================================
   25. STATUS
   ========================================================================== */

console.log(
    "[Adhyayn] Fresh Admin Core loaded."
);

console.log(
    "[Adhyayn] Demo Admin setup is enabled."
);

console.log(
    "[Adhyayn] Email verification is disabled for development."
);

console.log(
    "[Adhyayn] Attendance, Notice, Student Login and Manager Login removed."
);
