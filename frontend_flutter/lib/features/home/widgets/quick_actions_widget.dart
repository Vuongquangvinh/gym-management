import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import '../../model/user.model.dart';

class QuickActionsWidget extends StatelessWidget {
  final UserPackageInfo? userPackageInfo;

  const QuickActionsWidget({super.key, this.userPackageInfo});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Grid layout 2x2 với khoảng cách hợp lý
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: Icons.qr_code_scanner_rounded,
                title: 'Check-in',
                subtitle: 'Quét QR',
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () {
                  final userId = userPackageInfo?.user.id;
                  final fullName = userPackageInfo?.user.fullName;
                  final email = userPackageInfo?.user.email;
                  final phoneNumber = userPackageInfo?.user.phoneNumber;
                  final packageName = userPackageInfo?.getPackageName();
                  final hasActivePackage = userPackageInfo?.hasActivePackage();

                  Navigator.pushNamed(
                    context,
                    '/qr',
                    arguments: {
                      'qrData': userId ?? 'default_qr_code',
                      'userId': userId,
                      'fullName': fullName,
                      'email': email,
                      'phoneNumber': phoneNumber,
                      'packageName': packageName,
                      'hasActivePackage': hasActivePackage,
                    },
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                icon: Icons.fitness_center_rounded,
                title: 'PT cá nhân',
                subtitle: 'Đặt lịch',
                gradient: LinearGradient(
                  colors: [AppColors.secondary, AppColors.accent],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () {
                  Navigator.pushNamed(context, '/my-contracts');
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: Icons.history_rounded,
                title: 'Lịch sử',
                subtitle: 'Check-in',
                gradient: LinearGradient(
                  colors: [AppColors.cardio, Color(0xFFFF8787)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () {
                  Navigator.pushNamed(context, '/checkin-history');
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                icon: Icons.calendar_month_rounded,
                title: 'Gói tập',
                subtitle: 'Gia hạn',
                gradient: LinearGradient(
                  colors: [AppColors.strength, Color(0xFF6EDDD6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () {
                  Navigator.pushNamed(
                    context,
                    '/packageMember',
                    arguments: {'userId': userPackageInfo?.user.id ?? ''},
                  );
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
        height: 100,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
              spreadRadius: -2,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Icon container
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.25),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            // Text info
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    color: Colors.white.withOpacity(0.85),
                    fontWeight: FontWeight.w500,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
