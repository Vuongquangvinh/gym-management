// Test gửi FCM notification đến user cụ thể
import { sendToUser } from "./src/utils/fcm.helper.js";

const userId = "JVpJwI3RyvFNNbaC1C27"; // User ID vừa test

async function testSendNotification() {
  console.log("🧪 Testing FCM notification to user:", userId);
  console.log("─".repeat(60));

  try {
    // Test 1: Thông báo đơn giản
    const result1 = await sendToUser(
      userId,
      {
        title: "🧪 Test Notification",
        body: "Đây là thông báo test từ backend! Bạn đã nhận được chưa?",
      },
      {
        type: "test",
        timestamp: new Date().toISOString(),
      }
    );

    if (result1.success) {
      console.log("✅ Test notification sent successfully!");
    } else {
      console.log("❌ Failed to send notification:", result1.error);
    }

    // Đợi 2 giây
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 2: Thông báo thanh toán
    const result2 = await sendToUser(
      userId,
      {
        title: "💰 Thanh toán thành công!",
        body: "Bạn đã thanh toán thành công gói tập 1 tháng với số tiền 500,000 VNĐ",
      },
      {
        type: "payment",
        amount: "500000", // ✅ Phải là string
        packageName: "Gói tập 1 tháng",
      }
    );

    if (result2.success) {
      console.log("✅ Payment notification sent successfully!");
    } else {
      console.log("❌ Failed to send payment notification:", result2.error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testSendNotification();
