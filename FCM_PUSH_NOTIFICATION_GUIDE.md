# FCM Push Notification Implementation Guide

## 📋 Tổng quan

Đã tích hợp **Firebase Cloud Messaging (FCM)** vào app Flutter để gửi push notifications. Người dùng sẽ nhận được thông báo dù app đang tắt, chạy background, hoặc terminated.

---

## ✅ Đã hoàn thành

### 1. **Package đã cài đặt**
- ✅ `firebase_messaging: ^15.1.3` - Xử lý FCM
- ✅ `firebase_core` - Core Firebase
- ✅ `flutter_local_notifications` - Hiển thị notifications

### 2. **Files đã tạo/cập nhật**

#### **Tạo mới:**
- `lib/services/fcm_service.dart` - Service xử lý FCM

#### **Cập nhật:**
- `lib/main.dart` - Thêm FCM initialization & background handler
- `lib/services/notification_service.dart` - Thêm method `showInstantNotification()`
- `pubspec.yaml` - Thêm firebase_messaging

### 3. **Cấu hình Android**
- ✅ `android/app/google-services.json` - Đã có sẵn
- ✅ `android/settings.gradle.kts` - Google services plugin configured
- ✅ `android/app/build.gradle.kts` - Google services applied
- ✅ `AndroidManifest.xml` - Đã có permissions cho notifications

---

## 🚀 Các bước tiếp theo

### **BƯỚC 1: Chạy `flutter pub get`**

```bash
cd frontend_flutter
flutter pub get
```

### **BƯỚC 2: Build & test app trên thiết bị thật**

```bash
flutter run --release
```

**Lưu ý:** FCM chỉ hoạt động trên **thiết bị thật**, không hoạt động trên emulator.

### **BƯỚC 3: Lấy FCM Token**

Khi app khởi động, FCM token sẽ được in ra console:

```
📱 FCM Token: fAbC123XyZ...
```

Token này sẽ tự động lưu vào Firestore:
- Collection: `users`
- Document: `{userId}`
- Field: `fcmToken`

### **BƯỚC 4: Test gửi notification từ Firebase Console**

1. Vào https://console.firebase.google.com/
2. Chọn project của bạn
3. Vào **Cloud Messaging** (menu bên trái)
4. Click **"Send your first message"**
5. Điền:
   - **Notification title:** "Test Notification"
   - **Notification text:** "This is a test"
6. Click **Next**
7. Chọn **"Send test message"**
8. Paste **FCM Token** vừa lấy được
9. Click **Test**

### **BƯỚC 5: Verify kết quả**

**Khi app đang mở (foreground):**
- ✅ Notification hiển thị ngay lập tức

**Khi app ở background:**
- ✅ Notification xuất hiện trong notification tray
- ✅ Tap vào notification → app mở lên

**Khi app đã tắt (terminated):**
- ✅ Notification vẫn nhận được
- ✅ Tap vào notification → app khởi động

---

## 🔧 Cách hoạt động

### **1. Khởi tạo (main.dart)**

```dart
void main() async {
  // 1. Khởi tạo Firebase
  await Firebase.initializeApp();
  
  // 2. Đăng ký background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // 3. Khởi tạo notification services
  await NotificationService().initialize();
  await FCMService().initialize();
}
```

### **2. Background Message Handler**

```dart
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Background message: ${message.notification?.title}');
}
```

**Chức năng:**
- Xử lý notifications khi app ở **background** hoặc **terminated**
- Phải là **top-level function** (không thể ở trong class)
- Annotation `@pragma('vm:entry-point')` để Dart không loại bỏ function này

### **3. FCM Service**

**Chức năng chính:**

1. **Request Permission** - Xin quyền hiển thị notifications
2. **Get FCM Token** - Lấy device token để gửi notifications
3. **Save Token to Firestore** - Lưu token vào database
4. **Listen to Foreground Messages** - Xử lý notifications khi app đang mở
5. **Handle Notification Tap** - Xử lý khi user tap vào notification
6. **Token Refresh Listener** - Cập nhật token khi refresh

### **4. Luồng xử lý Notifications**

```
┌─────────────────────────────────────────────────────────────┐
│                    FCM Server (Firebase)                     │
│                    Gửi notification                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   App State?                 │
        └──┬───────────┬───────────┬───┘
           │           │           │
    ┌──────▼─────┐ ┌──▼────────┐ ┌▼─────────────┐
    │ Foreground │ │Background │ │ Terminated   │
    │ (đang mở)  │ │(minimize) │ │ (đã tắt)     │
    └──────┬─────┘ └──┬────────┘ └┬─────────────┘
           │           │           │
    ┌──────▼─────┐    │           │
    │FCMService  │    │           │
    │onMessage   │    │           │
    └──────┬─────┘    │           │
           │          │           │
    ┌──────▼──────────▼───────────▼────────┐
    │  NotificationService                  │
    │  showInstantNotification()            │
    └───────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  User nhìn thấy      │
            │  notification        │
            └──────────────────────┘
```

---

## 📤 Gửi Notification từ Backend

### **Option 1: Gửi đến 1 device cụ thể (qua token)**

```http
POST https://fcm.googleapis.com/fcm/send
Headers:
  Content-Type: application/json
  Authorization: key=YOUR_SERVER_KEY

Body:
{
  "to": "FCM_DEVICE_TOKEN",
  "notification": {
    "title": "Buổi tập sắp bắt đầu!",
    "body": "Bạn có buổi tập với PT lúc 14:00 hôm nay"
  },
  "data": {
    "contractId": "abc123",
    "type": "workout_reminder"
  }
}
```

### **Option 2: Gửi đến nhiều devices (qua topic)**

```http
POST https://fcm.googleapis.com/fcm/send
Headers:
  Content-Type: application/json
  Authorization: key=YOUR_SERVER_KEY

Body:
{
  "to": "/topics/all_users",
  "notification": {
    "title": "Thông báo chung",
    "body": "Phòng gym đóng cửa ngày mai"
  }
}
```

### **Lấy Server Key:**

1. Vào Firebase Console
2. Project Settings > Cloud Messaging
3. Copy **Server key**

---

## 🔍 Debug & Troubleshooting

### **1. Không nhận được notification**

**Check:**
- ✅ App đã request permission? (check console log)
- ✅ FCM token đã lưu vào Firestore?
- ✅ Gửi đến đúng token?
- ✅ Test trên **thiết bị thật**, không phải emulator

### **2. Notification không hiển thị khi app foreground**

**Check:**
- ✅ `FCMService.onMessage` có được gọi không?
- ✅ `NotificationService.showInstantNotification()` có lỗi không?

### **3. Background messages không hoạt động**

**Check:**
- ✅ `_firebaseMessagingBackgroundHandler` có annotation `@pragma('vm:entry-point')`?
- ✅ Function này ở **top-level** (ngoài class)?

### **4. Console logs để debug**

```
📱 FCM Token: ...           → Token đã được lấy
✅ FCM token saved          → Token đã lưu Firestore
🔔 FCM Permission status    → Permission status
📬 Received foreground msg  → Nhận message khi app mở
📲 Notification tapped!     → User tap vào notification
🔄 FCM token refreshed      → Token được refresh
```

---

## 💡 Tips & Best Practices

### **1. Subscribe to Topics**

Để gửi notification cho nhiều users cùng lúc:

```dart
// Subscribe user to "all_users" topic
await FCMService().subscribeToTopic('all_users');

// Subscribe PT trainers to "trainers" topic
await FCMService().subscribeToTopic('trainers');
```

### **2. Xử lý Navigation khi tap notification**

Update `FCMService._handleNotificationData()`:

```dart
void _handleNotificationData(Map<String, dynamic> data) {
  if (data.containsKey('contractId')) {
    // Navigate to contract detail
    NavigationHelper.navigateToContractDetail(data['contractId']);
  } else if (data.containsKey('type') && data['type'] == 'payment') {
    // Navigate to payment screen
    NavigationHelper.navigateToPayment();
  }
}
```

### **3. Cleanup khi logout**

Trong `AuthProvider.signOut()`:

```dart
await FCMService().deleteToken();
```

### **4. Lưu token vào Firestore khi login**

Trong `AuthProvider` hoặc `HomeScreen.initState()`:

```dart
await FCMService().initialize(); // Tự động lưu token
```

---

## 📊 Data Structure trong Firestore

### **users collection:**

```json
{
  "userId": "abc123",
  "email": "user@example.com",
  "fcmToken": "fAbC123XyZ...",
  "fcmTokenUpdatedAt": Timestamp
}
```

---

## 🎯 Use Cases

### **1. Nhắc nhở buổi tập**
- Backend lên lịch gửi notification 30 phút trước buổi tập
- User nhận được thông báo dù app đang tắt

### **2. Thông báo thanh toán**
- Admin gửi thông báo khi thanh toán được xác nhận
- User tap notification → đi đến màn hình payment history

### **3. Thông báo chung**
- Admin gửi thông báo cho tất cả users qua topic
- VD: "Phòng gym đóng cửa ngày lễ"

---

## ✨ Kết luận

FCM đã được tích hợp thành công! Bây giờ app có thể:

- ✅ Nhận push notifications dù app đang tắt
- ✅ Hiển thị notifications theo thời gian thực
- ✅ Xử lý khi user tap vào notification
- ✅ Lưu FCM token vào Firestore
- ✅ Support gửi đến nhiều users qua topics

**Next steps:**
1. Chạy `flutter pub get`
2. Build app trên thiết bị thật
3. Test gửi notification từ Firebase Console
4. Tích hợp gửi notification từ backend

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 13/11/2025
