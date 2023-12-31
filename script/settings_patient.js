import {initializeApp} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import {
    getAuth,
    updateEmail,
    updateProfile,
    updatePassword,
    onAuthStateChanged,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    updateDoc,
    deleteDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import {isDoctor, signOutButton} from "./utils.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDeiRIFp3pz2fNxMlGCsTc-NA7GviQghZU",
    authDomain: "database-project-bd7e8.firebaseapp.com",
    projectId: "database-project-bd7e8",
    storageBucket: "database-project-bd7e8.appspot.com",
    messagingSenderId: "771888139690",
    appId: "1:771888139690:web:6b1e5ee383ec06df976fd3",
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utils functions 

// Handle sign-out
signOutButton(document.getElementById('sign-out'), auth);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////


let currentUser;

// Restrict page to logged-in users
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;

        if (await isDoctor(user.uid, db)) {
            window.location.href = "settings_doctor.html"; // If user is a doctor, redirect to doctor page
        }

        // Fill form fields with current data
        document.getElementById('new-email').value = currentUser.email;
        document.getElementById('new-name').value = currentUser.displayName;
        getDoc(doc(db, "patients", currentUser.uid)).then((doc) => {
            if (doc.exists()) {
                document.getElementById('new-age').value = doc.data().age;
            } else {
                console.log("No such document!");
            }
        })

    } else {
        window.location = 'index.html'; // If user is not logged in, redirect to login page
    }
});

// Handle back button redirection
document.getElementById("button-back").addEventListener("click", function() {
    window.location.href = "patient.html";
})

// Handle email change
document
    .getElementById('email-form')
    .addEventListener('submit', async (event) => {
        event.preventDefault()

        const newEmail = document.getElementById('new-email').value;

        updateEmail(currentUser, newEmail)
            .then(async () => {

                // Changing user email field in Firestore
                await updateDoc(doc(db, "patients", currentUser.uid), {
                    email: newEmail
                })

                console.log(`Email changed successfully to ${newEmail}.`)
                // Clear any previous error messages
                document.getElementById("email-error").textContent = "";
                //  Display successful login message
                document.getElementById("email-success").textContent =
                    "Email changed successfully !";
            })
            .catch((error) => {
                console.error("Email change failed : ", error.message);
                // Clear any previous succeful error message
                document.getElementById("email-success").textContent = "";
                // Display error message
                document.getElementById("email-error").textContent = "Email change failed."
            });
    })

// Handle password change
document
    .getElementById('password-form')
    .addEventListener('submit', async (event) => {

        event.preventDefault();
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);

        reauthenticateWithCredential(currentUser, credential).then(() => {
            // User re-authenticated.
            updatePassword(currentUser, newPassword)
                .then(async () => {
                    console.log(`Password changed successfully.`)
                    // Clear any previous error messages
                    document.getElementById("password-error").textContent = "";
                    //  Display successful login message
                    document.getElementById("password-success").textContent = "Password changed successfully !";
                })
                .catch((error) => {
                    console.error("Password change failed : ", error.message);
                    // Clear any previous succeful error message
                    document.getElementById("password-success").textContent = "";
                    // Display error message
                    document.getElementById("password-error").textContent = "Password change failed."
                })
        }).catch((error) => {
            console.error("Re-authentication failed : ", error.message);
            // Clear any previous succeful error message
            document.getElementById("password-success").textContent = "";
            // Display error message
            document.getElementById("password-error").textContent = "The old password you entered is wrong."
        });
    })


// Handle name change
document
    .getElementById('name-form')
    .addEventListener('submit', async (event) => {
        event.preventDefault()

        const newName = document.getElementById('new-name').value;

        updateProfile(currentUser, {displayName : newName})
            .then(async () => {

                // Changing name field in Firestore
                await updateDoc(doc(db, "patients", currentUser.uid), {
                    name: newName
                })

                console.log(`Name changed successfully to ${newName}.`)
                // Clear any previous error messages
                document.getElementById("name-error").textContent = "";
                //  Display successful login message
                document.getElementById("name-success").textContent =
                    "Name changed successfully !";
            })
            .catch((error) => {
                console.error("Name change failed : ", error.message);
                // Clear any previous succeful error message
                document.getElementById("name-success").textContent = "";
                // Display error message
                document.getElementById("name-error").textContent = "Name change failed."
            });
    })

// Handle age change
document
    .getElementById('age-form')
    .addEventListener('submit', async (event) => {
        event.preventDefault()
        const newAge = document.getElementById('new-age').value;
        // Changing age in Firestore
        await updateDoc(doc(db, "patients", currentUser.uid), {
            age: newAge
        }).then(() => {
            console.log(`Age changed successfully to ${newAge}.`)
            // Clear any previous error messages
            document.getElementById("age-error").textContent = "";
            //  Display successful login message
            document.getElementById("age-success").textContent =
                "Age changed successfully !";
        }).catch((error) => {
            console.error("Name change failed : ", error.message);
            // Clear any previous succeful error message
            document.getElementById("age-success").textContent = "";
            // Display error message
            document.getElementById("age-error").textContent = "Age change failed."
        })
    })

// Handle account deletion
document
    .getElementById("delete-button")
    .addEventListener('click', async (event) => {
        event.preventDefault()
        if(confirm("Are you sure you want to delete your account ?")){

            const password = document.getElementById('current-password').value;
            const credential = EmailAuthProvider.credential(currentUser.email, password);

            reauthenticateWithCredential(currentUser, credential).then(async() => {

                // Delete account in Firestore
                await deleteDoc(doc(db, "patients", currentUser.uid)).then(() => {
                    console.log("User successfully deleted from Firestore.")
                }).catch((error) => {
                    console.error("Account deletion from Firestore failed : ", error.message)
                })

                currentUser.delete()
                    .then(async () => {
                        console.log("User account successfully deleted.")
                    }).catch((error) => {
                    console.error("Account deletion failed : ", error.message);
                })

            }).catch((error) => {
                console.error("Re-authentication failed : ", error.message);
                // Clear any previous successful error message
                document.getElementById("delete-success").textContent = "";
                // Display error message
                document.getElementById("delete-error").textContent = "The password you entered is wrong."
            });
        }
    })