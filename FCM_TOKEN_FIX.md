# ✅ FCM Token Fix - Hoàn thành

## 🔍 Vấn đề

User không nhận được notification sau khi thanh toán vì:
```
⚠️ [FCM] User JVpJwI3RyvFNNbaC1C27 has no FCM token
⚠️ Failed to send payment notification (Gym - Manual): No FCM token
```

## 🎯 Nguyên nhân

FCM token **không được lưu vào Firestore** vì:
- `FCMService._saveTokenToFirestore()` dùng `user.uid` (Firebase Auth UID) làm document ID
- Nhưng user document thực tế có ID khác (ví dụ: `JVpJwI3RyvFNNbaC1C27`)
- → Update thất bại vì tìm không đúng document

## ✅ Giải pháp

### 1. Sửa `fcm_service.dart`

Đã cập nhật hàm `_saveTokenToFirestore()` để:
1. **Thử tìm theo Auth UID trước** (document ID = Auth UID)
2. **Nếu không tìm thấy → Tìm theo email**
3. Lưu FCM token vào document đúng

```dart
// Thử 1: Tìm theo Auth UID
final userDocByUid = FirebaseFirestore.instance
    .collection('users')
    .doc(user.uid);

if (docSnapshot.exists) {
  // Cập nhật token
} else {
  // Thử 2: Tìm theo email
  final queryByEmail = await FirebaseFirestore.instance
      .collection('users')
      .where('email', isEqualTo: user.email)
      .limit(1)
      .get();
  
  if (queryByEmail.docs.isNotEmpty) {
    // Cập nhật token vào document tìm được
  }
}
```

### 2. Đã tích hợp FCM notification vào Manual Payment

Đã thêm gửi notification vào hàm `confirmPaymentManual()`:
- ✅ Gym Package payment → Gửi notification
- ✅ PT Package payment → Gửi notification

## 🧪 Test

### Bước 1: Hot Restart Flutter App

```bash
# Trong terminal Flutter, nhấn:
R   # (capital R) để hot restart
```

### Bước 2: Kiểm tra console log

Bạn sẽ thấy:
```
📱 FCM Token: f8xAXNOAQsaQ0Dk4UOed4t:APA91b...
✅ FCM token saved to Firestore (by email: user@example.com, doc ID: JVpJwI3RyvFNNbaC1C27)
```

### Bước 3: Verify trong Firestore

1. Mở Firebase Console → Firestore
2. Tìm user document (ví dụ: `JVpJwI3RyvFNNbaC1C27`)
3. Kiểm tra có field `fcmToken`:

```
users/JVpJwI3RyvFNNbaC1C27/
  ├─ email: "user@example.com"
  ├─ name: "User Name"
  ├─ fcmToken: "f8xAXNOAQsaQ0Dk4UOed4t:APA91b..." ← Phải có
  ├─ fcmTokenUpdatedAt: Timestamp
  └─ ...
```

### Bước 4: Test thanh toán lại

1. Tạo payment mới
2. Thanh toán (manual confirm hoặc webhook)
3. Check backend logs:

```
📲 Sending payment success notification (Gym - Manual)...
📤 [FCM] Sending to user JVpJwI3RyvFNNbaC1C27...
✅ [FCM] Found user by Document ID
📱 [FCM] Found token for user JVpJwI3RyvFNNbaC1C27: f8xAXNOAQsaQ0Dk4UOed4t...
✅ [FCM] Successfully sent message: projects/.../messages/123456
✅ Payment notification sent successfully (Gym - Manual)
```

4. ✅ App sẽ nhận notification!

## 📋 Files đã sửa

1. `frontend_flutter/lib/services/fcm_service.dart`
   - Sửa `_saveTokenToFirestore()` để tìm user theo email nếu Auth UID không khớp

2. `backend/src/features/payos/payos.controller.js`
   - Thêm FCM notification vào `confirmPaymentManual()` cho cả gym và PT package

## ⚠️ Lưu ý

### Nếu vẫn không nhận notification:

1. **Check permission:**
   ```dart
   final settings = await FirebaseMessaging.instance.requestPermission();
   print('Permission: ${settings.authorizationStatus}');
   ```

2. **Check app foreground/background:**
   - Foreground: Hiển thị local notification
   - Background: Notification tự động hiển thị

3. **Check console logs:**
   - Flutter: Xem FCM token có được lưu không
   - Backend: Xem notification có được gửi không

4. **Test bằng demo script:**
   ```bash
   cd backend
   # Edit USER_ID trong src/utils/fcm.demo.js
   node src/utils/fcm.demo.js
   ```

## ✅ Kết quả mong đợi

- [x] FCM token được lưu vào Firestore khi app start
- [x] Notification được gửi khi thanh toán thành công (manual hoặc webhook)
- [x] User nhận notification ngay lập tức
- [x] Không cần refresh app

---

**Status:** ✅ FIXED  
**Date:** 13/11/2025
