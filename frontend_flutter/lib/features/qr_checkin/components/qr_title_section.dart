import 'package:flutter/material.dart';
import '../../../theme/colors.dart';

class QRTitleSection extends StatelessWidget {
  final Animation<double> fadeAnimation;

  const QRTitleSection({super.key, required this.fadeAnimation});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return FadeTransition(
      opacity: fadeAnimation,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.secondary],
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Icon(Icons.qr_code_2_rounded, size: 48, color: Colors.white),
          ),
          const SizedBox(height: 24),
          Text(
            'Your Check-In QR Code',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Show this QR code at the gym entrance',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }
}
