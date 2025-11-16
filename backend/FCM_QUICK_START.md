# 🚀 Quick Start - FCM Payment Notification

## ✅ Đã hoàn thành

Backend đã được tích hợp FCM notification cho payment flow. Khi user thanh toán thành công, họ sẽ tự động nhận notification.

## 📱 Cần làm gì ở Frontend Flutter?

### 1. Lưu FCM Token vào Firestore

**File:** `lib/services/fcm_service.dart` (hoặc tương tự)

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

Future<void> saveFCMToken(String userId) async {
  try {
    // Lấy FCM token
    final fcmToken = await FirebaseMessaging.instance.getToken();
    
    if (fcmToken != null) {
      // Lưu vào Firestore
      await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .update({'fcmToken': fcmToken});
      
      print('✅ FCM token saved: ${fcmToken.substring(0, 30)}...');
    }
  } catch (e) {
    print('❌ Error saving FCM token: $e');
  }
}
```

### 2. Gọi hàm khi login

```dart
// Sau khi login thành công
await saveFCMToken(currentUser.uid);
```

### 3. Handle notification khi app chạy

```dart
// Foreground notification
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('📬 Notification received: ${message.notification?.title}');
  
  // Hiển thị local notification hoặc banner
  // TODO: Implement your UI
});

// Background notification tap
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  print('📬 Notification tapped: ${message.data}');
  
  // Navigate dựa vào message.data['type']
  if (message.data['type'] == 'payment_success') {
    // Navigate to payment history or home
  }
});
```

## 🧪 Test ngay

### Bước 1: Chạy Flutter app
```bash
cd frontend_flutter
flutter run
```

### Bước 2: Login và check console
Bạn sẽ thấy FCM token được in ra:
```
✅ FCM token saved: f8xAXNOAQsaQ0Dk4UOed4t...
```

### Bước 3: Test bằng demo script
```bash
cd backend

# Mở src/utils/fcm.demo.js
# Thay USER_ID bằng userId của bạn từ Firestore
# Hoặc thay DEVICE_TOKEN bằng token từ bước 2

node src/utils/fcm.demo.js
```

### Bước 4: Test với payment thực tế
1. Mở app Flutter
2. Chọn gói tập và thanh toán
3. Thanh toán qua PayOS
4. ✅ Ngay sau khi thanh toán thành công, app sẽ nhận notification!

## 📊 Check Firestore

Vào Firebase Console → Firestore → users collection:

```
users/
  ├─ {userId}/
  │   ├─ email: "user@example.com"
  │   ├─ name: "Nguyen Van A"
  │   ├─ fcmToken: "f8xAXNOAQsaQ0Dk4UOed4t:APA91b..." ← Phải có field này
  │   └─ ...
```

## ⚠️ Troubleshooting

### Không nhận được notification?

1. **Check FCM token đã lưu chưa?**
   ```dart
   print('FCM Token: ${await FirebaseMessaging.instance.getToken()}');
   ```

2. **Check Firestore có field fcmToken?**
   - Vào Firebase Console → Firestore
   - Tìm user document
   - Xem có field `fcmToken` không

3. **Check backend logs:**
   ```
   📲 Sending payment success notification...
   ✅ [FCM] Found token for user...
   ✅ [FCM] Successfully sent message
   ```

4. **Check app có permission notification?**
   ```dart
   final settings = await FirebaseMessaging.instance.requestPermission();
   print('Permission: ${settings.authorizationStatus}');
   ```

## 📚 Tài liệu đầy đủ

- `FCM_PAYMENT_INTEGRATION.md` - Chi tiết tích hợp
- `FCM_USAGE_EXAMPLES.md` - Ví dụ cho service khác
- `FCM_PAYMENT_NOTIFICATION_DONE.md` - Summary

## 🎯 Kết quả mong đợi

✅ User thanh toán → Nhận notification ngay lập tức  
✅ Không cần refresh app  
✅ Notification hiển thị kể cả khi app đang chạy background  

---

**Ready to test!** 🚀
