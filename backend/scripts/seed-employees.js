/**
 * 👔 SEED EMPLOYEES MOCK DATA
 * Script tạo dữ liệu demo cho nhân viên (employees)
 *
 * CÁCH CHẠY:
 * cd backend
 * node scripts/seed-employees.js
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
    "Mai Thanh Tùng",
    "Chu Văn Sơn",
    "Dương Minh Tâm",
    "Lý Quốc Thắng",
    "Phan Anh Tuấn",
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
    "Mai Diễm My",
    "Chu Hải Yến",
    "Dương Thu Thảo",
    "Lý Khánh Linh",
    "Phan Thu Trang",
  ],
};

const POSITIONS = [
  {
    value: "PT",
    label: "PT (Personal Trainer)",
    role: "pt",
    salary: [8000000, 15000000],
    commissionRate: [15, 30],
  },
  {
    value: "Lễ tân",
    label: "Lễ tân",
    role: "employee",
    salary: [5000000, 7000000],
    commissionRate: [0, 5],
  },
  {
    value: "Quản lý",
    label: "Quản lý",
    role: "manager",
    salary: [12000000, 20000000],
    commissionRate: [5, 10],
  },
  {
    value: "Kế toán",
    label: "Kế toán",
    role: "employee",
    salary: [7000000, 10000000],
    commissionRate: [0, 0],
  },
  {
    value: "Bảo vệ",
    label: "Bảo vệ",
    role: "employee",
    salary: [5000000, 7000000],
    commissionRate: [0, 0],
  },
  {
    value: "Vệ sinh",
    label: "Vệ sinh",
    role: "employee",
    salary: [4500000, 6000000],
    commissionRate: [0, 0],
  },
  {
    value: "Khác",
    label: "Khác",
    role: "employee",
    salary: [5000000, 8000000],
    commissionRate: [0, 5],
  },
];

const SHIFTS = ["fulltime", "parttime"];

const STATUSES = ["active", "active", "active", "inactive"]; // 75% active

const ADDRESSES = [
  "Hà Nội",
  "TP.HCM",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Biên Hòa",
  "Nha Trang",
  "Huế",
  "Vũng Tàu",
  "Thủ Đức",
];

// PT-specific data
const PT_SPECIALTIES = [
  "Giảm cân",
  "Tăng cơ",
  "Yoga",
  "Cardio",
  "Phục hồi chấn thương",
  "Powerlifting",
  "CrossFit",
  "Pilates",
  "Boxing",
];

const PT_CERTIFICATES = [
  "CPT (Certified Personal Trainer)",
  "ACE Personal Trainer",
  "NASM-CPT",
  "Yoga Instructor Level 1",
  "Yoga Instructor Level 2",
  "Nutrition Specialist",
  "First Aid & CPR",
  "Sports Nutrition",
  "Strength & Conditioning",
  "Crossfit Level 1",
];

const PT_ACHIEVEMENTS = [
  "Trainer of the Month 2024",
  "Best PT Award 2023",
  "100+ Happy Clients",
  "Top Revenue Generator Q3 2024",
  "Client Transformation Champion",
  "5-Star Rating Achievement",
];

const AVAILABLE_HOURS = [
  "06:00-08:00",
  "08:00-10:00",
  "10:00-12:00",
  "14:00-16:00",
  "16:00-18:00",
  "18:00-20:00",
  "20:00-22:00",
];

const LANGUAGES = ["vi", "en"];

// ============================================
// 🎯 GENERATE EMPLOYEE DATA
// ============================================

function generateEmployee(index, positionData) {
  const isMale = Math.random() > 0.4; // 60% nam, 40% nữ
  const gender = isMale ? "male" : "female";
  const names = isMale ? SAMPLE_NAMES.male : SAMPLE_NAMES.female;
  const fullName = names[index % names.length];

  // Tạo số điện thoại duy nhất
  const phoneNumber = `0${randomChoice([
    "70",
    "77",
    "78",
    "79",
    "90",
    "91",
    "92",
    "93",
  ])}${String(7000000 + index).substring(0, 7)}`;

  // Tạo email từ tên
  const emailName = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, ".");
  const email = `${emailName}${index}@gmail.com`;

  // Ngày sinh (22-55 tuổi)
  const age = randomInt(22, 55);
  const dateOfBirth = new Date();
  dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);

  // Ngày bắt đầu làm việc (1 tháng - 5 năm trước)
  const startDate = randomDate(1825, 30); // 5 năm = 1825 ngày

  // CCCD (12 số)
  const idCard = String(randomInt(100000000000, 999999999999));

  // Avatar placeholder
  const avatarUrl = isMale
    ? `https://i.pravatar.cc/150?img=${randomInt(10, 30)}`
    : `https://i.pravatar.cc/150?img=${randomInt(40, 60)}`;

  // Salary và commission dựa vào position
  const salary = randomInt(positionData.salary[0], positionData.salary[1]);
  const commissionRate = randomInt(
    positionData.commissionRate[0],
    positionData.commissionRate[1]
  );

  const employeeData = {
    fullName,
    gender,
    dateOfBirth: admin.firestore.Timestamp.fromDate(dateOfBirth),
    phone: phoneNumber,
    email,
    address: randomChoice(ADDRESSES),
    position: positionData.value,
    startDate: admin.firestore.Timestamp.fromDate(startDate),
    status: randomChoice(STATUSES),
    shift: randomChoice(SHIFTS),
    role: positionData.role,
    salary,
    commissionRate,
    totalClients: positionData.value === "PT" ? randomInt(0, 15) : 0,
    avatarUrl,
    idCard,
    notes: "",
    faceRegistered: Math.random() > 0.7, // 30% đã đăng ký khuôn mặt
    uid: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Thêm ptInfo nếu là PT
  if (positionData.value === "PT") {
    const numSpecialties = randomInt(2, 4);
    const specialties = [];
    for (let i = 0; i < numSpecialties; i++) {
      const specialty = randomChoice(PT_SPECIALTIES);
      if (!specialties.includes(specialty)) {
        specialties.push(specialty);
      }
    }

    const numCertificates = randomInt(2, 5);
    const certificates = [];
    const usedCerts = new Set();
    for (let i = 0; i < numCertificates; i++) {
      const cert = randomChoice(PT_CERTIFICATES);
      if (!usedCerts.has(cert)) {
        certificates.push({
          id: `cert_${Date.now()}_${i}`,
          text: cert,
          images: [],
        });
        usedCerts.add(cert);
      }
    }

    const numAchievements = randomInt(1, 3);
    const achievements = [];
    const usedAchievements = new Set();
    for (let i = 0; i < numAchievements; i++) {
      const achievement = randomChoice(PT_ACHIEVEMENTS);
      if (!usedAchievements.has(achievement)) {
        achievements.push({
          id: `ach_${Date.now()}_${i}`,
          text: achievement,
          images: [],
        });
        usedAchievements.add(achievement);
      }
    }

    const numHours = randomInt(2, 4);
    const availableHours = [];
    for (let i = 0; i < numHours; i++) {
      const hour = randomChoice(AVAILABLE_HOURS);
      if (!availableHours.includes(hour)) {
        availableHours.push(hour);
      }
    }

    const hasEnglish = Math.random() > 0.6; // 40% biết tiếng Anh
    const languages = hasEnglish ? ["vi", "en"] : ["vi"];

    employeeData.ptInfo = {
      specialties,
      experience: randomInt(1, 10),
      rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
      totalRatings: randomInt(5, 100),
      bio: `PT chuyên nghiệp với ${randomInt(
        1,
        10
      )} năm kinh nghiệm. Chuyên về ${specialties.slice(0, 2).join(", ")}.`,
      certificates,
      availableHours,
      maxClientsPerDay: randomInt(6, 10),
      isAcceptingNewClients: Math.random() > 0.2, // 80% nhận khách mới
      languages,
      achievements,
      socialMedia: {
        facebook: Math.random() > 0.5 ? `fb.com/${emailName}` : "",
        instagram: Math.random() > 0.5 ? `@${emailName}` : "",
        youtube: "",
        tiktok: "",
      },
    };
  }

  return employeeData;
}

// ============================================
// 🚀 SEED FUNCTION
// ============================================

async function seedEmployees() {
  try {
    console.log("🎯 Bắt đầu tạo mock data cho Employees...\n");

    const employeesRef = db.collection("employees");
    let created = 0;
    let skipped = 0;

    // Tạo 10 nhân viên với các vị trí khác nhau
    let index = 0;

    // Danh sách vị trí cho 10 nhân viên
    const employeePositions = [
      "Quản lý", // 1
      "PT", // 2
      "PT", // 3
      "PT", // 4
      "Lễ tân", // 5
      "Lễ tân", // 6
      "Kế toán", // 7
      "Bảo vệ", // 8
      "Vệ sinh", // 9
      "Khác", // 10
    ];

    for (const position of employeePositions) {
      const positionData = POSITIONS.find((p) => p.value === position);
      const employeeData = generateEmployee(index++, positionData);

      const existingQuery = await employeesRef
        .where("phone", "==", employeeData.phone)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        console.log(
          `⏭️  Bỏ qua: ${employeeData.fullName} (số điện thoại đã tồn tại)`
        );
        skipped++;
        continue;
      }

      await employeesRef.add(employeeData);
      console.log(
        `✅ Tạo: ${employeeData.fullName} - ${employeeData.position} (${employeeData.role})`
      );
      created++;
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 HOÀN THÀNH!");
    console.log("=".repeat(50));
    console.log(`✅ Đã tạo: ${created} employees`);
    console.log(`⏭️  Đã bỏ qua: ${skipped} employees (đã tồn tại)`);
    console.log(`👔 Tổng cộng: ${created + skipped} employees\n`);

    // Thống kê theo vị trí
    console.log("📊 Thống kê theo vị trí:");
    const allEmployees = await employeesRef.get();
    const positionStats = {};
    allEmployees.forEach((doc) => {
      const data = doc.data();
      positionStats[data.position] = (positionStats[data.position] || 0) + 1;
    });
    Object.entries(positionStats).forEach(([position, count]) => {
      console.log(`   ${position}: ${count} người`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

// Chạy seed
seedEmployees();
