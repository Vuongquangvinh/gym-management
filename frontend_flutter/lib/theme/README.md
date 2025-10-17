# Gym Management App - Theme & Color System

## 📋 Tổng quan

Hệ thống màu sắc được thiết kế dành riêng cho ứng dụng quản lý phòng gym, tối ưu cho cả **Light Mode** và **Dark Mode**, với màu chính là **Deep Blue (#0D47A1)** thể hiện sự chuyên nghiệp và năng lượng.

## 🎨 Bảng màu chính

### Primary Colors (Màu thương hiệu)
- **Primary**: `#0D47A1` - Xanh dương đậm (màu chính của ứng dụng)
- **Primary Light**: `#5472D3` - Xanh dương nhạt (dùng cho gradient, dark mode)
- **Primary Variant**: `#08316A` - Xanh dương tối

### Secondary & Accent Colors
- **Secondary**: `#FF6B35` - Cam đỏ năng động (thể hiện nhiệt huyết gym)
- **Accent**: `#FFB300` - Vàng amber (dùng cho CTA buttons)

### Fitness Activity Colors
- **Cardio**: `#4FC3F7` - Xanh cyan cho hoạt động cardio
- **Strength**: `#9C27B0` - Tím cho tập tạ
- **Yoga**: `#66BB6A` - Xanh lá cho yoga/flexibility
- **Nutrition**: `#FFB74D` - Cam cho dinh dưỡng

### Health Metrics Colors
- **Heart Rate**: `#FF6B9D` - Hồng cho nhịp tim
- **Steps**: `#42A5F5` - Xanh dương cho bước chân
- **Water**: `#26C6DA` - Xanh cyan cho nước
- **Calories**: `#FF7043` - Cam đỏ cho calories

### System Colors
- **Success**: `#2E7D32` - Xanh lá
- **Warning**: `#F57C00` - Cam
- **Error**: `#D32F2F` - Đỏ
- **Info**: `#0288D1` - Xanh dương

## 🌓 Light Mode vs Dark Mode

### Light Mode
- **Background**: `#F5F7FA` - Xám nhạt
- **Surface**: `#FFFFFF` - Trắng
- **Card**: `#FFFFFF` - Trắng
- **Text Primary**: `#0B2545` - Xanh đen
- **Text Secondary**: `#546E7A` - Xám
- **Border**: `#E0E0E0` - Xám nhạt

### Dark Mode
- **Background**: `#0A1929` - Xanh đen đậm
- **Surface**: `#132F4C` - Xanh đen vừa
- **Card**: `#1A2F45` - Xanh đen nhạt
- **Text Primary**: `#E3F2FD` - Trắng xanh
- **Text Secondary**: `#B0BEC5` - Xám nhạt
- **Border**: `#1E3A5F` - Xanh đen border

## 🔧 Cách sử dụng

### 1. Sử dụng màu tĩnh
```dart
import 'package:your_app/theme/colors.dart';

// Màu brand
Container(color: AppColors.primary)

// Màu hoạt động
Container(color: AppColors.cardio)

// Màu metrics
Container(color: AppColors.heartRate)
```

### 2. Sử dụng màu động theo theme
```dart
// Sử dụng extension methods
Widget build(BuildContext context) {
  return Container(
    color: context.background,  // Tự động chuyển đổi theo theme
    child: Text(
      'Hello',
      style: TextStyle(color: context.textPrimary),
    ),
  );
}

// Kiểm tra dark mode
if (context.isDarkMode) {
  // Code cho dark mode
}
```

### 3. Chuyển đổi Light/Dark Mode
```dart
// Trong widget
final themeProvider = Provider.of<ThemeProvider>(context);

// Toggle theme
ElevatedButton(
  onPressed: () => themeProvider.toggleTheme(),
  child: Text('Đổi theme'),
)

// Set theme cụ thể
themeProvider.setThemeMode(ThemeMode.dark);
```

### 4. Sử dụng trong MaterialApp
```dart
import 'package:provider/provider.dart';
import 'providers/theme_provider.dart';
import 'theme/colors.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return MaterialApp(
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeProvider.themeMode,
          // ...
        );
      },
    );
  }
}
```

## 🎯 Nguyên tắc thiết kế màu sắc

### 1. **Consistency (Nhất quán)**
- Sử dụng màu từ bảng màu định sẵn
- Không tự ý thêm màu mới

### 2. **Accessibility (Dễ tiếp cận)**
- Đảm bảo độ tương phản tốt giữa text và background
- Light mode: text tối trên nền sáng
- Dark mode: text sáng trên nền tối

### 3. **Context-aware (Nhận biết ngữ cảnh)**
- Cardio → Xanh cyan (năng động)
- Strength → Tím (mạnh mẽ)
- Yoga → Xanh lá (thư giãn)
- Calories → Cam đỏ (năng lượng)

### 4. **Hierarchy (Phân cấp)**
- Primary: Màu chính cho branding
- Secondary: Màu phụ cho accent
- Text Primary: Nội dung chính
- Text Secondary: Nội dung phụ

## 📱 Ví dụ áp dụng

### Health Summary Card
```dart
Container(
  decoration: BoxDecoration(
    color: context.card,
    borderRadius: BorderRadius.circular(24),
    border: Border.all(
      color: context.isDarkMode 
          ? AppColors.borderDark.withOpacity(0.3)
          : AppColors.borderLight.withOpacity(0.08),
    ),
  ),
  child: _buildHealthMetric(
    icon: Icons.favorite,
    label: 'Nhịp tim',
    value: '78 bpm',
    color: AppColors.heartRate,
  ),
)
```

### Member Card (Gradient)
```dart
Container(
  decoration: BoxDecoration(
    gradient: LinearGradient(
      colors: [
        AppColors.primary,
        AppColors.primaryLight,
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
  ),
)
```

### Goal Progress (với màu sắc phân biệt)
```dart
_buildGoalItem(
  context,
  'Buổi tập/tuần',
  3, 5,
  AppColors.cardio,  // Màu xanh cho cardio
  Icons.fitness_center,
)
```

## 🔄 Migration Guide

Nếu bạn đang nâng cấp từ hệ thống màu cũ:

1. **Thay thế màu tĩnh cũ**:
```dart
// Cũ
AppColors.background
AppColors.surface
AppColors.textPrimary

// Mới
context.background
context.surface
context.textPrimary
```

2. **Thêm import ThemeProvider**:
```dart
import 'package:provider/provider.dart';
import 'providers/theme_provider.dart';
```

3. **Wrap MaterialApp với Provider**:
```dart
ChangeNotifierProvider(
  create: (_) => ThemeProvider(),
  child: MaterialApp(...),
)
```

## 🎨 Design Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| background | #F5F7FA | #0A1929 | App background |
| surface | #FFFFFF | #132F4C | Card, AppBar |
| card | #FFFFFF | #1A2F45 | Card component |
| textPrimary | #0B2545 | #E3F2FD | Heading, important text |
| textSecondary | #546E7A | #B0BEC5 | Description, subtitle |
| border | #E0E0E0 | #1E3A5F | Dividers, borders |

## 📞 Support

Nếu có thắc mắc về hệ thống màu sắc, vui lòng liên hệ team Design/Dev.
