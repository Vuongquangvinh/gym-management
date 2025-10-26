import 'package:flutter/material.dart';

/// Shared color tokens for Gym Management (Flutter)
/// Usage:
/// import 'package:your_app/theme/colors.dart';
/// Color primary = AppColors.primary;

class AppColors {
  // Brand / primary - Màu tím đậm hiện đại, mạnh mẽ và thu hút Gen Z
  static const primary = Color(0xFF0D47A1); // deep blue (brand)
  static const primaryVariant = Color(0xFF08316A);
  static const primaryLight = Color(
    0xFF818CF8,
  ); // lighter variant for gradients

  // Secondary / accents - Màu hồng neon năng động, trendy
  static const secondary = Color(0xFFEC4899); // hot pink
  static const secondaryVariant = Color(0xFFDB2777);
  static const accent = Color(0xFF10B981); // emerald green for CTAs

  // Fitness colors - Màu sắc gradient hiện đại cho các chỉ số
  static const cardio = Color(0xFF06B6D4); // bright cyan
  static const strength = Color(0xFFA855F7); // vibrant purple
  static const yoga = Color(0xFF34D399); // mint green
  static const nutrition = Color(0xFFFBBF24); // golden yellow

  // Health metrics colors
  static const heartRate = Color(0xFFF43F5E); // red-pink for heart
  static const steps = Color(0xFF3B82F6); // bright blue for steps
  static const water = Color(0xFF06B6D4); // cyan for water
  static const calories = Color(0xFFF59E0B); // amber for calories

  // Light Mode - Minimalist & Clean
  static const backgroundLight = Color(0xFFF8FAFC);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const textPrimaryLight = Color(0xFF0F172A);
  static const textSecondaryLight = Color(0xFF64748B);
  static const borderLight = Color(0xFFE2E8F0);
  static const cardLight = Color(0xFFFFFFFF);

  // Dark Mode - Deep & Bold
  static const backgroundDark = Color(0xFF0F172A); // slate dark
  static const surfaceDark = Color(0xFF1E293B); // slate lighter
  static const cardDark = Color(0xFF1E293B); // card background
  static const textPrimaryDark = Color(0xFFF1F5F9); // almost white
  static const textSecondaryDark = Color(0xFF94A3B8); // slate gray
  static const borderDark = Color(0xFF334155);

  // System colors - Modern & Vibrant
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const muted = Color(0xFF94A3B8); // neutral gray for inactive states
  static const info = Color(0xFF3B82F6);

  // QR / scan-specific
  static const qrScan = Color(0xFF6366F1);
  static const overlay = Color(0xCC0F172A);

  // Gradient combinations for cards - Instagram-inspired
  static const gymCardGradientStart = Color(0xFF6366F1);
  static const gymCardGradientEnd = Color(0xFFEC4899);

  static const premiumGradientStart = Color(0xFFF59E0B);
  static const premiumGradientEnd = Color(0xFFEC4899);
}

/// App Theme Data
class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.backgroundLight,
    colorScheme: ColorScheme.light(
      primary: AppColors.primary,
      secondary: AppColors.secondary,
      surface: AppColors.surfaceLight,
      error: AppColors.error,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: AppColors.textPrimaryLight,
      onError: Colors.white,
    ),
    cardTheme: CardThemeData(
      color: AppColors.cardLight,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.surfaceLight,
      foregroundColor: AppColors.textPrimaryLight,
      elevation: 0,
    ),
    textTheme: TextTheme(
      bodyLarge: TextStyle(color: AppColors.textPrimaryLight),
      bodyMedium: TextStyle(color: AppColors.textPrimaryLight),
      bodySmall: TextStyle(color: AppColors.textSecondaryLight),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    primaryColor: AppColors.primary,
    scaffoldBackgroundColor: AppColors.backgroundDark,
    colorScheme: ColorScheme.dark(
      primary: AppColors.primaryLight,
      secondary: AppColors.secondary,
      surface: AppColors.surfaceDark,
      error: AppColors.error,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: AppColors.textPrimaryDark,
      onError: Colors.white,
    ),
    cardTheme: CardThemeData(
      color: AppColors.cardDark,
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.surfaceDark,
      foregroundColor: AppColors.textPrimaryDark,
      elevation: 0,
    ),
    textTheme: TextTheme(
      bodyLarge: TextStyle(color: AppColors.textPrimaryDark),
      bodyMedium: TextStyle(color: AppColors.textPrimaryDark),
      bodySmall: TextStyle(color: AppColors.textSecondaryDark),
    ),
  );
}

// Helper extension để dễ dàng lấy màu theo theme
extension ThemeColors on BuildContext {
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;

  Color get background =>
      isDarkMode ? AppColors.backgroundDark : AppColors.backgroundLight;
  Color get surface =>
      isDarkMode ? AppColors.surfaceDark : AppColors.surfaceLight;
  Color get card => isDarkMode ? AppColors.cardDark : AppColors.cardLight;
  Color get textPrimary =>
      isDarkMode ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
  Color get textSecondary =>
      isDarkMode ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
  Color get border => isDarkMode ? AppColors.borderDark : AppColors.borderLight;
}

// Example ThemeData snippet you can place in your main Theme:
// ThemeData(
//   primaryColor: AppColors.primary,
//   scaffoldBackgroundColor: AppColors.background,
//   colorScheme: ColorScheme.fromSwatch().copyWith(secondary: AppColors.secondary),
//   textTheme: TextTheme(bodyText1: TextStyle(color: AppColors.textPrimary)),
// )
