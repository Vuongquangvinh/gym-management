import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';

class GoalsProgressWidget extends StatelessWidget {
  const GoalsProgressWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final isDarkMode = context.isDarkMode;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDarkMode
              ? AppColors.borderDark.withOpacity(0.3)
              : AppColors.borderLight.withOpacity(0.1),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withOpacity(isDarkMode ? 0.15 : 0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
            spreadRadius: -5,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tiến độ mục tiêu',
                style: GoogleFonts.montserrat(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: context.textPrimary,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.trending_up,
                  color: AppColors.success,
                  size: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildGoalItem(
            context,
            'Buổi tập/tuần',
            3,
            5,
            AppColors.cardio,
            Icons.fitness_center,
          ),
          const SizedBox(height: 16),
          _buildGoalItem(
            context,
            'Giảm cân (kg)',
            2,
            5,
            AppColors.secondary,
            Icons.monitor_weight,
          ),
          const SizedBox(height: 16),
          _buildGoalItem(
            context,
            'Thời gian tập',
            12,
            16,
            AppColors.strength,
            Icons.timer,
          ),
        ],
      ),
    );
  }

  Widget _buildGoalItem(
    BuildContext context,
    String label,
    num current,
    num target,
    Color color,
    IconData icon,
  ) {
    double percent = (current / target).clamp(0, 1).toDouble();
    final isDarkMode = context.isDarkMode;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(isDarkMode ? 0.12 : 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(isDarkMode ? 0.25 : 0.15)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(isDarkMode ? 0.25 : 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      label,
                      style: GoogleFonts.montserrat(
                        fontSize: 14,
                        color: context.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${(percent * 100).toInt()}%',
                      style: GoogleFonts.montserrat(
                        fontSize: 13,
                        color: color,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: percent,
                    minHeight: 8,
                    backgroundColor: color.withOpacity(0.2),
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$current / $target',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    color: context.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
