import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';

class QuickActionsWidget extends StatelessWidget {
  const QuickActionsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Thao tác nhanh',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: Icons.qr_code_scanner_rounded,
                title: 'Check-in',
                subtitle: 'Quét mã QR',
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryVariant],
                ),
                onTap: () {
                  Navigator.pushNamed(context, '/qr');
                },
              ),
            ),
            // Expanded(
            //   child: _QuickActionCard(
            //     icon: Icons.card_membership_rounded,
            //     title: 'Gói tập',
            //     subtitle: 'Xem & gia hạn',
            //     gradient: LinearGradient(
            //       colors: [AppColors.secondary, AppColors.accent],
            //     ),
            //     onTap: () {
            //       Navigator.pushNamed(context, '/package');
            //     },
            //   ),
            // ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: Icons.fitness_center_rounded,
                title: 'PT cá nhân',
                subtitle: 'Đặt lịch tập',
                gradient: LinearGradient(
                  colors: [AppColors.success, Color(0xFF4CAF50)],
                ),
                onTap: () {
                  Navigator.pushNamed(context, '/my-contracts');
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                icon: Icons.history_rounded,
                title: 'Lịch sử',
                subtitle: 'Check-in ',
                gradient: LinearGradient(
                  colors: [AppColors.warning, Color(0xFFFF9800)],
                ),
                onTap: () {
                  Navigator.pushNamed(context, '/checkin-history');
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Gradient gradient;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
