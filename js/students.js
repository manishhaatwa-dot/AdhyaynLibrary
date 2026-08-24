/**
 * ==========================================================================
 * ADHYAYN LIBRARY - STUDENT DIRECTORY MODULE
 * ==========================================================================
 *
 * Handles:
 * - Student listing
 * - Search
 * - Add student
 * - Edit student
 * - Delete student
 * - Automatic unique student login code
 * - Library-wise Firestore isolation
 * - Joining date
 * - Fee due date
 * - Fee status Paid / Due toggle
 * - Fee receipt printing
 *
 * CURRENT STUDENT FIELDS:
 * - Student Name
 * - Student Email
 * - Class
 * - Seat Number
 * - Mobile Number
 * - Shift
 * - Joining Date
 * - Fee Due Date
 * - Fee Status
 *
 * NOT USED:
 * - Father's Name
 * - Password
 * - Expiry Date
 * - Student Status
 * - Student Authentication
 * ==========================================================================
 */

"use strict";


/* ==========================================================================
   1. MODULE STATE
   ========================================================================== */

let studentsRealtimeUnsubscribe = null;

let studentRecords = [];

let studentEditMode = false;

let currentEditingStudentCode = null;


/* ==========================================================================
   2. DOM HELPERS
   ========================================================================== */

function studentElement(id) {

    return document.getElementById(id);

}


/* ==========================================================================
   3. SESSION / DATABASE CHECK
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
        typeof value.toDate === "function"
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
   9. TODAY DATE
   ========================================================================== */

function getTodayIndianDate() {

    const now =
        new Date();


    return (
        String(
            now.getDate()
        ).padStart(2, "0") +
        "/" +
        String(
            now.getMonth() + 1
        ).padStart(2, "0") +
        "/" +
        now.getFullYear()
    );

}


/* ==========================================================================
   10. LOAD STUDENTS
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
                    colspan="10"
                    class="table-empty"
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
                    colspan="10"
                    class="table-empty"
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
                        (doc) => {

                            return {

                                firestoreId:
                                    doc.id,

                                ...doc.data()

                            };

                        }
                    );


                studentRecords.sort(
                    (a, b) => {

                        const aName =
                            String(
                                a.studentName || ""
                            ).toLowerCase();


                        const bName =
                            String(
                                b.studentName || ""
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
                            colspan="10"
                            class="table-empty"
                        >
                            Unable to load student records.
                        </td>
                    </tr>
                `;

            }

        );

}


/* ==========================================================================
   11. RENDER STUDENT TABLE
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
            searchInput?.value || ""
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
                    colspan="10"
                    class="table-empty"
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


            const isPaid =
                feeStatus.toLowerCase() ===
                "paid";


            /*
             * ----------------------------------------------------------
             * FEE STATUS BUTTON
             * ----------------------------------------------------------
             *
             * Paid -> click -> Due
             * Due  -> click -> Paid
             */

            const feeButtonClass =
                isPaid
                    ? "fee-status-button paid"
                    : "fee-status-button due";


            /*
             * Receipt is shown ONLY when fee is Paid.
             */

            const receiptHtml =
                isPaid
                    ? `
                        <button
                            type="button"
                            class="fee-receipt-button"
                            data-student-receipt="${escapeStudentHtml(
                                student.studentCode || ""
                            )}"
                        >
                            Receipt
                        </button>
                    `
                    : "";


            html += `
                <tr>

                    <!-- UNIQUE LOGIN CODE -->

                    <td class="cell-strong">
                        ${escapeStudentHtml(
                            student.studentCode || "-"
                        )}
                    </td>


                    <!-- SEAT -->

                    <td class="cell-strong">
                        ${escapeStudentHtml(
                            student.seatNumber || "-"
                        )}
                    </td>


                    <!-- STUDENT NAME -->

                    <td class="cell-name">

                        <button
                            type="button"
                            class="student-row-link"
                            data-student-view="${escapeStudentHtml(
                                student.studentCode || ""
                            )}"
                        >
                            ${escapeStudentHtml(
                                student.studentName || "-"
                            )}
                        </button>

                    </td>


                    <!-- EMAIL -->

                    <td>
                        ${escapeStudentHtml(
                            student.email || "-"
                        )}
                    </td>


                    <!-- CLASS -->

                    <td>
                        ${escapeStudentHtml(
                            student.className || "-"
                        )}
                    </td>


                    <!-- JOINING DATE -->

                    <td>
                        ${escapeStudentHtml(
                            formatDateValue(
                                student.joiningDate
                            ) || "-"
                        )}
                    </td>


                    <!-- FEE DUE DATE -->

                    <td>
                        ${escapeStudentHtml(
                            formatDateValue(
                                student.feeDueDate
                            ) || "-"
                        )}
                    </td>


                    <!-- MOBILE -->

                    <td>
                        ${escapeStudentHtml(
                            student.mobileNumber || "-"
                        )}
                    </td>


                    <!-- FEE STATUS -->

                    <td>

                        <div
                            class="fee-status-actions"
                            style="
                                display:flex;
                                flex-direction:column;
                                align-items:flex-start;
                                gap:7px;
                                min-width:80px;
                            "
                        >

                            <button
                                type="button"
                                class="${feeButtonClass}"
                                data-fee-toggle="${escapeStudentHtml(
                                    student.studentCode || ""
                                )}"
                                title="Click to change fee status"
                                style="
                                    display:inline-flex;
                                    align-items:center;
                                    justify-content:center;
                                    box-sizing:border-box;
                                    width:auto;
                                    min-width:68px;
                                    max-width:100%;
                                    padding:5px 10px;
                                    margin:0;
                                    border:1px solid transparent;
                                    border-radius:6px;
                                    background:#ffffff;
                                    font-family:inherit;
                                    font-size:12px;
                                    font-weight:700;
                                    line-height:1.2;
                                    white-space:nowrap;
                                    cursor:pointer;
                                "
                            >
                                ${escapeStudentHtml(
                                    feeStatus.toUpperCase()
                                )}
                            </button>


                            ${receiptHtml}

                        </div>

                    </td>


                    <!-- SHIFT -->

                    <td>
                        ${escapeStudentHtml(
                            student.shift || "-"
                        )}
                    </td>


                    <!-- ACTIONS -->

                    <td>

                        <div class="actions-cell-wrapper">

                            <button
                                type="button"
                                class="action-icon-btn edit-btn"
                                title="Edit Student"
                                data-student-edit="${escapeStudentHtml(
                                    student.studentCode || ""
                                )}"
                            >
                                Edit
                            </button>


                            <button
                                type="button"
                                class="action-icon-btn delete-btn"
                                title="Delete Student"
                                data-student-delete="${escapeStudentHtml(
                                    student.studentCode || ""
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
   12. RESET FORM
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


    studentEditMode =
        false;


    currentEditingStudentCode =
        null;

}


/* ==========================================================================
   13. OPEN ADD MODAL
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

        joiningInput.value =
            getTodayIndianDate();

    }


    modal.classList.add(
        "active"
    );

}


/* ==========================================================================
   14. OPEN EDIT MODAL
   ========================================================================== */

function openEditStudentModal(studentCode) {

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


    const codeInput =
        studentElement(
            "form-student-code"
        );


    if (codeInput) {

        codeInput.value =
            student.studentCode || "";

    }


    const nameInput =
        studentElement(
            "std-name"
        );


    if (nameInput) {

        nameInput.value =
            student.studentName || "";

    }


    const emailInput =
        studentElement(
            "std-email"
        );


    if (emailInput) {

        emailInput.value =
            student.email || "";

    }


    const classInput =
        studentElement(
            "std-class"
        );


    if (classInput) {

        classInput.value =
            student.className || "";

    }


    const seatInput =
        studentElement(
            "std-seat"
        );


    if (seatInput) {

        seatInput.value =
            student.seatNumber || "";

    }


    const mobileInput =
        studentElement(
            "std-mobile"
        );


    if (mobileInput) {

        mobileInput.value =
            student.mobileNumber || "";

    }


    const shiftInput =
        studentElement(
            "std-shift"
        );


    if (shiftInput) {

        shiftInput.value =
            student.shift || "";

    }


    const joiningInput =
        studentElement(
            "std-joining"
        );


    if (joiningInput) {

        joiningInput.value =
            formatDateValue(
                student.joiningDate
            );

    }


    const feeDueInput =
        studentElement(
            "std-fee-due-date"
        );


    if (feeDueInput) {

        feeDueInput.value =
            formatDateValue(
                student.feeDueDate
            );

    }


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
   15. CLOSE MODAL
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
   16. VALIDATE FORM
   ========================================================================== */

function validateStudentForm() {

    const name =
        studentElement(
            "std-name"
        )?.value.trim() || "";


    const email =
        studentElement(
            "std-email"
        )?.value.trim().toLowerCase() || "";


    const className =
        studentElement(
            "std-class"
        )?.value.trim() || "";


    const seat =
        studentElement(
            "std-seat"
        )?.value.trim() || "";


    const mobile =
        studentElement(
            "std-mobile"
        )?.value.trim() || "";


    const shift =
        studentElement(
            "std-shift"
        )?.value || "";


    const joining =
        studentElement(
            "std-joining"
        )?.value.trim() || "";


    const feeDueDate =
        studentElement(
            "std-fee-due-date"
        )?.value.trim() || "";


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
                feeDueDate

        }

    };

}


/* ==========================================================================
   17. SAVE STUDENT
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
        )?.value
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


        /* --------------------------------------------------------------
           SEAT DUPLICATE PROTECTION
           -------------------------------------------------------------- */

        const duplicateSeat =
            studentRecords.some(
                (student) => {

                    const sameSeat =
                        String(
                            student.seatNumber || ""
                        )
                        .trim()
                        .toLowerCase() ===
                        String(
                            data.seatNumber
                        )
                        .trim()
                        .toLowerCase();


                    const differentStudent =
                        String(
                            student.studentCode || ""
                        ).toUpperCase() !==
                        String(
                            code
                        ).toUpperCase();


                    return (
                        sameSeat &&
                        differentStudent
                    );

                }
            );


        if (duplicateSeat) {

            throw new Error(
                "This seat number is already assigned to another student."
            );

        }


        /* --------------------------------------------------------------
           EDIT
           -------------------------------------------------------------- */

        if (studentEditMode) {

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


        /* --------------------------------------------------------------
           NEW STUDENT
           -------------------------------------------------------------- */

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

            feeStatus:
                "Paid",

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
   18. TOGGLE FEE STATUS
   ========================================================================== */

async function toggleFeeStatus(studentCode) {

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

        await window.LibManageDB.student(
            session.libraryId,
            student.studentCode
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
   19. PRINT FEE RECEIPT
   ========================================================================== */

function printFeeReceipt(studentCode) {

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


    const feeStatus =
        String(
            student.feeStatus ||
            "Paid"
        );


    if (
        feeStatus.toLowerCase() !==
        "paid"
    ) {

        alert(
            "Receipt is available only for Paid fees."
        );

        return;

    }


    const session =
        getStudentLibraryContext();


    const libraryName =
        session?.libraryName ||
        "Adhyayn Library";


    const receiptWindow =
        window.open(
            "",
            "_blank",
            "width=800,height=700"
        );


    if (!receiptWindow) {

        alert(
            "Please allow pop-ups to print the receipt."
        );

        return;

    }


    receiptWindow.document.open();


    receiptWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <title>
                Fee Receipt - ${escapeStudentHtml(
                    student.studentCode || ""
                )}
            </title>


            <style>

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    padding: 30px;
                    background: #ffffff;
                    color: #111827;
                    font-family: Arial, sans-serif;
                }

                .receipt {
                    width: 100%;
                    max-width: 620px;
                    margin: 0 auto;
                    border: 1px solid #d1d5db;
                    padding: 28px;
                }

                .receipt-header {
                    text-align: center;
                    border-bottom: 1px solid #d1d5db;
                    padding-bottom: 18px;
                    margin-bottom: 20px;
                }

                .receipt-header h1 {
                    margin: 0 0 6px;
                    font-size: 24px;
                }

                .receipt-header p {
                    margin: 0;
                    font-size: 13px;
                    color: #6b7280;
                }

                .receipt-title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 20px;
                }

                .receipt-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 9px 0;
                    border-bottom: 1px solid #f1f5f9;
                }

                .receipt-label {
                    font-weight: 600;
                    color: #475569;
                }

                .receipt-value {
                    text-align: right;
                    font-weight: 500;
                }

                .paid {
                    display: inline-block;
                    margin-top: 20px;
                    padding: 7px 16px;
                    border: 1px solid #059669;
                    border-radius: 6px;
                    color: #059669;
                    font-weight: 700;
                }

                .print-date {
                    margin-top: 24px;
                    font-size: 12px;
                    color: #64748b;
                    text-align: center;
                }

                @media print {

                    body {
                        padding: 0;
                    }

                    .receipt {
                        border: 1px solid #999;
                    }

                }

            </style>

        </head>


        <body>

            <div class="receipt">

                <div class="receipt-header">

                    <h1>
                        ${escapeStudentHtml(
                            libraryName
                        )}
                    </h1>

                    <p>
                        Fee Payment Receipt
                    </p>

                </div>


                <div class="receipt-title">
                    PAYMENT RECEIPT
                </div>


                <div class="receipt-row">

                    <span class="receipt-label">
                        Student Code
                    </span>

                    <span class="receipt-value">
                        ${escapeStudentHtml(
                            student.studentCode || "-"
                        )}
                    </span>

                </div>


                <div class="receipt-row">

                    <span class="receipt-label">
                        Student Name
                    </span>

                    <span class="receipt-value">
                        ${escapeStudentHtml(
                            student.studentName || "-"
                        )}
                    </span>

                </div>


                <div class="receipt-row">

                    <span class="receipt-label">
                        Class
                    </span>

                    <span class="receipt-value">
                        ${escapeStudentHtml(
                            student.className || "-"
                        )}
                    </span>

                </div>


                <div class="receipt-row">

                    <span class="receipt-label">
                        Seat Number
                    </span>

                    <span class="receipt-value">
                        ${escapeStudentHtml(
                            student.seatNumber || "-"
                        )}
                    </span>

                </div>


                <div class="receipt-row">

                    <span class="receipt-label">
                        Shift
                    </span>

                    <span class="receipt-value">
                        ${escapeStudentHtml(
                            student.shift || "-"
                        )}
                    </span>

                </div>


                <div class="receipt-row">

                    <span class="receipt-label">
                        Fee Due Date
                    </span>

                    <span class="receipt-value">
                        ${escapeStudentHtml(
                            formatDateValue(
                                student.feeDueDate
                            ) || "-"
                        )}
                    </span>

                </div>


                <div style="text-align:center;">

                    <span class="paid">
                        PAID
                    </span>

                </div>


                <div class="print-date">

                    Receipt generated on
                    ${escapeStudentHtml(
                        getTodayIndianDate()
                    )}

                </div>

            </div>

        </body>

        </html>
    `);


    receiptWindow.document.close();


    receiptWindow.focus();


    setTimeout(
        function () {

            receiptWindow.print();

        },
        300
    );

}


/* ==========================================================================
   20. DELETE STUDENT
   ========================================================================== */

async function deleteStudent(studentCode) {

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


        await window.LibManageDB.student(
            session.libraryId,
            studentCode
        ).delete();


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
   21. STUDENT VIEW
   ========================================================================== */

function viewStudent(studentCode) {

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
        "\nClass: " +
        (
            student.className ||
            "-"
        ) +
        "\nSeat: " +
        (
            student.seatNumber ||
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
   22. TABLE EVENT DELEGATION
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

            /*
             * ----------------------------------------------------------
             * FEE STATUS TOGGLE
             * ----------------------------------------------------------
             */

            const feeButton =
                event.target.closest(
                    "[data-fee-toggle]"
                );


            if (feeButton) {

                toggleFeeStatus(
                    feeButton.getAttribute(
                        "data-fee-toggle"
                    )
                );

                return;

            }


            /*
             * ----------------------------------------------------------
             * RECEIPT
             * ----------------------------------------------------------
             */

            const receiptButton =
                event.target.closest(
                    "[data-student-receipt]"
                );


            if (receiptButton) {

                printFeeReceipt(
                    receiptButton.getAttribute(
                        "data-student-receipt"
                    )
                );

                return;

            }


            /*
             * ----------------------------------------------------------
             * EDIT
             * ----------------------------------------------------------
             */

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


            /*
             * ----------------------------------------------------------
             * DELETE
             * ----------------------------------------------------------
             */

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


            /*
             * ----------------------------------------------------------
             * VIEW
             * ----------------------------------------------------------
             */

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
   23. MODAL EVENTS
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
   24. SEARCH
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
   25. INITIALIZE
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
   26. GLOBAL MODULE API
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

    toggleFee:
        toggleFeeStatus,

    printReceipt:
        printFeeReceipt

};


console.log(
    "[Adhyayn] Students module loaded successfully."
);
