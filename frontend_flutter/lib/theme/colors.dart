import 'package:flutter/material.dart';

/// Shared color tokens for Gym Management (Flutter)
/// Usage:
/// import 'package:your_app/theme/colors.dart';
/// Color primary = AppColors.primary;

class AppColors {
  // Brand / primary
  static const primary = Color(0xFF0D47A1);        // deep blue (brand)
  static const primaryVariant = Color(0xFF08316A);

  // Secondary / accents
  static const secondary = Color(0xFF00897B);      // teal
  static const secondaryVariant = Color(0xFF00695C);
  static const accent = Color(0xFFFFB300);         // warm amber for CTAs

  // Surfaces & backgrounds
  static const background = Color(0xFFF5F7FA);     // very light
  static const surface = Color(0xFFFFFFFF);

  // Text
  static const textPrimary = Color(0xFF0B2545);    // near-black blue for main text
  static const textSecondary = Color(0xFF546E7A);  // muted
  static const muted = Color(0xFF9E9E9E);

  // Borders, dividers
  static const border = Color(0xFFE0E0E0);

  // System colors
  static const success = Color(0xFF2E7D32);
  static const warning = Color(0xFFF57C00);
  static const error = Color(0xFFD32F2F);

  // QR / scan-specific
  static const qrScan = Color(0xFF1976D2);         // bright blue for scan indicator
  static const overlay = Color(0x990B2545);       // 60% opacity overlay (0x99)
}

// Example ThemeData snippet you can place in your main Theme:
// ThemeData(
//   primaryColor: AppColors.primary,
//   scaffoldBackgroundColor: AppColors.background,
//   colorScheme: ColorScheme.fromSwatch().copyWith(secondary: AppColors.secondary),
//   textTheme: TextTheme(bodyText1: TextStyle(color: AppColors.textPrimary)),
// )
