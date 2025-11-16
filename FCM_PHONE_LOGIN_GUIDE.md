# 📱 Hướng dẫn sử dụng FCM với đăng nhập số điện thoại

## 📋 Tổng quan

Hệ thống FCM (Firebase Cloud Messaging) đã được tích hợp để gửi thông báo push đến người dùng, **hỗ trợ cả đăng nhập bằng email và số điện thoại**.

### ✨ Tính năng chính:
- ✅ Tự động lưu FCM token vào Firestore
- ✅ Hỗ trợ tìm user theo 3 cách: Auth UID, Email, Số điện thoại
- ✅ Gửi thông báo thanh toán thành công
- ✅ Gửi thông báo lịch tập PT
- ✅ Test và debug FCM token

---

## 🔧 Cách hoạt động

### 1. Khi người dùng đăng nhập (Email hoặc SĐT):

FCM Service sẽ tự động:
1. Request permission hiển thị thông báo
2. Lấy FCM token từ Firebase
3. Tìm user document trong Firestore theo thứ tự:
   - **Bước 1:** Tìm theo Auth UID (`users/<uid>`)
   - **Bước 2:** Nếu không có, tìm theo `email`
   - **Bước 3:** Nếu không có, tìm theo `phone_number` ⭐
4. Lưu token vào document user tìm được

### 2. Khi backend cần gửi thông báo:

```javascript
import { sendToUser } from './src/utils/fcm.helper.js';

// Gửi thông báo đến user
await sendToUser(
  userId,              // Document ID trong Firestore
  {
    title: '💰 Thanh toán thành công!',
    body: 'Gói tập đã được kích hoạt!'
  },
  {
    type: 'payment',
    amount: '500000',  // ⚠️ Phải là string
    packageName: 'Gói 1 tháng'
  }
);
```

---

## 🚀 Cách tích hợp vào chức năng chuyển khoản

### Backend - Payment Controller

File: `backend/src/features/payos/payos.controller.js`

#### 1️⃣ Webhook Payment (PayOS tự động confirm)

```javascript
import { sendPaymentSuccessNotification } from '../../utils/fcm.helper.js';

export const handlePaymentWebhook = async (req, res) => {
  try {
    // ... logic xử lý payment ...
    
    if (paymentData.status === 'PAID') {
      // Lấy userId từ payment order
      const userId = paymentOrder.user_id;
      
      // 🔔 GỬI THÔNG BÁO FCM
      await sendPaymentSuccessNotification(userId, {
        packageName: packageDoc.name,
        amount: paymentOrder.total_amount,
        orderCode: paymentOrder.order_code,
        paymentType: 'gym_package', // hoặc 'pt_package'
      });
      
      console.log('✅ Payment notification sent to user:', userId);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

#### 2️⃣ Manual Payment Confirmation (Admin xác nhận)

```javascript
export const confirmPaymentManual = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // ... logic xử lý xác nhận payment ...
    
    // Lấy userId từ payment order
    const userId = paymentOrder.user_id;
    
    // 🔔 GỬI THÔNG BÁO FCM
    await sendPaymentSuccessNotification(userId, {
      packageName: packageDoc.name,
      amount: paymentOrder.total_amount,
      orderCode: paymentOrder.order_code,
      paymentType: 'gym_package',
    });
    
    console.log('✅ Manual payment notification sent to user:', userId);
    
    res.status(200).json({ 
      success: true,
      message: 'Payment confirmed and notification sent'
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

---

## 📱 Frontend - Flutter App

### 1️⃣ Khởi tạo FCM khi app start

File: `frontend_flutter/lib/main.dart`

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // 🔔 Khởi tạo FCM Service
  await FCMService().initialize();
  
  runApp(MyApp());
}
```

### 2️⃣ Lưu token sau khi đăng nhập

File: `frontend_flutter/lib/features/auth/screens/login_screen.dart`

```dart
// Sau khi đăng nhập thành công
final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);

if (userCredential.user != null) {
  // ✅ Lưu FCM token ngay sau khi login
  await FCMService().saveFCMTokenManually();
  
  // Navigate to home
  Navigator.pushReplacement(context, ...);
}
```

### 3️⃣ Xử lý thông báo khi nhận được

FCM Service đã tự động xử lý:
- **Foreground:** Hiển thị banner notification
- **Background:** Hiển thị system notification
- **Terminated:** Lưu notification để xử lý khi mở app

---

## 🧪 Test FCM

### Cách 1: Từ App (User Test)

1. Mở app → **Settings** → **🔔 Test FCM Token**
2. Kiểm tra:
   - FCM Token hiện tại
   - Token đã lưu trong Firestore
   - Trạng thái: ✅ Token khớp - OK!
3. Nhấn **"Lưu FCM Token vào Firestore"** để lưu lại

### Cách 2: Từ Backend (Manual Test)

File: `backend/test_fcm_to_user.js`

```javascript
import { sendToUser } from './src/utils/fcm.helper.js';

const userId = 'JVpJwI3RyvFNNbaC1C27'; // Document ID user

await sendToUser(
  userId,
  {
    title: '🧪 Test Notification',
    body: 'Đây là thông báo test!'
  },
  { type: 'test' }
);
```

Chạy test:
```bash
cd backend
node test_fcm_to_user.js
```

---

## ⚠️ Lưu ý quan trọng

### 1. Firestore Data Structure

User document phải có **ít nhất một trong các field:**
- `phone_number`: "+84523294133" (cho đăng nhập SĐT)
- `email`: "user@example.com" (cho đăng nhập email)

Ví dụ document user:
```json
{
  "_id": "zNuGqqCYqwm6PNJCiu7Y",
  "phone_number": "+84523294133",
  "email": "vqvinhhttt2211029@student.ctuet.edu.vn",
  "full_name": "Vương Quang Vinh",
  "fcmToken": "f8xAXNOAQsaQ0Dk4UOed4t:APA91b...",
  "fcmTokenUpdatedAt": "2025-11-13T10:30:00.000Z"
}
```

### 2. FCM Data Payload

**FCM chỉ chấp nhận string trong data:**

❌ **SAI:**
```javascript
{
  amount: 500000,        // Number - LỖI!
  isActive: true,        // Boolean - LỖI!
  timestamp: new Date()  // Object - LỖI!
}
```

✅ **ĐÚNG:**
```javascript
{
  amount: '500000',           // String
  isActive: 'true',           // String
  timestamp: new Date().toISOString()  // String
}
```

### 3. User Lookup Logic

FCM helper tự động tìm user theo:
1. Document ID trực tiếp
2. Field `_id` (nếu document ID không khớp)
3. Backend sử dụng `userId` = document ID trong Firestore

### 4. Token Refresh

- Token FCM có thể thay đổi tự động
- FCM Service đã lắng nghe `onTokenRefresh` và tự động cập nhật
- Token cũ vẫn hoạt động trong thời gian ngắn

---

## 🔍 Troubleshooting

### ❌ "User has no FCM token"

**Nguyên nhân:**
- User chưa đăng nhập app
- User chưa cấp quyền notification
- Token chưa được lưu vào Firestore

**Giải pháp:**
1. Đăng nhập lại app
2. Vào Settings → Test FCM Token → Lưu token
3. Kiểm tra Firestore xem có field `fcmToken`

### ❌ "User document not found"

**Nguyên nhân:**
- Document user không tồn tại trong Firestore
- Document ID không khớp với userId backend gửi

**Giải pháp:**
1. Kiểm tra `userId` trong backend log
2. Tìm document trong Firestore bằng `phone_number` hoặc `email`
3. Đảm bảo document có field `phone_number` hoặc `email`

### ❌ "messaging/invalid-payload"

**Nguyên nhân:**
- Data payload có giá trị không phải string

**Giải pháp:**
- Convert tất cả giá trị thành string: `String(value)`

### ❌ Không nhận được thông báo

**Kiểm tra:**
1. ✅ FCM token đã lưu trong Firestore?
2. ✅ App đã cấp quyền notification?
3. ✅ Backend log có "Successfully sent message"?
4. ✅ Device có kết nối internet?
5. ✅ Firebase Cloud Messaging API enabled?

---

## 📚 File liên quan

### Backend:
- `src/utils/fcm.helper.js` - FCM helper functions
- `src/features/payos/payos.controller.js` - Payment webhook & manual confirm
- `test_fcm_to_user.js` - Test script

### Frontend:
- `lib/services/fcm_service.dart` - FCM service chính
- `lib/services/notification_service.dart` - Local notification
- `lib/screens/fcm_test_screen.dart` - Test screen
- `lib/widgets/fcm_debug_widget.dart` - Debug widget

---

## 🎯 Checklist tích hợp

### Lần đầu setup:
- [x] Firebase Cloud Messaging API enabled
- [x] Service account JSON có trong backend
- [x] FCM Service khởi tạo trong Flutter main()
- [x] User document có field `phone_number` hoặc `email`

### Khi thêm chức năng mới:
- [ ] Import `sendToUser` hoặc `sendPaymentSuccessNotification`
- [ ] Gọi hàm gửi notification sau khi hoàn thành action
- [ ] Convert tất cả data values thành string
- [ ] Test bằng `test_fcm_to_user.js`
- [ ] Test trên app thật

---

## 💡 Tips

1. **Luôn test trước khi deploy:**
   ```bash
   node test_fcm_to_user.js
   ```

2. **Debug bằng FCM Test Screen:**
   - Settings → 🔔 Test FCM Token
   - Xem token hiện tại và trạng thái sync

3. **Check backend logs:**
   ```
   📤 [FCM] Sending to user...
   📱 [FCM] Found token for user...
   ✅ [FCM] Successfully sent message...
   ```

4. **Check Flutter logs:**
   ```
   I/flutter: 📬 Received foreground message
   I/flutter: Title: 💰 Thanh toán thành công!
   ```

---

## 🆘 Support

Nếu gặp vấn đề:
1. Check logs backend và Flutter
2. Verify FCM token trong Firestore
3. Test với `test_fcm_to_user.js`
4. Check Firebase Console → Cloud Messaging

---

**Ngày cập nhật:** 13/11/2025  
**Phiên bản:** 1.0  
**Hỗ trợ:** Đăng nhập Email + Số điện thoại
