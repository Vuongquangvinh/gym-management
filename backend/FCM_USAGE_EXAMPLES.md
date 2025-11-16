# Hướng dẫn sử dụng FCM Helper trong các Service khác

## 📝 Import

```javascript
import {
  sendToUser,
  sendPaymentSuccessNotification,
  sendWorkoutReminderNotification,
  sendPackageExpiringNotification,
  sendGeneralNotification,
} from "../../utils/fcm.helper.js";
```

## 💡 Các ví dụ sử dụng

### 1. Gửi thông báo khi tạo lịch tập mới (PT Schedule)

```javascript
// File: src/features/contracts/contracts.service.js

export async function createPTSchedule(scheduleData) {
  try {
    // ... Tạo schedule trong Firestore
    
    // Gửi thông báo cho user
    const scheduledTime = new Date(scheduleData.date);
    await sendWorkoutReminderNotification(scheduleData.userId, {
      scheduledTime: scheduledTime.toLocaleString('vi-VN'),
      ptName: scheduleData.ptName,
      contractId: scheduleData.contractId,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
```

### 2. Gửi thông báo khi gói tập sắp hết hạn (Cron Job)

```javascript
// File: src/jobs/check-expiring-packages.js

import { admin } from "../config/firebase.js";
import { sendPackageExpiringNotification } from "../utils/fcm.helper.js";

export async function checkExpiringPackages() {
  const db = admin.firestore();
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  // Tìm users có gói sắp hết hạn trong 3 ngày
  const users = await db
    .collection("users")
    .where("package_end_date", "<=", admin.firestore.Timestamp.fromDate(threeDaysLater))
    .where("package_end_date", ">", admin.firestore.Timestamp.fromDate(now))
    .where("membership_status", "==", "Active")
    .get();
  
  for (const userDoc of users.docs) {
    const userData = userDoc.data();
    const endDate = userData.package_end_date.toDate();
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    // Lấy tên gói
    const packageDoc = await db
      .collection("packages")
      .where("PackageId", "==", userData.current_package_id)
      .limit(1)
      .get();
    
    const packageName = packageDoc.empty 
      ? "Gói tập"
      : packageDoc.docs[0].data().PackageName;
    
    // Gửi thông báo
    await sendPackageExpiringNotification(userDoc.id, {
      packageName: packageName,
      daysRemaining: daysRemaining,
      endDate: endDate.toISOString(),
    });
    
    console.log(`✅ Sent expiring notification to user ${userDoc.id}`);
  }
}
```

### 3. Gửi thông báo khi admin duyệt contract

```javascript
// File: src/features/contracts/contracts.controller.js

export async function approveContract(req, res) {
  try {
    const { contractId } = req.params;
    
    // ... Update contract status
    
    const contractDoc = await db.collection("contracts").doc(contractId).get();
    const contractData = contractDoc.data();
    
    // Gửi thông báo cho user
    await sendGeneralNotification(contractData.userId, {
      title: "✅ Hợp đồng được duyệt",
      body: `Hợp đồng PT của bạn đã được duyệt. Bạn có thể bắt đầu đặt lịch tập!`,
      type: "contract_approved",
      contractId: contractId,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### 4. Gửi thông báo khi PT hủy lịch tập

```javascript
// File: src/features/schedules/schedules.service.js

export async function cancelSchedule(scheduleId, reason) {
  try {
    const db = admin.firestore();
    const scheduleDoc = await db.collection("schedules").doc(scheduleId).get();
    const scheduleData = scheduleDoc.data();
    
    // Update schedule status
    await db.collection("schedules").doc(scheduleId).update({
      status: "cancelled",
      cancelReason: reason,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Gửi thông báo cho user
    await sendGeneralNotification(scheduleData.userId, {
      title: "❌ Lịch tập bị hủy",
      body: `Buổi tập lúc ${scheduleData.time} đã bị hủy. Lý do: ${reason}`,
      type: "schedule_cancelled",
      scheduleId: scheduleId,
      reason: reason,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
```

### 5. Gửi thông báo broadcast cho tất cả users

```javascript
// File: src/features/notifications/notifications.service.js

import { sendToMultipleDevices } from "../../utils/fcm.helper.js";

export async function sendBroadcastNotification(notificationData) {
  try {
    const db = admin.firestore();
    
    // Lấy tất cả FCM tokens
    const usersSnapshot = await db.collection("users").get();
    const tokens = usersSnapshot.docs
      .map(doc => doc.data().fcmToken)
      .filter(token => token && token.length > 0);
    
    console.log(`📤 Sending broadcast to ${tokens.length} users`);
    
    // Gửi notification
    const result = await sendToMultipleDevices(
      tokens,
      {
        title: notificationData.title,
        body: notificationData.body,
      },
      {
        type: "broadcast",
        ...notificationData.data,
      }
    );
    
    console.log(`✅ Sent to ${result.successCount} users`);
    console.log(`❌ Failed to send to ${result.failureCount} users`);
    
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
```

### 6. Gửi thông báo nhắc check-in

```javascript
// File: src/jobs/send-checkin-reminders.js

import { sendToUser } from "../utils/fcm.helper.js";

export async function sendCheckinReminders() {
  const db = admin.firestore();
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  
  // Tìm các lịch tập sắp bắt đầu trong 1 giờ
  const schedulesSnapshot = await db
    .collection("schedules")
    .where("scheduledTime", ">=", admin.firestore.Timestamp.fromDate(now))
    .where("scheduledTime", "<=", admin.firestore.Timestamp.fromDate(oneHourLater))
    .where("status", "==", "scheduled")
    .get();
  
  for (const scheduleDoc of schedulesSnapshot.docs) {
    const schedule = scheduleDoc.data();
    
    await sendToUser(schedule.userId, {
      title: "⏰ Nhắc nhở check-in",
      body: `Bạn có buổi tập lúc ${schedule.time}. Đừng quên check-in khi đến phòng gym!`,
    }, {
      type: "checkin_reminder",
      scheduleId: scheduleDoc.id,
      scheduledTime: schedule.scheduledTime.toDate().toISOString(),
    });
  }
}
```

## 🔧 Setup Cron Jobs (Optional)

Nếu muốn gửi notification định kỳ, có thể dùng `node-cron`:

```bash
npm install node-cron
```

```javascript
// File: src/jobs/scheduler.js

import cron from "node-cron";
import { checkExpiringPackages } from "./check-expiring-packages.js";
import { sendCheckinReminders } from "./send-checkin-reminders.js";

// Chạy mỗi ngày lúc 9:00 AM - Check gói sắp hết hạn
cron.schedule("0 9 * * *", async () => {
  console.log("🔄 Running expiring packages check...");
  await checkExpiringPackages();
});

// Chạy mỗi 30 phút - Gửi nhắc check-in
cron.schedule("*/30 * * * *", async () => {
  console.log("🔄 Sending check-in reminders...");
  await sendCheckinReminders();
});

console.log("✅ Cron jobs scheduled");
```

```javascript
// File: src/index.js (hoặc app.js)

import "./jobs/scheduler.js"; // Import để start cron jobs
```

## ⚠️ Lưu ý

1. **Luôn wrap trong try-catch** để không làm fail logic chính
2. **Log kết quả** để debug
3. **Kiểm tra FCM token** trước khi gửi
4. **Không throw error** nếu gửi notification fail (trừ khi notification là critical)

## 🎯 Best Practices

1. Gửi notification **sau khi** xử lý logic chính thành công
2. Sử dụng meaningful data trong notification payload
3. Tùy chỉnh title/body theo ngữ cảnh
4. Log đầy đủ để tracking
5. Handle gracefully khi user không có FCM token
