/**
 * 🗑️ CLEANUP MOCK DATA
 * Script xóa toàn bộ mock data để reset database
 *
 * CÁCH CHẠY:
 * cd backend
 * node scripts/cleanup-mock-data.js
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(
    path.join(
      __dirname,
      "../gym-managment-aa0a1-firebase-adminsdk-fbsvc-1138eee267.json"
    ),
    "utf8"
  )
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Collections to clean
const COLLECTIONS = [
  "users",
  "spending_users",
  "employees",
  "packages",
  "payment_orders",
  "contracts",
  "checkins",
  "expenses",
  "expense_categories",
  "pt_reviews",
  "schedules",
  "notifications",
  "auth_users",
];

/**
 * Confirm with user before deletion
 */
async function confirmDeletion() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "\n⚠️  WARNING: This will DELETE ALL DATA from the following collections:\n" +
        COLLECTIONS.map((c) => `   - ${c}`).join("\n") +
        '\n\nAre you absolutely sure? Type "DELETE ALL" to confirm: ',
      (answer) => {
        rl.close();
        resolve(answer === "DELETE ALL");
      }
    );
  });
}

/**
 * Delete all documents in a collection
 */
async function deleteCollection(collectionName, batchSize = 100) {
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

/**
 * Main cleanup function
 */
async function cleanupDatabase() {
  console.log("🗑️  ===============================================");
  console.log("🗑️  MOCK DATA CLEANUP - Gym Management System");
  console.log("🗑️  ===============================================\n");

  try {
    // Confirm deletion
    const confirmed = await confirmDeletion();

    if (!confirmed) {
      console.log("\n❌ Cleanup cancelled by user.\n");
      process.exit(0);
    }

    console.log("\n🔥 Starting cleanup process...\n");

    let totalDeleted = 0;

    // Delete each collection
    for (let i = 0; i < COLLECTIONS.length; i++) {
      const collection = COLLECTIONS[i];
      console.log(
        `🗑️  [${i + 1}/${COLLECTIONS.length}] Deleting ${collection}...`
      );

      try {
        // Get count before deletion
        const snapshot = await db.collection(collection).count().get();
        const count = snapshot.data().count;

        if (count > 0) {
          await deleteCollection(collection);
          totalDeleted += count;
          console.log(`   ✅ Deleted ${count} documents from ${collection}`);
        } else {
          console.log(`   ⚠️  Collection ${collection} is already empty`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error deleting ${collection}: ${error.message}`);
      }

      console.log("");
    }

    // Summary
    console.log("✅ ===============================================");
    console.log("✅ CLEANUP COMPLETED!");
    console.log("✅ ===============================================\n");
    console.log(`📊 Total documents deleted: ${totalDeleted}\n`);
    console.log(
      "💡 You can now run seed-mock-data.js to generate fresh data.\n"
    );
  } catch (error) {
    console.error("\n❌ ERROR DURING CLEANUP:");
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanupDatabase();
