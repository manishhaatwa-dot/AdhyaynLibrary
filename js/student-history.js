/**
 * ==========================================================================
 * LIBCONTROL - STUDENT HISTORY MODULE
 * ==========================================================================
 *
 * Shows students who have been removed from the current library.
 *
 * Source:
 * libmanage_secure_v2/{libraryId}/student_history/{studentCode}
 *
 * This module:
 * - Loads current library history only
 * - Searches history
 * - Sorts newest deleted records first
 * - Requires Admin session
 * - Does NOT use Attendance
 * ==========================================================================
 */

"use strict";


/* ==========================================================================
   1. MODULE STATE
   ========================================================================== */

let studentHistoryRealtimeUnsubscribe = null;

let studentHistoryRecords = [];


/* ==========================================================================
   2. DOM HELPER
   ========================================================================== */

function historyElement(id) {

    return document.getElementById(id);

}


/* ==========================================================================
   3. GET ADMIN LIBRARY SESSION
   ========================================================================== */

function getStudentHistoryLibraryContext() {

    const session =
        typeof getCurrentSession === "function"
            ? getCurrentSession()
            : null;


    if (!session) {

        return null;

    }


    if (
        session.role !== "admin" ||
        !session.libraryId
    ) {

        return null;

    }


    return session;

}


/* ==========================================================================
   4. DATE FORMAT
   ========================================================================== */

function formatHistoryDate(value) {

    if (!value) {

        return "-";

    }


    let date = null;


    if (
        typeof value.toDate === "function"
    ) {

        date = value.toDate();

    }
    else if (
        value instanceof Date
    ) {

        date = value;

    }
    else if (
        value.seconds !== undefined
    ) {

        date = new Date(
            Number(value.seconds) * 1000
        );

    }
    else if (
        typeof value === "string"
    ) {

        date = new Date(value);

    }


    if (
        !date ||
        Number.isNaN(date.getTime())
    ) {

        return String(value);

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* ==========================================================================
   5. ESCAPE HTML
   ========================================================================== */

function escapeHistoryHtml(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}


/* ==========================================================================
   6. LOAD HISTORY
   ========================================================================== */

function initializeStudentHistoryModule() {

    const tableBody =
        historyElement(
            "student-history-table-rows"
        );


    if (!tableBody) {

        return;

    }


    const session =
        getStudentHistoryLibraryContext();


    if (!session) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="table-empty"
                    style="
                        text-align:center;
                        padding:2rem;
                    "
                >
                    Session expired. Please login again.
                </td>
            </tr>
        `;

        return;

    }


    if (
        !window.LibManageDB ||
        !window.db
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="table-empty"
                    style="
                        text-align:center;
                        padding:2rem;
                    "
                >
                    Database is not available.
                </td>
            </tr>
        `;

        return;

    }


    /*
     * --------------------------------------------------------------
     * STUDENT HISTORY COLLECTION
     * --------------------------------------------------------------
     */

    const historyCollection =
        window.LibManageDB
            .library(
                session.libraryId
            )
            .collection(
                "student_history"
            );


    /*
     * Remove old listener if module
     * is initialized again.
     */

    if (
        typeof studentHistoryRealtimeUnsubscribe ===
        "function"
    ) {

        studentHistoryRealtimeUnsubscribe();

    }


    /*
     * --------------------------------------------------------------
     * REALTIME LISTENER
     * --------------------------------------------------------------
     */

    studentHistoryRealtimeUnsubscribe =
        historyCollection.onSnapshot(

            (snapshot) => {

                studentHistoryRecords =
                    snapshot.docs.map(
                        (doc) => {

                            return {

                                firestoreId:
                                    doc.id,

                                ...doc.data()

                            };

                        }
                    );


                /*
                 * Newest deleted student first.
                 */

                studentHistoryRecords.sort(
                    (a, b) => {

                        const aTime =
                            a.deletedAt &&
                            typeof a.deletedAt.toMillis ===
                            "function"
                                ? a.deletedAt.toMillis()
                                : 0;


                        const bTime =
                            b.deletedAt &&
                            typeof b.deletedAt.toMillis ===
                            "function"
                                ? b.deletedAt.toMillis()
                                : 0;


                        return bTime - aTime;

                    }
                );


                renderStudentHistory();

            },

            (error) => {

                console.error(
                    "[Student History] Realtime listener error:",
                    error
                );


                tableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="11"
                            class="table-empty"
                            style="
                                text-align:center;
                                padding:2rem;
                            "
                        >
                            Unable to load student history.
                        </td>
                    </tr>
                `;

            }

        );

}


/* ==========================================================================
   7. RENDER HISTORY TABLE
   ========================================================================== */

function renderStudentHistory() {

    const tableBody =
        historyElement(
            "student-history-table-rows"
        );


    if (!tableBody) {

        return;

    }


    const searchInput =
        historyElement(
            "student-history-search-input"
        );


    const searchValue =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    const filteredRecords =
        studentHistoryRecords.filter(
            (student) => {

                if (!searchValue) {

                    return true;

                }


                const searchableText = [

                    student.studentCode,

                    student.studentName,

                    student.fatherName,

                    student.className,

                    student.seatNumber,

                    student.mobileNumber,

                    student.shift,

                    student.status,

                    student.joiningDate,

                    student.expiryDate,

                    student.feeStatus,

                    student.feeDueDate

                ]
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(
                    searchValue
                );

            }
        );


    if (
        !filteredRecords.length
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="table-empty"
                    style="
                        text-align:center;
                        padding:2rem;
                    "
                >
                    ${
                        searchValue
                            ? "No matching student history found."
                            : "No student history available."
                    }
                </td>
            </tr>
        `;

        return;

    }


    let html = "";


    filteredRecords.forEach(
        (student) => {

            html += `

                <tr>

                    <td class="cell-strong">
                        ${escapeHistoryHtml(
                            student.studentCode || "-"
                        )}
                    </td>


                    <td class="cell-name">
                        ${escapeHistoryHtml(
                            student.studentName || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHistoryHtml(
                            student.fatherName || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHistoryHtml(
                            student.className || "-"
                        )}
                    </td>


                    <td class="cell-strong">
                        ${escapeHistoryHtml(
                            student.seatNumber || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHistoryHtml(
                            student.mobileNumber || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHistoryHtml(
                            student.shift || "-"
                        )}
                    </td>


                    <td>
                        ${escapeHistoryHtml(
                            formatHistoryDate(
                                student.joiningDate
                            )
                        )}
                    </td>


                    <td>
                        ${escapeHistoryHtml(
                            formatHistoryDate(
                                student.expiryDate
                            )
                        )}
                    </td>


                    <td>

                        <span class="status-tag ${
                            String(
                                student.feeStatus || "Paid"
                            ).toLowerCase() === "due"
                                ? "expired"
                                : "active"
                        }">

                            ${escapeHistoryHtml(
                                student.feeStatus || "Paid"
                            )}

                        </span>

                    </td>


                    <td>
                        ${escapeHistoryHtml(
                            formatHistoryDate(
                                student.deletedAt
                            )
                        )}
                    </td>

                </tr>

            `;

        }
    );


    tableBody.innerHTML =
        html;

}


/* ==========================================================================
   8. SEARCH
   ========================================================================== */

function bindStudentHistorySearch() {

    const searchInput =
        historyElement(
            "student-history-search-input"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        () => {

            renderStudentHistory();

        }
    );

}


/* ==========================================================================
   9. INITIALIZE PAGE
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (
            !historyElement(
                "student-history-table-rows"
            )
        ) {

            return;

        }


        /*
         * Admin authentication protection.
         */

        if (
            typeof requireAdminSession ===
            "function"
        ) {

            const authenticated =
                await requireAdminSession();


            if (!authenticated) {

                return;

            }

        }


        /*
         * Load common layout.
         */

        await Promise.all([

            loadSaaSLayoutComponent(
                "sidebar-container",
                "../components/sidebar.html"
            ),

            loadSaaSLayoutComponent(
                "navbar-container",
                "../components/navbar.html"
            ),

            loadSaaSLayoutComponent(
                "footer-container",
                "../components/footer.html"
            )

        ]);


        initializeLibraryNavigation();

        initializeStudentHistoryModule();

        bindStudentHistorySearch();

    }
);


/* ==========================================================================
   10. GLOBAL API
   ========================================================================== */

window.LibManageStudentHistory = {

    reload:
        initializeStudentHistoryModule,

    render:
        renderStudentHistory

};


console.log(
    "[LibManage] Student History module loaded successfully."
);
