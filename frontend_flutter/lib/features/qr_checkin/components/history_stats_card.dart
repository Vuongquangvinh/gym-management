import 'package:flutter/material.dart';
import '../../../theme/colors.dart';

class HistoryStatsCard extends StatelessWidget {
  final int totalSessions;

  const HistoryStatsCard({super.key, required this.totalSessions});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withOpacity(0.2), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            spreadRadius: 1,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildStatItem(
            context: context,
            icon: Icons.fitness_center_rounded,
            label: 'Tổng số lần Check-in',
            value: totalSessions.toString(),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required BuildContext context,
    required IconData icon,
    required String label,
    required String value,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 32),
        const SizedBox(height: 12),
        Text(
          value,
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.textPrimaryDark : AppColors.primary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isDark
                ? AppColors.textSecondaryDark.withOpacity(0.85)
                : AppColors.textSecondaryLight.withOpacity(0.7),
          ),
        ),
      ],
    );
  }
}
