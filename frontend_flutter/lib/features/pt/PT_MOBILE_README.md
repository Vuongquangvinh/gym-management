# PT Mobile App Features

## Tổng quan
Mobile app dành cho Personal Trainer (PT) với các chức năng cơ bản để quản lý công việc hàng ngày.

## Cấu trúc thư mục

```
lib/features/pt/
├── screens/
│   ├── pt_main_screen.dart          # Màn hình chính với bottom navigation
│   ├── pt_dashboard_screen.dart     # Tổng quan thống kê
│   ├── pt_profile_screen.dart       # Quản lý hồ sơ cá nhân
│   └── pt_clients_screen.dart       # Danh sách học viên
├── widgets/                         # Các widget tùy chỉnh (sẽ thêm sau)
└── providers/                       # State management (sẽ thêm sau)
```

## Các chức năng đã triển khai

### 1. PT Dashboard (`pt_dashboard_screen.dart`)
- **Hiển thị thống kê tổng quan:**
  - Tổng số học viên
  - Số gói tập đang bán
  - Doanh thu tháng này
  - Đánh giá từ học viên
- **Quick actions:**
  - Nút truy cập nhanh đến Hồ sơ
  - Nút truy cập nhanh đến Học viên
- **Pull-to-refresh** để cập nhật dữ liệu

### 2. PT Profile (`pt_profile_screen.dart`)
- **Thông tin cơ bản (chỉ xem):**
  - Họ tên
  - Email
  - Điện thoại
  - Giới tính
  
- **Thông tin chuyên môn (có thể chỉnh sửa):**
  - Giới thiệu bản thân
  - Số năm kinh nghiệm
  - Số học viên tối đa/ngày
  - Trạng thái nhận học viên mới
  
- **Quản lý danh sách:**
  - Chuyên môn (Ví dụ: Giảm cân, Tăng cơ...)
  - Chứng chỉ (Ví dụ: ACE-CPT, NASM-CPT...)
  - Thành tích (Ví dụ: Huấn luyện 100+ học viên...)
  
- **Chế độ chỉnh sửa:**
  - Nhấn icon Edit ở góc trên phải để vào chế độ chỉnh sửa
  - Thêm/xóa các mục trong danh sách
  - Nhấn "Lưu" để cập nhật lên Firestore

### 3. PT Clients (`pt_clients_screen.dart`)
- **Danh sách học viên:**
  - Hiển thị tất cả học viên của PT
  - Avatar, tên, email, số điện thoại
  - Số hợp đồng đang hoạt động
  - Tổng số hợp đồng
  
- **Tính năng tìm kiếm:**
  - Tìm theo tên
  - Tìm theo email
  - Tìm theo số điện thoại
  
- **Chi tiết học viên:**
  - Tap vào card để xem chi tiết
  - Bottom sheet hiển thị thông tin đầy đủ
  - Nút "Nhắn tin" (TODO: tích hợp chat)

### 4. PT Main Screen (`pt_main_screen.dart`)
- **Bottom Navigation Bar** với 3 tab:
  - Tổng quan (Dashboard)
  - Học viên (Clients)
  - Hồ sơ (Profile)
- Sử dụng `IndexedStack` để giữ state của các màn hình

## Cách sử dụng

### Thêm route vào app

Mở file `lib/main.dart` hoặc file routing của bạn và thêm route:

```dart
import 'package:your_app/features/pt/screens/pt_main_screen.dart';

// Trong MaterialApp routes:
routes: {
  '/pt': (context) => const PTMainScreen(),
  // ... các routes khác
}
```

### Điều hướng đến PT app

```dart
Navigator.pushNamed(context, '/pt');
```

### Hoặc từ màn hình login/home

```dart
// Kiểm tra role của user
if (user.role == 'pt') {
  Navigator.pushReplacementNamed(context, '/pt');
}
```

## Firestore Collections được sử dụng

### 1. `employees`
```javascript
{
  email: string,
  fullName: string,
  phone: string,
  gender: 'male' | 'female',
  role: 'pt',
  ptInfo: {
    bio: string,
    specialties: string[],
    experience: number,
    certificates: string[],
    achievements: string[],
    maxClientsPerDay: number,
    isAcceptingNewClients: boolean,
    rating: number
  }
}
```

### 2. `packages`
```javascript
{
  pt: string,           // employeeId
  isActive: boolean,
  // ... các fields khác
}
```

### 3. `package_users`
```javascript
{
  pt: string,           // employeeId
  userId: string,       // clientId
  status: 'active' | 'confirmed' | 'pending_payment' | 'expired',
  // ... các fields khác
}
```

### 4. `users`
```javascript
{
  displayName: string,
  email: string,
  phone: string,
  photoURL: string,
  // ... các fields khác
}
```

## Các tính năng cần phát triển thêm

### Cao cấp
1. **PT Schedule** - Lịch làm việc
   - Xem lịch theo tuần/tháng
   - Đánh dấu buổi tập đã hoàn thành
   - Check-in học viên
   
2. **PT Packages** - Quản lý gói tập
   - Tạo/sửa/xóa gói tập
   - Xem pending requests
   - Cập nhật giá, thời hạn
   
3. **Chat** - Nhắn tin với học viên
   - Chat 1-1
   - Gửi ảnh/video
   - Thông báo tin nhắn mới
   
4. **Notifications** - Thông báo
   - Thông báo lịch tập
   - Thông báo thanh toán
   - Thông báo từ hệ thống
   
5. **Statistics** - Thống kê chi tiết
   - Biểu đồ doanh thu
   - Tỉ lệ giữ chân học viên
   - Số buổi tập mỗi tháng

### Cơ bản
1. **Logout** - Đăng xuất
2. **Settings** - Cài đặt
   - Đổi mật khẩu
   - Thông báo
   - Ngôn ngữ

## Dependencies cần thiết

Đảm bảo `pubspec.yaml` có các packages sau:

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: latest
  firebase_auth: latest
  cloud_firestore: latest
  # Thêm các package khác nếu cần
```

## Design System

### Colors
- Primary: `#667EEA` (Purple Blue)
- Secondary: `#764BA2` (Deep Purple)
- Success: `#10B981` (Green)
- Info: `#06B6D4` (Cyan)
- Warning: `#F59E0B` (Orange)
- Background: `#F5F7FA` (Light Gray)

### Typography
- Heading: Bold, 20-24px
- Subheading: SemiBold, 16-18px
- Body: Regular, 14px
- Caption: Regular, 12-13px

### Spacing
- Container padding: 16px
- Card padding: 16-20px
- Card radius: 12-16px
- Grid spacing: 16px

## Testing

### Điều kiện để test
1. Firebase đã được cấu hình
2. Firestore có dữ liệu mẫu
3. User đã login với role 'pt'
4. Có ít nhất 1 employee có role 'pt' trong collection `employees`

### Test scenarios
1. **Dashboard:**
   - Kiểm tra hiển thị stats
   - Pull-to-refresh
   - Tap vào quick actions

2. **Profile:**
   - Xem thông tin
   - Chỉnh sửa thông tin
   - Thêm/xóa chuyên môn, chứng chỉ, thành tích
   - Lưu thay đổi

3. **Clients:**
   - Xem danh sách
   - Tìm kiếm học viên
   - Tap để xem chi tiết
   - Pull-to-refresh

## Performance Tips

1. **Sử dụng IndexedStack** trong MainScreen để giữ state
2. **Pagination** cho danh sách học viên nếu số lượng lớn
3. **Cache** ảnh avatar với `cached_network_image`
4. **Debounce** cho search input
5. **Stream/Snapshot listeners** cho real-time updates (optional)

## Troubleshooting

### Không tải được dữ liệu
- Kiểm tra Firebase connection
- Kiểm tra Firestore rules
- Kiểm tra email của user có trong `employees` collection

### Stats hiển thị 0
- Kiểm tra có `packages` và `package_users` trong Firestore
- Kiểm tra field `pt` có đúng employeeId không

### Không lưu được profile
- Kiểm tra Firestore rules có cho phép update không
- Kiểm tra network connection

## License
MIT
