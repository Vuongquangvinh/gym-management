// Script để kiểm tra user document trong Firestore
import admin from "firebase-admin";
import { readFileSync } from "fs";

// Khởi tạo Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    readFileSync(
      "./gym-managment-aa0a1-firebase-adminsdk-fbsvc-1138eee267.json",
      "utf8"
    )
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkUser() {
  try {
    const authUid = "Bmq7acR9SmNY4eUnkklYZZcVvrq2";

    console.log("🔍 Checking user with Auth UID:", authUid);
    console.log("─".repeat(60));

    // 1. Check by Auth UID as document ID
    const docByUid = await db.collection("users").doc(authUid).get();
    console.log("\n📄 Document by Auth UID:");
    if (docByUid.exists) {
      console.log("✅ Found!");
      console.log("Data:", docByUid.data());
    } else {
      console.log("❌ Not found");
    }

    // 2. Get Auth user info
    console.log("\n🔐 Firebase Auth User:");
    try {
      const authUser = await admin.auth().getUser(authUid);
      console.log("✅ Found in Auth!");
      console.log("  UID:", authUser.uid);
      console.log("  Email:", authUser.email);
      console.log("  Display Name:", authUser.displayName);
      console.log("  Email Verified:", authUser.emailVerified);

      // 3. Try to find by email in Firestore
      if (authUser.email) {
        console.log("\n📧 Searching Firestore by email:", authUser.email);
        const queryByEmail = await db
          .collection("users")
          .where("email", "==", authUser.email)
          .get();

        if (!queryByEmail.empty) {
          console.log(`✅ Found ${queryByEmail.size} document(s)`);
          queryByEmail.forEach((doc) => {
            console.log(`  Document ID: ${doc.id}`);
            console.log("  Data:", doc.data());
          });
        } else {
          console.log("❌ No document found with this email");
        }
      }
    } catch (authError) {
      console.log("❌ Not found in Firebase Auth:", authError.message);
    }

    // 4. List all users in Firestore
    console.log("\n📋 All users in Firestore (first 5):");
    const allUsers = await db.collection("users").limit(5).get();
    allUsers.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id}`);
      console.log(`    Email: ${data.email || "N/A"}`);
      console.log(`    Name: ${data.name || "N/A"}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkUser();
