import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF667EEA), const Color(0xFF764BA2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF667EEA).withOpacity(0.3),
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
                  // Phần này được fix để tránh overflow
                  children: [
                    Icon(Icons.calendar_today, color: Colors.white70, size: 16),
                    const SizedBox(width: 4),
                    Expanded(
                      // Thêm Expanded để text co giãn nếu cần
                      child: Text(
                        'HSD: $expiryDate',
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          color: Colors.white70,
                        ),
                        overflow: TextOverflow.ellipsis, // Cắt ngắn nếu tràn
                        maxLines: 1,
                      ),
                    ),
                    const SizedBox(
                      width: 8,
                    ), // Giảm từ 12 xuống 8 để tiết kiệm space
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
                              ? const Color(0xFF4CAF50)
                              : const Color(0xFFFF5252),
                          width: 1.5,
                        ),
                      ),
                      child: Text(
                        isActive ? 'Hoạt động' : 'Hết hạn',
                        style: GoogleFonts.montserrat(
                          fontSize: 11,
                          color: isActive
                              ? const Color(0xFF4CAF50)
                              : const Color(0xFFFF5252),
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
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: onScanQR,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Icon(
                    Icons.qr_code_scanner,
                    color: const Color(0xFF667EEA),
                    size: 24,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
