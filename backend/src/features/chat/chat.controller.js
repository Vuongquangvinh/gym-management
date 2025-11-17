import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Gửi chat notification qua FCM
 * POST /api/chat/notification
 */
export const sendChatNotification = async (req, res) => {
  try {
    const { chatId, senderId, receiverId, messageText, imageUrl } = req.body;

    console.log("📬 Sending chat notification:", {
      chatId,
      senderId,
      receiverId,
      hasImage: !!imageUrl,
    });

    // Validate input
    if (!chatId || !senderId || !receiverId || !messageText) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: chatId, senderId, receiverId, messageText",
      });
    }

    // Lấy FCM token của người nhận
    const db = getFirestore();
    const receiverDoc = await db.collection("users").doc(receiverId).get();

    if (!receiverDoc.exists) {
      console.log(`⚠️ Receiver ${receiverId} not found`);
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    const receiverData = receiverDoc.data();
    const fcmToken = receiverData?.fcmToken;

    if (!fcmToken) {
      console.log(`⚠️ No FCM token for user ${receiverId}`);
      return res.status(200).json({
        success: true,
        message: "Receiver has no FCM token (notification skipped)",
        skipped: true,
      });
    }

    // Lấy tên người gửi với nhiều fallback options
    const senderDoc = await db.collection("users").doc(senderId).get();

    let senderName = "Người dùng"; // Default fallback

    if (senderDoc.exists) {
      const senderData = senderDoc.data();

      console.log(`🔍 Sender data found:`, {
        id: senderId,
        name: senderData?.name,
        fullName: senderData?.fullName,
        displayName: senderData?.displayName,
        username: senderData?.username,
        email: senderData?.email,
      });

      // Thử các field có thể chứa tên
      senderName =
        senderData?.name || // Field 'name'
        senderData?.fullName || // Field 'fullName'
        senderData?.displayName || // Field 'displayName'
        senderData?.username || // Field 'username'
        senderData?.email?.split("@")[0] || // Email username
        senderId; // Cuối cùng dùng ID

      console.log(
        `👤 Sender name resolved: "${senderName}" (from users collection)`
      );
    } else {
      // Nếu không tìm thấy trong users, thử tìm trong employees bằng uid
      console.log(
        `⚠️ User ${senderId} not found in users collection, searching employees by uid...`
      );

      try {
        const empQuery = await db
          .collection("employees")
          .where("uid", "==", senderId)
          .limit(1)
          .get();
        if (!empQuery.empty) {
          const empDoc = empQuery.docs[0];
          const empData = empDoc.data();

          console.log(`🔍 Employee data found:`, {
            id: senderId,
            name: empData?.name,
            fullName: empData?.fullName,
            displayName: empData?.displayName,
            email: empData?.email,
          });

          senderName =
            empData?.name ||
            empData?.fullName ||
            empData?.displayName ||
            empData?.email?.split("@")[0] ||
            senderId;
          console.log(
            `👤 Sender name resolved: "${senderName}" (from employees)`
          );
        } else {
          console.log(
            `⚠️ Sender ${senderId} not found in any collection, using ID as name`
          );
          senderName = senderId;
        }
      } catch (empError) {
        console.error(`❌ Error fetching employee:`, empError);
        senderName = senderId;
      }
    }

    // Tạo notification body
    let notificationBody = "";
    if (imageUrl) {
      // Tin nhắn có hình
      if (messageText.trim() && messageText !== "[Hình ảnh]") {
        notificationBody = `📷 ${messageText}`;
      } else {
        notificationBody = "📷 Đã gửi một hình ảnh";
      }
    } else {
      // Tin nhắn text thường
      notificationBody = messageText;
    }

    // Tạo FCM message
    const message = {
      token: fcmToken,
      notification: {
        title: senderName,
        body: notificationBody,
      },
      data: {
        chatId: chatId,
        senderId: senderId,
        isImage: imageUrl ? "true" : "false",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "chat_messages",
          sound: "default",
          priority: "high",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    // Gửi FCM
    const response = await admin.messaging().send(message);

    console.log("✅ Notification sent successfully:", response);

    return res.status(200).json({
      success: true,
      message: "Notification sent",
      messageId: response,
    });
  } catch (error) {
    console.error("❌ Error sending chat notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};
