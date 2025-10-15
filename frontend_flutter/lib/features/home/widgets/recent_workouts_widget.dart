import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';

class RecentWorkoutsWidget extends StatelessWidget {
  const RecentWorkoutsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.06),
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
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
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
          ..._buildWorkoutList(),
        ],
      ),
    );
  }

  List<Widget> _buildWorkoutList() {
    final workouts = [
      {
        'date': '14/10',
        'type': 'Cardio',
        'duration': '45p',
        'calories': 320,
        'icon': Icons.directions_run,
        'color': AppColors.primary,
      },
      {
        'date': '13/10',
        'type': 'Tạ',
        'duration': '60p',
        'calories': 410,
        'icon': Icons.fitness_center,
        'color': AppColors.secondary,
      },
      {
        'date': '12/10',
        'type': 'Yoga',
        'duration': '30p',
        'calories': 180,
        'icon': Icons.self_improvement,
        'color': AppColors.accent,
      },
    ];

    return workouts
        .map(
          (w) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  (w['color'] as Color).withOpacity(0.05),
                  (w['color'] as Color).withOpacity(0.02),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: (w['color'] as Color).withOpacity(0.15),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (w['color'] as Color).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    w['icon'] as IconData,
                    color: w['color'] as Color,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${w['type']}',
                        style: GoogleFonts.montserrat(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${w['date']} • ${w['duration']}',
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${w['calories']}',
                      style: GoogleFonts.montserrat(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: w['color'] as Color,
                      ),
                    ),
                    Text(
                      'calories',
                      style: GoogleFonts.montserrat(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        )
        .toList();
  }
}
