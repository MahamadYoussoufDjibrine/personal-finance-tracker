// js/firebase-config.js

// Your web app's Firebase configuration (using the values you provided)
const firebaseConfig = {
    apiKey: "AIzaSyDmqHMZJRhHZZ-S9PwbVi-FyrEAUv1epjA",
    authDomain: "personal-finance-tracker-7a83a.firebaseapp.com",
    projectId: "personal-finance-tracker-7a83a",
    storageBucket: "personal-finance-tracker-7a83a.firebasestorage.app",
    messagingSenderId: "64379939408",
    appId: "1:64379939408:web:f11283311981bddc833f55"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Get a reference to the services we will use
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage(); // Line 19: This syntax is CORRECT for v8.