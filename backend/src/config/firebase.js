import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { initializeApp } from "firebase/app";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(
  __dirname,
  "../../gym-managment-aa0a1-firebase-adminsdk-fbsvc-66a43312d0.json"
);

console.log("📍 Service account path:", serviceAccountPath);

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  console.log("✅ Service account loaded successfully");
  console.log("Project ID:", serviceAccount.project_id);
} catch (error) {
  console.error("❌ Error loading service account:", error.message);
  throw error;
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });
    console.log("✅ Firebase Admin SDK initialized successfully");
    console.log(
      "Database URL:",
      `https://${serviceAccount.project_id}.firebaseio.com`
    );
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error);
    throw error;
  }
} else {
  console.log("⚠️ Firebase Admin SDK already initialized");
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

// Export admin SDK
export default admin;
