import 'package:cloud_firestore/cloud_firestore.dart';

/// User info embedded in contract
class PTUserInfo {
  final String? id;
  final String? email;
  final String? phone;
  final String? phoneNumber; // phone_number field
  final String? photoURL;
  final String? avatar;

  PTUserInfo({
    this.id,
    this.email,
    this.phone,
    this.phoneNumber,
    this.photoURL,
    this.avatar,
  });

  factory PTUserInfo.fromJson(Map<String, dynamic> json) {
    return PTUserInfo(
      id: json['id'] ?? json['_id'],
      email: json['email'],
      phone: json['phone'],
      phoneNumber: json['phone_number'],
      photoURL: json['photoURL'],
      avatar: json['avatar'],
    );
  }
}

/// Package info embedded in contract
class PTPackageInfo {
  final String? id;
  final String? name;

  PTPackageInfo({this.id, this.name});

  factory PTPackageInfo.fromJson(Map<String, dynamic> json) {
    return PTPackageInfo(id: json['id'] ?? json['_id'], name: json['name']);
  }
}

/// Weekly schedule slot
class WeeklyScheduleSlot {
  final String startTime;
  final String endTime;

  WeeklyScheduleSlot({required this.startTime, required this.endTime});

  factory WeeklyScheduleSlot.fromJson(Map<String, dynamic> json) {
    return WeeklyScheduleSlot(
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
    );
  }

  String get timeSlot => '$startTime - $endTime';
}

/// Weekly schedule
class WeeklySchedule {
  final Map<int, WeeklyScheduleSlot> schedule; // key: 1-7 (Mon-Sun)

  WeeklySchedule({required this.schedule});

  factory WeeklySchedule.fromJson(Map<String, dynamic> json) {
    // Firestore data trực tiếp là Map<int, slot>, không có nested 'schedule'
    final Map<int, WeeklyScheduleSlot> parsedSchedule = {};

    json.forEach((key, value) {
      final dayOfWeek = int.tryParse(key);
      if (dayOfWeek != null && value is Map<String, dynamic>) {
        parsedSchedule[dayOfWeek] = WeeklyScheduleSlot.fromJson(value);
      }
    });

    return WeeklySchedule(schedule: parsedSchedule);
  }
}

/// Contract info
class PTContract {
  final String? id;
  final PTPackageInfo? packageId;
  final int sessionsRemaining;
  final String status;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? notes;
  final WeeklySchedule? weeklySchedule;
  final num? paymentAmount;

  PTContract({
    this.id,
    this.packageId,
    this.sessionsRemaining = 0,
    this.status = 'active',
    this.startDate,
    this.endDate,
    this.notes,
    this.weeklySchedule,
    this.paymentAmount,
  });

  factory PTContract.fromJson(Map<String, dynamic> json) {
    return PTContract(
      id: json['_id'] ?? json['id'],
      packageId: json['packageId'] != null
          ? PTPackageInfo.fromJson(json['packageId'])
          : null,
      sessionsRemaining: json['sessionsRemaining'] ?? 0,
      status: json['status'] ?? 'active',
      startDate: _parseTimestamp(json['startDate']),
      endDate: _parseTimestamp(json['endDate']),
      notes: json['notes'],
      weeklySchedule: json['weeklySchedule'] != null
          ? WeeklySchedule.fromJson(json['weeklySchedule'])
          : null,
      paymentAmount: json['paymentAmount'],
    );
  }

  static DateTime? _parseTimestamp(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is Map && value.containsKey('_seconds')) {
      return DateTime.fromMillisecondsSinceEpoch(
        (value['_seconds'] as int) * 1000,
      );
    }
    if (value is String) {
      return DateTime.tryParse(value);
    }
    return null;
  }
}

/// Contract with user info
class PTContractWithUser {
  final String userName;
  final PTUserInfo? user;
  final PTContract? contract;

  PTContractWithUser({required this.userName, this.user, this.contract});

  factory PTContractWithUser.fromJson(Map<String, dynamic> json) {
    return PTContractWithUser(
      userName: json['userName'] ?? 'N/A',
      user: json['user'] != null ? PTUserInfo.fromJson(json['user']) : null,
      contract: json['contract'] != null
          ? PTContract.fromJson(json['contract'])
          : null,
    );
  }
}

/// Member schedule for a specific day
class PTMemberSchedule {
  final String fullName;
  final String startTime;
  final String endTime;
  final PTUserInfo? user;
  final PTContract? contract;

  PTMemberSchedule({
    required this.fullName,
    required this.startTime,
    required this.endTime,
    this.user,
    this.contract,
  });

  String get timeSlot => '$startTime - $endTime';
}

/// Time slot group
class TimeSlotGroup {
  final String timeSlot;
  final List<PTMemberSchedule> members;

  TimeSlotGroup({required this.timeSlot, required this.members});
}

/// Day statistics
class DayStatistics {
  final int total;
  final int expired;
  final int totalTimeSlots;
  final int remainingTimeSlots;

  DayStatistics({
    required this.total,
    required this.expired,
    required this.totalTimeSlots,
    required this.remainingTimeSlots,
  });
}
