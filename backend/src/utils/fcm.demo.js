/**
 * Demo FCM Helper - Test gửi notification
 *
 * Cách sử dụng:
 * 1. Đảm bảo Firebase Admin SDK đã được khởi tạo
 * 2. Cập nhật USER_ID và DEVICE_TOKEN
 * 3. node src/utils/fcm.demo.js
 */

import {
  sendToDevice,
  sendToUser,
  sendPaymentSuccessNotification,
  sendWorkoutReminderNotification,
  sendPackageExpiringNotification,
} from "./fcm.helper.js";

// ============================================
// CẤU HÌNH - THAY ĐỔI THEO DỮ LIỆU THỰC TẾ
// ============================================

// Lấy từ Firestore users collection
const USER_ID = "JVpJwI3RyvFNNbaC1C27"; // Document ID hoặc field _id

// Lấy từ app (console log)
const DEVICE_TOKEN =
  "f8xAXNOAQsaQ0Dk4UOed4t:APA91bFXSIuwbtUPeRoB02ZjmLOGmbCeaFLYhb40JnRKGYTRMmW8Va_5VF11DVVCAj7dy2DWPk73hsUhkxjb8GHxVvcyfdm1HFC20iEAE3Le1TYdVUxWPQw";

// ============================================
// DEMO FUNCTIONS
// ============================================

async function demo() {
  console.log("🚀 FCM Helper Demo\n");

  // Example 1: Gửi đến device trực tiếp
  console.log("=".repeat(60));
  console.log("📱 Example 1: Gửi đến device trực tiếp");
  console.log("=".repeat(60));

  if (DEVICE_TOKEN !== "YOUR_DEVICE_TOKEN_HERE") {
    const result1 = await sendToDevice(
      DEVICE_TOKEN,
      {
        title: "🏋️ Test Notification",
        body: "Đây là test notification gửi trực tiếp đến device",
      },
      {
        type: "test",
        testId: "123",
      }
    );
    console.log("Result:", result1);
  } else {
    console.log("⏭️  Skipped - cần cấu hình DEVICE_TOKEN");
  }

  console.log("\n");

  // Example 2: Gửi đến user (lấy token từ Firestore)
  console.log("=".repeat(60));
  console.log("📱 Example 2: Gửi đến user (lấy token từ Firestore)");
  console.log("=".repeat(60));

  if (USER_ID !== "YOUR_USER_ID_HERE") {
    const result2 = await sendToUser(
      USER_ID,
      {
        title: "👋 Xin chào!",
        body: "Đây là notification gửi qua userId",
      },
      {
        type: "greeting",
        userId: USER_ID,
      }
    );
    console.log("Result:", result2);
  } else {
    console.log("⏭️  Skipped - cần cấu hình USER_ID");
  }

  console.log("\n");

  // Example 3: Thông báo thanh toán thành công (Gym Package)
  console.log("=".repeat(60));
  console.log("📱 Example 3: Thanh toán Gym Package thành công");
  console.log("=".repeat(60));

  if (USER_ID !== "YOUR_USER_ID_HERE") {
    const result3 = await sendPaymentSuccessNotification(USER_ID, {
      packageName: "Gói tập 1 tháng",
      amount: 500000,
      orderCode: Date.now(),
      paymentType: "gym_package",
    });
    console.log("Result:", result3);
  } else {
    console.log("⏭️  Skipped - cần cấu hình USER_ID");
  }

  console.log("\n");

  // Example 4: Thông báo thanh toán PT Package thành công
  console.log("=".repeat(60));
  console.log("📱 Example 4: Thanh toán PT Package thành công");
  console.log("=".repeat(60));

  if (USER_ID !== "YOUR_USER_ID_HERE") {
    const result4 = await sendPaymentSuccessNotification(USER_ID, {
      packageName: "PT Monthly - 8 buổi",
      amount: 2000000,
      orderCode: Date.now(),
      contractId: "J4NiE5vDTHBHJnxuYA8T",
      paymentType: "pt_package",
    });
    console.log("Result:", result4);
  } else {
    console.log("⏭️  Skipped - cần cấu hình USER_ID");
  }

  console.log("\n");

  // Example 5: Nhắc lịch tập
  console.log("=".repeat(60));
  console.log("📱 Example 5: Nhắc lịch tập với PT");
  console.log("=".repeat(60));

  // Uncomment để test
  // const result5 = await sendWorkoutReminderNotification(USER_ID, {
  //   scheduledTime: "14:00 hôm nay",
  //   ptName: "Nguyễn Văn A",
  //   contractId: "J4NiE5vDTHBHJnxuYA8T",
  // });
  // console.log("Result:", result5);
  console.log("⏭️  Skipped - uncomment code để test");

  console.log("\n");

  // Example 6: Thông báo gói tập sắp hết hạn
  console.log("=".repeat(60));
  console.log("📱 Example 6: Gói tập sắp hết hạn");
  console.log("=".repeat(60));

  // Uncomment để test
  // const result6 = await sendPackageExpiringNotification(USER_ID, {
  //   packageName: "Gói tập 1 tháng",
  //   daysRemaining: 3,
  //   endDate: "2025-11-16",
  // });
  // console.log("Result:", result6);
  console.log("⏭️  Skipped - uncomment code để test");

  console.log("\n");
  console.log("✅ Demo completed!\n");
}

// ============================================
// MAIN
// ============================================

demo()
  .then(() => {
    console.log("🎉 All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error:", error);
    process.exit(1);
  });
