import 'package:flutter/material.dart';

/// Shared color tokens for Gym Management (Flutter)
/// Usage:
/// import 'package:your_app/theme/colors.dart';
/// Color primary = AppColors.primary;

class AppColors {
  // Brand / primary - Màu xanh dương chuyên nghiệp, hiện đại
  static const primary = Color(0xFF2563EB); // Professional Blue
  static const primaryVariant = Color(0xFF1E40AF); // Darker Blue
  static const primaryLight = Color(0xFF3B82F6); // Lighter Blue for gradients

  // Secondary / accents - Màu bổ trợ hiện đại
  static const secondary = Color(0xFF06B6D4); // Cyan Blue
  static const secondaryVariant = Color(0xFF0891B2); // Darker Cyan
  static const accent = Color(0xFF10B981); // Emerald Green for CTAs

  // Fitness colors - Màu sắc gradient hiện đại cho các chỉ số
  static const cardio = Color(0xFFEF4444); // Modern Red
  static const strength = Color(0xFF8B5CF6); // Purple
  static const yoga = Color(0xFF14B8A6); // Teal
  static const nutrition = Color(0xFFF59E0B); // Amber

  // Health metrics colors
  static const heartRate = Color(0xFFEF4444); // Modern Red
  static const steps = Color(0xFF3B82F6); // Blue
  static const water = Color(0xFF06B6D4); // Cyan
  static const calories = Color(0xFFF59E0B); // Amber

  // Light Mode - Clean Blue & White
  static const backgroundLight = Color.fromARGB(
    255,
    207,
    228,
    255,
  ); // Light Blue Background
  static const surfaceLight = Color(0xFFFFFFFF); // Pure White
  static const textPrimaryLight = Color(0xFF1E293B); // Slate Dark
  static const textSecondaryLight = Color(0xFF64748B); // Slate Gray
  static const borderLight = Color(0xFFE2E8F0); // Light Border
  static const cardLight = Color(0xFFFFFFFF); // White Card

  // Dark Mode - Deep Blue & Dark
  static const backgroundDark = Color(0xFF0F172A); // Deep Navy Blue
  static const surfaceDark = Color(0xFF1E293B); // Slate Surface
  static const cardDark = Color(0xFF334155); // Slate Card
  static const textPrimaryDark = Color(0xFFF8FAFC); // Almost White
  static const textSecondaryDark = Color(0xFF94A3B8); // Light Slate
  static const borderDark = Color(0xFF475569); // Slate Border

  // System colors - Modern & Clear
  static const success = Color(0xFF10B981); // Emerald Green
  static const warning = Color(0xFFF59E0B); // Amber
  static const error = Color(0xFFEF4444); // Modern Red
  static const muted = Color(0xFF94A3B8); // Slate Gray
  static const info = Color(0xFF3B82F6); // Blue

  // QR / scan-specific
  static const qrScan = Color(0xFF2563EB); // Blue for scan
  static const overlay = Color(0xDD0F172A); // Dark Blue Overlay

  // Gradient combinations - Modern Blue Theme
  static const gymCardGradientStart = Color(0xFF2563EB); // Blue
  static const gymCardGradientEnd = Color(0xFF3B82F6); // Light Blue

  static const premiumGradientStart = Color(0xFF1E40AF); // Dark Blue
  static const premiumGradientEnd = Color(0xFF06B6D4); // Cyan
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
