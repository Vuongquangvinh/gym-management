# 🔧 FCM Token Test Screen - Hướng dẫn sử dụng

## 📋 Đã tạo

### 1. Widget Debug
**File:** `lib/widgets/fcm_debug_widget.dart`

Widget hiển thị:
- User ID và Email hiện tại
- FCM Token hiện tại từ Firebase Messaging
- FCM Token đã lưu trong Firestore
- Trạng thái (khớp hay chưa)
- Nút "Lưu FCM Token" để lưu thủ công

### 2. Test Screen
**File:** `lib/screens/fcm_test_screen.dart`

Screen đầy đủ với:
- Hướng dẫn sử dụng
- FCM Debug Widget
- Các thông tin bổ sung

### 3. Service Method
**File:** `lib/services/fcm_service.dart`

Thêm 2 public methods:
- `saveFCMTokenManually()` - Lưu token thủ công
- `getCurrentToken()` - Lấy token hiện tại

## 🚀 Cách sử dụng

### Bước 1: Thêm route vào app

Mở file `lib/main.dart` hoặc nơi định nghĩa routes, thêm:

```dart
import 'screens/fcm_test_screen.dart';

// Trong MaterialApp hoặc routes:
routes: {
  '/fcm-test': (context) => const FCMTestScreen(),
  // ... các routes khác
}

// Hoặc nếu dùng Go Router:
GoRoute(
  path: '/fcm-test',
  builder: (context, state) => const FCMTestScreen(),
),
```

### Bước 2: Navigate đến screen

Thêm một button để test (có thể ở Settings screen hoặc Profile):

```dart
ElevatedButton(
  onPressed: () {
    Navigator.pushNamed(context, '/fcm-test');
    // Hoặc: context.go('/fcm-test');
  },
  child: const Text('🔔 Test FCM Token'),
)
```

### Bước 3: Test

1. **Mở FCM Test Screen**
2. **Kiểm tra thông tin:**
   - FCM Token hiện tại: Phải có (dạng `f8xAXNOAQsaQ0Dk4UOed4t:APA91b...`)
   - Token đã lưu: Có thể chưa có
3. **Nhấn "Lưu FCM Token vào Firestore"**
4. **Chờ 1-2 giây, nhấn nút Refresh (⟳)**
5. **Verify:**
   - Status hiển thị: ✅ Token khớp - OK!
   - 2 token phải giống nhau

### Bước 4: Verify trong Firestore

1. Mở Firebase Console → Firestore
2. Tìm user document (ví dụ: `users/JVpJwI3RyvFNNbaC1C27`)
3. Check field `fcmToken` đã có chưa

## 🧪 Test Notification

Sau khi lưu token thành công:

### Test 1: Backend Demo Script

```bash
cd backend

# Edit src/utils/fcm.demo.js
# Thay USER_ID = "JVpJwI3RyvFNNbaC1C27"

node src/utils/fcm.demo.js
```

### Test 2: Thanh toán thực tế

1. Tạo payment từ app
2. Thanh toán (manual confirm)
3. ✅ App sẽ nhận notification!

## 🔍 Troubleshooting

### Vấn đề 1: "FCM Token hiện tại" = null

**Nguyên nhân:** App chưa request permission hoặc Firebase chưa init

**Giải pháp:**
1. Check `main.dart` có `await FCMService().initialize()` chưa
2. Hot restart app (nhấn `R`)

### Vấn đề 2: "Token đã lưu" vẫn null sau khi nhấn Save

**Nguyên nhân:** 
- User document không tồn tại
- Hoặc tìm không đúng user

**Giải pháp:**
1. Check console log Flutter xem có lỗi gì
2. Verify user ID trong Firestore
3. Check email có đúng không

### Vấn đề 3: Token không khớp

**Nguyên nhân:** Token đã refresh

**Giải pháp:**
1. Nhấn "Lưu FCM Token" lại
2. Token sẽ tự động update khi refresh

## 📱 Quick Access (Tạm thời)

Nếu không muốn thêm vào routes, có thể test trực tiếp:

```dart
// Ở bất kỳ đâu trong code
import 'screens/fcm_test_screen.dart';

// Navigate trực tiếp
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => const FCMTestScreen()),
);
```

Hoặc thêm floating button tạm:

```dart
// Trong Scaffold
floatingActionButton: FloatingActionButton(
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const FCMTestScreen()),
    );
  },
  child: const Icon(Icons.notifications),
),
```

## ✅ Kết quả mong đợi

Sau khi hoàn thành:
- [x] FCM Token hiển thị
- [x] Token được lưu vào Firestore
- [x] 2 token khớp nhau
- [x] Backend có thể gửi notification
- [x] App nhận được notification khi thanh toán

---

**Ready to test!** 🚀

Bây giờ hãy:
1. Hot restart Flutter app (`R`)
2. Navigate đến FCM Test Screen
3. Lưu token
4. Test thanh toán!
