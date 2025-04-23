import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
const firebaseConfig = {
  apiKey: "AIzaSyAip-2cEuNHV3lq670l4RG8L1jZ2qyAoEM",
  authDomain: "userdb-67b43.firebaseapp.com",
  databaseURL:
    "https://userdb-67b43-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "userdb-67b43",
  storageBucket: "userdb-67b43.firebasestorage.app",
  messagingSenderId: "716340306235",
  appId: "1:716340306235:web:f924df28dd04e9d3acd71e",
  measurementId: "G-DQ7ND95RJF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, analytics, auth, database };
