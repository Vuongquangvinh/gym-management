# 🚀 Quick Start - Hiển thị ảnh từ Backend

## 1. Import widget

```dart
import 'package:frontend_flutter/shared/widgets/network_avatar.dart';
```

## 2. Sử dụng ngay

```dart
// Data từ Firestore
final employee = {
  'fullName': 'Hồ Phúc Thịnh',
  'avatarUrl': '/uploads/employees/avatars/emp_1762356223481_owffkb.jpg',
};

// Hiển thị
NetworkAvatar(
  avatarUrl: employee['avatarUrl'],
  size: 80,
)
```

## 3. Trong ListView

```dart
ListView.builder(
  itemBuilder: (context, index) {
    return ListTile(
      leading: NetworkAvatar(
        avatarUrl: employee.avatarUrl,
        size: 50,
      ),
      title: Text(employee.fullName),
    );
  },
)
```

## 4. Với StreamBuilder + Firestore

```dart
StreamBuilder<DocumentSnapshot>(
  stream: FirebaseFirestore.instance
      .collection('employees')
      .doc(employeeId)
      .snapshots(),
  builder: (context, snapshot) {
    final data = snapshot.data?.data() as Map<String, dynamic>?;
    final avatarUrl = data?['avatarUrl'] as String?;
    
    return NetworkAvatar(
      avatarUrl: avatarUrl,
      size: 100,
    );
  },
)
```

## ⚠️ Lưu ý quan trọng

1. **Backend phải đang chạy:** `cd backend && npm start`
2. **Cấu hình đúng IP** trong `lib/config/api_config.dart`:
   - Android Emulator: `http://10.0.2.2:3000`
   - Thiết bị thật: `http://<YOUR_IP>:3000`

## 📚 Xem thêm

- Chi tiết: `NETWORK_IMAGE_GUIDE.md`
- Ví dụ đầy đủ: `lib/shared/examples/`

---

**Xong! Chỉ cần 3 bước:** Import → Truyền avatarUrl → Hiển thị ✨
