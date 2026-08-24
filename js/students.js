/**
 * ==========================================================================
 * LIBMANAGE - STUDENT DIRECTORY MODULE
 * ==========================================================================
 *
 * CURRENT STUDENT FORM:
 * - Student Name
 * - Student Email
 * - Class
 * - Seat Number
 * - Mobile Number
 * - Shift
 * - Joining Date
 * - Fee Due Date
 *
 * NO:
 * - Password
 * - Father's Name
 * - Expiry Date
 * - Manual Status field
 *
 * FEE STATUS:
 * - Paid / Due
 * - Clickable from student table
 * - Paid => Receipt button
 *
 * FIRESTORE:
 * libcontrol_libraries
 *   └── LIB-XXXXXX
 *       └── students
 *
 * IMPORTANT:
 * - Uses LibManageDB when available.
 * - Has direct Firestore fallback.
 * - Never uses old saas_libraries structure.
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
   3. CURRENT LIBRARY SESSION
   ========================================================================== */

function getStudentLibraryContext() {

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
        session.role !== "admin" ||
        !session.libraryId
    ) {

        return null;

    }


    return session;

}


/* ==========================================================================
   4. CURRENT LIBRARY ID
   ========================================================================== */

function getStudentLibraryId() {

    const session =
        getStudentLibraryContext();


    if (!session) {

        return "";

    }


    return String(
        session.libraryId
    )
        .trim()
        .toUpperCase();

}


/* ==========================================================================
   5. STUDENTS FIRESTORE REFERENCE
   ========================================================================== */

function getStudentsCollectionRef() {

    const libraryId =
        getStudentLibraryId();


    if (!libraryId) {

        return null;

    }


    /*
     * --------------------------------------------------------------
     * FIRST: USE CURRENT LibManageDB API
     * --------------------------------------------------------------
     */

    if (
        window.LibManageDB &&
        typeof window.LibManageDB.students ===
        "function"
    ) {

        try {

            const reference =
                window.LibManageDB.students(
                    libraryId
                );


            if (reference) {

                return reference;

            }

        }
        catch (error) {

            console.warn(
                "[Students] LibManageDB.students failed:",
                error
            );

        }

    }


    /*
     * --------------------------------------------------------------
     * FALLBACK: DIRECT CURRENT FIRESTORE STRUCTURE
     * --------------------------------------------------------------
     */

    if (
        window.db &&
        typeof window.db.collection ===
        "function"
    ) {

        return window.db
            .collection(
                "libcontrol_libraries"
            )
            .doc(
                libraryId
            )
            .collection(
                "students"
            );

    }


    return null;

}


/* ==========================================================================
   6. SINGLE STUDENT REFERENCE
   ========================================================================== */

function getStudentReference(
    studentCode
) {

    const collection =
        getStudentsCollectionRef();


    if (!collection) {

        return null;

    }


    return collection.doc(
        String(
            studentCode
        )
            .trim()
            .toUpperCase()
    );

}


/* ==========================================================================
   7. STUDENT CODE GENERATOR
   ========================================================================== */

function generateStudentCode() {

    let highestNumber =
        0;


    studentRecords.forEach(
        (student) => {

            const code =
                String(
                    student.studentCode ||
                    ""
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
        )
            .padStart(
                2,
                "0"
            )
    );

}


/* ==========================================================================
   8. DATE VALIDATION
   ========================================================================== */

function isValidDateFormat(
    value
) {

    const date =
        String(
            value || ""
        )
            .trim();


    if (
        !/^\d{2}\/\d{2}\/\d{4}$/.test(
            date
        )
    ) {

        return false;

    }


    const parts =
        date.split(
            "/"
        );


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
        day < 1 ||
        month < 1 ||
        month > 12
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
   9. PARSE INDIAN DATE
   ========================================================================== */

function parseIndianDate(
    value
) {

    if (
        !isValidDateFormat(
            value
        )
    ) {

        return null;

    }


    const parts =
        value.split(
            "/"
        );


    return new Date(
        parseInt(
            parts[2],
            10
        ),
        parseInt(
            parts[1],
            10
        ) - 1,
        parseInt(
            parts[0],
            10
        )
    );

}


/* ==========================================================================
   10. FORMAT DATE
   ========================================================================== */

function formatDateValue(
    value
) {

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
            ).padStart(
                2,
                "0"
            ) +
            "/" +
            String(
                value.getMonth() + 1
            ).padStart(
                2,
                "0"
            ) +
            "/" +
            value.getFullYear()
        );

    }


    return String(
        value
    );

}


/* ==========================================================================
   11. ESCAPE HTML
   ========================================================================== */

function escapeStudentHtml(
    value
) {

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
   12. CURRENT FEE STATUS
   ========================================================================== */

function getStudentFeeStatus(
    student
) {

    const value =
        String(
            student.feeStatus ||
            "Paid"
        )
            .trim()
            .toLowerCase();


    return value === "due"
        ? "Due"
        : "Paid";

}


/* ==========================================================================
   13. CURRENT STUDENT STATUS
   ==========================================================================
 *
 * Since Expiry Date / Status were removed from the form,
 * status is kept only for compatibility with old records.
 *
 * New students are saved as Active.
 */

function getStudentStatus(
    student
) {

    const stored =
        String(
            student.status ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        stored === "expired"
    ) {

        return "Expired";

    }


    return "Active";

}


/* ==========================================================================
   14. LOAD STUDENTS
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


    const studentsCollection =
        getStudentsCollectionRef();


    if (!studentsCollection) {

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
                                a.studentName ||
                                ""
                            )
                                .toLowerCase();


                        const bName =
                            String(
                                b.studentName ||
                                ""
                            )
                                .toLowerCase();


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
   15. RENDER TABLE
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


    let html =
        "";


    filteredStudents.forEach(
        (student) => {

            const feeStatus =
                getStudentFeeStatus(
                    student
                );


            const feeClass =
                feeStatus === "Due"
                    ? "expired"
                    : "active";


            const status =
                getStudentStatus(
                    student
                );


            const statusClass =
                status === "Expired"
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

                        <button
                            type="button"
                            class="status-tag ${feeClass}"
                            data-fee-toggle="${escapeStudentHtml(
                                student.studentCode ||
                                ""
                            )}"
                            title="Click to change fee status"
                            style="
                                border:0;
                                cursor:pointer;
                                font:inherit;
                            "
                        >
                            ${feeStatus}
                        </button>


                        ${
                            feeStatus === "Paid"
                                ? `
                                    <button
                                        type="button"
                                        class="action-icon-btn receipt-btn"
                                        data-fee-receipt="${escapeStudentHtml(
                                            student.studentCode ||
                                            ""
                                        )}"
                                        title="Print Fee Receipt"
                                    >
                                        Receipt
                                    </button>
                                `
                                : ""
                        }

                    </td>


                    <td>

                        <span
                            class="status-tag ${statusClass}"
                        >
                            ${escapeStudentHtml(
                                status
                            )}
                        </span>

                    </td>


                    <td>

                        <div class="actions-cell-wrapper">

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
   16. RESET FORM
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

        editIndex.value =
            "";

    }


    if (studentCode) {

        studentCode.value =
            "";

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
   17. OPEN ADD MODAL
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

        codeHidden.value =
            code;

    }


    if (codePreview) {

        codePreview.textContent =
            code;

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
            ).padStart(
                2,
                "0"
            ) +
            "/" +
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            ) +
            "/" +
            now.getFullYear();

    }


    modal.classList.add(
        "active"
    );

}


/* ==========================================================================
   18. OPEN EDIT MODAL
   ========================================================================== */

function openEditStudentModal(
    studentCode
) {

    const student =
        studentRecords.find(
            (item) =>
                String(
                    item.studentCode ||
                    ""
                ).toUpperCase() ===
                String(
                    studentCode ||
                    ""
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
            student.studentCode ||
            "";

    }


    const nameInput =
        studentElement(
            "std-name"
        );


    const emailInput =
        studentElement(
            "std-email"
        );


    const classInput =
        studentElement(
            "std-class"
        );


    const seatInput =
        studentElement(
            "std-seat"
        );


    const mobileInput =
        studentElement(
            "std-mobile"
        );


    const shiftInput =
        studentElement(
            "std-shift"
        );


    const joiningInput =
        studentElement(
            "std-joining"
        );


    const feeDueInput =
        studentElement(
            "std-fee-due-date"
        );


    if (nameInput) {

        nameInput.value =
            student.studentName ||
            "";

    }


    if (emailInput) {

        emailInput.value =
            student.email ||
            "";

    }


    if (classInput) {

        classInput.value =
            student.className ||
            "";

    }


    if (seatInput) {

        seatInput.value =
            student.seatNumber ||
            "";

    }


    if (mobileInput) {

        mobileInput.value =
            student.mobileNumber ||
            "";

    }


    if (shiftInput) {

        shiftInput.value =
            student.shift ||
            "";

    }


    if (joiningInput) {

        joiningInput.value =
            formatDateValue(
                student.joiningDate
            );

    }


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
            student.studentCode ||
            "";

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
   19. CLOSE MODAL
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
   20. VALIDATE FORM
   ========================================================================== */

function validateStudentForm() {

    const name =
        studentElement(
            "std-name"
        )?.value.trim() ||
        "";


    const email =
        studentElement(
            "std-email"
        )?.value.trim().toLowerCase() ||
        "";


    const className =
        studentElement(
            "std-class"
        )?.value.trim() ||
        "";


    const seat =
        studentElement(
            "std-seat"
        )?.value.trim() ||
        "";


    const mobile =
        studentElement(
            "std-mobile"
        )?.value.trim() ||
        "";


    const shift =
        studentElement(
            "std-shift"
        )?.value ||
        "";


    const joining =
        studentElement(
            "std-joining"
        )?.value.trim() ||
        "";


    const feeDueDate =
        studentElement(
            "std-fee-due-date"
        )?.value.trim() ||
        "";


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
   21. SAVE STUDENT
   ========================================================================== */

async function saveStudent(
    event
) {

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
            "#student-form button[type='submit']"
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

        const studentsCollection =
            getStudentsCollectionRef();


        if (!studentsCollection) {

            throw new Error(
                "Database is not available."
            );

        }


        const reference =
            studentsCollection.doc(
                code
            );


        const data =
            validation.data;


        /*
         * --------------------------------------------------------------
         * SEAT DUPLICATE CHECK
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
                            .trim()
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

            feeStatus:
                "Paid",

            status:
                "Active",

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
            "Student saved successfully.\n\n" +
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
   22. TOGGLE FEE STATUS
   ========================================================================== */

async function toggleStudentFeeStatus(
    studentCode
) {

    const student =
        studentRecords.find(
            (item) =>
                String(
                    item.studentCode ||
                    ""
                ).toUpperCase() ===
                String(
                    studentCode ||
                    ""
                ).toUpperCase()
        );


    if (!student) {

        return;

    }


    const reference =
        getStudentReference(
            studentCode
        );


    if (!reference) {

        alert(
            "Database is not available."
        );

        return;

    }


    const currentStatus =
        getStudentFeeStatus(
            student
        );


    const newStatus =
        currentStatus === "Paid"
            ? "Due"
            : "Paid";


    try {

        await reference.update({

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
   23. PRINT FEE RECEIPT
   ========================================================================== */

function printFeeReceipt(
    studentCode
) {

    const student =
        studentRecords.find(
            (item) =>
                String(
                    item.studentCode ||
                    ""
                ).toUpperCase() ===
                String(
                    studentCode ||
                    ""
                ).toUpperCase()
        );


    if (!student) {

        alert(
            "Student record not found."
        );

        return;

    }


    if (
        getStudentFeeStatus(
            student
        ) !== "Paid"
    ) {

        alert(
            "Receipt is available only for Paid fee."
        );

        return;

    }


    const libraryName =
        getStudentLibraryContext()?.libraryName ||
        "Library";


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


    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>

            <title>Fee Receipt</title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    color: #111;
                }

                .receipt {
                    max-width: 650px;
                    margin: auto;
                    border: 1px solid #ccc;
                    padding: 30px;
                }

                h1 {
                    margin: 0 0 5px;
                    text-align: center;
                }

                h2 {
                    text-align: center;
                    margin-top: 5px;
                }

                .line {
                    border-top: 1px solid #ccc;
                    margin: 20px 0;
                }

                .row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                }

                .label {
                    font-weight: 600;
                }

                .paid {
                    font-weight: bold;
                }

                .footer {
                    margin-top: 35px;
                    text-align: center;
                    font-size: 13px;
                }

            </style>

        </head>

        <body>

            <div class="receipt">

                <h1>
                    ${escapeStudentHtml(
                        libraryName
                    )}
                </h1>

                <h2>
                    Fee Receipt
                </h2>

                <div class="line"></div>

                <div class="row">
                    <span class="label">
                        Student Name
                    </span>

                    <span>
                        ${escapeStudentHtml(
                            student.studentName ||
                            "-"
                        )}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Student Code
                    </span>

                    <span>
                        ${escapeStudentHtml(
                            student.studentCode ||
                            "-"
                        )}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Seat Number
                    </span>

                    <span>
                        ${escapeStudentHtml(
                            student.seatNumber ||
                            "-"
                        )}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Class
                    </span>

                    <span>
                        ${escapeStudentHtml(
                            student.className ||
                            "-"
                        )}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Shift
                    </span>

                    <span>
                        ${escapeStudentHtml(
                            student.shift ||
                            "-"
                        )}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Fee Due Date
                    </span>

                    <span>
                        ${escapeStudentHtml(
                            formatDateValue(
                                student.feeDueDate
                            ) ||
                            "-"
                        )}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Fee Status
                    </span>

                    <span class="paid">
                        PAID
                    </span>
                </div>

                <div class="line"></div>

                <div class="footer">
                    Fee payment receipt
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
   24. DELETE STUDENT
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
                    item.studentCode ||
                    ""
                ).toUpperCase() ===
                String(
                    studentCode ||
                    ""
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

        /*
         * --------------------------------------------------------------
         * SAVE HISTORY
         * --------------------------------------------------------------
         */

        const historyReference =
            window.db
                .collection(
                    "libcontrol_libraries"
                )
                .doc(
                    getStudentLibraryId()
                )
                .collection(
                    "student_history"
                )
                .doc(
                    String(
                        studentCode
                    )
                        .trim()
                        .toUpperCase()
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
                getStudentLibraryId(),

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


        const reference =
            getStudentReference(
                studentCode
            );


        if (!reference) {

            throw new Error(
                "Student database reference unavailable."
            );

        }


        await reference.delete();


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
   25. STUDENT VIEW
   ========================================================================== */

function viewStudent(
    studentCode
) {

    const student =
        studentRecords.find(
            (item) =>
                String(
                    item.studentCode ||
                    ""
                ).toUpperCase() ===
                String(
                    studentCode ||
                    ""
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
        "\nJoining Date: " +
        (
            formatDateValue(
                student.joiningDate
            ) ||
            "-"
        ) +
        "\nFee Due Date: " +
        (
            formatDateValue(
                student.feeDueDate
            ) ||
            "-"
        ) +
        "\nFee Status: " +
        getStudentFeeStatus(
            student
        )
    );

}


/* ==========================================================================
   26. TABLE ACTIONS
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

            const feeToggle =
                event.target.closest(
                    "[data-fee-toggle]"
                );


            if (feeToggle) {

                toggleStudentFeeStatus(
                    feeToggle.getAttribute(
                        "data-fee-toggle"
                    )
                );

                return;

            }


            const receiptButton =
                event.target.closest(
                    "[data-fee-receipt]"
                );


            if (receiptButton) {

                printFeeReceipt(
                    receiptButton.getAttribute(
                        "data-fee-receipt"
                    )
                );

                return;

            }


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
   27. MODAL EVENTS
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
   28. SEARCH
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
   29. INITIALIZE
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
   30. PUBLIC API
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
        toggleStudentFeeStatus,

    printReceipt:
        printFeeReceipt

};


console.log(
    "[LibManage] Students module loaded successfully."
);
