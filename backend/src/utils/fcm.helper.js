/**
 * FCM Helper - Gửi Push Notification sử dụng Firebase Admin SDK
 *
 * Module này cung cấp các hàm để gửi FCM push notification
 * đến người dùng khi có các sự kiện quan trọng.
 */

import { admin } from "../config/firebase.js";

/**
 * Gửi notification đến 1 device cụ thể
 */
export async function sendToDevice(token, notification, data = {}) {
  try {
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
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ [FCM] Successfully sent message:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ [FCM] Error sending message:", error.code, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi notification đến user dựa trên userId
 * (Lấy FCM token từ Firestore)
 */
export async function sendToUser(userId, notification, data = {}) {
  try {
    console.log(`📤 [FCM] Sending to user ${userId}...`);

    // Lấy FCM token từ Firestore
    const db = admin.firestore();
    let userDoc = await db.collection("users").doc(userId).get();

    // Nếu không tìm thấy theo document ID, thử tìm theo field _id
    if (!userDoc.exists) {
      console.log("⚠️ [FCM] Not found by Document ID, trying field _id...");
      const userQuery = await db
        .collection("users")
        .where("_id", "==", userId)
        .limit(1)
        .get();

      if (!userQuery.empty) {
        userDoc = userQuery.docs[0];
        console.log("✅ [FCM] Found user by field _id");
      }
    }

    if (!userDoc.exists) {
      console.error(`❌ [FCM] User ${userId} not found`);
      return { success: false, error: "User not found" };
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      console.warn(`⚠️ [FCM] User ${userId} has no FCM token`);
      return { success: false, error: "No FCM token" };
    }

    console.log(
      `📱 [FCM] Found token for user ${userId}: ${fcmToken.substring(0, 30)}...`
    );

    return await sendToDevice(fcmToken, notification, data);
  } catch (error) {
    console.error("❌ [FCM] Error sending to user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi notification đến nhiều devices
 */
export async function sendToMultipleDevices(tokens, notification, data = {}) {
  try {
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
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("✅ [FCM] Successfully sent messages:");
    console.log("  Success count:", response.successCount);
    console.log("  Failure count:", response.failureCount);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error("❌ [FCM] Error sending messages:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi notification đến topic
 */
export async function sendToTopic(topic, notification, data = {}) {
  try {
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
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ [FCM] Successfully sent to topic:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ [FCM] Error sending to topic:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper functions cho các loại thông báo cụ thể
 */

/**
 * Gửi thông báo thanh toán thành công
 */
export async function sendPaymentSuccessNotification(userId, paymentData) {
  const { packageName, amount, orderCode, contractId, paymentType } =
    paymentData;

  let title, body;

  if (paymentType === "pt_package") {
    title = "💰 Thanh toán PT thành công!";
    body = `Gói tập PT "${packageName}" đã được kích hoạt!`;
  } else {
    title = "💰 Thanh toán thành công!";
    body = `Gói tập "${packageName}" đã được kích hoạt!`;
  }

  return await sendToUser(
    userId,
    { title, body },
    {
      type: "payment_success",
      paymentType: paymentType || "gym_package",
      orderCode: String(orderCode),
      contractId: contractId || "",
      amount: String(amount),
      packageName: packageName,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Gửi thông báo nhắc lịch tập
 */
export async function sendWorkoutReminderNotification(userId, scheduleData) {
  const { scheduledTime, ptName, contractId } = scheduleData;

  return await sendToUser(
    userId,
    {
      title: "🏋️ Buổi tập sắp bắt đầu!",
      body: `Bạn có buổi tập với PT ${ptName} lúc ${scheduledTime}. Chuẩn bị sẵn sàng nhé! 💪`,
    },
    {
      type: "workout_reminder",
      contractId: String(contractId),
      scheduledTime: scheduledTime,
      ptName: ptName,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Gửi thông báo gói tập sắp hết hạn
 */
export async function sendPackageExpiringNotification(userId, packageData) {
  const { packageName, daysRemaining, endDate } = packageData;

  return await sendToUser(
    userId,
    {
      title: "⏰ Gói tập sắp hết hạn!",
      body: `Gói "${packageName}" của bạn còn ${daysRemaining} ngày. Hãy gia hạn để tiếp tục tập luyện!`,
    },
    {
      type: "package_expiring",
      packageName: packageName,
      daysRemaining: String(daysRemaining),
      endDate: endDate,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Gửi thông báo chung
 */
export async function sendGeneralNotification(userId, notificationData) {
  const { title, body, type, ...extraData } = notificationData;

  return await sendToUser(
    userId,
    { title, body },
    {
      type: type || "general",
      ...extraData,
      timestamp: new Date().toISOString(),
    }
  );
}
