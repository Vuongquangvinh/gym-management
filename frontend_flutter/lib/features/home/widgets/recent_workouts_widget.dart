import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';

class RecentWorkoutsWidget extends StatelessWidget {
  const RecentWorkoutsWidget({super.key});

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
            color: AppColors.primary.withOpacity(isDarkMode ? 0.15 : 0.06),
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
                'Lịch sử tập luyện',
                style: GoogleFonts.montserrat(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: context.textPrimary,
                ),
              ),
              TextButton(
                onPressed: () {},
                child: Text(
                  'Xem tất cả',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          ..._buildWorkoutList(context),
        ],
      ),
    );
  }

  List<Widget> _buildWorkoutList(BuildContext context) {
    final workouts = [
      {
        'date': '14/10',
        'type': 'Cardio',
        'duration': '45p',
        'calories': 320,
        'icon': Icons.directions_run,
        'color': AppColors.cardio,
      },
      {
        'date': '13/10',
        'type': 'Tạ',
        'duration': '60p',
        'calories': 410,
        'icon': Icons.fitness_center,
        'color': AppColors.strength,
      },
      {
        'date': '12/10',
        'type': 'Yoga',
        'duration': '30p',
        'calories': 180,
        'icon': Icons.self_improvement,
        'color': AppColors.yoga,
      },
    ];

    return workouts.map((w) => _buildWorkoutItem(context, w)).toList();
  }

  Widget _buildWorkoutItem(BuildContext context, Map<String, dynamic> workout) {
    final isDarkMode = context.isDarkMode;
    final color = workout['color'] as Color;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDarkMode
              ? [color.withOpacity(0.15), color.withOpacity(0.08)]
              : [color.withOpacity(0.05), color.withOpacity(0.02)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(isDarkMode ? 0.3 : 0.15)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(isDarkMode ? 0.25 : 0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(workout['icon'] as IconData, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${workout['type']}',
                  style: GoogleFonts.montserrat(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: context.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${workout['date']} • ${workout['duration']}',
                  style: GoogleFonts.montserrat(
                    fontSize: 13,
                    color: context.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${workout['calories']}',
                style: GoogleFonts.montserrat(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                'kcal',
                style: GoogleFonts.montserrat(
                  fontSize: 12,
                  color: context.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
