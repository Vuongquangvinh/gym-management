# Chat List Screen - Hướng Dẫn Sử Dụng

## Tổng Quan

`ChatListScreen` là màn hình hiển thị danh sách các PT (Personal Trainer) mà user đang có contract active, cho phép user nhắn tin trực tiếp với họ.

## Tính Năng

✅ **Tự động lọc PT từ contracts**: Chỉ hiển thị các PT mà user đang có gói tập active (status = 'paid' hoặc 'active')

✅ **Thông tin PT đầy đủ**: Hiển thị tên, avatar, email của PT

✅ **Pull to refresh**: Vuốt xuống để tải lại danh sách

✅ **Empty state**: Hiển thị thông báo khi user chưa có contract nào

✅ **Navigation trực tiếp**: Tap vào PT để mở màn hình chat

## Cách Sử Dụng

### 1. Import vào app

```dart
import 'package:your_app/features/chat/screens/chat_list_screen.dart';
// Hoặc import từ export chính
import 'package:your_app/features/chat/chat.dart';
```

### 2. Thêm vào Navigation

**Option A: Trong Bottom Navigation Bar**

```dart
BottomNavigationBar(
  items: [
    BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Trang chủ'),
    BottomNavigationBarItem(icon: Icon(Icons.chat), label: 'Tin nhắn'),
    BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Tài khoản'),
  ],
  onTap: (index) {
    if (index == 1) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => ChatListScreen()),
      );
    }
  },
)
```

**Option B: Trong Drawer/Menu**

```dart
ListTile(
  leading: Icon(Icons.chat_bubble),
  title: Text('Tin nhắn với PT'),
  onTap: () {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => ChatListScreen()),
    );
  },
)
```

**Option C: Floating Action Button**

```dart
FloatingActionButton(
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => ChatListScreen()),
    );
  },
  child: Icon(Icons.chat),
)
```

### 3. Từ Contract Detail Screen

Bạn vẫn có thể giữ tính năng nhắn tin từ Contract Detail, nhưng bây giờ user có thể nhắn tin từ ChatListScreen mà không cần vào Contract Detail:

```dart
// Trong Contract Detail Screen
ElevatedButton.icon(
  icon: Icon(Icons.chat),
  label: Text('Nhắn tin với PT'),
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatScreen(
          ptId: contract.ptId,
          ptName: ptName,
          clientId: currentUserId,
        ),
      ),
    );
  },
)
```

## Luồng Hoạt Động

```
ChatListScreen
    ↓
Query Firestore: contracts collection
    ↓
Filter: user_id = currentUser && status in ['paid', 'active']
    ↓
Extract unique PT IDs
    ↓
Load PT info từ users collection
    ↓
Display list of PTs
    ↓
User tap vào PT
    ↓
Navigate to ChatScreen(ptId, ptName, clientId)
```

## Firestore Query

Screen này sử dụng 2 queries:

1. **Query contracts**:
```dart
firestore
  .collection('contracts')
  .where('user_id', isEqualTo: currentUserId)
  .where('status', whereIn: ['paid', 'active'])
  .get()
```

2. **Query PT info**:
```dart
firestore
  .collection('users')
  .doc(ptId)
  .get()
```

## Lợi Ích

1. **UX tốt hơn**: User không cần vào Contract Detail mới có thể nhắn tin
2. **Truy cập nhanh**: Danh sách tập trung tất cả PT của user
3. **Tự động cập nhật**: Chỉ hiển thị PT từ contracts đang active
4. **Dễ quản lý**: User có thể xem tất cả PT và lựa chọn nhắn tin với ai

## Lưu Ý

- User phải có ít nhất 1 contract với status 'paid' hoặc 'active' mới thấy PT
- PT phải tồn tại trong collection 'users' để hiển thị thông tin
- Cần đăng nhập (Firebase Auth) để sử dụng
- Screen tự động lọc và loại bỏ PT trùng lặp (nếu có nhiều contracts với cùng 1 PT)

## Troubleshooting

**Lỗi: "User not authenticated"**
- Đảm bảo user đã đăng nhập qua Firebase Auth

**Không hiển thị PT nào**
- Kiểm tra user có contract nào không
- Kiểm tra status của contracts (phải là 'paid' hoặc 'active')
- Kiểm tra field name trong Firestore: `user_id`, `status`

**PT info không đầy đủ**
- Kiểm tra PT document trong collection 'users'
- Kiểm tra các fields: `fullName`, `email`, `avatarUrl`

## Demo

Để test màn hình này, bạn có thể:

1. Đăng nhập với tài khoản có contract active
2. Mở ChatListScreen
3. Xem danh sách PT
4. Tap vào PT để mở chat
5. Pull down để refresh danh sách

---

**Tạo bởi**: AI Assistant
**Ngày**: 2025-11-17
**Version**: 1.0.0
