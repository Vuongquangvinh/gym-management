#!/usr/bin/env node

/**
 * 🚀 QUICK START - Mock Data Management
 * Interactive CLI để quản lý mock data
 */

import readline from "readline";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function printBanner() {
  console.clear();
  console.log("🎭 ═══════════════════════════════════════════════════════");
  console.log("🎭  GYM MANAGEMENT - MOCK DATA SYSTEM");
  console.log("🎭 ═══════════════════════════════════════════════════════\n");
}

function showMenu() {
  console.log("📋 Choose an option:\n");
  console.log("  1️⃣  Generate Mock Data (Seed Database)");
  console.log("  2️⃣  Cleanup All Data (Reset Database)");
  console.log("  3️⃣  View Data Statistics");
  console.log("  4️⃣  Help & Documentation");
  console.log("  5️⃣  Exit\n");
}

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = join(__dirname, scriptName);
    const child = spawn("node", [scriptPath], {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function showStats() {
  console.log("\n📊 MOCK DATA STATISTICS\n");
  console.log("When generated, you will have:");
  console.log("  👥 Users (Members): 50");
  console.log("  💼 Employees: 15 (including PTs, Admin, Staff)");
  console.log("  📦 Packages: 5 (Gym & PT packages)");
  console.log("  💰 Payment Orders: 100");
  console.log("  📄 Contracts: 80");
  console.log("  🏋️  Check-ins: 500");
  console.log("  💸 Expenses: 50");
  console.log("  📂 Expense Categories: 7");
  console.log("  ⭐ PT Reviews: 60");
  console.log("  📅 Schedules: 100");
  console.log("  🔔 Notifications: 80");
  console.log("  💳 Spending Users: 10");
  console.log("\n  📝 Total: ~1,000 documents\n");

  await pressAnyKey();
}

function showHelp() {
  console.log("\n📚 DOCUMENTATION\n");
  console.log("📖 Full guide: MOCK_DATA_GUIDE.md\n");
  console.log("Quick Commands:");
  console.log("  • node scripts/seed-mock-data.js    - Generate data");
  console.log("  • node scripts/cleanup-mock-data.js - Delete all data");
  console.log("  • node scripts/quick-start.js       - This menu\n");
  console.log("Files Created:");
  console.log("  • backend/scripts/seed-mock-data.js");
  console.log("  • backend/scripts/cleanup-mock-data.js");
  console.log("  • backend/scripts/quick-start.js");
  console.log("  • MOCK_DATA_GUIDE.md\n");

  pressAnyKey();
}

function pressAnyKey() {
  return new Promise((resolve) => {
    rl.question("\nPress ENTER to continue...", () => {
      resolve();
    });
  });
}

async function main() {
  while (true) {
    printBanner();
    showMenu();

    const answer = await new Promise((resolve) => {
      rl.question("Enter your choice (1-5): ", resolve);
    });

    console.log("");

    switch (answer.trim()) {
      case "1":
        console.log("🚀 Starting Mock Data Generation...\n");
        try {
          await runScript("seed-mock-data.js");
          console.log("\n✅ Generation completed!");
          await pressAnyKey();
        } catch (error) {
          console.error("\n❌ Error:", error.message);
          await pressAnyKey();
        }
        break;

      case "2":
        console.log("🗑️  Starting Database Cleanup...\n");
        try {
          await runScript("cleanup-mock-data.js");
          console.log("\n✅ Cleanup completed!");
          await pressAnyKey();
        } catch (error) {
          console.error("\n❌ Error:", error.message);
          await pressAnyKey();
        }
        break;

      case "3":
        await showStats();
        break;

      case "4":
        showHelp();
        break;

      case "5":
        console.log("\n👋 Goodbye!\n");
        rl.close();
        process.exit(0);
        break;

      default:
        console.log("❌ Invalid choice. Please enter 1-5.\n");
        await pressAnyKey();
    }
  }
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
