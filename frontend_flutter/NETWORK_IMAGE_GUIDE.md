# Hướng dẫn hiển thị ảnh từ Backend trong Flutter

## 📌 Tổng quan

Backend đang lưu ảnh tại `frontend_react/public/uploads/` và serve qua endpoint `/uploads`.
Flutter sẽ load ảnh qua HTTP từ backend.

## 🏗️ Cấu trúc Files

```
lib/
├── config/
│   ├── api_config.dart         # Cấu hình base URL backend
│   └── image_config.dart       # Helper cho image URLs
└── shared/
    ├── widgets/
    │   ├── network_avatar.dart      # Widget hiển thị avatar
    │   └── network_image_card.dart  # Widget hiển thị ảnh khác
    └── examples/
        └── image_display_example.dart  # Ví dụ sử dụng
```

## ⚙️ Cấu hình Backend URL

### Cập nhật `api_config.dart`:

```dart
class ApiConfig {
  // Android Emulator
  static const String baseUrl = 'http://10.0.2.2:3000';
  
  // Hoặc thiết bị thật (thay bằng IP máy tính)
  // static const String baseUrl = 'http://192.168.x.x:3000';
}
```

**Lưu ý:** 
- Android Emulator: dùng `10.0.2.2` thay vì `localhost`
- Thiết bị thật: dùng IP thực của máy (chạy `ipconfig` để xem)

## 🎯 Cách sử dụng

### 1. Hiển thị Avatar Employee

```dart
import 'package:frontend_flutter/shared/widgets/network_avatar.dart';

// Giả sử bạn có data từ Firestore
final employee = {
  'avatarUrl': '/uploads/employees/avatars/emp_1762356223481_owffkb.jpg',
  'fullName': 'Hồ Phúc Thịnh',
};

// Sử dụng widget
NetworkAvatar(
  avatarUrl: employee['avatarUrl'],
  size: 80,
)
```

### 2. Trong ListTile

```dart
ListTile(
  leading: NetworkAvatar(
    avatarUrl: employee.avatarUrl,
    size: 50,
  ),
  title: Text(employee.fullName),
  subtitle: Text(employee.position),
)
```

### 3. Hiển thị Certificate/Achievement

```dart
import 'package:frontend_flutter/shared/widgets/network_image_card.dart';

NetworkImageCard(
  imageUrl: pt.certificateUrl,
  width: double.infinity,
  height: 200,
  label: 'Chứng chỉ PT',
  borderRadius: BorderRadius.circular(12),
)
```

### 4. Với Firestore Model

```dart
class Employee {
  final String uid;
  final String fullName;
  final String? avatarUrl;
  
  Employee({
    required this.uid,
    required this.fullName,
    this.avatarUrl,
  });
  
  factory Employee.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Employee(
      uid: doc.id,
      fullName: data['fullName'] ?? '',
      avatarUrl: data['avatarUrl'], // Đã có sẵn từ Firestore
    );
  }
}

// Sử dụng
NetworkAvatar(
  avatarUrl: employee.avatarUrl,
  size: 60,
)
```

## 🔄 Luồng hoạt động

```
1. Backend lưu ảnh vào: 
   frontend_react/public/uploads/employees/avatars/emp_xxx.jpg

2. Backend trả về đường dẫn:
   "/uploads/employees/avatars/emp_xxx.jpg"

3. Lưu vào Firestore:
   {
     "avatarUrl": "/uploads/employees/avatars/emp_xxx.jpg"
   }

4. Flutter đọc từ Firestore và tạo URL đầy đủ:
   ImageConfig.getImageUrl(avatarUrl)
   → "http://10.0.2.2:3000/uploads/employees/avatars/emp_xxx.jpg"

5. Image.network tải ảnh từ URL trên
```

## 🎨 Tính năng Widget

### NetworkAvatar
- ✅ Tự động xử lý loading state
- ✅ Hiển thị placeholder nếu không có ảnh
- ✅ Error handling tự động
- ✅ Hình tròn (CircleAvatar)
- ✅ Tùy chỉnh size, icon

### NetworkImageCard
- ✅ Loading indicator
- ✅ Error placeholder
- ✅ Tùy chỉnh width, height, borderRadius
- ✅ Có thể thêm label
- ✅ Dùng cho certificates, achievements

## 🐛 Troubleshooting

### Ảnh không hiển thị?

1. **Kiểm tra backend đang chạy:**
   ```bash
   cd backend
   npm start
   ```

2. **Kiểm tra URL trong console:**
   Widget sẽ print error nếu load fail

3. **Kiểm tra CORS (nếu cần):**
   Backend đã enable CORS trong `app.js`

4. **Kiểm tra file tồn tại:**
   ```
   frontend_react/public/uploads/employees/avatars/emp_xxx.jpg
   ```

5. **Test URL trực tiếp:**
   Mở browser: `http://localhost:3000/uploads/employees/avatars/emp_xxx.jpg`

### Android Emulator không kết nối được?

- Đảm bảo dùng `10.0.2.2` thay vì `localhost`
- Hoặc dùng IP thực của máy

### Thiết bị thật không kết nối được?

- Máy tính và điện thoại phải cùng WiFi
- Cập nhật IP trong `api_config.dart`
- Chạy `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux)

## 📝 Ví dụ hoàn chỉnh

Xem file: `lib/shared/examples/image_display_example.dart`

## 🚀 Production

Khi deploy lên production, cập nhật `baseUrl` trong `api_config.dart`:

```dart
static const String baseUrl = 'https://your-domain.com';
```

---

**Tác giả:** Gym Management Team  
**Ngày cập nhật:** November 11, 2025
