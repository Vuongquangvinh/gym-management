/**
 * 📦 SEED PACKAGES MOCK DATA
 * Script tạo dữ liệu demo cho gói tập (packages)
 *
 * CÁCH CHẠY:
 * cd backend
 * node scripts/seed-packages.js
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
// 📦 MOCK PACKAGES DATA
// ============================================

const MOCK_PACKAGES = [
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

// ============================================
// 🚀 SEED FUNCTION
// ============================================

async function seedPackages() {
  try {
    console.log("🎯 Bắt đầu tạo mock data cho Packages...\n");

    const packagesRef = db.collection("packages");
    let created = 0;
    let skipped = 0;

    for (const packageData of MOCK_PACKAGES) {
      try {
        // Kiểm tra xem package đã tồn tại chưa
        const existingQuery = await packagesRef
          .where("PackageId", "==", packageData.PackageId)
          .limit(1)
          .get();

        if (!existingQuery.empty) {
          console.log(`⏭️  Bỏ qua: ${packageData.PackageName} (đã tồn tại)`);
          skipped++;
          continue;
        }

        // Tạo package mới
        await packagesRef.add(packageData);
        console.log(`✅ Tạo: ${packageData.PackageName}`);
        created++;
      } catch (error) {
        console.error(
          `❌ Lỗi khi tạo ${packageData.PackageName}:`,
          error.message
        );
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 HOÀN THÀNH!");
    console.log("=".repeat(50));
    console.log(`✅ Đã tạo: ${created} gói tập`);
    console.log(`⏭️  Đã bỏ qua: ${skipped} gói tập (đã tồn tại)`);
    console.log(`📦 Tổng cộng: ${MOCK_PACKAGES.length} gói tập\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

// Chạy seed
seedPackages();
