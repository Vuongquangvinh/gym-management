import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import "package:cloud_firestore/cloud_firestore.dart";
import '../../../theme/colors.dart';
import "package:logger/logger.dart";

final logger = Logger();

/// Widget hiển thị thống kê nhanh và lịch hẹn sắp tới
class StatsSummaryWidget extends StatelessWidget {
  // Lấy _id từ document ID trong users collection
  Future<String?> get_idFromUserId(String userId) async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get();
      if (doc.exists && doc.data() != null) {
        final memberId = doc.data()!['_id'] as String?;
        logger.i('[StatsSummaryWidget] UserId: $userId -> _id: $memberId');
        return memberId;
      }
    } catch (e) {
      logger.e('[StatsSummaryWidget] Error getting _id from userId: $e');
    }
    return null;
  }

  Future<int> getCheckinCountByMemberId(String memberId) async {
    try {
      // Sử dụng local time - đơn giản và nhất quán
      final now = DateTime.now();
      final startOfMonth = DateTime(now.year, now.month, 1, 0, 0, 0);
      final endOfMonth = DateTime(now.year, now.month + 1, 0, 23, 59, 59, 999);

      logger.i(
        '[StatsSummaryWidget] Querying checkins from $startOfMonth to $endOfMonth',
      );

      // Server-side query
      try {
        final rangeQuery = await FirebaseFirestore.instance
            .collection('checkins')
            .where('memberId', isEqualTo: memberId)
            .where(
              'checkedAt',
              isGreaterThanOrEqualTo: Timestamp.fromDate(startOfMonth),
            )
            .where(
              'checkedAt',
              isLessThanOrEqualTo: Timestamp.fromDate(endOfMonth),
            )
            .get();

        logger.i(
          '[StatsSummaryWidget] Checkin count: ${rangeQuery.docs.length}',
        );
        return rangeQuery.docs.length;
      } catch (e) {
        logger.w(
          '[StatsSummaryWidget] Range query failed, using client filter: $e',
        );
      }

      // Fallback: client-side filtering (bao gồm offline cache)
      final query = await FirebaseFirestore.instance
          .collection('checkins')
          .where('memberId', isEqualTo: memberId)
          .get(const GetOptions(source: Source.cache)); // Lấy từ cache offline

      logger.i(
        '[StatsSummaryWidget] Total cached checkins: ${query.docs.length}',
      );

      // Log một vài checkin để debug
      if (query.docs.isNotEmpty) {
        for (
          var i = 0;
          i < (query.docs.length > 3 ? 3 : query.docs.length);
          i++
        ) {
          final doc = query.docs[i];
          final data = doc.data();
          logger.i(
            '[StatsSummaryWidget] Sample checkin #$i: checkedAt=${data['checkedAt']}',
          );
        }
      }

      final checkinThisMonth = query.docs.where((doc) {
        final data = doc.data();
        final checkedAtValue = data['checkedAt'];
        DateTime? checkedAt;

        if (checkedAtValue is Timestamp) {
          checkedAt = checkedAtValue.toDate();
        } else if (checkedAtValue is String) {
          checkedAt = DateTime.tryParse(checkedAtValue);
        } else if (checkedAtValue is DateTime) {
          checkedAt = checkedAtValue;
        }

        if (checkedAt == null) return false;

        final isInRange =
            checkedAt.isAfter(
              startOfMonth.subtract(const Duration(seconds: 1)),
            ) &&
            checkedAt.isBefore(endOfMonth.add(const Duration(seconds: 1)));

        if (isInRange) {
          logger.i('[StatsSummaryWidget] ✓ Matched checkin: $checkedAt');
        }

        return isInRange;
      }).length;

      logger.i('[StatsSummaryWidget] Client-side count: $checkinThisMonth');
      return checkinThisMonth;
    } catch (e) {
      logger.e('[StatsSummaryWidget] Error: $e');
      return 0;
    }
  }

  Future<String?> getUserCustomId() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        logger.i("[StatsSummaryWidget] Firebase Auth UID: ${user.uid}");
        logger.i("[StatsSummaryWidget] Firebase Auth Email: ${user.email}");

        // Query user document bằng email thay vì UID
        final querySnapshot = await FirebaseFirestore.instance
            .collection('users')
            .where('email', isEqualTo: user.email)
            .limit(1)
            .get();

        if (querySnapshot.docs.isNotEmpty) {
          final doc = querySnapshot.docs.first;
          final data = doc.data();
          logger.i("[StatsSummaryWidget] Document data: $data");
          final customId = data['_id'] as String?;
          logger.i("[StatsSummaryWidget] Firestore _id: $customId");
          return customId;
        } else {
          logger.w(
            "[StatsSummaryWidget] Không tìm thấy user với email: ${user.email}",
          );
        }
      } else {
        logger.w("[StatsSummaryWidget] User chưa đăng nhập");
      }
    } catch (e) {
      logger.e('[StatsSummaryWidget] Error getting custom _id: $e');
    }
    return null;
  }

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

    // Nếu userId được truyền vào, dùng trực tiếp
    if (userId != null) {
      logger.i("StatsSummaryWidget: Dùng userId từ props: $userId");
      // Bước 1: Lấy _id (memberId) từ userId
      return FutureBuilder<String?>(
        future: get_idFromUserId(userId!),
        builder: (context, memberIdSnap) {
          if (memberIdSnap.connectionState == ConnectionState.waiting) {
            return const SizedBox.shrink();
          }
          final memberId = memberIdSnap.data;
          if (memberId == null) {
            logger.w("Không lấy được memberId từ userId: $userId");
            return const SizedBox.shrink();
          }
          // Bước 2: Dùng memberId để đếm checkins
          return FutureBuilder<int>(
            future: getCheckinCountByMemberId(memberId),
            builder: (context, checkinSnap) {
              final checkinCount = checkinSnap.data ?? 0;
              return _buildStatsContent(isDarkMode, checkinCount);
            },
          );
        },
      );
    }

    // Fallback: query Firestore nếu không có userId
    return FutureBuilder<String?>(
      future: getUserCustomId(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox.shrink();
        }
        final customId = snapshot.data;
        if (customId == null) {
          logger.w("Không lấy được _id Firestore cho user hiện tại");
          return const SizedBox.shrink();
        }
        // customId ở đây là _id (memberId) rồi, dùng trực tiếp
        return FutureBuilder<int>(
          future: getCheckinCountByMemberId(customId),
          builder: (context, checkinSnap) {
            final checkinCount = checkinSnap.data ?? 0;
            logger.i(
              "Checkin count tháng này cho memberId $customId: $checkinCount",
            );
            return _buildStatsContent(isDarkMode, checkinCount);
          },
        );
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
