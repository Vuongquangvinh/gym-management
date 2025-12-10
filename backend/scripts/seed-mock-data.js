/**
 * 🎭 MOCK DATA GENERATOR
 * Script tạo dữ liệu demo toàn diện cho hệ thống Gym Management
 *
 * CÁCH CHẠY:
 * cd backend
 * node scripts/seed-mock-data.js
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
// 📦 CONSTANTS & HELPERS
// ============================================

const SAMPLE_NAMES = {
  male: [
    "Nguyễn Văn An",
    "Trần Minh Bình",
    "Lê Hoàng Cường",
    "Phạm Đức Duy",
    "Võ Quang Hải",
    "Đặng Tuấn Kiệt",
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
    "Đặng Hồng Nhung",
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

const GYMS = [
  { id: "gym_hn_center", name: "Gym Hà Nội Center", city: "Hà Nội" },
  { id: "gym_hcm_q1", name: "Gym Sài Gòn Q1", city: "TP.HCM" },
  { id: "gym_dn_center", name: "Gym Đà Nẵng Center", city: "Đà Nẵng" },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomPhone() {
  const prefixes = [
    "032",
    "033",
    "034",
    "035",
    "036",
    "037",
    "038",
    "039",
    "086",
    "096",
    "097",
    "098",
  ];
  return randomChoice(prefixes) + randomInt(1000000, 9999999);
}

function randomEmail(name) {
  const domains = ["gmail.com", "yahoo.com", "outlook.com"];
  const cleaned = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, ".");
  return `${cleaned}${randomInt(1, 999)}@${randomChoice(domains)}`;
}

function randomDate(startYear = 1985, endYear = 2005) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function randomPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  date.setHours(randomInt(6, 22), randomInt(0, 59), 0, 0);
  return date;
}

function generateId(prefix = "ID") {
  return `${prefix}_${Date.now()}_${randomInt(1000, 9999)}`;
}

// ============================================
// 🎭 MOCK DATA GENERATORS
// ============================================

class MockDataGenerator {
  // 👥 Generate Users (Members)
  static generateUsers(count = 50) {
    const users = [];
    const genders = ["male", "female"];

    for (let i = 0; i < count; i++) {
      const gender = randomChoice(genders);
      const fullName = randomChoice(SAMPLE_NAMES[gender]);
      const userId = generateId("USER");
      const gym = randomChoice(GYMS);

      users.push({
        _id: userId,
        full_name: fullName,
        phone_number: randomPhone(),
        email: randomEmail(fullName),
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        date_of_birth: admin.firestore.Timestamp.fromDate(
          randomDate(1985, 2005)
        ),
        gender: gender,
        membership_status: randomChoice(["active", "inactive", "expired"]),
        branch_id: gym.id,
        branch_name: gym.name,
        current_package_id: "",
        package_expiry_date: null,
        joined_date: admin.firestore.Timestamp.fromDate(randomPastDate(365)),
        last_checkin: admin.firestore.Timestamp.fromDate(randomPastDate(7)),
        total_checkins: randomInt(10, 200),
        fcm_tokens: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return users;
  }

  // 💼 Generate Employees (Staff & PTs)
  static generateEmployees(count = 15) {
    const employees = [];
    const positions = [
      { role: "pt", position: "Personal Trainer", baseSalary: 8000000 },
      { role: "admin", position: "Admin", baseSalary: 12000000 },
      { role: "manager", position: "Manager", baseSalary: 15000000 },
      { role: "staff", position: "Staff", baseSalary: 7000000 },
    ];

    for (let i = 0; i < count; i++) {
      const gender = randomChoice(["male", "female"]);
      const fullName = randomChoice(SAMPLE_NAMES[gender]);
      const empId = generateId("EMP");
      const posInfo = randomChoice(positions);
      const gym = randomChoice(GYMS);

      employees.push({
        _id: empId,
        email: randomEmail(fullName),
        fullName: fullName,
        phone: randomPhone(),
        role: posInfo.role,
        position: posInfo.position,
        salary: posInfo.baseSalary + randomInt(-1000000, 2000000),
        dateOfBirth: admin.firestore.Timestamp.fromDate(randomDate(1985, 2000)),
        gender: gender,
        address: `${randomInt(1, 500)} ${randomChoice([
          "Nguyễn Trãi",
          "Láng Hạ",
          "Giải Phóng",
          "Lê Duẩn",
        ])}, ${gym.city}`,
        branchId: gym.id,
        status: randomChoice(["active", "active", "active", "inactive"]),
        hireDate: admin.firestore.Timestamp.fromDate(randomPastDate(730)),

        // PT specific fields
        ...(posInfo.role === "pt"
          ? {
              specialization: randomChoice([
                "Gym",
                "Yoga",
                "Boxing",
                "Cardio",
                "Functional Training",
              ]),
              certifications: randomChoice([
                ["ACE Certified", "CPR"],
                ["NASM Certified", "Nutrition Specialist"],
                ["ISSA Certified"],
              ]),
              experience: randomInt(1, 10),
              rating: (4.0 + Math.random()).toFixed(1),
              totalReviews: randomInt(5, 50),
              totalClients: randomInt(10, 100),
              commissionRate: randomInt(10, 30),
              bio: `${fullName} - ${randomInt(
                1,
                10
              )} năm kinh nghiệm. Chuyên về ${randomChoice([
                "tăng cơ",
                "giảm cân",
                "tăng sức bền",
                "phục hồi chức năng",
              ])}.`,
              availability: ["monday", "wednesday", "friday"],
            }
          : {}),

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return employees;
  }

  // 📦 Generate Packages
  static generatePackages() {
    return [
      // Gói tập theo thời gian - Cơ bản
      {
        PackageId: "PKG_BASIC_1M",
        PackageName: "Gói Cơ Bản 1 Tháng",
        Description:
          "Gói tập gym cơ bản, phù hợp cho người mới bắt đầu. Tập gym không giới hạn, tủ đồ và nước uống miễn phí.",
        Duration: 30,
        Price: 500000,
        Status: "active",
        NumberOfSession: 0,
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_BASIC_3M",
        PackageName: "Gói Cơ Bản 3 Tháng",
        Description:
          "Gói tập 3 tháng tiết kiệm cho người mới. Cam kết tập luyện đều đặn với giá ưu đãi.",
        Duration: 90,
        Price: 1350000,
        Status: "active",
        NumberOfSession: 0,
        Discount: 10,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "Áp dụng cho khách hàng mới, thanh toán 1 lần",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },

      // Gói tập theo thời gian - Tiêu chuẩn
      {
        PackageId: "PKG_STANDARD_1M",
        PackageName: "Gói Tiêu Chuẩn 1 Tháng",
        Description:
          "Gói tập gym tiêu chuẩn với thêm quyền lợi tư vấn chế độ ăn uống cơ bản.",
        Duration: 30,
        Price: 750000,
        Status: "active",
        NumberOfSession: 0,
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_STANDARD_3M",
        PackageName: "Gói Tiêu Chuẩn 3 Tháng",
        Description:
          "Gói tập 3 tháng với ưu đãi hấp dẫn. Bao gồm tư vấn dinh dưỡng và theo dõi tiến độ hàng tháng.",
        Duration: 90,
        Price: 2000000,
        Status: "active",
        NumberOfSession: 0,
        Discount: 12,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "Thanh toán toàn bộ trước khi kích hoạt",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_STANDARD_6M",
        PackageName: "Gói Tiêu Chuẩn 6 Tháng",
        Description:
          "Gói tập dài hạn 6 tháng với mức giá cực kỳ ưu đãi. Phù hợp cho người muốn cam kết lâu dài.",
        Duration: 180,
        Price: 3600000,
        Status: "active",
        NumberOfSession: 0,
        Discount: 20,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "Ưu đãi đặc biệt - Số lượng có hạn",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },

      // Gói tập theo thời gian - Premium
      {
        PackageId: "PKG_PREMIUM_1M",
        PackageName: "Gói Premium 1 Tháng",
        Description:
          "Gói cao cấp với đầy đủ tiện ích VIP. Tủ đồ riêng, khăn tắm cao cấp, nước uống không giới hạn.",
        Duration: 30,
        Price: 1200000,
        Status: "active",
        NumberOfSession: 0,
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_PREMIUM_3M",
        PackageName: "Gói Premium 3 Tháng",
        Description:
          "Gói VIP 3 tháng - Trải nghiệm cao cấp với tư vấn dinh dưỡng cá nhân hóa và đo lường body định kỳ.",
        Duration: 90,
        Price: 3200000,
        Status: "active",
        NumberOfSession: 0,
        Discount: 10,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "Khách hàng VIP - Ưu tiên đặt lịch",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_PREMIUM_6M",
        PackageName: "Gói Premium 6 Tháng",
        Description:
          "Gói cao cấp nhất 6 tháng. Bao gồm tất cả quyền lợi VIP + 2 buổi tập PT miễn phí.",
        Duration: 180,
        Price: 6000000,
        Status: "active",
        NumberOfSession: 0,
        Discount: 15,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "VIP PLATINUM - Tặng kèm 2 buổi PT",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_PREMIUM_12M",
        PackageName: "Gói Premium 12 Tháng",
        Description:
          "Gói VIP cả năm - Tiết kiệm nhất! Tặng kèm 5 buổi PT và InBody scan hàng tháng.",
        Duration: 365,
        Price: 10000000,
        Status: "active",
        NumberOfSession: 0,
        Discount: 25,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "DIAMOND - Tặng 5 buổi PT + InBody hàng tháng",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },

      // Gói tập theo buổi - PT Personal Training
      {
        PackageId: "PKG_PT_5",
        PackageName: "Gói PT 5 Buổi",
        Description:
          "Gói tập PT cá nhân 5 buổi - Trải nghiệm huấn luyện viên riêng. Lịch tập linh hoạt.",
        Duration: 30,
        Price: 1500000,
        Status: "active",
        NumberOfSession: 5,
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_PT_10",
        PackageName: "Gói PT 10 Buổi",
        Description:
          "Gói tập PT cá nhân 10 buổi với kế hoạch tập luyện được cá nhân hóa theo mục tiêu.",
        Duration: 45,
        Price: 2800000,
        Status: "active",
        NumberOfSession: 10,
        Discount: 5,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "Đặt lịch trước 24h - Không hoàn tiền",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_PT_20",
        PackageName: "Gói PT 20 Buổi",
        Description:
          "Gói tập PT cá nhân 20 buổi tiết kiệm. Bao gồm tư vấn dinh dưỡng chi tiết và theo dõi tiến độ.",
        Duration: 60,
        Price: 5200000,
        Status: "active",
        NumberOfSession: 20,
        Discount: 10,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "Đặt lịch trước 24h - Tặng kế hoạch dinh dưỡng",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_PT_30",
        PackageName: "Gói PT 30 Buổi",
        Description:
          "Gói PT cao cấp 30 buổi - Cam kết kết quả! Bao gồm InBody scan và tư vấn sâu.",
        Duration: 90,
        Price: 7500000,
        Status: "active",
        NumberOfSession: 30,
        Discount: 12,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "Cam kết kết quả - Tặng InBody + kế hoạch chi tiết",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },

      // Gói đặc biệt
      {
        PackageId: "PKG_TRIAL_7D",
        PackageName: "Gói Thử 7 Ngày",
        Description:
          "Gói trải nghiệm 7 ngày - Phù hợp để khám phá phòng gym và các tiện ích.",
        Duration: 7,
        Price: 100000,
        Status: "active",
        NumberOfSession: 0,
        UsageCondition: "Chỉ áp dụng 1 lần cho khách hàng mới",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_STUDENT_1M",
        PackageName: "Gói Sinh Viên 1 Tháng",
        Description:
          "Ưu đãi đặc biệt cho sinh viên - Xuất trình thẻ sinh viên khi đăng ký.",
        Duration: 30,
        Price: 400000,
        Status: "active",
        NumberOfSession: 0,
        Discount: 20,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "Yêu cầu thẻ sinh viên còn hiệu lực",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_COUPLE_3M",
        PackageName: "Gói Đôi 3 Tháng",
        Description:
          "Gói tập cho 2 người - Tập cùng nhau vui hơn! Giá ưu đãi khi đăng ký cùng bạn bè hoặc người thân.",
        Duration: 90,
        Price: 1800000,
        Status: "active",
        NumberOfSession: 0,
        Discount: 15,
        StartDayDiscount: admin.firestore.Timestamp.now(),
        EndDayDiscount: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
        UsageCondition: "Đăng ký cùng lúc cho 2 người - Giá cho 1 người",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_WEEKEND",
        PackageName: "Gói Cuối Tuần",
        Description:
          "Gói tập chỉ vào Thứ 7, Chủ nhật - Phù hợp cho người bận rộn trong tuần.",
        Duration: 60,
        Price: 600000,
        Status: "active",
        NumberOfSession: 0,
        UsageCondition: "Chỉ áp dụng T7, CN - Không hoàn tiền",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        PackageId: "PKG_MORNING",
        PackageName: "Gói Buổi Sáng",
        Description:
          "Gói tập buổi sáng (5h-10h) - Giá ưu đãi cho người tập sáng sớm.",
        Duration: 30,
        Price: 350000,
        Status: "active",
        NumberOfSession: 0,
        UsageCondition: "Chỉ tập 5h-10h sáng các ngày trong tuần",
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },

      // Gói tạm ngưng hoạt động
      {
        PackageId: "PKG_OLD_PROMO",
        PackageName: "Gói Khuyến Mãi Cũ",
        Description: "Gói khuyến mãi đã hết hạn - Không còn áp dụng.",
        Duration: 30,
        Price: 300000,
        Status: "inactive",
        NumberOfSession: 0,
        CreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        UpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    ];
  }

  // 💳 Generate Payment Orders
  static generatePaymentOrders(users, packages, count = 100) {
    const orders = [];
    const statuses = ["PAID", "PAID", "PAID", "PENDING", "CANCELLED"];

    for (let i = 0; i < count; i++) {
      const user = randomChoice(users);
      const pkg = randomChoice(packages);
      const status = randomChoice(statuses);
      const orderCode = Date.now() + i;
      const createdDate = randomPastDate(90);

      const order = {
        orderCode: orderCode,
        userId: user._id,
        userName: user.full_name,
        userEmail: user.email,
        userPhone: user.phone_number,
        packageId: pkg.PackageId,
        packageName: pkg.PackageName,
        packageDuration: pkg.Duration,
        amount: pkg.Price,
        status: status,
        paymentMethod:
          status === "PAID" ? randomChoice(["PayOS", "Cash", "Transfer"]) : "",
        transactionId: status === "PAID" ? `TXN${orderCode}` : "",
        paymentTime:
          status === "PAID"
            ? admin.firestore.Timestamp.fromDate(createdDate)
            : "",
        confirmedManually: status === "PAID" && Math.random() > 0.7,
        verifiedWithPayOS: status === "PAID" && Math.random() > 0.5,
        paymentLinkId: `${orderCode}`,
        checkoutUrl:
          status === "PENDING" ? `https://pay.payos.vn/web/${orderCode}` : "",
        qrCode: "",
        description: `Thanh toán ${pkg.PackageName} - ${user.full_name}`,
        metadata: {
          branchId: user.branch_id,
          source: "web",
        },
        createdAt: admin.firestore.Timestamp.fromDate(createdDate),
        updatedAt: admin.firestore.Timestamp.fromDate(createdDate),
        paidAt:
          status === "PAID"
            ? admin.firestore.Timestamp.fromDate(createdDate)
            : null,
        cancelledAt:
          status === "CANCELLED"
            ? admin.firestore.Timestamp.fromDate(createdDate)
            : null,
      };

      orders.push(order);
    }

    return orders;
  }

  // 📋 Generate Contracts
  static generateContracts(
    users,
    packages,
    employees,
    paymentOrders,
    count = 80
  ) {
    const contracts = [];
    const timeSlots = [
      { start: "06:00", end: "08:00", slotId: "slot1" },
      { start: "08:00", end: "10:00", slotId: "slot2" },
      { start: "10:00", end: "12:00", slotId: "slot3" },
      { start: "14:00", end: "16:00", slotId: "slot5" },
      { start: "16:00", end: "18:00", slotId: "slot6" },
      { start: "18:00", end: "20:00", slotId: "slot7" },
    ];
    const dayNames = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    for (let i = 0; i < count; i++) {
      const user = randomChoice(users);
      const pkg = randomChoice(packages);
      const startDate = randomPastDate(180);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + pkg.Duration);
      const isPaid = Math.random() > 0.1; // 90% paid
      const isCompleted = endDate < new Date();

      // Find matching payment order for this contract
      const matchingOrder = paymentOrders.find(
        (order) =>
          order.userId === user._id &&
          order.packageId === pkg.PackageId &&
          order.status === "PAID"
      );

      const contract = {
        userId: user._id,
        packageId: pkg.PackageId,
        startDate: admin.firestore.Timestamp.fromDate(startDate),
        endDate: admin.firestore.Timestamp.fromDate(endDate),
        status: isCompleted
          ? "completed"
          : endDate > new Date()
          ? "active"
          : "expired",
        paymentStatus: isPaid ? "PAID" : "PENDING",
        paymentAmount: pkg.Price,
        paymentOrderCode: matchingOrder
          ? matchingOrder.orderCode.toString()
          : "",
        paidAt: isPaid ? admin.firestore.Timestamp.fromDate(startDate) : null,
        createdAt: admin.firestore.Timestamp.fromDate(startDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Add PT-specific fields for session packages
      if (pkg.PackageType === "session") {
        const pts = employees.filter((e) => e.role === "pt");
        if (pts.length > 0) {
          const pt = randomChoice(pts);
          const commissionRate = randomInt(15, 30);
          const commissionAmount = Math.round(
            (pkg.Price * commissionRate) / 100
          );

          contract.ptId = pt._id;
          contract.ptPackageId = generateId("PTPKG");
          contract.commissionRate = commissionRate;
          contract.commissionAmount = commissionAmount;
          contract.commissionPaid = isCompleted && Math.random() > 0.3;
          contract.isReviewed = isCompleted && Math.random() > 0.4;
          contract.reviewId = contract.isReviewed ? generateId("REVIEW") : "";

          // Generate weekly schedule (7 days)
          const weeklySchedule = {};
          const numDays = randomInt(3, 7); // PT sessions 3-7 days per week
          const selectedDays = [];

          while (selectedDays.length < numDays) {
            const day = randomInt(1, 7);
            if (!selectedDays.includes(day)) {
              selectedDays.push(day);
            }
          }

          selectedDays.sort((a, b) => a - b);

          selectedDays.forEach((dayOfWeek) => {
            const slot = randomChoice(timeSlots);
            const dayName = dayNames[dayOfWeek - 1];

            weeklySchedule[dayOfWeek] = {
              dayOfWeek: dayOfWeek,
              timeSlotId: `${dayName}_${slot.slotId}`,
              startTime: slot.start,
              endTime: slot.end,
              note: "Khung cố định 120 phút",
            };
          });

          contract.weeklySchedule = weeklySchedule;
        }
      } else {
        // For monthly packages, add basic fields
        contract.ptId = "";
        contract.ptPackageId = "";
        contract.weeklySchedule = {};
      }

      contracts.push(contract);
    }

    return contracts;
  }

  // 🏋️ Generate Check-ins
  static generateCheckins(users, count = 500) {
    const checkins = [];

    for (let i = 0; i < count; i++) {
      const user = randomChoice(users);
      const checkinDate = randomPastDate(90);
      const gym =
        GYMS.find((g) => g.id === user.branch_id) || randomChoice(GYMS);

      checkins.push({
        memberId: user._id,
        memberName: user.full_name,
        memberPhone: user.phone_number,
        packageId: user.current_package_id || "",
        locationId: gym.id,
        locationName: gym.name,
        checkedAt: admin.firestore.Timestamp.fromDate(checkinDate),
        source: randomChoice(["QR", "QR", "QR", "manual"]),
        searchTokens: [
          user.full_name.toLowerCase(),
          user.phone_number,
          user._id.toLowerCase(),
        ],
        createdAt: admin.firestore.Timestamp.fromDate(checkinDate),
      });
    }

    return checkins;
  }

  // 💸 Generate Expenses
  static generateExpenses(count = 50) {
    const expenses = [];
    const categories = [
      { id: "CAT_RENT", name: "Tiền thuê mặt bằng", type: "fixed" },
      { id: "CAT_UTILITIES", name: "Tiền điện nước", type: "variable" },
      { id: "CAT_EQUIPMENT", name: "Thiết bị tập luyện", type: "one-time" },
      { id: "CAT_SALARY", name: "Lương nhân viên", type: "fixed" },
      { id: "CAT_MARKETING", name: "Marketing & Quảng cáo", type: "variable" },
      { id: "CAT_MAINTENANCE", name: "Bảo trì & Sửa chữa", type: "variable" },
      { id: "CAT_SUPPLIES", name: "Vật tư tiêu hao", type: "variable" },
    ];

    for (let i = 0; i < count; i++) {
      const category = randomChoice(categories);
      const expenseDate = randomPastDate(180);
      const dueDate = new Date(expenseDate);
      dueDate.setDate(dueDate.getDate() + randomInt(7, 30));

      expenses.push({
        expenseId: generateId("EXP"),
        categoryId: category.id,
        categoryName: category.name,
        amount: randomInt(1000000, 50000000),
        description: `${category.name} - tháng ${
          expenseDate.getMonth() + 1
        }/${expenseDate.getFullYear()}`,
        expenseDate: admin.firestore.Timestamp.fromDate(expenseDate),
        dueDate: admin.firestore.Timestamp.fromDate(dueDate),
        status: randomChoice(["paid", "paid", "pending", "overdue"]),
        paymentMethod: randomChoice(["cash", "transfer", "card"]),
        note: "",
        branchId: randomChoice(GYMS).id,
        createdBy: "ADMIN",
        createdAt: admin.firestore.Timestamp.fromDate(expenseDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return expenses;
  }

  // ⭐ Generate PT Reviews
  static generatePTReviews(employees, users, count = 60) {
    const reviews = [];
    const pts = employees.filter((e) => e.role === "pt");

    if (pts.length === 0) return reviews;

    for (let i = 0; i < count; i++) {
      const pt = randomChoice(pts);
      const user = randomChoice(users);
      const reviewDate = randomPastDate(365);
      const rating = randomInt(3, 5);

      const comments = {
        5: [
          "PT rất nhiệt tình và chuyên nghiệp!",
          "Tập với PT giúp tôi tiến bộ rất nhanh!",
          "Chế độ tập luyện rất phù hợp và hiệu quả!",
          "PT tận tâm, động viên nhiệt tình!",
        ],
        4: [
          "PT dạy tốt, nhiệt tình.",
          "Khá hài lòng với buổi tập.",
          "PT có kinh nghiệm.",
          "Kế hoạch tập hợp lý.",
        ],
        3: [
          "Bình thường, cần cải thiện thêm.",
          "Có thể tốt hơn.",
          "Chưa thực sự ấn tượng.",
        ],
      };

      reviews.push({
        reviewId: generateId("REVIEW"),
        ptId: pt._id,
        ptName: pt.fullName,
        userId: user._id,
        userName: user.full_name,
        rating: rating,
        comment: randomChoice(comments[rating] || comments[4]),
        createdAt: admin.firestore.Timestamp.fromDate(reviewDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return reviews;
  }

  // 📅 Generate Schedules (for PT sessions)
  static generateSchedules(employees, users, count = 100) {
    const schedules = [];
    const pts = employees.filter((e) => e.role === "pt");

    if (pts.length === 0) return schedules;

    const timeSlots = [
      "06:00-07:00",
      "07:00-08:00",
      "08:00-09:00",
      "09:00-10:00",
      "10:00-11:00",
      "14:00-15:00",
      "15:00-16:00",
      "16:00-17:00",
      "17:00-18:00",
      "18:00-19:00",
      "19:00-20:00",
      "20:00-21:00",
    ];

    for (let i = 0; i < count; i++) {
      const pt = randomChoice(pts);
      const user = randomChoice(users);
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + randomInt(-30, 30));
      const timeSlot = randomChoice(timeSlots);
      const gym = randomChoice(GYMS);

      schedules.push({
        scheduleId: generateId("SCHEDULE"),
        ptId: pt._id,
        ptName: pt.fullName,
        clientId: user._id,
        clientName: user.full_name,
        date: admin.firestore.Timestamp.fromDate(scheduleDate),
        timeSlot: timeSlot,
        duration: 60,
        status:
          scheduleDate > new Date()
            ? "scheduled"
            : randomChoice(["completed", "cancelled", "no-show"]),
        branchId: gym.id,
        branchName: gym.name,
        note: "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return schedules;
  }

  // 🔔 Generate Notifications
  static generateNotifications(users, count = 80) {
    const notifications = [];
    const types = ["payment", "contract", "schedule", "promotion", "system"];
    const titles = {
      payment: ["Thanh toán thành công", "Nhắc nhở thanh toán", "Hóa đơn mới"],
      contract: ["Hợp đồng sắp hết hạn", "Gia hạn thành công", "Hợp đồng mới"],
      schedule: ["Lịch tập mới", "Nhắc nhở buổi tập", "Hủy lịch tập"],
      promotion: ["Khuyến mãi đặc biệt", "Ưu đãi mới", "Giảm giá 20%"],
      system: ["Cập nhật hệ thống", "Bảo trì hệ thống", "Thông báo quan trọng"],
    };

    for (let i = 0; i < count; i++) {
      const user = randomChoice(users);
      const type = randomChoice(types);
      const title = randomChoice(titles[type]);
      const createdDate = randomPastDate(60);

      notifications.push({
        notificationId: generateId("NOTIF"),
        userId: user._id,
        type: type,
        title: title,
        message: `${title} - ${user.full_name}`,
        isRead: Math.random() > 0.4,
        link: "",
        metadata: {},
        createdAt: admin.firestore.Timestamp.fromDate(createdDate),
      });
    }

    return notifications;
  }

  // 📂 Generate Expense Categories
  static generateExpenseCategories() {
    return [
      {
        categoryId: "CAT_RENT",
        name: "Tiền thuê mặt bằng",
        description: "Chi phí thuê mặt bằng phòng gym",
        type: "fixed",
        budgetLimit: 50000000,
        icon: "🏢",
        color: "#FF6B6B",
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        categoryId: "CAT_UTILITIES",
        name: "Tiền điện nước",
        description: "Chi phí điện, nước, internet",
        type: "variable",
        budgetLimit: 15000000,
        icon: "💡",
        color: "#4ECDC4",
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        categoryId: "CAT_EQUIPMENT",
        name: "Thiết bị tập luyện",
        description: "Mua sắm, nâng cấp thiết bị",
        type: "one-time",
        budgetLimit: 100000000,
        icon: "🏋️",
        color: "#45B7D1",
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        categoryId: "CAT_SALARY",
        name: "Lương nhân viên",
        description: "Lương và thưởng nhân viên",
        type: "fixed",
        budgetLimit: 200000000,
        icon: "💰",
        color: "#FFA07A",
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        categoryId: "CAT_MARKETING",
        name: "Marketing & Quảng cáo",
        description: "Chi phí marketing, quảng cáo",
        type: "variable",
        budgetLimit: 30000000,
        icon: "📱",
        color: "#96CEB4",
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        categoryId: "CAT_MAINTENANCE",
        name: "Bảo trì & Sửa chữa",
        description: "Chi phí bảo trì, sửa chữa",
        type: "variable",
        budgetLimit: 20000000,
        icon: "🔧",
        color: "#DDA15E",
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {
        categoryId: "CAT_SUPPLIES",
        name: "Vật tư tiêu hao",
        description: "Khăn, nước, vệ sinh, v.v.",
        type: "variable",
        budgetLimit: 10000000,
        icon: "🧴",
        color: "#BC6C25",
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    ];
  }
}

// ============================================
// 🚀 MAIN SEEDING FUNCTION
// ============================================

async function seedDatabase() {
  console.log("🎭 ===============================================");
  console.log("🎭 MOCK DATA GENERATOR - Gym Management System");
  console.log("🎭 ===============================================\n");

  try {
    // Generate all mock data
    console.log("📦 Generating mock data...\n");

    const users = MockDataGenerator.generateUsers(50);
    const employees = MockDataGenerator.generateEmployees(15);
    const packages = MockDataGenerator.generatePackages();
    const paymentOrders = MockDataGenerator.generatePaymentOrders(
      users,
      packages,
      100
    );
    const contracts = MockDataGenerator.generateContracts(
      users,
      packages,
      employees,
      paymentOrders,
      80
    );
    const checkins = MockDataGenerator.generateCheckins(users, 500);
    const expenses = MockDataGenerator.generateExpenses(50);
    const expenseCategories = MockDataGenerator.generateExpenseCategories();
    const ptReviews = MockDataGenerator.generatePTReviews(employees, users, 60);
    const schedules = MockDataGenerator.generateSchedules(
      employees,
      users,
      100
    );
    const notifications = MockDataGenerator.generateNotifications(users, 80);

    // Seed to Firestore
    console.log("💾 Seeding data to Firestore...\n");

    // 1. Expense Categories (must be first)
    console.log("📂 [1/11] Seeding expense_categories...");
    for (const category of expenseCategories) {
      await db
        .collection("expense_categories")
        .doc(category.categoryId)
        .set(category);
    }
    console.log(
      `   ✅ Created ${expenseCategories.length} expense categories\n`
    );

    // 2. Packages
    console.log("📦 [2/11] Seeding packages...");
    for (const pkg of packages) {
      await db.collection("packages").add(pkg);
    }
    console.log(`   ✅ Created ${packages.length} packages\n`);

    // 3. Employees
    console.log("👥 [3/11] Seeding employees...");
    for (const emp of employees) {
      await db.collection("employees").doc(emp._id).set(emp);
    }
    console.log(`   ✅ Created ${employees.length} employees\n`);

    // 4. Users
    console.log("👤 [4/11] Seeding users...");
    for (const user of users) {
      await db.collection("users").doc(user._id).set(user);
    }
    console.log(`   ✅ Created ${users.length} users\n`);

    // 5. Spending Users (subset of users)
    console.log("💳 [5/11] Seeding spending_users...");
    const spendingUsers = users.slice(0, 10).map((u) => {
      const { ...userData } = u;
      return {
        ...userData,
        isTransferred: false,
      };
    });
    for (const user of spendingUsers) {
      await db.collection("spending_users").doc(user._id).set(user);
    }
    console.log(`   ✅ Created ${spendingUsers.length} spending users\n`);

    // 6. Payment Orders
    console.log("💰 [6/11] Seeding payment_orders...");
    for (const order of paymentOrders) {
      await db
        .collection("payment_orders")
        .doc(order.orderCode.toString())
        .set(order);
    }
    console.log(`   ✅ Created ${paymentOrders.length} payment orders\n`);

    // 7. Contracts
    console.log("📄 [7/11] Seeding contracts...");
    for (const contract of contracts) {
      await db.collection("contracts").add(contract);
    }
    console.log(`   ✅ Created ${contracts.length} contracts\n`);

    // 8. Check-ins
    console.log("🏋️ [8/11] Seeding checkins...");
    for (const checkin of checkins) {
      await db.collection("checkins").add(checkin);
    }
    console.log(`   ✅ Created ${checkins.length} check-ins\n`);

    // 9. Expenses
    console.log("💸 [9/11] Seeding expenses...");
    for (const expense of expenses) {
      await db.collection("expenses").doc(expense.expenseId).set(expense);
    }
    console.log(`   ✅ Created ${expenses.length} expenses\n`);

    // 10. PT Reviews
    console.log("⭐ [10/11] Seeding pt_reviews...");
    for (const review of ptReviews) {
      await db.collection("pt_reviews").doc(review.reviewId).set(review);
    }
    console.log(`   ✅ Created ${ptReviews.length} PT reviews\n`);

    // 11. Schedules
    console.log("📅 [11/11] Seeding schedules...");
    for (const schedule of schedules) {
      await db.collection("schedules").doc(schedule.scheduleId).set(schedule);
    }
    console.log(`   ✅ Created ${schedules.length} schedules\n`);

    // 12. Notifications
    console.log("🔔 [12/12] Seeding notifications...");
    for (const notif of notifications) {
      await db.collection("notifications").add(notif);
    }
    console.log(`   ✅ Created ${notifications.length} notifications\n`);

    // Summary
    console.log("\n✅ ===============================================");
    console.log("✅ SEEDING COMPLETED SUCCESSFULLY!");
    console.log("✅ ===============================================\n");

    console.log("📊 Summary:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   💼 Employees: ${employees.length}`);
    console.log(`   📦 Packages: ${packages.length}`);
    console.log(`   💰 Payment Orders: ${paymentOrders.length}`);
    console.log(`   📄 Contracts: ${contracts.length}`);
    console.log(`   🏋️ Check-ins: ${checkins.length}`);
    console.log(`   💸 Expenses: ${expenses.length}`);
    console.log(`   📂 Expense Categories: ${expenseCategories.length}`);
    console.log(`   ⭐ PT Reviews: ${ptReviews.length}`);
    console.log(`   📅 Schedules: ${schedules.length}`);
    console.log(`   🔔 Notifications: ${notifications.length}`);
    console.log(`   💳 Spending Users: ${spendingUsers.length}`);

    console.log("\n🎉 Your database is now ready for demo!\n");
  } catch (error) {
    console.error("\n❌ ERROR DURING SEEDING:");
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
