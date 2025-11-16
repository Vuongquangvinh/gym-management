/**
 * Script để gửi FCM Push Notification
 *
 * Cách sử dụng:
 * 1. Cài đặt: npm install
 * 2. Lấy FCM Server Key từ Firebase Console
 * 3. Chạy: node send_fcm_notification.js
 */

const https = require("https");

// ============================================
// CẤU HÌNH - THAY ĐỔI NHỮNG GIÁ TRỊ NÀY
// ============================================

// Lấy từ Firebase Console > Project Settings > Cloud Messaging > Server key
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || "YOUR_SERVER_KEY_HERE";
const FCM_DEVICE_TOKEN =
  process.env.FCM_DEVICE_TOKEN || "YOUR_DEVICE_TOKEN_HERE";

// ============================================
// PAYLOAD NOTIFICATION
// ============================================

// Ví dụ: Thông báo thanh toán thành công
const paymentSuccessPayload = {
  to: FCM_DEVICE_TOKEN,
  notification: {
    title: "💰 Thanh toán thành công!",
    body: "Gói tập của bạn đã được kích hoạt!",
    sound: "default",
  },
  data: {
    type: "payment_success",
    contractId: "J4NiE5vDTHBHJnxuYA8T",
    amount: "500000",
    paymentTime: new Date().toISOString(),
  },
  android: {
    priority: "high",
    notification: {
      icon: "ic_launcher",
      color: "#FF6B35",
      sound: "default",
    },
  },
};

// (Có thể thêm các payload khác cho các loại thông báo khác)

// ============================================
// GỬI NOTIFICATION
// ============================================

function sendFCMNotification(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: "fcm.googleapis.com",
      port: 443,
      path: "/fcm/send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${FCM_SERVER_KEY}`,
        "Content-Length": data.length,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        console.log("\n📬 FCM Response:");
        console.log("Status Code:", res.statusCode);
        console.log("Response:", JSON.parse(responseData));

        if (res.statusCode === 200) {
          console.log("\n✅ Notification sent successfully!");
          resolve(JSON.parse(responseData));
        } else {
          console.log("\n❌ Failed to send notification");
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error("\n❌ Error sending notification:", error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("🚀 Sending FCM Payment Success Notification...\n");
  console.log("Configuration:");
  console.log("- Server Key:", FCM_SERVER_KEY.substring(0, 20) + "...");
  console.log("- Device Token:", FCM_DEVICE_TOKEN.substring(0, 30) + "...");
  console.log("- Title:", paymentSuccessPayload.notification.title);
  console.log("- Body:", paymentSuccessPayload.notification.body);
  console.log("\n");

  try {
    await sendFCMNotification(paymentSuccessPayload);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Kiểm tra config
if (FCM_SERVER_KEY === "YOUR_SERVER_KEY_HERE") {
  console.error("❌ ERROR: Bạn chưa cấu hình FCM_SERVER_KEY!");
  console.error("\nHướng dẫn:");
  console.error(
    "1. Vào Firebase Console: https://console.firebase.google.com/"
  );
  console.error("2. Chọn project của bạn");
  console.error("3. Project Settings > Cloud Messaging");
  console.error('4. Copy "Server key" và paste vào file này\n');
  process.exit(1);
}

if (FCM_DEVICE_TOKEN === "YOUR_DEVICE_TOKEN_HERE") {
  console.error("❌ ERROR: Bạn chưa cấu hình FCM_DEVICE_TOKEN!");
  console.error("\nHướng dẫn:");
  console.error("1. Chạy app trên thiết bị thật");
  console.error('2. Xem console log, tìm dòng: "📱 FCM Token: ..."');
  console.error("3. Copy token và paste vào file này\n");
  process.exit(1);
}

// Run
main();
