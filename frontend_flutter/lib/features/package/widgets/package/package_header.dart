import 'package:flutter/material.dart';
import '../../../../theme/colors.dart';

class PackageHeader extends StatelessWidget {
  final VoidCallback onBack;

  const PackageHeader({super.key, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: context.surface,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: IconButton(
            icon: Icon(Icons.arrow_back, color: AppColors.primary),
            onPressed: onBack,
            splashRadius: 24,
          ),
        ),
      ],
    );
  }
}
