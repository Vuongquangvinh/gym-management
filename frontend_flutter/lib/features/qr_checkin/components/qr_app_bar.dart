import 'package:flutter/material.dart';
import '../../../theme/colors.dart';

class QRAppBar extends StatelessWidget {
  final VoidCallback onBack;
  final VoidCallback onShare;

  const QRAppBar({super.key, required this.onBack, required this.onShare});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              Icons.arrow_back_ios_new_rounded,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
            ),
            onPressed: onBack,
          ),
          const Spacer(),
          IconButton(
            icon: Icon(
              Icons.share_rounded,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
            ),
            onPressed: onShare,
          ),
        ],
      ),
    );
  }
}
