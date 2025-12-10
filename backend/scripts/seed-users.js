/**
 * 👥 SEED USERS MOCK DATA
 * Script tạo dữ liệu demo cho thành viên (users) đã đăng ký gói tập
 *
 * CÁCH CHẠY:
 * cd backend
 * node scripts/seed-users.js
 */

import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

// ============================================
// 🎲 HELPER FUNCTIONS
// ============================================

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(startDays, endDays) {
  const now = Date.now();
  const start = now - startDays * 24 * 60 * 60 * 1000;
  const end = now - endDays * 24 * 60 * 60 * 1000;
  return new Date(start + Math.random() * (end - start));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================
// 📦 MOCK DATA
// ============================================

const SAMPLE_NAMES = {
  male: [
    "Nguyễn Văn An",
    "Trần Minh Bình",
    "Lê Hoàng Cường",
    "Phạm Đức Duy",
    "Võ Quang Hải",
    "Hoàng Minh Long",
    "Bùi Việt Nam",
    "Đỗ Thành Phát",
    "Ngô Quang Vinh",
    "Đinh Hữu Trung",
  ],
  female: [
    "Nguyễn Thị Lan",
    "Trần Thu Hà",
    "Lê Thanh Hương",
    "Phạm Ngọc Linh",
    "Võ Thị Mai",
    "Hoàng Thị Phương",
    "Bùi Quỳnh Anh",
    "Đỗ Thị Thu",
    "Ngô Thanh Vân",
    "Đinh Thị Xuân",
  ],
};

const FITNESS_GOALS = [
  "Giảm cân",
  "Tăng cơ",
  "Tăng sức bền",
  "Cải thiện sức khỏe",
  "Tăng sức mạnh",
  "Định hình cơ thể",
  "Tăng sự linh hoạt",
];

const MEDICAL_CONDITIONS = [
  "Không có",
  "Cao huyết áp",
  "Tiểu đường",
  "Hen suyễn",
  "Chấn thương cũ ở đầu gối",
  "Đau lưng mãn tính",
];

const LEAD_SOURCES = [
  "Facebook Ads",
  "Google Ads",
  "Giới thiệu bạn bè",
  "Walk-in",
  "Instagram",
  "Zalo",
  "Event",
];

// ============================================
// 🎯 GENERATE USER DATA
// ============================================

async function getRandomPackage() {
  try {
    const packagesSnapshot = await db
      .collection("packages")
      .where("Status", "==", "active")
      .get();

    if (packagesSnapshot.empty) {
      console.log(
        "⚠️  Không tìm thấy gói tập nào. Vui lòng chạy seed-packages.js trước."
      );
      return null;
    }

    const packages = packagesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return randomChoice(packages);
  } catch (error) {
    console.error("❌ Lỗi khi lấy packages:", error);
    return null;
  }
}

function generateUser(index, packageData) {
  const isMale = Math.random() > 0.5;
  const gender = isMale ? "male" : "female";
  const names = isMale ? SAMPLE_NAMES.male : SAMPLE_NAMES.female;
  const fullName = names[index % names.length];

  // Tạo số điện thoại duy nhất
  const phoneNumber = `0${randomChoice([
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
  ])}${String(1000000 + index).substring(0, 7)}`;

  // Ngày tham gia (1-90 ngày trước)
  const joinDate = randomDate(90, 1);

  // Tính package_end_date dựa trên Duration
  const packageEndDate = addDays(joinDate, packageData.Duration);

  // Xác định membership_status
  const now = new Date();
  let membershipStatus = "Active";
  if (packageEndDate < now) {
    membershipStatus = "Expired";
  } else if (packageEndDate - now < 7 * 24 * 60 * 60 * 1000) {
    // Sắp hết hạn trong 7 ngày
    membershipStatus = "Active";
  }

  // Ngày sinh (18-65 tuổi)
  const age = randomInt(18, 65);
  const dateOfBirth = new Date();
  dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);

  // Email
  const emailName = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "");
  const email = `${emailName}${index}@gmail.com`;

  // Avatar (placeholder)
  const avatarUrl = isMale
    ? `https://i.pravatar.cc/150?img=${randomInt(10, 30)}`
    : `https://i.pravatar.cc/150?img=${randomInt(40, 60)}`;

  // Remaining sessions (nếu là gói theo buổi)
  let remainingSessions = null;
  if (packageData.NumberOfSession && packageData.NumberOfSession > 0) {
    remainingSessions = randomInt(
      Math.floor(packageData.NumberOfSession * 0.3),
      packageData.NumberOfSession
    );
  }

  // Initial measurements
  const initialMeasurements = {
    weight: randomInt(50, 90),
    height: randomInt(155, 185),
    bodyFat: randomInt(15, 35),
    muscleMass: randomInt(25, 45),
    date: joinDate,
  };

  // Fitness goals (1-3 mục tiêu ngẫu nhiên)
  const numGoals = randomInt(1, 3);
  const fitnessGoal = [];
  for (let i = 0; i < numGoals; i++) {
    const goal = randomChoice(FITNESS_GOALS);
    if (!fitnessGoal.includes(goal)) {
      fitnessGoal.push(goal);
    }
  }

  // Medical conditions
  const medicalConditions = [randomChoice(MEDICAL_CONDITIONS)];

  return {
    _id: `USER_${String(index + 1).padStart(4, "0")}`,
    full_name: fullName,
    phone_number: phoneNumber,
    email: email,
    avatar_url: avatarUrl,
    date_of_birth: admin.firestore.Timestamp.fromDate(dateOfBirth),
    gender: gender,
    membership_status: membershipStatus,
    current_package_id: packageData.PackageId,
    package_end_date: admin.firestore.Timestamp.fromDate(packageEndDate),
    remaining_sessions: remainingSessions,
    frozen_history: [],
    join_date: admin.firestore.Timestamp.fromDate(joinDate),
    assigned_staff_id: "",
    last_checkin_time: randomDate(7, 0),
    lead_source: randomChoice(LEAD_SOURCES),
    fitness_goal: fitnessGoal,
    medical_conditions: medicalConditions,
    initial_measurements: {
      ...initialMeasurements,
      date: admin.firestore.Timestamp.fromDate(initialMeasurements.date),
    },
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

// ============================================
// 🚀 SEED FUNCTION
// ============================================

async function seedUsers() {
  try {
    console.log("🎯 Bắt đầu tạo mock data cho Users...\n");

    const usersRef = db.collection("users");
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < 10; i++) {
      try {
        // Lấy package ngẫu nhiên cho mỗi user
        const packageData = await getRandomPackage();
        if (!packageData) {
          console.log("❌ Không thể tạo user do thiếu package data");
          break;
        }

        const userData = generateUser(i, packageData);

        // Kiểm tra xem user đã tồn tại chưa (theo phone_number)
        const existingQuery = await usersRef
          .where("phone_number", "==", userData.phone_number)
          .limit(1)
          .get();

        if (!existingQuery.empty) {
          console.log(
            `⏭️  Bỏ qua: ${userData.full_name} (số điện thoại đã tồn tại)`
          );
          skipped++;
          continue;
        }

        // Tạo user mới
        await usersRef.add(userData);
        console.log(
          `✅ Tạo: ${userData.full_name} - ${userData.phone_number} - Gói: ${packageData.PackageName}`
        );
        created++;
      } catch (error) {
        console.error(`❌ Lỗi khi tạo user ${i + 1}:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 HOÀN THÀNH!");
    console.log("=".repeat(50));
    console.log(`✅ Đã tạo: ${created} users`);
    console.log(`⏭️  Đã bỏ qua: ${skipped} users (đã tồn tại)`);
    console.log(`👥 Tổng cộng: 10 users\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

// Chạy seed
seedUsers();
