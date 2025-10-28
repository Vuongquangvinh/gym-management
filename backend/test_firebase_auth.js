// Script để test Firebase Admin SDK authentication
// Run: node test_firebase_auth.js

import admin from "firebase-admin";
import { readFileSync } from "fs";

console.log("🧪 Testing Firebase Admin SDK Authentication...\n");

try {
  // Load service account
  const serviceAccount = JSON.parse(
    readFileSync(
      "./gym-managment-aa0a1-firebase-adminsdk-fbsvc-66a43312d0.json",
      "utf8"
    )
  );

  console.log("✅ Service account file loaded");
  console.log("📋 Project ID:", serviceAccount.project_id);
  console.log("📧 Client Email:", serviceAccount.client_email);
  console.log("🔑 Private Key ID:", serviceAccount.private_key_id);
  console.log("");

  // Initialize Admin SDK
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized");
  }

  // Test Firestore access
  console.log("🔍 Testing Firestore access...");
  const db = admin.firestore();

  // Try to list collections
  const collections = await db.listCollections();
  console.log("✅ Firestore accessible!");
  console.log("📚 Collections:", collections.map((c) => c.id).join(", "));

  console.log("\n✅ ALL TESTS PASSED - Firebase Admin SDK is working!");
  process.exit(0);
} catch (error) {
  console.error("\n❌ TEST FAILED");
  console.error("Error:", error.message);
  console.error("Code:", error.code);

  if (error.code === 16 || error.message.includes("UNAUTHENTICATED")) {
    console.error("\n🔥 AUTHENTICATION ISSUE DETECTED");
    console.error("\n💡 SOLUTIONS:");
    console.error("1. Download NEW service account key from Firebase Console:");
    console.error(
      "   https://console.firebase.google.com/project/gym-managment-aa0a1/settings/serviceaccounts/adminsdk"
    );
    console.error("");
    console.error("2. Make sure Firestore is enabled in Firebase Console:");
    console.error(
      "   https://console.firebase.google.com/project/gym-managment-aa0a1/firestore"
    );
    console.error("");
    console.error("3. Check if service account has Firestore permissions:");
    console.error(
      "   Go to Google Cloud Console > IAM & Admin > Service Accounts"
    );
    console.error(
      '   Make sure the service account has "Firebase Admin" or "Cloud Datastore User" role'
    );
  }

  process.exit(1);
}
