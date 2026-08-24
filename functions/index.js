const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const {
    getFirestore,
    FieldValue
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
/* ==========================================================================
   DEMO ADMIN SETUP
   ========================================================================== */

exports.setupDemoAdmin = functions.https.onCall(
    async (data, context) => {

        const demoEmail =
            "demo@adhyayn.com";

        const demoPassword =
            "Demo@12345";

        const libraryId =
            "ADHYAYN_MAIN";


        try {

            /*
             * ----------------------------------------------------------
             * CHECK IF DEMO AUTH ACCOUNT ALREADY EXISTS
             * ----------------------------------------------------------
             */

            let user;


            try {

                user =
                    await admin
                        .auth()
                        .getUserByEmail(
                            demoEmail
                        );

            }
            catch (error) {

                if (
                    error.code ===
                    "auth/user-not-found"
                ) {

                    user =
                        await admin
                            .auth()
                            .createUser({

                                email:
                                    demoEmail,

                                password:
                                    demoPassword,

                                emailVerified:
                                    true

                            });

                }
                else {

                    throw error;

                }

            }


            /*
             * ----------------------------------------------------------
             * LIBRARY DOCUMENT
             * ----------------------------------------------------------
             */

            await db
                .collection(
                    "adhyayn_libraries"
                )
                .doc(
                    libraryId
                )
                .set({

                    libraryName:
                        "Adhyayn Library",

                    libraryId:
                        libraryId,

                    ownerUID:
                        user.uid,

                    ownerEmail:
                        demoEmail,

                    updatedAt:
                     FieldValue.serverTimestamp()

                }, {

                    merge:
                        true

                });


            /*
             * ----------------------------------------------------------
             * ADMIN PROFILE
             * ----------------------------------------------------------
             */

            await db
                .collection(
                    "adhyayn_libraries"
                )
                .doc(
                    libraryId
                )
                .collection(
                    "admins"
                )
                .doc(
                    user.uid
                )
                .set({

                    uid:
                        user.uid,

                    email:
                        demoEmail,

                    role:
                        "admin",

                    libraryId:
                        libraryId,

                    libraryName:
                        "Adhyayn Library",

                    createdAt:
                        
                            FieldValue.serverTimestamp()

                            

                }, {

                    merge:
                        true

                });


            return {

                success:
                    true,

                email:
                    demoEmail,

                password:
                    demoPassword,

                uid:
                    user.uid,

                libraryId:
                    libraryId

            };

        }
        catch (error) {

            console.error(
                "[Adhyayn] Demo Admin setup error:",
                error
            );


            throw new functions.https.HttpsError(
                "internal",
                "Unable to create Demo Admin."
            );

        }

    }
);
