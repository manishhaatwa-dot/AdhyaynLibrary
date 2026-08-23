/**
 * ==========================================================================
 * ADHYAYN LIBRARY - STUDENTS HISTORY MODULE
 * ==========================================================================
 *
 * Shows students whose records were removed from the active students
 * collection.
 *
 * Firestore:
 *
 * libmanage_secure_v2
 *   └── {LIBRARY_ID}
 *       └── student_history
 *
 * IMPORTANT:
 * - Library-wise isolation
 * - Admin session required
 * - Does NOT read the active students collection
 * - Does NOT modify/delete history records
 * ==========================================================================
 */

"use strict";


/* ==========================================================================
   1. MODULE STATE
   ========================================================================== */

let studentHistoryRecords = [];


/* ==========================================================================
   2. DOM HELPER
   ========================================================================== */

function historyElement(id) {

    return document.getElementById(id);

}


/* ==========================================================================
   3. HTML ESCAPE
   ========================================================================== */

function escapeHistoryHtml(value) {

    return String(
        value ?? ""
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
   4. DATE FORMAT
   ========================================================================== */

function formatHistoryDate(value) {

    if (!value) {

        return "-";

    }


    let date = null;


    if (
        typeof value.toDate ===
        "function"
    ) {

        date =
            value.toDate();

    }
    else if (
        value instanceof Date
    ) {

        date =
            value;

    }
    else if (
        value.seconds !==
        undefined
    ) {

        date =
            new Date(
                Number(
                    value.seconds
                ) * 1000
            );

    }
    else if (
        typeof value ===
        "string"
    ) {

        /*
         * Existing Indian date format.
         */

        if (
            /^\d{2}\/\d{2}\/\d{4}$/.test(
                value
            )
        ) {

            return value;

        }


        const parsed =
            new Date(
                value
            );


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            date =
                parsed;

        }

    }


    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }


    return (
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        ) +
        "/" +
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ) +
        "/" +
        date.getFullYear()
    );

}


/* ==========================================================================
   5. GET ADMIN SESSION
   ========================================================================== */

function getHistoryLibraryContext() {

    if (
        typeof getCurrentSession !==
        "function"
    ) {

        return null;

    }


    const session =
        getCurrentSession();


    if (
        !session ||
        session.role !==
        "admin" ||
        !session.libraryId
    ) {

        return null;

    }


    return session;

}


/* ==========================================================================
   6. LOAD STUDENT HISTORY
   ========================================================================== */

async function loadStudentHistory() {

    const tableBody =
        historyElement(
            "student-history-rows"
        );


    if (!tableBody) {

        return;

    }


    const session =
        getHistoryLibraryContext();


    if (!session) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="history-empty"
                >
                    Session expired. Please login again.

                </td>

            </tr>

        `;

        return;

    }


    if (
        !window.db
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="history-empty"
                >
                    Database is not available.

                </td>

            </tr>

        `;

        return;

    }


    tableBody.innerHTML = `

        <tr>

            <td
                colspan="10"
                class="history-empty"
            >
                Loading student history...

            </td>

        </tr>

    `;


    try {

        /*
         * ==========================================================
         * LIBRARY-WISE HISTORY COLLECTION
         * ==========================================================
         */

        const historySnapshot =
            await window.db
                .collection(
                    "libmanage_secure_v2"
                )
                .doc(
                    session.libraryId
                )
                .collection(
                    "student_history"
                )
                .get();


        studentHistoryRecords =
            historySnapshot.docs.map(
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


                return (
                    bTime -
                    aTime
                );

            }
        );


        renderStudentHistory();

    }
    catch (error) {

        console.error(
            "[Students History] Load error:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="history-empty"
                >
                    Unable to load student history.

                </td>

            </tr>

        `;

    }

}


/* ==========================================================================
   7. RENDER HISTORY TABLE
   ========================================================================== */

function renderStudentHistory() {

    const tableBody =
        historyElement(
            "student-history-rows"
        );


    if (!tableBody) {

        return;

    }


    const searchInput =
        historyElement(
            "history-search-input"
        );


    const searchValue =
        String(
            searchInput?.value ||
            ""
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

                    student.email,

                    student.className,

                    student.seatNumber,

                    student.mobileNumber,

                    student.shift,

                    student.status,

                    student.joiningDate,

                    student.expiryDate,

                    student.feeDueDate,

                    student.feeStatus

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
                    colspan="10"
                    class="history-empty"
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


    let html =
        "";


    filteredRecords.forEach(
        (student) => {

            html += `

                <tr>

                    <td>

                        <span class="history-code">

                            ${escapeHistoryHtml(
                                student.studentCode ||
                                "-"
                            )}

                        </span>

                    </td>


                    <td>

                        <span class="history-name">

                            ${escapeHistoryHtml(
                                student.studentName ||
                                "-"
                            )}

                        </span>

                    </td>


                    <td>

                        ${escapeHistoryHtml(
                            student.fatherName ||
                            "-"
                        )}

                    </td>


                    <td>

                        ${escapeHistoryHtml(
                            student.seatNumber ||
                            "-"
                        )}

                    </td>


                    <td>

                        ${escapeHistoryHtml(
                            student.className ||
                            "-"
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

                        ${escapeHistoryHtml(
                            formatHistoryDate(
                                student.deletedAt
                            )
                        )}

                    </td>


                    <td>

                        <span class="history-status">

                            ${escapeHistoryHtml(
                                student.status ||
                                "Deleted"
                            )}

                        </span>

                    </td>


                    <td>

                        <button
                            type="button"
                            class="history-view-btn"
                            data-history-view="${escapeHistoryHtml(
                                student.firestoreId ||
                                student.studentCode ||
                                ""
                            )}"
                        >
                            View

                        </button>

                    </td>

                </tr>

            `;

        }
    );


    tableBody.innerHTML =
        html;

}


/* ==========================================================================
   8. SHOW STUDENT DETAILS
   ========================================================================== */

function showStudentHistoryDetails(
    recordId
) {

    const student =
        studentHistoryRecords.find(
            (item) => {

                return (
                    String(
                        item.firestoreId
                    ) ===
                    String(
                        recordId
                    )
                );

            }
        );


    if (!student) {

        return;

    }


    const modal =
        historyElement(
            "history-details-modal"
        );


    const content =
        historyElement(
            "history-details-content"
        );


    if (
        !modal ||
        !content
    ) {

        return;

    }


    content.innerHTML = `

        <div class="history-detail">

            <span>
                Student Login Code
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.studentCode ||
                    "-"
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Student Name
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.studentName ||
                    "-"
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Father's Name
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.fatherName ||
                    "-"
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Email
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.email ||
                    "-"
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Class
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.className ||
                    "-"
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Seat Number
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.seatNumber ||
                    "-"
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Mobile Number
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.mobileNumber ||
                    "-"
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Shift
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.shift ||
                    "-"
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Joining Date
            </span>

            <strong>
                ${escapeHistoryHtml(
                    formatHistoryDate(
                        student.joiningDate
                    )
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Expiry Date
            </span>

            <strong>
                ${escapeHistoryHtml(
                    formatHistoryDate(
                        student.expiryDate
                    )
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Fee Due Date
            </span>

            <strong>
                ${escapeHistoryHtml(
                    formatHistoryDate(
                        student.feeDueDate
                    )
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Fee Status
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.feeStatus ||
                    "Paid"
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Deleted Date
            </span>

            <strong>
                ${escapeHistoryHtml(
                    formatHistoryDate(
                        student.deletedAt
                    )
                )}
            </strong>

        </div>


        <div class="history-detail">

            <span>
                Deleted By
            </span>

            <strong>
                ${escapeHistoryHtml(
                    student.deletedBy ||
                    "-"
                )}
            </strong>

        </div>

    `;


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* ==========================================================================
   9. CLOSE DETAILS MODAL
   ========================================================================== */

function closeStudentHistoryModal() {

    const modal =
        historyElement(
            "history-details-modal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* ==========================================================================
   10. SEARCH
   ========================================================================== */

function bindStudentHistorySearch() {

    const searchInput =
        historyElement(
            "history-search-input"
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
   11. VIEW BUTTONS
   ========================================================================== */

function bindStudentHistoryActions() {

    const tableBody =
        historyElement(
            "student-history-rows"
        );


    if (!tableBody) {

        return;

    }


    tableBody.addEventListener(
        "click",
        (event) => {

            const viewButton =
                event.target.closest(
                    "[data-history-view]"
                );


            if (!viewButton) {

                return;

            }


            showStudentHistoryDetails(
                viewButton.getAttribute(
                    "data-history-view"
                )
            );

        }
    );

}


/* ==========================================================================
   12. MODAL EVENTS
   ========================================================================== */

function bindStudentHistoryModal() {

    const modal =
        historyElement(
            "history-details-modal"
        );


    const closeButton =
        historyElement(
            "history-close-modal"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeStudentHistoryModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    modal
                ) {

                    closeStudentHistoryModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                    "Escape" &&
                modal &&
                modal.classList.contains(
                    "active"
                )
            ) {

                closeStudentHistoryModal();

            }

        }
    );

}


/* ==========================================================================
   13. INITIALIZATION
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (
            !historyElement(
                "student-history-rows"
            )
        ) {

            return;

        }


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


        bindStudentHistorySearch();

        bindStudentHistoryActions();

        bindStudentHistoryModal();

        await loadStudentHistory();

    }
);


/* ==========================================================================
   14. GLOBAL API
   ========================================================================== */

window.LibManageStudentHistory = {

    reload:
        loadStudentHistory,

    render:
        renderStudentHistory

};


console.log(
    "[Adhyayn Library] Students History module loaded successfully."
);
