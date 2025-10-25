import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../../theme/colors.dart';
import 'stat_card.dart';
import 'history_card.dart';

class WorkoutHistoryBottomSheet extends StatelessWidget {
  final List<Map<String, dynamic>> workoutHistory;

  const WorkoutHistoryBottomSheet({super.key, required this.workoutHistory});

  @override
  Widget build(BuildContext context) {
    final totalWorkouts = workoutHistory.length;
    final totalCalories = workoutHistory.fold<int>(
      0,
      (sum, item) => sum + (item['calories'] as int),
    );
    final totalMinutes = workoutHistory.fold<int>(
      0,
      (sum, item) => sum + (item['duration'] as int),
    );

    return DraggableScrollableSheet(
      initialChildSize: 0.8,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: context.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.surface,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
              ),
              child: Row(
                children: [
                  Text(
                    'Lịch Sử Tập Luyện',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: context.textSecondary),
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    'Thống Kê Tập Luyện',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: context.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          label: 'Tổng Buổi',
                          value: totalWorkouts.toString(),
                          icon: Icons.fitness_center,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          label: 'Calories',
                          value: NumberFormat('#,###').format(totalCalories),
                          icon: Icons.local_fire_department,
                          color: AppColors.error,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  StatCard(
                    label: 'Thời Gian',
                    value: '${totalMinutes} phút',
                    icon: Icons.timer,
                    color: AppColors.secondary,
                    fullWidth: true,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Chi Tiết Lịch Sử',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: context.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...workoutHistory.map(
                    (workout) => HistoryCard(workout: workout),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static void show(
    BuildContext context, {
    required List<Map<String, dynamic>> workoutHistory,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          WorkoutHistoryBottomSheet(workoutHistory: workoutHistory),
    );
  }
}
