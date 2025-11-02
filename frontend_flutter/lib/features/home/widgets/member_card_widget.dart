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
    try {
      // Hiển thị loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      // Gọi method từ UserModel để lấy thông tin user kèm package
      final userPackageInfo = await UserModel.getCurrentUserWithPackage();

      Navigator.pop(context); // Đóng loading

      if (userPackageInfo == null) {
        _showError(context, 'Không tìm thấy thông tin người dùng');
        return;
      }

      if (userPackageInfo.package == null) {
        _showError(context, 'Bạn chưa đăng ký gói tập nào');
        return;
      }

      // Navigate với userId
      Navigator.pushNamed(
        context,
        '/packageMember',
        arguments: {'userId': userPackageInfo.user.id},
      );
    } catch (e) {
      Navigator.pop(context); // Đóng loading nếu có
      logger.e('Lỗi khi lấy thông tin package: $e');
      _showError(context, 'Có lỗi xảy ra: ${e.toString()}');
    }
  }

  void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _navigateToPackageDetail(context),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.primary, AppColors.primaryLight],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 10),
              spreadRadius: -5,
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(Icons.card_membership, color: Colors.white, size: 32),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    memberName,
                    style: GoogleFonts.montserrat(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    cardType,
                    style: GoogleFonts.montserrat(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        color: Colors.white70,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          'HSD: $expiryDate',
                          style: GoogleFonts.montserrat(
                            fontSize: 13,
                            color: Colors.white70,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Container(
                      //   padding: const EdgeInsets.symmetric(
                      //     horizontal: 10,
                      //     vertical: 4,
                      //   ),
                      //   decoration: BoxDecoration(
                      //     color: isActive
                      //         ? Colors.white
                      //         : Colors.white.withOpacity(0.9),
                      //     borderRadius: BorderRadius.circular(12),
                      //     border: Border.all(
                      //       color: isActive
                      //           ? AppColors.success
                      //           : AppColors.error,
                      //       width: 1.5,
                      //     ),
                      //   ),
                      //   child: Text(
                      //     isActive ? 'Hoạt động' : 'Hết hạn',
                      //     style: GoogleFonts.montserrat(
                      //       fontSize: 11,
                      //       color: isActive
                      //           ? AppColors.success
                      //           : AppColors.error,
                      //       fontWeight: FontWeight.w700,
                      //     ),
                      //   ),
                      // ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
          ],
        ),
      ),
    );  
  }
}
