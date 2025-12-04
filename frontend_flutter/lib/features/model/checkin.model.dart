import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';

final logger = Logger();

/// Model Checkin cho phía User (Flutter)
///
/// ⚠️ CHỈ CÓ CHỨC NĂNG READ-ONLY:
/// - ✅ Xem lịch sử checkin của chính mình
/// - ✅ Lấy thông tin checkin gần nhất
/// - ✅ Thống kê checkin (theo tuần, tháng, hôm nay)
/// - ✅ Kiểm tra đã checkin hôm nay chưa
///
/// ❌ KHÔNG CÓ CHỨC NĂNG:
/// - Tạo checkin (chỉ admin/staff có thể tạo khi quét QR)
/// - Sửa checkin
/// - Xóa checkin
class CheckinModel {
  String id;
  DateTime checkedAt;
  String locationId;
  String memberId;
  String memberName;
  String memberPhone;
  String packageId;
  String source; // 'QR' hoặc 'manual'
  DateTime? createdAt;
  DateTime? updatedAt;

  CheckinModel({
    this.id = '',
    DateTime? checkedAt,
    this.locationId = '',
    this.memberId = '',
    this.memberName = '',
    this.memberPhone = '',
    this.packageId = '',
    this.source = 'QR',
    this.createdAt,
    this.updatedAt,
  }) : checkedAt = checkedAt ?? DateTime.now();

  /// Tạo CheckinModel từ Firestore DocumentSnapshot
  factory CheckinModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return CheckinModel.fromMap(data, doc.id);
  }

  /// Tạo CheckinModel từ Map
  factory CheckinModel.fromMap(Map<String, dynamic> data, String docId) {
    return CheckinModel(
      id: docId,
      checkedAt: _parseDateTime(data['checkedAt']),
      locationId: data['locationId'] ?? '',
      memberId: data['memberId'] ?? '',
      memberName: data['memberName'] ?? '',
      memberPhone: data['memberPhone'] ?? '',
      packageId: data['packageId'] ?? '',
      source: data['source'] ?? 'QR',
      createdAt: _parseTimestamp(data['createdAt']),
      updatedAt: _parseTimestamp(data['updatedAt']),
    );
  }

  /// Parse DateTime từ nhiều định dạng khác nhau
  static DateTime _parseDateTime(dynamic value) {
    if (value == null) return DateTime.now();

    if (value is Timestamp) {
      return value.toDate();
    } else if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        logger.w('Không thể parse DateTime từ string: $value');
        return DateTime.now();
      }
    } else if (value is DateTime) {
      return value;
    }

    return DateTime.now();
  }

  /// Parse Timestamp từ Firestore
  static DateTime? _parseTimestamp(dynamic value) {
    if (value == null) return null;

    if (value is Timestamp) {
      return value.toDate();
    } else if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        logger.w('Không thể parse Timestamp từ string: $value');
        return null;
      }
    } else if (value is DateTime) {
      return value;
    }

    return null;
  }

  // ==================== STATIC METHODS (Read-Only User Actions) ====================

  /// Helper method: Lấy _id từ collection users
  /// @returns memberId (_id field) hoặc null nếu không tìm thấy
  static Future<String?> _getMemberId() async {
    try {
      // Lấy userId (document ID) từ SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      final userDocId = prefs.getString('userId');

      if (userDocId == null || userDocId.isEmpty) {
        logger.w('Không tìm thấy userId trong SharedPreferences');
        return null;
      }

      // Truy vấn collection users để lấy field _id
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userDocId)
          .get();

      if (!userDoc.exists) {
        logger.w('Không tìm thấy user document với ID: $userDocId');
        return null;
      }

      final userData = userDoc.data();
      final memberId = userData?['_id'] as String?;

      if (memberId == null || memberId.isEmpty) {
        logger.w('Không tìm thấy field _id trong user document');
        return null;
      }

      return memberId;
    } catch (e) {
      logger.e('Lỗi khi lấy memberId: $e');
      return null;
    }
  }

  /// Lấy lịch sử checkin của user hiện tại
  /// Trả về danh sách checkin được sắp xếp theo thời gian mới nhất
  static Future<List<CheckinModel>> getMyCheckinHistory({
    int limit = 20,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      // Lấy memberId (_id) từ users collection
      final memberId = await _getMemberId();
      if (memberId == null) {
        return [];
      }

      logger.i('Lấy lịch sử checkin cho memberId: $memberId');

      // Query checkins với memberId (_id)
      Query query = FirebaseFirestore.instance
          .collection('checkins')
          .where('memberId', isEqualTo: memberId)
          .orderBy('checkedAt', descending: true)
          .limit(limit);

      // Thêm filter theo date nếu có
      if (startDate != null) {
        query = query.where(
          'checkedAt',
          isGreaterThanOrEqualTo: Timestamp.fromDate(startDate),
        );
      }
      if (endDate != null) {
        query = query.where(
          'checkedAt',
          isLessThanOrEqualTo: Timestamp.fromDate(endDate),
        );
      }

      final snapshot = await query.get();

      final checkins = snapshot.docs
          .map((doc) => CheckinModel.fromFirestore(doc))
          .toList();

      logger.i('Lấy được ${checkins.length} checkin từ Firestore');
      return checkins;
    } catch (e) {
      logger.e('Lỗi khi lấy lịch sử checkin: $e');
      return [];
    }
  }

  /// Lấy thông tin checkin gần nhất của user
  static Future<CheckinModel?> getLastCheckin() async {
    try {
      // Lấy memberId (_id) từ users collection
      final memberId = await _getMemberId();
      if (memberId == null) {
        return null;
      }

      // Query checkin gần nhất
      final snapshot = await FirebaseFirestore.instance
          .collection('checkins')
          .where('memberId', isEqualTo: memberId)
          .orderBy('checkedAt', descending: true)
          .limit(1)
          .get();

      if (snapshot.docs.isEmpty) {
        logger.i('Chưa có checkin nào');
        return null;
      }

      return CheckinModel.fromFirestore(snapshot.docs.first);
    } catch (e) {
      logger.e('Lỗi khi lấy checkin gần nhất: $e');
      return null;
    }
  }

  /// Lấy số lần checkin trong tháng hiện tại
  static Future<int> getMonthlyCheckinCount() async {
    try {
      // Lấy memberId (_id) từ users collection
      final memberId = await _getMemberId();
      if (memberId == null) {
        return 0;
      }

      // Query checkin trong tháng - sử dụng local time
      final now = DateTime.now();
      final startOfMonth = DateTime(now.year, now.month, 1, 0, 0, 0);
      final endOfMonth = DateTime(now.year, now.month + 1, 0, 23, 59, 59, 999);

      logger.i(
        '[CheckinModel] Querying checkins from $startOfMonth to $endOfMonth',
      );

      try {
        // Thử query với range trước
        final snapshot = await FirebaseFirestore.instance
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
          '[CheckinModel] Found ${snapshot.docs.length} checkins this month',
        );
        return snapshot.docs.length;
      } catch (e) {
        // Fallback: lấy tất cả checkins và filter ở client
        logger.w(
          '[CheckinModel] Range query failed, using client-side filter: $e',
        );
        final allCheckins = await FirebaseFirestore.instance
            .collection('checkins')
            .where('memberId', isEqualTo: memberId)
            .get();

        final thisMonthCheckins = allCheckins.docs.where((doc) {
          final data = doc.data();
          final checkedAtValue = data['checkedAt'];
          DateTime? checkedAt;

          if (checkedAtValue is Timestamp) {
            checkedAt = checkedAtValue.toDate();
          } else if (checkedAtValue is String) {
            checkedAt = DateTime.tryParse(checkedAtValue);
          }

          if (checkedAt == null) return false;

          return checkedAt.isAfter(
                startOfMonth.subtract(const Duration(seconds: 1)),
              ) &&
              checkedAt.isBefore(endOfMonth.add(const Duration(seconds: 1)));
        }).length;

        logger.i(
          '[CheckinModel] Client-side filter found $thisMonthCheckins checkins',
        );
        return thisMonthCheckins;
      }
    } catch (e) {
      logger.e('Lỗi khi đếm checkin trong tháng: $e');
      return 0;
    }
  }

  /// Lấy số lần checkin trong tuần hiện tại
  static Future<int> getWeeklyCheckinCount() async {
    try {
      // Lấy memberId (_id) từ users collection
      final memberId = await _getMemberId();
      if (memberId == null) {
        return 0;
      }

      // Query checkin trong tuần - sử dụng local time
      final now = DateTime.now();
      final startOfWeek = now.subtract(Duration(days: now.weekday - 1));
      final startOfWeekDate = DateTime(
        startOfWeek.year,
        startOfWeek.month,
        startOfWeek.day,
        0,
        0,
        0,
      );
      final endOfWeek = startOfWeekDate
          .add(const Duration(days: 7))
          .subtract(const Duration(milliseconds: 1));

      try {
        final snapshot = await FirebaseFirestore.instance
            .collection('checkins')
            .where('memberId', isEqualTo: memberId)
            .where(
              'checkedAt',
              isGreaterThanOrEqualTo: Timestamp.fromDate(startOfWeekDate),
            )
            .where(
              'checkedAt',
              isLessThanOrEqualTo: Timestamp.fromDate(endOfWeek),
            )
            .get();

        return snapshot.docs.length;
      } catch (e) {
        // Fallback: client-side filter
        logger.w('[CheckinModel] Week range query failed, using client filter');
        final allCheckins = await FirebaseFirestore.instance
            .collection('checkins')
            .where('memberId', isEqualTo: memberId)
            .get();

        return allCheckins.docs.where((doc) {
          final data = doc.data();
          final checkedAtValue = data['checkedAt'];
          DateTime? checkedAt;

          if (checkedAtValue is Timestamp) {
            checkedAt = checkedAtValue.toDate();
          } else if (checkedAtValue is String) {
            checkedAt = DateTime.tryParse(checkedAtValue);
          }

          if (checkedAt == null) return false;

          return checkedAt.isAfter(
                startOfWeekDate.subtract(const Duration(seconds: 1)),
              ) &&
              checkedAt.isBefore(endOfWeek.add(const Duration(seconds: 1)));
        }).length;
      }
    } catch (e) {
      logger.e('Lỗi khi đếm checkin trong tuần: $e');
      return 0;
    }
  }

  /// Kiểm tra xem user đã checkin hôm nay chưa
  static Future<bool> hasCheckedInToday() async {
    try {
      // Lấy memberId (_id) từ users collection
      final memberId = await _getMemberId();
      if (memberId == null) {
        return false;
      }

      // Kiểm tra checkin hôm nay - sử dụng local time
      final now = DateTime.now();
      final startOfDay = DateTime(now.year, now.month, now.day, 0, 0, 0);
      final endOfDay = DateTime(now.year, now.month, now.day, 23, 59, 59, 999);

      try {
        final snapshot = await FirebaseFirestore.instance
            .collection('checkins')
            .where('memberId', isEqualTo: memberId)
            .where(
              'checkedAt',
              isGreaterThanOrEqualTo: Timestamp.fromDate(startOfDay),
            )
            .where(
              'checkedAt',
              isLessThanOrEqualTo: Timestamp.fromDate(endOfDay),
            )
            .limit(1)
            .get();

        return snapshot.docs.isNotEmpty;
      } catch (e) {
        // Fallback: client-side filter
        logger.w('[CheckinModel] Today query failed, using client filter');
        final allCheckins = await FirebaseFirestore.instance
            .collection('checkins')
            .where('memberId', isEqualTo: memberId)
            .get();

        return allCheckins.docs.any((doc) {
          final data = doc.data();
          final checkedAtValue = data['checkedAt'];
          DateTime? checkedAt;

          if (checkedAtValue is Timestamp) {
            checkedAt = checkedAtValue.toDate();
          } else if (checkedAtValue is String) {
            checkedAt = DateTime.tryParse(checkedAtValue);
          }

          if (checkedAt == null) return false;

          return checkedAt.year == now.year &&
              checkedAt.month == now.month &&
              checkedAt.day == now.day;
        });
      }
    } catch (e) {
      logger.e('Lỗi khi kiểm tra checkin hôm nay: $e');
      return false;
    }
  }

  /// Format thời gian checkin hiển thị cho user
  String getFormattedCheckinTime() {
    final now = DateTime.now();
    final difference = now.difference(checkedAt);

    if (difference.inMinutes < 1) {
      return 'Vừa xong';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes} phút trước';
    } else if (difference.inDays < 1) {
      return '${difference.inHours} giờ trước';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} ngày trước';
    } else {
      // Format: dd/MM/yyyy HH:mm
      return '${checkedAt.day.toString().padLeft(2, '0')}/${checkedAt.month.toString().padLeft(2, '0')}/${checkedAt.year} '
          '${checkedAt.hour.toString().padLeft(2, '0')}:${checkedAt.minute.toString().padLeft(2, '0')}';
    }
  }

  /// Format ngày checkin (chỉ ngày)
  String getFormattedDate() {
    return '${checkedAt.day.toString().padLeft(2, '0')}/${checkedAt.month.toString().padLeft(2, '0')}/${checkedAt.year}';
  }

  /// Format giờ checkin (chỉ giờ)
  String getFormattedTime() {
    return '${checkedAt.hour.toString().padLeft(2, '0')}:${checkedAt.minute.toString().padLeft(2, '0')}';
  }

  @override
  String toString() {
    return 'CheckinModel(id: $id, memberName: $memberName, checkedAt: $checkedAt, source: $source)';
  }
}
