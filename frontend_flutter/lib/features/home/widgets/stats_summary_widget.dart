import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import "package:logger/logger.dart";
import '../../model/checkin.model.dart';

final logger = Logger();

/// Widget hiển thị thống kê nhanh và lịch hẹn sắp tới
class StatsSummaryWidget extends StatelessWidget {
  final String? userId; // _id từ Firestore users
  final int checkinsThisMonth;
  final int remainingSessionsThisWeek;
  final String? upcomingAppointment; // Format: "Hẹn PT lúc 19:00 hôm nay"
  final bool forceServerFetch;

  const StatsSummaryWidget({
    super.key,
    this.userId,
    this.checkinsThisMonth = 0,
    this.remainingSessionsThisWeek = 0,
    this.upcomingAppointment,
    this.forceServerFetch = false,
  });

  Future loadCheckin() async {}

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    // Sử dụng method getMonthlyCheckinCount() từ CheckinModel
    // Method này đã được tối ưu và lấy dữ liệu từ server
    return FutureBuilder<int>(
      future: CheckinModel.getMonthlyCheckinCount(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox.shrink();
        }

        final checkinCount = snapshot.data ?? 0;
        logger.i('[StatsSummaryWidget] Monthly checkin count: $checkinCount');

        return _buildStatsContent(isDarkMode, checkinCount);
      },
    );
  }

  Widget _buildStatsContent(bool isDarkMode, int checkinCount) {
    return Column(
      children: [
        // Stats Row
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDarkMode ? AppColors.surfaceDark : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDarkMode ? AppColors.borderDark : AppColors.borderLight,
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: _StatItem(
                  icon: Icons.fitness_center_rounded,
                  label: 'Tập tháng này',
                  value: '$checkinCount lần',
                  color: AppColors.accent,
                  isDarkMode: isDarkMode,
                ),
              ),
              if (remainingSessionsThisWeek > 0)
                Container(
                  width: 1,
                  height: 40,
                  color: isDarkMode
                      ? AppColors.borderDark
                      : AppColors.borderLight,
                ),
              if (remainingSessionsThisWeek > 0)
                Expanded(
                  child: _StatItem(
                    icon: Icons.calendar_today_rounded,
                    label: 'Còn lại tuần này',
                    value: '$remainingSessionsThisWeek buổi',
                    color: AppColors.primary,
                    isDarkMode: isDarkMode,
                  ),
                ),
            ],
          ),
        ),

        // Upcoming Appointment
        if (upcomingAppointment != null) ...[
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.secondary.withOpacity(0.15),
                  AppColors.info.withOpacity(0.15),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.secondary.withOpacity(0.3),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.event_available_rounded,
                    color: AppColors.secondary,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Lịch hẹn sắp tới',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: isDarkMode
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        upcomingAppointment!,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: isDarkMode
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: AppColors.secondary,
                  size: 16,
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final bool isDarkMode;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    required this.isDarkMode,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: isDarkMode
                ? AppColors.textSecondaryDark
                : AppColors.textSecondaryLight,
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
