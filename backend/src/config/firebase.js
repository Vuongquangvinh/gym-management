import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { initializeApp } from "firebase/app";
import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple possible locations for service account
const possiblePaths = [
  path.resolve(
    __dirname,
    "../../gym-managment-aa0a1-firebase-adminsdk-fbsvc-5689d59345.json"
  ),
  path.resolve(
    process.cwd(),
    "gym-managment-aa0a1-firebase-adminsdk-fbsvc-5689d59345.json"
  ),
  path.resolve(
    process.cwd(),
    "backend",
    "gym-managment-aa0a1-firebase-adminsdk-fbsvc-5689d59345.json"
  ),
];

console.log("🔥 Initializing Firebase Admin SDK...");

let serviceAccountPath = null;
for (const testPath of possiblePaths) {
  if (existsSync(testPath)) {
    serviceAccountPath = testPath;
    console.log("✅ Found service account at:", testPath);
    break;
  }
}

if (!serviceAccountPath) {
  console.error("❌ Service account file not found in any of these locations:");
  possiblePaths.forEach((p) => console.error("  -", p));
  throw new Error("Firebase service account file not found");
}

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

  console.log("✅ Service account loaded successfully");
  console.log("📋 Project ID:", serviceAccount.project_id);
  console.log("📋 Client Email:", serviceAccount.client_email);

  // Delete any existing apps first to avoid conflicts
  if (admin.apps.length > 0) {
    console.log("⚠️ Deleting existing Firebase Admin apps...");
    admin.apps.forEach((app) => {
      if (app) app.delete();
    });
  }

  // Initialize with full config
  const adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
  });

  console.log("✅ Firebase Admin SDK initialized successfully");
  console.log("📋 Admin App Name:", adminApp.name);

  // Test Firestore connection immediately
  const db = admin.firestore();
  console.log("✅ Firestore instance created");

  // Try a simple operation to verify auth
  db.collection("_test_connection_")
    .limit(1)
    .get()
    .then(() => {
      console.log("✅ Firestore connection verified - Authentication working!");
    })
    .catch((error) => {
      console.error("❌ Firestore connection test failed:");
      console.error("   Error code:", error.code);
      console.error("   Error message:", error.message);
      console.error(
        "⚠️ This means Firebase Admin SDK is NOT properly authenticated"
      );
    });
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error);
  console.error("Stack trace:", error.stack);
  throw error;
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

// Export admin for use in other modules
export { admin };
export default admin;
