/**
 * ==========================================================================
 * LIBCONTROL - STUDENT DIRECTORY MODULE
 * ==========================================================================
 *
 * Handles:
 * - Student listing
 * - Search
 * - Add student
 * - Edit student
 * - Delete student
 * - Automatic unique student login code
 * - Seat number
 * - Shift
 * - Joining date
 * - Fee due date
 * - Fee status Paid / Due
 * - Clickable Fee Status
 * - Receipt button for Paid students
 * - Library-wise Firestore isolation
 *
 * IMPORTANT:
 * - No password required
 * - No authentication account creation
 * - Student email is stored only as student information
 * - Uses current LibControl Firestore structure
 * ==========================================================================
 */


/* ==========================================================================
   1. MODULE STATE
   ========================================================================== */

let studentsRealtimeUnsubscribe = null;

let studentRecords = [];

let studentEditMode = false;

let currentEditingStudentCode = null;


/* ==========================================================================
   2. DOM HELPER
   ========================================================================== */

function studentElement(id) {

    return document.getElementById(id);

}


/* ==========================================================================
   3. SESSION / DATABASE
   ========================================================================== */

function getStudentLibraryContext() {

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
   4. STUDENT CODE GENERATOR
   ========================================================================== */

function generateStudentCode() {

    let highestNumber = 0;


    studentRecords.forEach(
        (student) => {

            const code =
                String(
                    student.studentCode || ""
                )
                .trim()
                .toUpperCase();


            const match =
                code.match(
                    /^S(\d+)$/
                );


            if (match) {

                const number =
                    parseInt(
                        match[1],
                        10
                    );


                if (
                    !Number.isNaN(number) &&
                    number > highestNumber
                ) {

                    highestNumber =
                        number;

                }

            }

        }
    );


    return (
        "S" +
        String(
            highestNumber + 1
        ).padStart(
            2,
            "0"
        )
    );

}


/* ==========================================================================
   5. DATE VALIDATION
   ========================================================================== */

function isValidDateFormat(value) {

    const date =
        String(
            value || ""
        ).trim();


    if (
        !/^\d{2}\/\d{2}\/\d{4}$/.test(
            date
        )
    ) {

        return false;

    }


    const parts =
        date.split("/");


    const day =
        parseInt(
            parts[0],
            10
        );


    const month =
        parseInt(
            parts[1],
            10
        );


    const year =
        parseInt(
            parts[2],
            10
        );


    if (
        month < 1 ||
        month > 12 ||
        day < 1
    ) {

        return false;

    }


    const testDate =
        new Date(
            year,
            month - 1,
            day
        );


    return (
        testDate.getFullYear() === year &&
        testDate.getMonth() === month - 1 &&
        testDate.getDate() === day
    );

}


/* ==========================================================================
   6. DATE CONVERSION
   ========================================================================== */

function parseIndianDate(value) {

    if (
        !isValidDateFormat(
            value
        )
    ) {

        return null;

    }


    const parts =
        value.split("/");


    return new Date(
        parseInt(parts[2], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10)
    );

}


/* ==========================================================================
   7. DATE FORMATTER
   ========================================================================== */

function formatDateValue(value) {

    if (!value) {
        return "";
    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        value =
            value.toDate();

    }


    if (
        value instanceof Date &&
        !Number.isNaN(
            value.getTime()
        )
    ) {

        return (
            String(
                value.getDate()
            ).padStart(2, "0") +
            "/" +
            String(
                value.getMonth() + 1
            ).padStart(2, "0") +
            "/" +
            value.getFullYear()
        );

    }


    return String(value);

}


/* ==========================================================================
   8. HTML ESCAPE
   ========================================================================== */

function escapeStudentHtml(value) {

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
   9. LOAD STUDENTS
   ========================================================================== */

function initializeStudentsModule() {

    const tableBody =
        studentElement(
            "students-table-rows"
        );


    if (!tableBody) {
        return;
    }


    const session =
        getStudentLibraryContext();


    if (!session) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="table-empty"
                    style="text-align:center;padding:2rem;"
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
                    style="text-align:center;padding:2rem;"
                >
                    Database is not available.
                </td>
            </tr>
        `;

        return;

    }


    const studentsCollection =
        window.LibManageDB.students(
            session.libraryId
        );


    if (
        typeof studentsRealtimeUnsubscribe ===
        "function"
    ) {

        studentsRealtimeUnsubscribe();

    }


    studentsRealtimeUnsubscribe =
        studentsCollection.onSnapshot(

            (snapshot) => {

                studentRecords =
                    snapshot.docs.map(
                        (doc) => ({

                            firestoreId:
                                doc.id,

                            ...doc.data()

                        })
                    );


                studentRecords.sort(
                    (a, b) => {

                        const aName =
                            String(
                                a.studentName ||
                                ""
                            ).toLowerCase();


                        const bName =
                            String(
                                b.studentName ||
                                ""
                            ).toLowerCase();


                        return aName.localeCompare(
                            bName
                        );

                    }
                );


                renderStudentTable();

            },


            (error) => {

                console.error(
                    "[Students] Realtime listener error:",
                    error
                );


                tableBody.innerHTML = `
                    <tr>
                        <td
                            colspan="11"
                            class="table-empty"
                            style="text-align:center;padding:2rem;"
                        >
                            Unable to load student records.
                        </td>
                    </tr>
                `;

            }

        );

}


/* ==========================================================================
   10. RENDER TABLE
   ========================================================================== */

function renderStudentTable() {

    const tableBody =
        studentElement(
            "students-table-rows"
        );


    if (!tableBody) {
        return;
    }


    const searchInput =
        studentElement(
            "student-search-input"
        );


    const searchValue =
        String(
            searchInput?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const filteredStudents =
        studentRecords.filter(
            (student) => {

                if (!searchValue) {
                    return true;
                }


                const searchableText = [

                    student.studentCode,

                    student.seatNumber,

                    student.studentName,

                    student.email,

                    student.className,

                    student.mobileNumber,

                    student.shift,

                    student.joiningDate,

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
        !filteredStudents.length
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="table-empty"
                    style="text-align:center;padding:2rem;"
                >
                    ${
                        searchValue
                            ? "No matching student records found."
                            : "No student records available."
                    }
                </td>
            </tr>
        `;

        return;

    }


    let html = "";


    filteredStudents.forEach(
        (student) => {

            const feeStatus =
                String(
                    student.feeStatus ||
                    "Paid"
                );


            const isDue =
                feeStatus.toLowerCase() ===
                "due";


            const feeClass =
                isDue
                    ? "expired"
                    : "active";


            html += `
                <tr>

                    <td class="cell-strong">
                        ${escapeStudentHtml(
                            student.studentCode ||
                            "-"
                        )}
                    </td>


                    <td class="cell-strong">
                        ${escapeStudentHtml(
                            student.seatNumber ||
                            "-"
                        )}
                    </td>


                    <td class="cell-name">

                        <button
                            type="button"
                            class="student-row-link"
                            data-student-view="${escapeStudentHtml(
                                student.studentCode ||
                                ""
                            )}"
                        >
                            ${escapeStudentHtml(
                                student.studentName ||
                                "-"
                            )}
                        </button>

                    </td>


                    <td>
                        ${escapeStudentHtml(
                            student.email ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${escapeStudentHtml(
                            student.className ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${escapeStudentHtml(
                            formatDateValue(
                                student.joiningDate
                            ) ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${escapeStudentHtml(
                            formatDateValue(
                                student.feeDueDate
                            ) ||
                            "-"
                        )}
                    </td>


                    <td>
                        ${escapeStudentHtml(
                            student.mobileNumber ||
                            "-"
                        )}
                    </td>


                    <td>

                        <button
                            type="button"
                            class="status-tag ${feeClass}"
                            data-fee-toggle="${escapeStudentHtml(
                                student.studentCode ||
                                ""
                            )}"
                            title="Click to change fee status"
                            style="
                                border:none;
                                cursor:pointer;
                            "
                        >
                            ${escapeStudentHtml(
                                feeStatus
                            )}
                        </button>

                    </td>


                    <td>
                        ${escapeStudentHtml(
                            student.shift ||
                            "-"
                        )}
                    </td>


                    <td>

                        <div
                            class="actions-cell-wrapper"
                        >

                            <button
                                type="button"
                                class="action-icon-btn edit-btn"
                                title="Edit Student"
                                data-student-edit="${escapeStudentHtml(
                                    student.studentCode ||
                                    ""
                                )}"
                            >
                                Edit
                            </button>


                            ${
                                !isDue
                                    ? `
                                        <button
                                            type="button"
                                            class="action-icon-btn"
                                            data-student-receipt="${escapeStudentHtml(
                                                student.studentCode ||
                                                ""
                                            )}"
                                            title="Print Receipt"
                                        >
                                            Receipt
                                        </button>
                                    `
                                    : ""
                            }


                            <button
                                type="button"
                                class="action-icon-btn delete-btn"
                                title="Delete Student"
                                data-student-delete="${escapeStudentHtml(
                                    student.studentCode ||
                                    ""
                                )}"
                            >
                                Delete
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }
    );


    tableBody.innerHTML =
        html;

}


/* ==========================================================================
   11. RESET FORM
   ========================================================================== */

function resetStudentForm() {

    const form =
        studentElement(
            "student-form"
        );


    if (form) {
        form.reset();
    }


    const editIndex =
        studentElement(
            "form-edit-index"
        );


    const studentCode =
        studentElement(
            "form-student-code"
        );


    if (editIndex) {
        editIndex.value = "";
    }


    if (studentCode) {
        studentCode.value = "";
    }


    studentEditMode =
        false;


    currentEditingStudentCode =
        null;


    const codeBlock =
        studentElement(
            "modal-code-display-block"
        );


    const codePreview =
        studentElement(
            "modal-student-code-preview"
        );


    if (codeBlock) {

        codeBlock.classList.add(
            "hide-element"
        );

    }


    if (codePreview) {

        codePreview.textContent =
            "";

    }

}


/* ==========================================================================
   12. OPEN ADD MODAL
   ========================================================================== */

function openAddStudentModal() {

    const modal =
        studentElement(
            "student-modal"
        );


    if (!modal) {
        return;
    }


    resetStudentForm();


    studentEditMode =
        false;


    const title =
        studentElement(
            "modal-title-context"
        );


    if (title) {

        title.textContent =
            "Register New Library Member";

    }


    const code =
        generateStudentCode();


    const codeHidden =
        studentElement(
            "form-student-code"
        );


    const codePreview =
        studentElement(
            "modal-student-code-preview"
        );


    const codeBlock =
        studentElement(
            "modal-code-display-block"
        );


    if (codeHidden) {
        codeHidden.value = code;
    }


    if (codePreview) {
        codePreview.textContent = code;
    }


    if (codeBlock) {

        codeBlock.classList.remove(
            "hide-element"
        );

    }


    const joiningInput =
        studentElement(
            "std-joining"
        );


    if (joiningInput) {

        const now =
            new Date();


        joiningInput.value =
            String(
                now.getDate()
            ).padStart(2, "0") +
            "/" +
            String(
                now.getMonth() + 1
            ).padStart(2, "0") +
            "/" +
            now.getFullYear();

    }


    modal.classList.add(
        "active"
    );

}


/* ==========================================================================
   13. OPEN EDIT MODAL
   ========================================================================== */

function openEditStudentModal(
    studentCode
) {

    const student =
        studentRecords.find(
            (item) =>
                String(
                    item.studentCode
                ).toUpperCase() ===
                String(
                    studentCode
                ).toUpperCase()
        );


    if (!student) {

        alert(
            "Student record not found."
        );

        return;

    }


    const modal =
        studentElement(
            "student-modal"
        );


    if (!modal) {
        return;
    }


    resetStudentForm();


    studentEditMode =
        true;


    currentEditingStudentCode =
        student.studentCode;


    const title =
        studentElement(
            "modal-title-context"
        );


    if (title) {

        title.textContent =
            "Edit Library Member";

    }


    studentElement(
        "form-student-code"
    ).value =
        student.studentCode || "";


    studentElement(
        "std-name"
    ).value =
        student.studentName || "";


    studentElement(
        "std-email"
    ).value =
        student.email || "";


    studentElement(
        "std-class"
    ).value =
        student.className || "";


    studentElement(
        "std-seat"
    ).value =
        student.seatNumber || "";


    studentElement(
        "std-mobile"
    ).value =
        student.mobileNumber || "";


    studentElement(
        "std-shift"
    ).value =
        student.shift || "";


    studentElement(
        "std-joining"
    ).value =
        formatDateValue(
            student.joiningDate
        );


    studentElement(
        "std-fee-due-date"
    ).value =
        formatDateValue(
            student.feeDueDate
        );


    const codePreview =
        studentElement(
            "modal-student-code-preview"
        );


    const codeBlock =
        studentElement(
            "modal-code-display-block"
        );


    if (codePreview) {

        codePreview.textContent =
            student.studentCode || "";

    }


    if (codeBlock) {

        codeBlock.classList.remove(
            "hide-element"
        );

    }


    modal.classList.add(
        "active"
    );

}


/* ==========================================================================
   14. CLOSE MODAL
   ========================================================================== */

function closeStudentModal() {

    const modal =
        studentElement(
            "student-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    resetStudentForm();

}


/* ==========================================================================
   15. VALIDATE FORM
   ========================================================================== */

function validateStudentForm() {

    const name =
        studentElement(
            "std-name"
        ).value.trim();


    const email =
        studentElement(
            "std-email"
        ).value.trim().toLowerCase();


    const className =
        studentElement(
            "std-class"
        ).value.trim();


    const seat =
        studentElement(
            "std-seat"
        ).value.trim();


    const mobile =
        studentElement(
            "std-mobile"
        ).value.trim();


    const shift =
        studentElement(
            "std-shift"
        ).value;


    const joining =
        studentElement(
            "std-joining"
        ).value.trim();


    const feeDueDate =
        studentElement(
            "std-fee-due-date"
        ).value.trim();


    if (
        !name ||
        !email ||
        !className ||
        !seat ||
        !mobile ||
        !shift ||
        !joining ||
        !feeDueDate
    ) {

        return {

            valid: false,

            message:
                "Please fill all required fields."

        };

    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        )
    ) {

        return {

            valid: false,

            message:
                "Please enter a valid student email address."

        };

    }


    if (
        !/^\d{10}$/.test(
            mobile
        )
    ) {

        return {

            valid: false,

            message:
                "Please enter a valid 10-digit mobile number."

        };

    }


    if (
        !isValidDateFormat(
            joining
        )
    ) {

        return {

            valid: false,

            message:
                "Joining Date must be in DD/MM/YYYY format."

        };

    }


    if (
        !isValidDateFormat(
            feeDueDate
        )
    ) {

        return {

            valid: false,

            message:
                "Fee Due Date must be in DD/MM/YYYY format."

        };

    }


    return {

        valid: true,

        data: {

            studentName:
                name,

            email:
                email,

            className:
                className,

            seatNumber:
                seat,

            mobileNumber:
                mobile,

            shift:
                shift,

            joiningDate:
                joining,

            feeDueDate:
                feeDueDate,

            feeStatus:
                "Paid"

        }

    };

}


/* ==========================================================================
   16. SAVE STUDENT
   ========================================================================== */

async function saveStudent(event) {

    event.preventDefault();


    const validation =
        validateStudentForm();


    if (!validation.valid) {

        alert(
            validation.message
        );

        return;

    }


    const session =
        getStudentLibraryContext();


    if (!session) {

        alert(
            "Session expired. Please login again."
        );

        return;

    }


    const code =
        studentElement(
            "form-student-code"
        ).value
        .trim()
        .toUpperCase();


    if (!code) {

        alert(
            "Student Login Code is missing."
        );

        return;

    }


    const saveButton =
        document.querySelector(
            '#student-form button[type="submit"]'
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            studentEditMode
                ? "Updating..."
                : "Saving...";

    }


    try {

        const reference =
            window.LibManageDB.student(
                session.libraryId,
                code
            );


        const data =
            validation.data;


        /*
         * --------------------------------------------------------------
         * SEAT DUPLICATE PROTECTION
         * --------------------------------------------------------------
         */

        const duplicateSeat =
            studentRecords.some(
                (student) => {

                    const existingSeat =
                        String(
                            student.seatNumber ||
                            ""
                        )
                        .trim()
                        .toLowerCase();


                    const newSeat =
                        String(
                            data.seatNumber
                        )
                        .trim()
                        .toLowerCase();


                    const differentStudent =
                        String(
                            student.studentCode ||
                            ""
                        )
                        .toUpperCase() !==
                        code;


                    return (
                        existingSeat ===
                        newSeat &&
                        differentStudent
                    );

                }
            );


        if (duplicateSeat) {

            throw new Error(
                "This seat number is already assigned to another student."
            );

        }


        /*
         * --------------------------------------------------------------
         * EDIT
         * --------------------------------------------------------------
         */

        if (studentEditMode) {

            /*
             * Keep the existing fee status while editing.
             */

            const existingStudent =
                studentRecords.find(
                    (student) =>
                        String(
                            student.studentCode
                        ).toUpperCase() ===
                        code
                );


            data.feeStatus =
                existingStudent?.feeStatus ||
                "Paid";


            await reference.update({

                ...data,

                updatedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


            alert(
                "Student updated successfully."
            );


            closeStudentModal();

            return;

        }


        /*
         * --------------------------------------------------------------
         * NEW STUDENT
         * --------------------------------------------------------------
         */

        const existing =
            await reference.get();


        if (existing.exists) {

            throw new Error(
                "Generated Student Code already exists. Please try again."
            );

        }


        await reference.set({

            studentCode:
                code,

            ...data,

            role:
                "student",

            libraryId:
                session.libraryId,

            authEnabled:
                false,

            createdAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp(),

            updatedAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp(),

            createdBy:
                session.adminUID ||
                ""

        });


        alert(
            "Student registered successfully.\n\n" +
            "Student Login Code: " +
            code
        );


        closeStudentModal();

    }
    catch (error) {

        console.error(
            "[Students] Save error:",
            error
        );


        alert(
            error?.message ||
            "Unable to save student."
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Student";

        }

    }

}


/* ==========================================================================
   17. TOGGLE FEE STATUS
   ========================================================================== */

async function toggleStudentFeeStatus(
    studentCode
) {

    const session =
        getStudentLibraryContext();


    if (!session) {

        alert(
            "Session expired. Please login again."
        );

        return;

    }


    const student =
        studentRecords.find(
            (item) =>
                String(
                    item.studentCode
                ).toUpperCase() ===
                String(
                    studentCode
                ).toUpperCase()
        );


    if (!student) {
        return;
    }


    const currentStatus =
        String(
            student.feeStatus ||
            "Paid"
        )
        .toLowerCase();


    const newStatus =
        currentStatus === "paid"
            ? "Due"
            : "Paid";


    try {

        await window.LibManageDB
            .student(
                session.libraryId,
                studentCode
            )
            .update({

                feeStatus:
                    newStatus,

                updatedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });

    }
    catch (error) {

        console.error(
            "[Students] Fee status update error:",
            error
        );


        alert(
            "Unable to update fee status."
        );

    }

}


/* ==========================================================================
   18. PRINT RECEIPT
   ========================================================================== */

function printStudentReceipt(
    studentCode
) {

    const student =
        studentRecords.find(
            (item) =>
                String(
                    item.studentCode
                ).toUpperCase() ===
                String(
                    studentCode
                ).toUpperCase()
        );


    if (!student) {

        alert(
            "Student record not found."
        );

        return;

    }


    const libraryName =
        localStorage.getItem(
            "session_library_name"
        ) ||
        "Library";


    const receiptWindow =
        window.open(
            "",
            "_blank",
            "width=700,height=800"
        );


    if (!receiptWindow) {

        alert(
            "Please allow pop-ups to print the receipt."
        );

        return;

    }


    receiptWindow.document.write(`
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<title>Fee Receipt</title>

<style>

body {
    font-family: Arial, sans-serif;
    padding: 30px;
    color: #111827;
}

.receipt {
    max-width: 600px;
    margin: auto;
    border: 1px solid #d1d5db;
    padding: 30px;
}

h1 {
    margin: 0 0 8px;
    text-align: center;
}

.subtitle {
    text-align: center;
    color: #6b7280;
    margin-bottom: 28px;
}

.row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 10px 0;
    border-bottom: 1px solid #e5e7eb;
}

.label {
    font-weight: 700;
}

.status {
    margin-top: 24px;
    text-align: center;
    font-weight: 800;
    font-size: 18px;
}

.footer {
    margin-top: 35px;
    text-align: center;
    color: #6b7280;
    font-size: 13px;
}

@media print {
    body {
        padding: 0;
    }

    .receipt {
        border: none;
    }
}

</style>

</head>

<body>

<div class="receipt">

    <h1>
        ${escapeStudentHtml(libraryName)}
    </h1>

    <div class="subtitle">
        Fee Payment Receipt
    </div>

    <div class="row">
        <span class="label">Student Name</span>
        <span>
            ${escapeStudentHtml(
                student.studentName || "-"
            )}
        </span>
    </div>

    <div class="row">
        <span class="label">Student Code</span>
        <span>
            ${escapeStudentHtml(
                student.studentCode || "-"
            )}
        </span>
    </div>

    <div class="row">
        <span class="label">Seat Number</span>
        <span>
            ${escapeStudentHtml(
                student.seatNumber || "-"
            )}
        </span>
    </div>

    <div class="row">
        <span class="label">Class</span>
        <span>
            ${escapeStudentHtml(
                student.className || "-"
            )}
        </span>
    </div>

    <div class="row">
        <span class="label">Shift</span>
        <span>
            ${escapeStudentHtml(
                student.shift || "-"
            )}
        </span>
    </div>

    <div class="row">
        <span class="label">Fee Due Date</span>
        <span>
            ${escapeStudentHtml(
                formatDateValue(
                    student.feeDueDate
                ) || "-"
            )}
        </span>
    </div>

    <div class="status">
        PAID
    </div>

    <div class="footer">
        Thank you for your payment.
    </div>

</div>

<script>
window.onload = function () {
    window.print();
};
<\/script>

</body>
</html>
    `);


    receiptWindow.document.close();

}


/* ==========================================================================
   19. DELETE STUDENT
   ========================================================================== */

async function deleteStudent(
    studentCode
) {

    const session =
        getStudentLibraryContext();


    if (!session) {

        alert(
            "Session expired. Please login again."
        );

        return;

    }


    const student =
        studentRecords.find(
            (item) =>
                String(
                    item.studentCode
                ).toUpperCase() ===
                String(
                    studentCode
                ).toUpperCase()
        );


    if (!student) {

        alert(
            "Student record not found."
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Delete student "${student.studentName || studentCode}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const historyReference =
            window.db
                .collection(
                    "libmanage_secure_v2"
                )
                .doc(
                    session.libraryId
                )
                .collection(
                    "student_history"
                )
                .doc(
                    studentCode
                );


        await historyReference.set({

            studentCode:
                student.studentCode ||
                studentCode,

            studentName:
                student.studentName ||
                "",

            email:
                student.email ||
                "",

            className:
                student.className ||
                "",

            seatNumber:
                student.seatNumber ||
                "",

            mobileNumber:
                student.mobileNumber ||
                "",

            shift:
                student.shift ||
                "",

            joiningDate:
                student.joiningDate ||
                "",

            feeDueDate:
                student.feeDueDate ||
                "",

            feeStatus:
                student.feeStatus ||
                "Paid",

            libraryId:
                session.libraryId,

            historyAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp(),

            deletedAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp(),

            deletedBy:
                session.adminUID ||
                ""

        });


        await window.LibManageDB
            .student(
                session.libraryId,
                studentCode
            )
            .delete();


        alert(
            "Student deleted successfully."
        );

    }
    catch (error) {

        console.error(
            "[Students] Delete error:",
            error
        );


        alert(
            "Unable to delete student."
        );

    }

}


/* ==========================================================================
   20. STUDENT VIEW
   ========================================================================== */

function viewStudent(
    studentCode
) {

    const student =
        studentRecords.find(
            (item) =>
                String(
                    item.studentCode
                ).toUpperCase() ===
                String(
                    studentCode
                ).toUpperCase()
        );


    if (!student) {
        return;
    }


    alert(
        "Student: " +
        (
            student.studentName ||
            "-"
        ) +
        "\nEmail: " +
        (
            student.email ||
            "-"
        ) +
        "\nSeat: " +
        (
            student.seatNumber ||
            "-"
        ) +
        "\nClass: " +
        (
            student.className ||
            "-"
        ) +
        "\nMobile: " +
        (
            student.mobileNumber ||
            "-"
        ) +
        "\nShift: " +
        (
            student.shift ||
            "-"
        ) +
        "\nFee Status: " +
        (
            student.feeStatus ||
            "Paid"
        ) +
        "\nFee Due Date: " +
        (
            formatDateValue(
                student.feeDueDate
            ) ||
            "-"
        )
    );

}


/* ==========================================================================
   21. TABLE ACTIONS
   ========================================================================== */

function bindStudentTableActions() {

    const tableBody =
        studentElement(
            "students-table-rows"
        );


    if (!tableBody) {
        return;
    }


    tableBody.addEventListener(
        "click",
        (event) => {

            const editButton =
                event.target.closest(
                    "[data-student-edit]"
                );


            if (editButton) {

                openEditStudentModal(
                    editButton.getAttribute(
                        "data-student-edit"
                    )
                );

                return;

            }


            const deleteButton =
                event.target.closest(
                    "[data-student-delete]"
                );


            if (deleteButton) {

                deleteStudent(
                    deleteButton.getAttribute(
                        "data-student-delete"
                    )
                );

                return;

            }


            const feeButton =
                event.target.closest(
                    "[data-fee-toggle]"
                );


            if (feeButton) {

                toggleStudentFeeStatus(
                    feeButton.getAttribute(
                        "data-fee-toggle"
                    )
                );

                return;

            }


            const receiptButton =
                event.target.closest(
                    "[data-student-receipt]"
                );


            if (receiptButton) {

                printStudentReceipt(
                    receiptButton.getAttribute(
                        "data-student-receipt"
                    )
                );

                return;

            }


            const viewButton =
                event.target.closest(
                    "[data-student-view]"
                );


            if (viewButton) {

                viewStudent(
                    viewButton.getAttribute(
                        "data-student-view"
                    )
                );

            }

        }
    );

}


/* ==========================================================================
   22. MODAL EVENTS
   ========================================================================== */

function bindStudentModalEvents() {

    const openButton =
        studentElement(
            "open-add-modal-btn"
        );


    const closeButton =
        studentElement(
            "close-modal-btn"
        );


    const cancelButton =
        studentElement(
            "cancel-form-btn"
        );


    const form =
        studentElement(
            "student-form"
        );


    const modal =
        studentElement(
            "student-modal"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            openAddStudentModal
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeStudentModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeStudentModal
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            saveStudent
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

                    closeStudentModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                modal &&
                modal.classList.contains(
                    "active"
                )
            ) {

                closeStudentModal();

            }

        }
    );

}


/* ==========================================================================
   23. SEARCH
   ========================================================================== */

function bindStudentSearch() {

    const input =
        studentElement(
            "student-search-input"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            renderStudentTable();

        }
    );

}


/* ==========================================================================
   24. INITIALIZE
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (
            !studentElement(
                "students-table-rows"
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


        initializeStudentsModule();

        bindStudentTableActions();

        bindStudentModalEvents();

        bindStudentSearch();

    }
);


/* ==========================================================================
   25. PUBLIC API
   ========================================================================== */

window.LibManageStudents = {

    reload:
        initializeStudentsModule,

    render:
        renderStudentTable,

    openAdd:
        openAddStudentModal,

    openEdit:
        openEditStudentModal,

    closeModal:
        closeStudentModal,

    toggleFeeStatus:
        toggleStudentFeeStatus,

    printReceipt:
        printStudentReceipt

};


console.log(
    "[LibControl] Students module loaded successfully."
);
