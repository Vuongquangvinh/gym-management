# Package Feature - Membership Card Refactoring

## Tổng quan
Đã tái cấu trúc `MembershipCard` để widget tự quản lý dữ liệu thay vì nhận props từ parent screen.

## Thay đổi chính

### 1. Tạo Provider
- **File**: `lib/features/package/data/providers/membership_provider.dart`
- **Chức năng**: Quản lý state và fetch dữ liệu từ Firestore
- **API**:
  - `loadMembershipData(userId)`: Load thông tin membership
  - `refresh(userId)`: Refresh dữ liệu
  - `clear()`: Clear state
  - Getters: `isActive`, `daysLeft`, `isExpiringSoon`, `membershipStatus`

### 2. Cập nhật Widget
- **File**: `lib/features/package/widgets/membership_card.dart`
- **Thay đổi**: 
  - Từ `StatelessWidget` → `StatefulWidget`
  - Từ nhận props → Tự fetch data qua Provider
  - Props: `userId` (duy nhất)
  - Tự động load data trong `initState()`
  - Có loading, error và empty states

### 3. Đơn giản hóa Screen
- **File**: `lib/features/package/screens/package_screen.dart`
- **Thay đổi**:
  - Props: Chỉ cần `userId` (thay vì memberName, cardType, expiryDate, isActive)
  - Không còn quản lý membership data trong screen

## Cách sử dụng

### Option 1: Dùng navigation helper (Khuyến nghị)
```dart
import 'package:your_app/features/package/utils/navigation_helper.dart';

// Navigate đến package screen
navigateToPackageScreen(context, userId);
```

### Option 2: Dùng wrapper widget
```dart
import 'package:your_app/features/package/utils/navigation_helper.dart';

MaterialApp(
  home: PackageScreenWithProvider(userId: 'user123'),
);
```

### Option 3: Tự wrap với Provider (Advanced)
```dart
import 'package:provider/provider.dart';
import 'package:your_app/features/package/screens/package_screen.dart';
import 'package:your_app/features/package/data/providers/membership_provider.dart';

ChangeNotifierProvider(
  create: (_) => MembershipProvider(),
  child: PackageScreen(userId: 'user123'),
);
```

## Lợi ích

✅ **Separation of Concerns**: Widget tự quản lý data, screen chỉ layout
✅ **Reusability**: MembershipCard có thể dùng ở nhiều nơi
✅ **Maintainability**: Dễ maintain và test hơn
✅ **Scalability**: Dễ mở rộng thêm features
✅ **Loading States**: Xử lý loading, error, empty states tự động

## Dependencies

Cần thêm `provider` vào `pubspec.yaml` nếu chưa có:
```yaml
dependencies:
  provider: ^6.0.0
```

## Database Structure

Provider expects:
- Collection: `users` với UserModel structure
- Collection: `packages` với PackageModel structure
- UserModel có field: `currentPackageId` để link với Package

## Testing

```dart
// Mock provider để test
final mockProvider = MembershipProvider();
await mockProvider.loadMembershipData('test_user_id');

expect(mockProvider.isLoading, false);
expect(mockProvider.currentUser, isNotNull);
```

## Các widget khác có thể refactor tương tự

- `PackageCard` - Có thể tự fetch available packages
- `HistoryCard` - Có thể tự fetch workout history
- `StatCard` - Có thể tự calculate statistics

---
**Created**: October 24, 2025
**Author**: Refactoring Team
