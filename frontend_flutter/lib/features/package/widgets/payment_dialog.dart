import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';

class PaymentDialog extends StatelessWidget {
  const PaymentDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: context.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        'Thanh Toán',
        style: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: context.textPrimary,
        ),
      ),
      content: Text(
        'Tính năng thanh toán đang được phát triển.\n\nVui lòng liên hệ nhân viên để được hỗ trợ.',
        style: GoogleFonts.inter(fontSize: 14, color: context.textSecondary),
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
    showDialog(context: context, builder: (context) => const PaymentDialog());
  }
}
