# 🔔 FCM Push Notification - Quick Start Guide

## 📝 Tóm tắt

Hệ thống push notification đã được tích hợp sử dụng **Firebase Cloud Messaging (FCM)**. User sẽ nhận được thông báo **dù app đang tắt**.

---

## ⚡ Quick Start (5 phút)

### **Bước 1: Cài đặt dependencies**

```bash
cd frontend_flutter
flutter pub get
```

### **Bước 2: Build & chạy app trên thiết bị thật**

```bash
flutter run --release
```

**⚠️ Lưu ý:** FCM chỉ hoạt động trên **thiết bị thật**, không hoạt động trên emulator.

### **Bước 3: Lấy FCM Token**

Mở app, xem console log:

```
📱 FCM Token: fAbC123XyZ456...
```

Copy token này (dùng cho bước 4).

### **Bước 4: Test gửi notification**

**Cách 1: Từ Firebase Console (đơn giản nhất)**

1. Vào https://console.firebase.google.com/
2. Chọn project → **Cloud Messaging**
3. Click **"Send your first message"**
4. Điền title & body
5. Click **Next** → **"Send test message"**
6. Paste FCM Token → Click **Test**

**Cách 2: Từ backend script (nâng cao)**

```bash
cd backend

# Cách A: Sử dụng HTTP API
node send_fcm_notification.js

# Cách B: Sử dụng Admin SDK (khuyên dùng)
npm install firebase-admin
node send_fcm_admin.js
```

### **Bước 5: Verify kết quả**

✅ **App đang mở:** Notification hiển thị ngay lập tức  
✅ **App ở background:** Notification xuất hiện trong notification tray  
✅ **App đã tắt:** Vẫn nhận được notification  

---

## 📂 Files quan trọng

### **Frontend (Flutter)**

```
lib/
  ├── services/
  │   ├── fcm_service.dart              ← FCM service chính
  │   ├── notification_service.dart     ← Local notifications
  │   └── pt_schedule_notification_service.dart
  └── main.dart                         ← FCM initialization
```

### **Backend (Node.js)**

```
backend/
  ├── send_fcm_notification.js          ← Gửi qua HTTP API
  ├── send_fcm_admin.js                 ← Gửi qua Admin SDK (khuyên dùng)
  └── gym-managment-*.json              ← Service account key
```

---

## 🎯 Use Cases

### **1. Nhắc nhở buổi tập**

```javascript
// Backend - Gửi 30 phút trước buổi tập
await sendToUser(userId, {
  title: '🏋️ Buổi tập sắp bắt đầu!',
  body: 'Bạn có buổi tập với PT lúc 14:00',
}, {
  contractId: 'abc123',
  type: 'workout_reminder',
});
```

### **2. Thông báo thanh toán**

```javascript
await sendToUser(userId, {
  title: '💰 Thanh toán thành công',
  body: 'Gói tập đã được kích hoạt!',
}, {
  type: 'payment_success',
});
```

### **3. Thông báo chung (gửi cho tất cả users)**

```javascript
await sendToTopic('all_users', {
  title: '📢 Thông báo',
  body: 'Phòng gym đóng cửa ngày lễ',
});
```

---

## 🔧 Cấu hình

### **FCM Token tự động lưu vào Firestore**

```
Collection: users
Document: {userId}
Fields:
  - fcmToken: "fAbC123..."
  - fcmTokenUpdatedAt: Timestamp
```

### **Subscribe to Topics (Optional)**

```dart
// Trong app
await FCMService().subscribeToTopic('all_users');
await FCMService().subscribeToTopic('premium_members');
```

---

## 📊 Workflow

```
┌─────────────┐
│   Backend   │ Gửi notification
│   Server    │ ──────────────┐
└─────────────┘               │
                              ▼
                    ┌──────────────────┐
                    │   FCM Server     │
                    │   (Firebase)     │
                    └─────────┬────────┘
                              │
                    ┌─────────▼─────────┐
                    │  User's Device    │
                    │  (Android/iOS)    │
                    └─────────┬─────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
         │ Foreground  │ │ Background│ │ Terminated │
         │ (đang mở)   │ │ (minimize)│ │  (đã tắt)  │
         └──────┬──────┘ └───┬────┘ └─────┬──────┘
                │            │            │
                └────────────┼────────────┘
                             │
                  ┌──────────▼───────────┐
                  │ Notification hiển thị│
                  └──────────────────────┘
```

---

## 🐛 Troubleshooting

### **Không nhận được notification?**

1. ✅ Kiểm tra app đã request permission chưa
2. ✅ Test trên **thiết bị thật**, không phải emulator
3. ✅ Xem console log có FCM token không
4. ✅ Token đã lưu vào Firestore chưa
5. ✅ Gửi đến đúng token chưa

### **Console logs để debug:**

```
📱 FCM Token: ...              → Token đã được lấy
✅ FCM token saved             → Đã lưu vào Firestore
🔔 FCM Permission: granted     → Permission OK
📬 Received foreground message → Nhận được message
📲 Notification tapped!        → User tap vào
```

---

## 📚 Tài liệu chi tiết

- **[FCM_PUSH_NOTIFICATION_GUIDE.md](./FCM_PUSH_NOTIFICATION_GUIDE.md)** - Hướng dẫn đầy đủ
- **[Firebase Console](https://console.firebase.google.com/)** - Quản lý FCM
- **[FCM Documentation](https://firebase.google.com/docs/cloud-messaging)** - Official docs

---

## ✅ Checklist

- [x] ✅ Cài đặt `firebase_messaging` package
- [x] ✅ Tạo `FCMService` class
- [x] ✅ Tạo background message handler
- [x] ✅ Khởi tạo FCM trong `main.dart`
- [x] ✅ Cấu hình Android permissions
- [x] ✅ Lưu FCM token vào Firestore
- [x] ✅ Tạo backend scripts để gửi notification
- [ ] 🔲 Test gửi notification từ Firebase Console
- [ ] 🔲 Test gửi notification từ backend
- [ ] 🔲 Implement navigation khi tap notification
- [ ] 🔲 Subscribe users to topics

---

## 💡 Tips

1. **Local Notifications** (hiện có) - Nhắc nhở khi app đã mở
2. **Push Notifications** (mới) - Gửi từ server, nhận dù app tắt
3. Kết hợp cả 2 để có trải nghiệm tốt nhất!

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 13/11/2025
