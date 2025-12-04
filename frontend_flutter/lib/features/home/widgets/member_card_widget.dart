import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import '../../model/user.model.dart';
import 'package:logger/logger.dart';

final logger = Logger();

class MemberCardWidget extends StatelessWidget {
  final String memberName;
  final String cardType;
  final String expiryDate;
  final bool isActive;
  final VoidCallback onScanQR;

  const MemberCardWidget({
    super.key,
    required this.memberName,
    required this.cardType,
    required this.expiryDate,
    required this.isActive,
    required this.onScanQR,
  });

  Future<void> _navigateToPackageDetail(BuildContext context) async {
    // Bỏ chặn: luôn cho phép vào màn hình package_screen để đăng ký hoặc gia hạn gói tập
    // Lấy userId từ UserModel (giả sử có hàm async getCurrentUserId)
    try {
      final userId = await UserModel.getMemberId();
      if (userId == null || userId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Không thể lấy thông tin người dùng'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      Navigator.pushNamed(
        context,
        '/packageMember',
        arguments: {'userId': userId},
      );
    } catch (e) {
      logger.e('Lỗi khi lấy userId: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không thể lấy thông tin người dùng'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // Tính số ngày còn lại
  int _calculateDaysRemaining() {
    try {
      final parts = expiryDate.split('/');
      if (parts.length == 3) {
        final day = int.parse(parts[0]);
        final month = int.parse(parts[1]);
        final year = int.parse(parts[2]);
        final expiry = DateTime(year, month, day);
        final now = DateTime.now();
        final difference = expiry.difference(now).inDays;
        return difference > 0 ? difference : 0;
      }
    } catch (e) {
      logger.e('Lỗi tính ngày còn lại: $e');
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final daysRemaining = _calculateDaysRemaining();
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () => _navigateToPackageDetail(context),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          // Glassmorphism effect - nền trong suốt, hiện đại
          color: isDarkMode
              ? Colors.white.withOpacity(0.05)
              : Colors.white.withOpacity(0.9),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDarkMode
                ? Colors.white.withOpacity(0.1)
                : AppColors.primary.withOpacity(0.2),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
              spreadRadius: -4,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header compact với icon và status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Icon nhỏ gọn hơn
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryLight],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.card_membership_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                // Status badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: isActive
                        ? AppColors.success.withOpacity(0.15)
                        : AppColors.error.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isActive ? AppColors.success : AppColors.error,
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: isActive ? AppColors.success : AppColors.error,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        isActive ? 'Hoạt động' : 'Hết hạn',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: isActive ? AppColors.success : AppColors.error,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Member name - giữ nổi bật
            Text(
              memberName,
              style: GoogleFonts.inter(
                fontSize: 19,
                fontWeight: FontWeight.bold,
                color: isDarkMode ? Colors.white : AppColors.textPrimaryLight,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 4),

            // Card type - nhỏ gọn hơn
            Text(
              cardType,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: isDarkMode
                    ? Colors.white70
                    : AppColors.textSecondaryLight,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),

            // Row chứa HSD và Days remaining
            Row(
              children: [
                // Expiry date
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: isDarkMode
                        ? AppColors.primary.withOpacity(0.15)
                        : AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.schedule_rounded,
                        color: AppColors.primary,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'HSD: $expiryDate',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                // Days remaining - Thông tin động lực
                if (isActive && daysRemaining > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.accent.withOpacity(0.15),
                          AppColors.success.withOpacity(0.15),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppColors.accent.withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.trending_up_rounded,
                          color: AppColors.accent,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Còn $daysRemaining ngày',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppColors.accent,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
