import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../../theme/colors.dart';

class HistoryCard extends StatelessWidget {
  final Map<String, dynamic> workout;

  const HistoryCard({super.key, required this.workout});

  @override
  Widget build(BuildContext context) {
    final date = DateTime.parse(workout['date']);
    final isRecent = DateTime.now().difference(date).inDays < 2;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isRecent ? AppColors.primary.withOpacity(0.3) : context.border,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                DateFormat('dd').format(date),
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  workout['type'],
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: context.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  DateFormat('EEEE, dd/MM/yyyy').format(date),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: context.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  const Icon(Icons.timer, size: 14, color: AppColors.secondary),
                  const SizedBox(width: 4),
                  Text(
                    '${workout['duration']} phút',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: context.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(
                    Icons.local_fire_department,
                    size: 14,
                    color: AppColors.error,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${workout['calories']} cal',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: context.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
