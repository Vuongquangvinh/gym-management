import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import '../../../features/chat/screens/chat_list_screen.dart';
import '../../model/user.model.dart';

class QuickActionsWidget extends StatelessWidget {
  final UserPackageInfo? userPackageInfo;

  const QuickActionsWidget({super.key, this.userPackageInfo});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Check-in nổi bật - chiếm toàn bộ chiều rộng và cao gấp đôi
        _PrimaryActionCard(
          icon: Icons.qr_code_scanner_rounded,
          title: 'Check-in',
          subtitle: 'Quét QR để vào phòng tập',
          gradient: LinearGradient(
            colors: [AppColors.accent, Color(0xFF059669)], // Xanh lá nổi bật
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
        const SizedBox(height: 12),

        // Hàng 2: PT và Lịch sử (cùng màu xanh lá - workout related)
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: Icons.fitness_center_rounded,
                title: 'PT cá nhân',
                subtitle: 'Đặt lịch',
                gradient: LinearGradient(
                  colors: [
                    Color(0xFF10B981),
                    Color(0xFF34D399),
                  ], // Xanh lá nhạt
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
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
                subtitle: 'Check-in',
                gradient: LinearGradient(
                  colors: [Color(0xFF14B8A6), Color(0xFF2DD4BF)], // Teal
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () {
                  Navigator.pushNamed(context, '/checkin-history');
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Hàng 3: Nhắn tin (xanh dương - service/communication)
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: Icons.chat_bubble_rounded,
                title: 'Nhắn tin',
                subtitle: 'với PT',
                gradient: LinearGradient(
                  colors: [AppColors.secondary, AppColors.info], // Xanh dương
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ChatListScreen(),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            // Placeholder cho cân đối layout (có thể thêm action khác sau)
            Expanded(child: SizedBox()),
          ],
        ),
      ],
    );
  }
}

// Primary Action Card - Lớn hơn, nổi bật cho Check-in
class _PrimaryActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Gradient gradient;
  final VoidCallback onTap;

  const _PrimaryActionCard({
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
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: double.infinity,
        height: 120, // Cao gấp đôi so với card thường
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.accent.withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 8),
              spreadRadius: -2,
            ),
          ],
        ),
        child: Row(
          children: [
            // Icon lớn nổi bật
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.25),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: Colors.white, size: 36),
            ),
            const SizedBox(width: 16),
            // Text info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: Colors.white.withOpacity(0.9),
                      fontWeight: FontWeight.w500,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Arrow icon
            Icon(
              Icons.arrow_forward_ios_rounded,
              color: Colors.white.withOpacity(0.8),
              size: 20,
            ),
          ],
        ),
      ),
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
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 12,
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
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.25),
                borderRadius: BorderRadius.circular(12),
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
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11,
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
