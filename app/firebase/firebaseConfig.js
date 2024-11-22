// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDllPuUabosWXG7XmNrkm8UFQquGv4-A4",
  authDomain: "app-restaurant-a6370.firebaseapp.com",
  projectId: "app-restaurant-a6370",
  storageBucket: "app-restaurant-a6370.firebasestorage.app",
  messagingSenderId: "440903464604",
  appId: "1:440903464604:web:1bd7a444de550870391f59",
  measurementId: "G-HPWLGNB53F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { app };