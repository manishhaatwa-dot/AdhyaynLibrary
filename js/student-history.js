/**
 * ==========================================================================
 * ADHYAYN LIBRARY - STUDENT HISTORY
 * ==========================================================================
 */

"use strict";


/* ==========================================================================
   1. INITIALIZATION
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeStudentHistory
);


async function initializeStudentHistory() {

    /*
     * ------------------------------------------------------
     * Admin session protection
     * ------------------------------------------------------
     */

    const authenticated =
        await requireAdminSession();


    if (!authenticated) {

        return;

    }


    /*
     * ------------------------------------------------------
     * Load shared layout
     * ------------------------------------------------------
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


    /*
     * ------------------------------------------------------
     * Library navigation
     * ------------------------------------------------------
     */

    initializeLibraryNavigation();


    /*
     * ------------------------------------------------------
     * Load history
     * ------------------------------------------------------
     */

    loadStudentHistory();


    /*
     * ------------------------------------------------------
     * Search
     * ------------------------------------------------------
     */

    const searchInput =
        document.getElementById(
            "history-search-input"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                filterStudentHistory(
                    searchInput.value
                );

            }
        );

    }

}


/* ==========================================================================
   2. HISTORY DATA
   ========================================================================== */

let studentHistoryRecords = [];


/* ==========================================================================
   3. HISTORY COLLECTION
   ========================================================================== */

function studentHistoryRef(
    libraryId
) {

    return libraryRef(
        libraryId
    )
        .collection(
            "student_history"
        );

}


/* ==========================================================================
   4. LOAD STUDENT HISTORY
   ========================================================================== */

async function loadStudentHistory() {

    const tableBody =
        document.getElementById(
            "student-history-rows"
        );


    if (!tableBody) {

        return;

    }


    const session =
        getCurrentSession();


    const libraryId =
        normalizeLibraryId(
            session.libraryId
        );


    if (!libraryId) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="history-empty"
                >
                    Library session not found.
                </td>

            </tr>

        `;

        return;

    }


    if (!window.db) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="history-empty"
                >
                    Database is unavailable.
                </td>

            </tr>

        `;

        return;

    }


    try {

        const snapshot =
            await studentHistoryRef(
                libraryId
            )
            .get();


        studentHistoryRecords =
            snapshot.docs.map(
                function (doc) {

                    return {

                        id:
                            doc.id,

                        ...(
                            doc.data() ||
                            {}
                        )

                    };

                }
            );


        /*
         * Newest history first.
         */

        studentHistoryRecords.sort(
            function (a, b) {

                return (
                    getTimestamp(
                        b.historyAt ||
                        b.createdAt ||
                        b.updatedAt
                    )
                    -
                    getTimestamp(
                        a.historyAt ||
                        a.createdAt ||
                        a.updatedAt
                    )
                );

            }
        );


        renderStudentHistory(
            studentHistoryRecords
        );

    }
    catch (error) {

        console.error(
            "[Adhyayn Library] Student history load error:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="history-empty"
                >
                    Unable to load student history.
                </td>

            </tr>

        `;

    }

}


/* ==========================================================================
   5. RENDER HISTORY
   ========================================================================== */

function renderStudentHistory(
    records
) {

    const tableBody =
        document.getElementById(
            "student-history-rows"
        );


    if (!tableBody) {

        return;

    }


    if (!records.length) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="history-empty"
                >
                    No student history available.
                </td>

            </tr>

        `;

        return;

    }


    tableBody.innerHTML =
        records
            .map(
                function (student) {

                    const status =
                        String(
                            student.status ||
                            "Expired"
                        );


                    const statusClass =
                        status
                            .toLowerCase()
                            .includes(
                                "active"
                            )
                            ? "active"
                            : "expired";


                    return `

                        <tr>

                            <td>
                                ${escapeHistoryHtml(
                                    student.studentCode ||
                                    student.code ||
                                    student.id ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHistoryHtml(
                                    student.name ||
                                    student.studentName ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHistoryHtml(
                                    student.fatherName ||
                                    student.father ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHistoryHtml(
                                    student.seatNumber ||
                                    student.seat ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHistoryHtml(
                                    student.class ||
                                    student.className ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHistoryHtml(
                                    student.joiningDate ||
                                    "—"
                                )}
                            </td>


                            <td>
                                ${escapeHistoryHtml(
                                    student.expiryDate ||
                                    "—"
                                )}
                            </td>


                            <td>

                                <span
                                    class="history-status ${statusClass}"
                                >
                                    ${escapeHistoryHtml(
                                        status
                                    )}
                                </span>

                            </td>


                            <td>
                                ${escapeHistoryHtml(
                                    formatHistoryDate(
                                        student.historyAt ||
                                        student.createdAt ||
                                        student.updatedAt
                                    )
                                )}
                            </td>

                        </tr>

                    `;

                }
            )
            .join("");

}


/* ==========================================================================
   6. SEARCH FILTER
   ========================================================================== */

function filterStudentHistory(
    searchValue
) {

    const search =
        String(
            searchValue ||
            ""
        )
        .trim()
        .toLowerCase();


    if (!search) {

        renderStudentHistory(
            studentHistoryRecords
        );

        return;

    }


    const filtered =
        studentHistoryRecords.filter(
            function (student) {

                const searchableText = [

                    student.studentCode,

                    student.code,

                    student.name,

                    student.studentName,

                    student.fatherName,

                    student.father,

                    student.seatNumber,

                    student.seat,

                    student.class,

                    student.className,

                    student.mobile,

                    student.mobileNumber,

                    student.status

                ]
                .filter(
                    function (value) {

                        return value !==
                            undefined &&
                            value !==
                            null;

                    }
                )
                .join(" ")
                .toLowerCase();


                return searchableText
                    .includes(
                        search
                    );

            }
        );


    renderStudentHistory(
        filtered
    );

}


/* ==========================================================================
   7. TIMESTAMP HELPER
   ========================================================================== */

function getTimestamp(
    value
) {

    if (!value) {

        return 0;

    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate().getTime();

    }


    if (
        value.seconds !==
        undefined
    ) {

        return Number(
            value.seconds
        ) * 1000;

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return 0;

    }


    return date.getTime();

}


/* ==========================================================================
   8. DATE FORMAT
   ========================================================================== */

function formatHistoryDate(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );


    if (!timestamp) {

        return "—";

    }


    return new Date(
        timestamp
    )
        .toLocaleString(
            "en-IN",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );

}


/* ==========================================================================
   9. HTML ESCAPE
   ========================================================================== */

function escapeHistoryHtml(
    value
) {

    return String(
        value ??
        ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#39;"
        );

}


/* ==========================================================================
   10. GLOBAL
   ========================================================================== */

window.studentHistoryRef =
    studentHistoryRef;

window.loadStudentHistory =
    loadStudentHistory;