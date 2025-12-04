import admin from "firebase-admin";

// Gửi thông báo cho PT khi user thay đổi gói tập/khung giờ
export async function notifyPTScheduleChange(req, res) {
  try {
    const { contractId, oldSchedule, newSchedule } = req.body;
    if (!contractId)
      return res.status(400).json({ message: "Missing contractId" });

    // Lấy thông tin hợp đồng
    console.log("===> Fetching contract:", contractId);
    const contractDoc = await admin
      .firestore()
      .collection("contracts")
      .doc(contractId)
      .get();
    if (!contractDoc.exists)
      return res.status(404).json({ message: "Contract not found" });

    const contract = contractDoc.data();
    const ptId = contract.ptId;
    if (!ptId) return res.status(400).json({ message: "No PT assigned" });

    // Lấy FCM token của PT từ employees
    const ptDoc = await admin
      .firestore()
      .collection("employees")
      .doc(ptId)
      .get();
    if (!ptDoc.exists) return res.status(404).json({ message: "PT not found" });

    const ptData = ptDoc.data();
    const ptName = ptData.fullName || ptData.name || "PT";

    // Lấy thông tin user từ contract
    const userId = contract.userId;
    let userName = "Khách hàng";
    if (userId) {
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userName =
          userData.fullName ||
          userData.displayName ||
          userData.email ||
          "Khách hàng";
      }
    }

    // Tạo notification trong Firestore để PT lắng nghe real-time
    const notificationData = {
      recipientId: ptData.uid, // Sử dụng uid thực sự của PT
      recipientType: "pt",
      title: "Lịch tập đã thay đổi",
      body: `${userName} vừa cập nhật khung giờ/gói tập. Vui lòng kiểm tra lại lịch.`,
      message: `${userName} vừa cập nhật khung giờ/gói tập. Vui lòng kiểm tra lại lịch.`,
      type: "schedule_update",
      contractId,
      userId,
      oldSchedule: oldSchedule || null,
      newSchedule: newSchedule || null,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const notificationRef = await admin
      .firestore()
      .collection("notifications")
      .add(notificationData);

    console.log("Notification created in Firestore:", notificationRef.id);

    // Thử gửi FCM nếu có token (optional, cho mobile app)
    const fcmToken = ptData.fcmToken;
    if (fcmToken) {
      try {
        const message = {
          token: fcmToken,
          notification: {
            title: notificationData.title,
            body: notificationData.body,
          },
          data: {
            contractId,
            type: "schedule_update",
            notificationId: notificationRef.id,
          },
        };
        await admin.messaging().send(message);
        console.log("FCM sent to PT mobile app");
      } catch (fcmError) {
        console.log("FCM send failed (optional):", fcmError.message);
      }
    }

    return res.json({
      success: true,
      notificationId: notificationRef.id,
      message: "Notification created successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
