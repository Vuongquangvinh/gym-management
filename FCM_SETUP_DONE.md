# ✅ FCM Test Screen - Đã tích hợp xong!

## 🎉 Hoàn thành

Tôi đã tích hợp FCM Test Screen vào app của bạn!

## 📍 Cách truy cập

### Option 1: Từ Settings (Khuyến nghị)

1. Mở app
2. Vào **Profile/Settings** (icon ⚙️)
3. Trong mục **"Cài đặt ứng dụng"**, tìm:
   ```
   🔔 Test FCM Token
   Kiểm tra và lưu FCM notification token
   ```
4. Nhấn vào đó!

### Option 2: Direct Navigation (Từ code)

```dart
Navigator.pushNamed(context, '/fcm-test');
```

## 🧪 Hướng dẫn sử dụng

### Bước 1: Mở FCM Test Screen

- Vào **Settings** → **🔔 Test FCM Token**

### Bước 2: Kiểm tra token

Screen sẽ hiển thị:
- ✅ **User ID**: ID của bạn trong Firestore
- ✅ **Email**: Email đã đăng ký
- ✅ **FCM Token hiện tại**: Token từ Firebase Messaging
- ✅ **Token đã lưu trong Firestore**: Token đã được lưu (nếu có)
- ✅ **Trạng thái**: Token có khớp không?

### Bước 3: Lưu FCM Token

1. Nhấn nút **"Lưu FCM Token vào Firestore"**
2. Đợi 1-2 giây
3. Nhấn icon **Refresh (⟳)** để reload
4. Verify: Status hiển thị **"✅ Token khớp - OK!"**

### Bước 4: Test notification

Sau khi token đã lưu thành công:

#### Test 1: Backend Demo Script
```bash
cd backend

# Edit src/utils/fcm.demo.js
# Thay USER_ID bằng User ID của bạn (xem trong FCM Test Screen)

node src/utils/fcm.demo.js
```

#### Test 2: Thanh toán thực tế
1. Tạo payment từ app
2. Thanh toán (manual confirm hoặc PayOS webhook)
3. ✅ Bạn sẽ nhận notification ngay lập tức!

## 📋 Files đã sửa

1. **`lib/main.dart`**
   - Import: `screens/fcm_test_screen.dart`
   - Route: `'/fcm-test': (context) => const FCMTestScreen()`

2. **`lib/features/profile/screens/setting_screen.dart`**
   - Thêm option "🔔 Test FCM Token" vào "Cài đặt ứng dụng"

3. **`lib/screens/fcm_test_screen.dart`** (đã tạo trước)
4. **`lib/widgets/fcm_debug_widget.dart`** (đã tạo trước)
5. **`lib/services/fcm_service.dart`** (đã update)

## 🚀 Test ngay bây giờ!

### Bước 1: Hot Restart
```bash
# Trong terminal Flutter, nhấn:
R   # (capital R) để hot restart
```

### Bước 2: Navigate
1. Mở app
2. Vào **Settings** (⚙️)
3. Scroll xuống mục **"Cài đặt ứng dụng"**
4. Nhấn **"🔔 Test FCM Token"**

### Bước 3: Lưu token
1. Nhấn **"Lưu FCM Token vào Firestore"**
2. Đợi thông báo "✅ FCM token đã được lưu!"
3. Nhấn **Refresh** để verify

### Bước 4: Verify trong Firestore
1. Mở Firebase Console → Firestore
2. Tìm user document của bạn
3. Check field `fcmToken` đã có chưa

### Bước 5: Test payment
1. Tạo payment
2. Thanh toán
3. ✅ Nhận notification!

## 🎯 Kết quả mong đợi

**Trước khi lưu token:**
```
⚠️ Token chưa được lưu hoặc không khớp
```

**Sau khi lưu token:**
```
✅ Token khớp - OK!
```

**Backend logs khi gửi notification:**
```
📲 Sending payment success notification...
📤 [FCM] Sending to user JVpJwI3RyvFNNbaC1C27...
✅ [FCM] Found user by Document ID
📱 [FCM] Found token for user: f8xAXNOAQsaQ0Dk4UOed4t...
✅ [FCM] Successfully sent message
✅ Payment notification sent successfully
```

**App nhận notification:**
```
📬 Received foreground message:
Title: 💰 Thanh toán thành công!
Body: Gói tập "Gói 1 tháng" đã được kích hoạt!
```

## ⚠️ Troubleshooting

### Vấn đề: Không tìm thấy option trong Settings

**Giải pháp:** Hot restart app (`R`)

### Vấn đề: FCM Token = null

**Nguyên nhân:** Permission chưa được cấp

**Giải pháp:**
1. Check console log xem có lỗi không
2. Restart app
3. Allow notification permission

### Vấn đề: Lưu token thất bại

**Nguyên nhân:** User document không tồn tại hoặc email không khớp

**Giải pháp:**
1. Check console log Flutter
2. Verify user tồn tại trong Firestore
3. Check email có đúng không

---

**All set!** 🎉

Bây giờ hãy:
1. **Hot restart** app (`R`)
2. Vào **Settings** → **🔔 Test FCM Token**
3. Lưu token
4. Test thanh toán!

Good luck! 🚀
