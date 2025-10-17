import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import 'package:qr_flutter/qr_flutter.dart';

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

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(
          context,
          '/packageMember',
          arguments: {
            'memberName': memberName,
            'cardType': cardType,
            'expiryDate': expiryDate,
            'isActive': isActive,
          },
        );
      },
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
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isActive
                              ? Colors.white
                              : Colors.white.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isActive
                                ? AppColors.success
                                : AppColors.error,
                            width: 1.5,
                          ),
                        ),
                        child: Text(
                          isActive ? 'Hoạt động' : 'Hết hạn',
                          style: GoogleFonts.montserrat(
                            fontSize: 11,
                            color: isActive
                                ? AppColors.success
                                : AppColors.error,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Container(
              // Không viền, không boxShadow, chỉ QR nổi bật
              color: Colors.transparent,
              child: QrImageView(
                data: memberName, // hoặc dữ liệu bạn muốn mã hóa
                version: QrVersions.auto,
                size: 90, // Tăng kích thước QR
                gapless: false,
                backgroundColor: Colors.transparent,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: Color(0xFF1565C0), // màu chủ đạo
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: Color(0xFF1976D2), // màu chủ đạo
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
