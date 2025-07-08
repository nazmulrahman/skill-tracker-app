// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBer8TYgR0Fz5awRkq87XZZESvRRulXJg",
  authDomain: "nyza-skill-tracker.firebaseapp.com",
  projectId: "nyza-skill-tracker",
  storageBucket: "nyza-skill-tracker.firebasestorage.app",
  messagingSenderId: "68269769502",
  appId: "1:68269769502:web:d16c21b6194aff4fba3f0f",
  measurementId: "G-1TW5QSH7S5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);