// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUJAwKqzF3rVKQX7ya5ptqAKlF3Qcs5V8",
  authDomain: "streamtitleai.firebaseapp.com",
  projectId: "streamtitleai",
  storageBucket: "streamtitleai.firebasestorage.app",
  messagingSenderId: "618657994144",
  appId: "1:618657994144:web:36ac0ba93d0d1e2e0640c5",
  measurementId: "G-Y3PLQQJVX7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };