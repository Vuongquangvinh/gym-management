import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { initializeApp } from "firebase/app";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(
  __dirname,
  "../../gym-managment-aa0a1-firebase-adminsdk-fbsvc-1138eee267.json"
);
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} = process.env;

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

let app;
export const initializeFirebaseApp = () => {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Error initializing Firebase app:", error);
    }
  }
  return app;
};

export const getFirebaseApp = () => app;

// Export Firestore database instance
export const db = admin.firestore();

// Export admin for direct use
export { admin };
