import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';

class SupportDialog extends StatelessWidget {
  const SupportDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: context.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        'Hỗ Trợ Khách Hàng',
        style: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: context.textPrimary,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Liên hệ với chúng tôi:',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: context.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.phone, color: AppColors.primary, size: 20),
              const SizedBox(width: 12),
              Text(
                '1900-xxxx',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: context.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.email, color: AppColors.primary, size: 20),
              const SizedBox(width: 12),
              Text(
                'support@gym.com',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: context.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(
            'Đóng',
            style: GoogleFonts.inter(
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  static void show(BuildContext context) {
    showDialog(context: context, builder: (context) => const SupportDialog());
  }
}
