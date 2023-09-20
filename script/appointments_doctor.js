import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDocs,
    getDoc,
    where,
    collection,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import {
    signOutButton,
    isPatient
} from "./utils.js";

// Web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDeiRIFp3pz2fNxMlGCsTc-NA7GviQghZU",
    authDomain: "database-project-bd7e8.firebaseapp.com",
    projectId: "database-project-bd7e8",
    storageBucket: "database-project-bd7e8.appspot.com",
    messagingSenderId: "771888139690",
    appId: "1:771888139690:web:6b1e5ee383ec06df976fd3",
};

// Initializations of Firebase, Firebase Authentication and Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser;



// Restrict page to logged-in doctors users
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html'; // If user is not logged in, redirect to login page
    }
    if (await isPatient(user.uid, db)) {
        window.location.href = "patient.html"; // If user is a patient, redirect to patient page
    }
    currentUser = user;
    try {
        await search();
    } catch (error){
        console.error("Error while searching for appointments : ", error);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utils functions

// Handle sign-out
signOutButton(document.getElementById('sign-out'), auth);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//THIS PART TAKES CARE OF GETTING THE PATIENTS APPOINTMENT

async function search() {
    // Get the appointments  database
    const appointments = collection(db, 'usedSlots');
    // Query the Firestore database
    let answer = query(appointments,
        where('doctorId', '==', currentUser.uid));
    const querySnapshot = await getDocs(answer);

    // Display the appointments
    await displayAppointments(querySnapshot);
}


// Function to display the appointments found
async function displayAppointments(querySnapshot) {
    const appointmentsDiv = document.getElementById('appointments');
    appointmentsDiv.innerHTML = ''; // Clear previous results
    appointmentsDiv.style.visibility = 'visible';


    // Create an array to store the events for the doctor's calendar
    const events = [];

    const allPatients = await getDocs(collection(db, "patients"));
    const patientsData = new Map();
    allPatients.forEach((doc) => {
        patientsData.set(doc.id, doc.data());
    })

    // Iterate over each result
    querySnapshot.forEach((slotDoc) => {
        const slotData = slotDoc.data();
        const patientData = patientsData.get(slotData.patientId);
        if (patientData) {
            const start = new Date(slotData.slotStartTime);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            const slotTuple = {
                title: `Appointment with ${patientData.name} (${patientData.age} y.o.), \n contact : ${patientData.email}`,
                start: slotData.slotStartTime,
                end: end.toISOString(),
            };
            events.push(slotTuple);
        }
    });

    // Create a div for the calendar
    const calendarDiv = document.createElement('div');
    calendarDiv.classList.add('appointments-calendar');
    document.getElementById('appointments').appendChild(calendarDiv);


    let calendar;
    calendar = new FullCalendar.Calendar(calendarDiv, {
        events: events,
        initialView: 'listWeek',
        themeSystem: 'rounded',
        headerToolbar: {
            right: 'title',   // Customize the center section of the toolbar
            left: 'prev,next', // Customize the left section of the toolbar
        },
    });

    await calendar.render();
    return calendar;
}


