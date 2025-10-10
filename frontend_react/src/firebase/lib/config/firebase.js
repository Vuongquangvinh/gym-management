// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxt-f5FU9Ezs0cI2R7YAhkbbuDv7sEyLM",
  authDomain: "gym-managment-aa0a1.firebaseapp.com",
  projectId: "gym-managment-aa0a1",
  storageBucket: "gym-managment-aa0a1.firebasestorage.app",
  messagingSenderId: "570047516781",
  appId: "1:570047516781:web:37d2940218d19f60ba6f64",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
console.log("Firebase App Name:", app.name); // Kiểm tra kết nối Firebase
