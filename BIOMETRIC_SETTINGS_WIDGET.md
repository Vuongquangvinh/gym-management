# Cách sử dụng BiometricSettingTile Widget

## Widget này dùng để làm gì?

Widget `BiometricSettingTile` là một tile (ô cài đặt) cho phép người dùng **bật/tắt** đăng nhập bằng sinh trắc học trực tiếp trong màn hình Settings hoặc Profile.

## Cách thêm vào màn hình Settings

### Bước 1: Import widget

```dart
import 'package:frontend_flutter/widgets/biometric_setting_tile.dart';
```

### Bước 2: Thêm vào màn hình Settings

Ví dụ trong `SettingsScreen` hoặc `ProfileScreen`:

```dart
class SettingsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Cài đặt'),
      ),
      body: ListView(
        children: [
          // Các tile khác...
          
          // Tile sinh trắc học
          BiometricSettingTile(),
          
          // Các tile khác...
          ListTile(
            leading: Icon(Icons.notifications),
            title: Text('Thông báo'),
            trailing: Switch(value: true, onChanged: (v) {}),
          ),
          
          ListTile(
            leading: Icon(Icons.dark_mode),
            title: Text('Chế độ tối'),
            trailing: Switch(value: false, onChanged: (v) {}),
          ),
        ],
      ),
    );
  }
}
```

## Lưu ý quan trọng

### ⚠️ Cần hoàn thiện phương thức `_getCurrentPhoneNumber()`

Widget này cần lấy số điện thoại của user hiện tại để lưu cùng với thông tin sinh trắc học. Bạn cần thay thế phương thức placeholder này:

```dart
Future<String?> _getCurrentPhoneNumber() async {
  // TODO: Implement logic để lấy số điện thoại từ Firestore
  final prefs = await SharedPreferences.getInstance();
  final userId = prefs.getString('userId');
  
  if (userId == null) return null;
  
  final userDoc = await FirebaseFirestore.instance
      .collection('users')
      .doc(userId)
      .get();
  
  return userDoc.data()?['phone_number'];
}
```

Thêm import cần thiết:

```dart
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
```

## Giao diện của widget

```
┌─────────────────────────────────────────────┐
│  [👆]  Đăng nhập bằng Vân tay      [Switch] │
│        Đăng nhập nhanh chóng và an toàn     │
└─────────────────────────────────────────────┘
```

- **Icon vân tay** ở bên trái
- **Tên phương thức sinh trắc** (Vân tay/Face ID) tự động nhận diện
- **Mô tả ngắn** bên dưới
- **Switch** để bật/tắt ở bên phải
- **Loading indicator** khi đang xử lý

## Tính năng

✅ **Tự động ẩn** nếu thiết bị không hỗ trợ sinh trắc học  
✅ **Hiển thị đúng tên** phương thức (Vân tay/Face ID)  
✅ **Xử lý lỗi** và hiển thị SnackBar  
✅ **Loading state** khi đang bật/tắt  
✅ **Dark mode support**

## Ví dụ hoàn chỉnh

File: `lib/screens/settings_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/biometric_setting_tile.dart';
import '../theme/colors.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Cài đặt',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: isDarkMode 
            ? AppColors.surfaceDark 
            : Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 16),
        children: [
          // Security Section
          _buildSectionHeader(context, 'Bảo mật'),
          
          // Biometric Setting
          const BiometricSettingTile(),
          
          // Notifications Section
          const SizedBox(height: 24),
          _buildSectionHeader(context, 'Thông báo'),
          
          _buildSettingTile(
            context,
            icon: Icons.notifications,
            title: 'Thông báo push',
            subtitle: 'Nhận thông báo từ ứng dụng',
            value: true,
            onChanged: (v) {},
          ),
          
          // Appearance Section
          const SizedBox(height: 24),
          _buildSectionHeader(context, 'Giao diện'),
          
          _buildSettingTile(
            context,
            icon: Icons.dark_mode,
            title: 'Chế độ tối',
            subtitle: 'Chuyển sang giao diện tối',
            value: isDarkMode,
            onChanged: (v) {},
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: isDarkMode
              ? AppColors.textSecondaryDark
              : AppColors.textSecondaryLight,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSettingTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required Function(bool) onChanged,
  }) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDarkMode ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: AppColors.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isDarkMode
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: isDarkMode
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
            activeTrackColor: AppColors.primary.withOpacity(0.3),
          ),
        ],
      ),
    );
  }
}
```

## Screenshot mẫu

```
╔═══════════════════════════════════════╗
║  Cài đặt                              ║
╠═══════════════════════════════════════╣
║                                       ║
║  BẢO MẬT                             ║
║  ┌─────────────────────────────────┐ ║
║  │ [👆] Đăng nhập bằng Vân tay   ☑️ │ ║
║  │      Đăng nhập nhanh và an toàn │ ║
║  └─────────────────────────────────┘ ║
║                                       ║
║  THÔNG BÁO                           ║
║  ┌─────────────────────────────────┐ ║
║  │ [🔔] Thông báo push           ☑️ │ ║
║  │      Nhận thông báo từ app    │ ║
║  └─────────────────────────────────┘ ║
║                                       ║
║  GIAO DIỆN                           ║
║  ┌─────────────────────────────────┐ ║
║  │ [🌙] Chế độ tối                □ │ ║
║  │      Chuyển sang giao diện tối│ ║
║  └─────────────────────────────────┘ ║
║                                       ║
╚═══════════════════════════════════════╝
```

## Test widget

1. Tạo màn hình Settings
2. Thêm `BiometricSettingTile()` vào ListView
3. Hoàn thiện `_getCurrentPhoneNumber()`
4. Run app
5. Vào Settings → Toggle switch sinh trắc học

Khi toggle:
- **Bật ON**: Yêu cầu xác thực sinh trắc học → Lưu thông tin
- **Tắt OFF**: Xóa thông tin sinh trắc học → Nút ở login screen sẽ biến mất

## Tips

- Widget tự động ẩn nếu thiết bị không hỗ trợ sinh trắc học
- Nên đặt trong section "Bảo mật" hoặc "Tài khoản"
- Có thể tùy chỉnh màu sắc, icon theo design của bạn
