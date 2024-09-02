// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDk8wI56i7zAJEpb7ZQTeXAZeiU3MNOuks",
  authDomain: "synthotime.firebaseapp.com",
  projectId: "synthotime",
  storageBucket: "synthotime.appspot.com",
  messagingSenderId: "382741622919",
  appId: "1:382741622919:web:631040bea2e51f18210822",
  measurementId: "G-35RCRC26R7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const analytics = getAnalytics(app);
const firestore = getFirestore(app);

export { app, auth, firestore, analytics };