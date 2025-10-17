import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';

class HealthSummaryWidget extends StatelessWidget {
  const HealthSummaryWidget({super.key});

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
              : AppColors.borderLight.withOpacity(0.08),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(isDarkMode ? 0.15 : 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
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
                'Sức khỏe hôm nay',
                style: GoogleFonts.montserrat(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: context.textPrimary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.secondary.withOpacity(0.2),
                      AppColors.accent.withOpacity(0.2),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.local_fire_department,
                      size: 16,
                      color: AppColors.calories,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '1,250 kcal',
                      style: GoogleFonts.montserrat(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.calories,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildHealthCard(
                  context,
                  Icons.directions_walk,
                  'Bước',
                  '7,500',
                  '/ 10,000',
                  AppColors.steps,
                  0.75,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildHealthCard(
                  context,
                  Icons.favorite,
                  'Nhịp tim',
                  '78',
                  'bpm',
                  AppColors.heartRate,
                  1.0,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildHealthCard(
                  context,
                  Icons.local_drink,
                  'Nước',
                  '1.8',
                  '/ 2.0L',
                  AppColors.water,
                  0.9,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildHealthCard(
                  context,
                  Icons.route,
                  'Quãng đường',
                  '5.2',
                  'km',
                  AppColors.nutrition,
                  1.0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHealthCard(
    BuildContext context,
    IconData icon,
    String label,
    String value,
    String unit,
    Color color,
    double progress,
  ) {
    final isDarkMode = context.isDarkMode;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(isDarkMode ? 0.15 : 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(isDarkMode ? 0.3 : 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(isDarkMode ? 0.25 : 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              if (progress < 1.0)
                SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 2.5,
                    backgroundColor: color.withOpacity(0.2),
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: value,
                  style: GoogleFonts.montserrat(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                TextSpan(
                  text: unit,
                  style: GoogleFonts.montserrat(
                    fontSize: 14,
                    color: context.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.montserrat(
              fontSize: 13,
              color: context.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
