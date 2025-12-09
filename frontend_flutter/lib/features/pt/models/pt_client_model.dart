import 'package:cloud_firestore/cloud_firestore.dart';

/// Model để map dữ liệu học viên của PT
class PTClientModel {
  final String contractId;
  final String userId;
  final String userName;
  final String userEmail;
  final String userPhone;
  final String packageId;
  final String packageName;
  final String packageType; // 'monthly' hoặc 'sessions'
  final int sessionsTotal;
  final int sessionsRemaining;
  final String
  status; // 'pending_payment', 'paid', 'active', 'completed', 'cancelled'
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? createdAt;
  final Map<String, dynamic>? weeklySchedule;

  PTClientModel({
    required this.contractId,
    required this.userId,
    required this.userName,
    required this.userEmail,
    required this.userPhone,
    required this.packageId,
    required this.packageName,
    required this.packageType,
    required this.sessionsTotal,
    required this.sessionsRemaining,
    required this.status,
    this.startDate,
    this.endDate,
    this.createdAt,
    this.weeklySchedule,
  });

  /// Parse từ API response
  factory PTClientModel.fromMap(Map<String, dynamic> map) {
    return PTClientModel(
      contractId: map['contractId'] ?? '',
      userId: map['user']?['id'] ?? map['user']?['_id'] ?? '',
      userName: map['userName'] ?? 'N/A',
      userEmail: map['userEmail'] ?? 'N/A',
      userPhone: map['userPhone'] ?? 'N/A',
      packageId: map['package']?['id'] ?? '',
      packageName: map['packageName'] ?? 'N/A',
      packageType: map['packageType'] ?? 'sessions',
      sessionsTotal: map['sessionsTotal'] ?? 0,
      sessionsRemaining: map['sessionsRemaining'] ?? 0,
      status: map['status'] ?? 'pending_payment',
      startDate: _parseTimestamp(map['startDate']),
      endDate: _parseTimestamp(map['endDate']),
      createdAt: _parseTimestamp(map['createdAt']),
      weeklySchedule: map['weeklySchedule'] as Map<String, dynamic>?,
    );
  }

  /// Helper: Parse timestamp
  static DateTime? _parseTimestamp(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is Map && value.containsKey('_seconds')) {
      return DateTime.fromMillisecondsSinceEpoch(value['_seconds'] * 1000);
    }
    return null;
  }

  /// Get status text in Vietnamese
  String get statusText {
    switch (status) {
      case 'pending_payment':
        return 'Chờ thanh toán';
      case 'paid':
        return 'Đã thanh toán';
      case 'active':
        return 'Đang hoạt động';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  /// Get package type text in Vietnamese
  String get packageTypeText {
    return packageType == 'monthly' ? 'Tháng' : 'Buổi';
  }

  /// Check if contract is active
  bool get isActive => status == 'active';

  /// Get formatted date range
  String get dateRange {
    if (startDate == null || endDate == null) return 'N/A';
    final start = _formatDate(startDate!);
    final end = _formatDate(endDate!);
    return '$start - $end';
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  /// Get user initials for avatar
  String get userInitials {
    if (userName == 'N/A' || userName.isEmpty) return '--';
    final parts = userName.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
    }
    return userName.substring(0, 1).toUpperCase();
  }
}
