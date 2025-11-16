/**
 * Gửi FCM Push Notification sử dụng Firebase Admin SDK
 *
 * Cách sử dụng:
 * 1. npm install firebase-admin
 * 2. Đảm bảo có file service account key (gym-managment-aa0a1-firebase-adminsdk-*.json)
 * 3. node send_fcm_admin.js
 */

import admin from "firebase-admin";
import serviceAccount from "./gym-managment-aa0a1-firebase-adminsdk-fbsvc-1138eee267.json" with { type: "json" };
``;
// Khởi tạo Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ============================================
// CẤU HÌNH
// ============================================

// Lấy từ app (xem console log)
const DEVICE_TOKEN =
  "f8xAXNOAQsaQ0Dk4UOed4t:APA91bFXSIuwbtUPeRoB02ZjmLOGmbCeaFLYhb40JnRKGYTRMmW8Va_5VF11DVVCAj7dy2DWPk73hsUhkxjb8GHxVvcyfdm1HFC20iEAE3Le1TYdVUxWPQw";

// ============================================
// HÀM GỬI NOTIFICATION
// ============================================

/**
 * Gửi notification đến 1 device
 */
async function sendToDevice(token, notification, data = {}) {
  const message = {
    token: token,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: data,
    android: {
      priority: "high",
      notification: {
        icon: "ic_launcher",
        color: "#FF6B35",
        sound: "default",
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
}

/**
 * Gửi notification đến nhiều devices
 */
async function sendToMultipleDevices(tokens, notification, data = {}) {
  const message = {
    tokens: tokens,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: data,
    android: {
      priority: "high",
      notification: {
        icon: "ic_launcher",
        color: "#FF6B35",
        sound: "default",
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("✅ Successfully sent messages:");
    console.log("  Success count:", response.successCount);
    console.log("  Failure count:", response.failureCount);
    return response;
  } catch (error) {
    console.error("❌ Error sending messages:", error);
    throw error;
  }
}

/**
 * Gửi notification đến topic
 */
async function sendToTopic(topic, notification, data = {}) {
  const message = {
    topic: topic,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: data,
    android: {
      priority: "high",
      notification: {
        icon: "ic_launcher",
        color: "#FF6B35",
        sound: "default",
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Successfully sent to topic:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending to topic:", error);
    throw error;
  }
}

/**
 * Gửi notification đến user từ Firestore
 */
async function sendToUser(userId, notification, data = {}) {
  try {
    // Lấy FCM token từ Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const fcmToken = userDoc.data().fcmToken;
    if (!fcmToken) {
      throw new Error(`User ${userId} has no FCM token`);
    }

    console.log(
      `📤 Sending to user ${userId} (token: ${fcmToken.substring(0, 30)}...)`
    );

    return await sendToDevice(fcmToken, notification, data);
  } catch (error) {
    console.error("❌ Error sending to user:", error);
    throw error;
  }
}

// ============================================
// DEMO EXAMPLES
// ============================================

async function demo() {
  console.log("🚀 FCM Push Notification Demo\n");

  // Example 1: Gửi đến 1 device
  console.log("📱 Example 1: Gửi đến 1 device");
  if (DEVICE_TOKEN !== "YOUR_DEVICE_TOKEN_HERE") {
    await sendToDevice(
      DEVICE_TOKEN,
      {
        title: "🏋️ Buổi tập sắp bắt đầu!",
        body: "Bạn có buổi tập với PT lúc 14:00 hôm nay 💪",
      },
      {
        contractId: "J4NiE5vDTHBHJnxuYA8T",
        type: "workout_reminder",
      }
    );
  } else {
    console.log("⏭️  Skipped - cần cấu hình DEVICE_TOKEN");
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Example 2: Gửi đến nhiều devices
  console.log("📱 Example 2: Gửi đến nhiều devices");
  // const tokens = ['token1', 'token2', 'token3'];
  // await sendToMultipleDevices(tokens, {
  //   title: '🎉 Chương trình khuyến mãi',
  //   body: 'Giảm 20% cho gói tập năm!',
  // });
  console.log("⏭️  Skipped - uncomment code để test");

  console.log("\n" + "=".repeat(50) + "\n");

  // Example 3: Gửi đến topic
  console.log('📱 Example 3: Gửi đến topic "all_users"');
  // await sendToTopic('all_users', {
  //   title: '📢 Thông báo chung',
  //   body: 'Phòng gym đóng cửa vào Chủ nhật tuần này',
  // });
  console.log("⏭️  Skipped - uncomment code để test");

  console.log("\n" + "=".repeat(50) + "\n");

  // Example 4: Gửi đến user qua Firestore
  console.log("📱 Example 4: Gửi đến user qua Firestore");
  // await sendToUser('JVpJwI3RyvFNNbaC1C27', {
  //   title: '💰 Thanh toán thành công',
  //   body: 'Gói tập của bạn đã được kích hoạt!',
  // }, {
  //   type: 'payment_success',
  // });
  console.log("⏭️  Skipped - uncomment code để test");

  console.log("\n✅ Demo completed!\n");
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
