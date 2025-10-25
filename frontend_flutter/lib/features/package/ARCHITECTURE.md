# Package Feature - Cấu Trúc Code Mới

## 📁 Cấu trúc thư mục

```
features/package/
├── screens/
│   └── package_screen.dart          # Main screen - Đơn giản, chỉ quản lý navigation
├── widgets/
│   ├── membership_card.dart         # Card hiển thị thông tin membership
│   ├── package_header.dart          # Header với nút back
│   ├── section_title.dart           # Title section
│   ├── action_cards_section.dart    # Danh sách action cards
│   ├── action_card.dart             # Card action đơn lẻ
│   ├── package_card.dart            # Card hiển thị gói tập
│   ├── stat_card.dart               # Card thống kê
│   ├── history_card.dart            # Card lịch sử tập luyện
│   ├── renew_button.dart            # Nút gia hạn
│   ├── personal_PT_card.dart        # Card thông tin PT
│   ├── packages_bottom_sheet.dart   # Bottom sheet chọn gói tập
│   ├── workout_history_bottom_sheet.dart  # Bottom sheet lịch sử tập luyện
│   ├── pt_list_bottom_sheet.dart    # Bottom sheet danh sách PT
│   ├── payment_dialog.dart          # Dialog thanh toán
│   └── support_dialog.dart          # Dialog hỗ trợ
├── data/
│   ├── constants/
│   │   └── package_constants.dart   # Dữ liệu constants (packages, workout history)
│   └── providers/
│       └── membership_provider.dart # Provider quản lý state membership
└── model/
    └── (các model liên quan)
```

## 🎯 Nguyên tắc thiết kế

### 1. **Separation of Concerns**
- **Screen**: Chỉ quản lý navigation và kết nối các widget
- **Widget**: Mỗi widget độc lập, có trách nhiệm riêng
- **Bottom Sheet/Dialog**: Tách riêng logic hiển thị popup
- **Constants**: Dữ liệu tĩnh được tách ra file riêng
- **Provider**: Quản lý state và business logic

### 2. **Single Responsibility Principle**
Mỗi file chỉ làm một việc:
- `package_screen.dart`: Navigation và orchestration
- `packages_bottom_sheet.dart`: Hiển thị danh sách gói tập
- `pt_list_bottom_sheet.dart`: Hiển thị danh sách PT
- `payment_dialog.dart`: Dialog thanh toán
- `support_dialog.dart`: Dialog hỗ trợ

### 3. **Reusability**
- Các widget có thể tái sử dụng ở nhiều nơi
- Bottom sheets và dialogs có phương thức `show()` static
- Constants được centralized

## 📝 Cách sử dụng

### Package Screen (Main)
```dart
PackageScreen(userId: 'user123')
```

### Bottom Sheets
```dart
// Show packages
showModalBottomSheet(
  context: context,
  builder: (context) => PackagesBottomSheet(
    availablePackages: PackageConstants.availablePackages,
    onRenewPackage: (packageId) { /* handle */ },
  ),
);

// Show PT list (with auto-loading)
PTListBottomSheet.show(
  context,
  onSelectPT: (ptName) { /* handle */ },
);

// Show workout history
showModalBottomSheet(
  context: context,
  builder: (context) => WorkoutHistoryBottomSheet(
    workoutHistory: PackageConstants.workoutHistory,
  ),
);
```

### Dialogs
```dart
// Payment dialog
PaymentDialog.show(context);

// Support dialog
SupportDialog.show(context);
```

## 🔧 Lợi ích của cấu trúc mới

### 1. **Dễ bảo trì**
- Code ngắn gọn, dễ đọc
- Mỗi file < 200 dòng
- Dễ tìm và sửa lỗi

### 2. **Dễ test**
- Mỗi widget có thể test độc lập
- Mock data dễ dàng thông qua constants

### 3. **Dễ mở rộng**
- Thêm bottom sheet mới: Tạo file mới, không ảnh hưởng code cũ
- Thay đổi UI: Chỉ sửa widget cụ thể
- Thêm tính năng: Không cần sửa main screen

### 4. **Reusable**
- Widgets có thể dùng lại ở màn hình khác
- Bottom sheets và dialogs có thể gọi từ bất kỳ đâu

### 5. **Clean Architecture**
- Tách biệt UI, Logic, Data
- Tuân thủ SOLID principles
- Dễ hiểu cho developer mới

## 🚀 So sánh trước và sau

### Trước (1 file 600+ dòng)
```dart
// package_screen.dart
class PackageScreen {
  // Chứa tất cả:
  // - Data (availablePackages, workoutHistory)
  // - UI (build widgets)
  // - Logic (dialog methods)
  // - State management
}
```

### Sau (nhiều file nhỏ, rõ ràng)
```dart
// package_screen.dart - 130 dòng
class PackageScreen {
  // Chỉ navigation và orchestration
}

// packages_bottom_sheet.dart - 110 dòng
class PackagesBottomSheet {
  // Chỉ UI chọn gói tập
}

// package_constants.dart - 40 dòng
class PackageConstants {
  // Chỉ constants
}

// ... và các file khác
```

## 📌 Next Steps

### Để tiếp tục cải thiện:

1. **Tách Provider riêng cho Package**
   - Tạo `PackageProvider` để quản lý packages
   - Tạo `WorkoutHistoryProvider` để quản lý workout history
   
2. **Kết nối Backend**
   - Replace mock data bằng API calls
   - Implement error handling
   
3. **Add Loading States**
   - Shimmer effects cho loading
   - Pull to refresh
   
4. **Implement Real Payment**
   - Integrate payment gateway
   - Handle payment callbacks
   
5. **Add Analytics**
   - Track user interactions
   - Monitor performance

## 💡 Tips

- **Khi thêm dialog mới**: Tạo file riêng với static method `show()`
- **Khi thêm dữ liệu**: Thêm vào `PackageConstants` hoặc provider
- **Khi sửa UI**: Tìm widget cụ thể, không cần đọc toàn bộ code
- **Khi debug**: Check từng widget độc lập

## 🎨 Theme Integration

Tất cả widgets sử dụng:
- `context.background` - Background color
- `context.surface` - Surface color
- `context.textPrimary` - Primary text color
- `context.textSecondary` - Secondary text color
- `AppColors.*` - Predefined colors

Đảm bảo dark/light mode hoạt động tự động.
