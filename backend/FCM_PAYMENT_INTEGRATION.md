# Tích hợp FCM Push Notification cho Payment

## 📋 Tổng quan

Hệ thống đã được tích hợp FCM Push Notification để gửi thông báo tự động khi:
- ✅ Thanh toán gói tập gym thành công
- ✅ Thanh toán gói tập PT thành công

## 🏗️ Kiến trúc

### 1. FCM Helper (`src/utils/fcm.helper.js`)

Module chứa các hàm gửi FCM notification:

**Hàm cơ bản:**
- `sendToDevice(token, notification, data)` - Gửi đến 1 device cụ thể
- `sendToUser(userId, notification, data)` - Gửi đến user (tự động lấy FCM token từ Firestore)
- `sendToMultipleDevices(tokens, notification, data)` - Gửi đến nhiều devices
- `sendToTopic(topic, notification, data)` - Gửi đến topic

**Hàm helper cho các sự kiện cụ thể:**
- `sendPaymentSuccessNotification(userId, paymentData)` - Thanh toán thành công
- `sendWorkoutReminderNotification(userId, scheduleData)` - Nhắc lịch tập
- `sendPackageExpiringNotification(userId, packageData)` - Gói tập sắp hết hạn
- `sendGeneralNotification(userId, notificationData)` - Thông báo chung

### 2. Payment Integration (`src/features/payos/payos.controller.js`)

Đã tích hợp vào hàm `handlePaymentWebhook()`:

```javascript
// Sau khi xử lý thanh toán thành công
await sendPaymentSuccessNotification(userId, {
  packageName: orderInfo.packageName,
  amount: amount,
  orderCode: orderCode,
  paymentType: "gym_package", // hoặc "pt_package"
});
```

## 📱 Luồng hoạt động

### Thanh toán Gym Package

1. User thanh toán qua PayOS
2. PayOS gọi webhook → `handlePaymentWebhook()`
3. Backend xác thực và cập nhật Firestore:
   - Cập nhật `users` collection (package, end_date, sessions...)
   - Cập nhật `payment_orders` status = "PAID"
4. **🔔 GỬI NOTIFICATION:**
   - Lấy FCM token của user từ Firestore
   - Gửi notification "Thanh toán thành công"
   - Log kết quả (thành công/thất bại)
5. Trả response về PayOS

### Thanh toán PT Package

1. User thanh toán qua PayOS
2. PayOS gọi webhook → `handlePaymentWebhook()`
3. Backend xác thực và cập nhật Firestore:
   - Cập nhật `contracts` collection (paymentStatus = "PAID")
   - Cập nhật `payment_orders` status = "PAID"
4. **🔔 GỬI NOTIFICATION:**
   - Lấy FCM token của user từ Firestore
   - Gửi notification "Thanh toán PT thành công"
   - Log kết quả (thành công/thất bại)
5. Trả response về PayOS

## 💾 Cấu trúc dữ liệu Notification

### Gym Package Payment Success

```javascript
{
  notification: {
    title: "💰 Thanh toán thành công!",
    body: "Gói tập \"Gói tập 1 tháng\" đã được kích hoạt!"
  },
  data: {
    type: "payment_success",
    paymentType: "gym_package",
    orderCode: "1731484800123",
    contractId: "",
    amount: "500000",
    packageName: "Gói tập 1 tháng",
    timestamp: "2025-11-13T10:30:00.000Z"
  }
}
```

### PT Package Payment Success

```javascript
{
  notification: {
    title: "💰 Thanh toán PT thành công!",
    body: "Gói tập PT \"PT Monthly - 8 buổi\" đã được kích hoạt!"
  },
  data: {
    type: "payment_success",
    paymentType: "pt_package",
    orderCode: "1731484800123",
    contractId: "J4NiE5vDTHBHJnxuYA8T",
    amount: "2000000",
    packageName: "PT Monthly - 8 buổi",
    timestamp: "2025-11-13T10:30:00.000Z"
  }
}
```

## 🔧 Yêu cầu

### Backend

1. **Firebase Admin SDK** đã được khởi tạo (`src/config/firebase.js`)
2. **Service Account Key** đã được cấu hình
3. User có field `fcmToken` trong Firestore collection `users`

### Frontend (Flutter)

User phải có FCM token được lưu trong Firestore:

```dart
// Lưu FCM token khi login hoặc app start
final fcmToken = await FirebaseMessaging.instance.getToken();
await FirebaseFirestore.instance
  .collection('users')
  .doc(userId)
  .update({'fcmToken': fcmToken});
```

## 📊 Xử lý lỗi

Notification được gửi **sau khi** thanh toán đã được xử lý thành công:
- ✅ Nếu gửi notification **thất bại** → Log warning, nhưng **không** fail transaction
- ✅ Payment vẫn được xử lý bình thường
- ✅ Lý do: Notification là "nice to have", không phải "must have"

```javascript
try {
  const result = await sendPaymentSuccessNotification(...);
  if (result.success) {
    console.log("✅ Notification sent");
  } else {
    console.warn("⚠️ Failed to send:", result.error);
  }
} catch (error) {
  console.error("❌ Error:", error);
  // Don't throw - payment already processed
}
```

## 🧪 Testing

### 1. Test gửi notification thủ công

```bash
cd backend
node send_fcm_admin.js
```

### 2. Test với thanh toán thực tế

1. Tạo payment link (frontend hoặc Postman)
2. Thanh toán qua PayOS
3. Check logs backend:
   ```
   📲 Sending payment success notification...
   ✅ Payment notification sent successfully
   ```
4. Check app Flutter nhận notification

### 3. Check Firestore

Verify user có `fcmToken`:
```javascript
users/{userId} {
  fcmToken: "f8xAXNOAQsaQ0Dk4UOed4t:APA91b...",
  ...
}
```

## 📝 Logs

### Success Flow

```
💰 Payment successful for order: 1731484800123
📦 Order info: { userId: "abc123", packageName: "Gói 1 tháng", ... }
📲 Sending payment success notification (Gym)...
📤 [FCM] Sending to user abc123...
✅ [FCM] Found user by Document ID
📱 [FCM] Found token for user abc123: f8xAXNOAQsaQ0Dk4UOed4t...
✅ [FCM] Successfully sent message: projects/.../messages/123456
✅ Payment notification sent successfully (Gym)
🎉 Payment webhook processed successfully!
```

### No FCM Token Flow

```
📲 Sending payment success notification (Gym)...
📤 [FCM] Sending to user abc123...
⚠️ [FCM] User abc123 has no FCM token
⚠️ Failed to send payment notification (Gym): No FCM token
🎉 Payment webhook processed successfully!
```

## 🚀 Mở rộng

### Thêm loại notification mới

1. Thêm hàm helper vào `fcm.helper.js`:

```javascript
export async function sendNewTypeNotification(userId, data) {
  return await sendToUser(
    userId,
    {
      title: "📢 Title",
      body: "Body message",
    },
    {
      type: "new_type",
      ...data,
      timestamp: new Date().toISOString(),
    }
  );
}
```

2. Import và sử dụng trong controller/service:

```javascript
import { sendNewTypeNotification } from "../../utils/fcm.helper.js";

// Somewhere in your code
await sendNewTypeNotification(userId, { key: "value" });
```

### Gửi đến nhiều users

```javascript
import { sendToMultipleDevices } from "../../utils/fcm.helper.js";

// Get all FCM tokens
const users = await db.collection("users").get();
const tokens = users.docs
  .map(doc => doc.data().fcmToken)
  .filter(token => token);

await sendToMultipleDevices(tokens, {
  title: "📢 Thông báo chung",
  body: "Nội dung thông báo...",
});
```

## ✅ Checklist triển khai

- [x] Tạo `fcm.helper.js` với các hàm gửi notification
- [x] Tích hợp vào `payos.controller.js` cho gym package
- [x] Tích hợp vào `payos.controller.js` cho PT package
- [x] Xử lý lỗi gracefully (không fail payment)
- [x] Log đầy đủ để debug
- [ ] Test với thiết bị thật
- [ ] Verify FCM token được lưu trong Firestore
- [ ] Test cả gym package và PT package payment

## 📚 Tài liệu liên quan

- `FCM_PUSH_NOTIFICATION_GUIDE.md` - Hướng dẫn setup FCM
- `PAYMENT_API_SUMMARY.md` - Tài liệu PayOS API
- `send_fcm_admin.js` - Script test FCM thủ công
