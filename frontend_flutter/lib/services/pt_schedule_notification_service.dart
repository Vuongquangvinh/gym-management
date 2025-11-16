import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../features/model/contract.mode.dart';
import '../features/model/user.model.dart';
import '../features/notifications/models/notification_model.dart';
import 'notification_service.dart';

final _logger = Logger();

/// Service quản lý việc lên lịch thông báo cho các buổi tập PT
class PTScheduleNotificationService {
  static final PTScheduleNotificationService _instance =
      PTScheduleNotificationService._internal();
  factory PTScheduleNotificationService() => _instance;
  PTScheduleNotificationService._internal();

  final _notificationService = NotificationService();

  /// Tạo in-app notifications ngay lập tức cho các workout hôm nay
  Future<void> createTodayWorkoutNotifications() async {
    try {
      _logger.i('🔔 Kiểm tra các buổi tập hôm nay...');

      // Lấy user ID
      final userId = await UserModel.getMemberId();
      if (userId == null || userId.isEmpty) {
        _logger.w('⚠️ Không tìm thấy user ID');
        return;
      }

      // Kiểm tra đã tạo notifications hôm nay chưa bằng SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      final today = DateTime.now();
      final todayKey =
          'notifications_created_${userId}_${today.year}-${today.month}-${today.day}';

      if (prefs.getBool(todayKey) == true) {
        _logger.i('ℹ️ Đã tạo notifications hôm nay rồi, bỏ qua');
        return;
      }

      _logger.i('✅ Chưa có notification hôm nay, tiếp tục kiểm tra...');

      // Query contracts active
      final snapshot = await FirebaseFirestore.instance
          .collection('contracts')
          .where('userId', isEqualTo: userId)
          .where('status', whereIn: ['active', 'approved', 'paid'])
          .get();

      if (snapshot.docs.isEmpty) {
        _logger.i('ℹ️ Không có contract active');
        return;
      }

      _logger.i('📦 Tìm thấy ${snapshot.docs.length} contracts active');

      final now = DateTime.now();
      final todayDayOfWeek = now.weekday % 7;

      _logger.i(
        '📅 Hôm nay: ${_getDayName(todayDayOfWeek)} (dayOfWeek: $todayDayOfWeek)',
      );

      int created = 0;

      for (final doc in snapshot.docs) {
        final contract = ContractModel.fromFirestore(doc);

        // Lấy tên PT
        String ptName = 'PT';
        try {
          final ptDoc = await FirebaseFirestore.instance
              .collection('users')
              .doc(contract.ptId)
              .get();
          if (ptDoc.exists) {
            ptName = ptDoc.data()?['fullName'] ?? 'PT';
          }
        } catch (e) {
          _logger.w('⚠️ Không lấy được tên PT: $e');
        }

        // Kiểm tra từng slot xem có buổi nào hôm nay không
        for (final slot in contract.selectedTimeSlots) {
          _logger.d(
            '🔍 Checking slot: ${_getDayName(slot.dayOfWeek)} ${slot.startTime} (dayOfWeek: ${slot.dayOfWeek} vs today: $todayDayOfWeek)',
          );

          if (slot.dayOfWeek == todayDayOfWeek) {
            final dayName = _getDayName(slot.dayOfWeek);

            _logger.i(
              '🎯 Tìm thấy buổi tập hôm nay: $dayName ${slot.startTime}',
            );

            // Tạo notification trong Firestore ngay lập tức
            await NotificationModel.create(
              userId: contract.userId,
              title: '🏋️ Hôm nay có buổi tập với $ptName!',
              body:
                  '$dayName lúc ${slot.startTime} - ${slot.endTime}\nChuẩn bị tinh thần, trang phục và đồ tập nhé! 💪',
              type: 'pt_workout_today',
              data: {
                'contractId': contract.id,
                'dayOfWeek': slot.dayOfWeek,
                'startTime': slot.startTime,
                'endTime': slot.endTime,
              },
            );

            created++;
            _logger.d(
              '✅ Đã tạo notification cho buổi tập: $dayName ${slot.startTime}',
            );
          }
        }
      }

      if (created > 0) {
        _logger.i(
          '🎉 Đã tạo $created in-app notifications cho buổi tập hôm nay',
        );

        // Đánh dấu đã tạo notifications hôm nay
        final prefs = await SharedPreferences.getInstance();
        final today = DateTime.now();
        final todayKey =
            'notifications_created_${userId}_${today.year}-${today.month}-${today.day}';
        await prefs.setBool(todayKey, true);
        _logger.d('✅ Đã lưu flag: $todayKey');
      } else {
        _logger.i('ℹ️ Không có buổi tập nào hôm nay');
      }
    } catch (e) {
      _logger.e('❌ Lỗi khi tạo today notifications: $e');
    }
  }

  /// Lên lịch thông báo cho tất cả contracts active của user
  Future<void> scheduleAllWorkoutNotifications() async {
    try {
      _logger.i('📋 Bắt đầu lên lịch thông báo cho các buổi tập...');

      // Lấy user ID
      final userId = await UserModel.getMemberId();
      if (userId == null || userId.isEmpty) {
        _logger.w('⚠️ Không tìm thấy user ID, bỏ qua lên lịch thông báo');
        return;
      }

      // Lấy danh sách notification đang pending
      final pending = await _notificationService.getPendingNotifications();
      final pendingIds = pending.map((e) => e.id).toSet();

      _logger.i('🔍 Pending IDs hiện tại: $pendingIds');
      _logger.i('📊 Tổng số pending: ${pendingIds.length}');

      // Query tất cả contracts active của user
      final snapshot = await FirebaseFirestore.instance
          .collection('contracts')
          .where('userId', isEqualTo: userId)
          .where('status', whereIn: ['active', 'approved', 'paid'])
          .get();

      if (snapshot.docs.isEmpty) {
        _logger.i('ℹ️ User không có contract nào đang active');
        return;
      }

      _logger.i('📦 Tìm thấy ${snapshot.docs.length} contracts active');

      int totalScheduled = 0;

      // Lên lịch thông báo cho từng contract
      for (final doc in snapshot.docs) {
        final contract = ContractModel.fromFirestore(doc);
        final scheduled = await _scheduleNotificationsForContract(
          contract,
          pendingIds,
        );
        totalScheduled += scheduled;
      }

      _logger.i('✅ Đã lên lịch $totalScheduled thông báo mới');

      // Verify pending notifications sau khi schedule
      final finalPending = await _notificationService.getPendingNotifications();
      _logger.i('📅 Tổng số pending notifications: ${finalPending.length}');
    } catch (e) {
      _logger.e('❌ Lỗi khi lên lịch thông báo: $e');
    }
  }

  /// Lên lịch thông báo cho một contract cụ thể
  Future<int> _scheduleNotificationsForContract(
    ContractModel contract, [
    Set<int>? pendingIds,
  ]) async {
    int scheduled = 0;
    try {
      // Lấy thông tin PT name (nếu cần)
      String ptName = 'PT';
      try {
        final ptDoc = await FirebaseFirestore.instance
            .collection('users')
            .doc(contract.ptId)
            .get();
        if (ptDoc.exists) {
          ptName = ptDoc.data()?['fullName'] ?? 'PT';
        }
      } catch (e) {
        _logger.w('⚠️ Không lấy được tên PT: $e');
      }

      // Lên lịch cho từng time slot chỉ cho ngày hôm nay
      final now = DateTime.now();
      final todayDayOfWeek = now.weekday % 7; // 0=CN, 1=T2, ...
      for (final slot in contract.selectedTimeSlots) {
        if (slot.dayOfWeek == todayDayOfWeek) {
          final didSchedule = await _scheduleNotificationForTimeSlot(
            contract: contract,
            slot: slot,
            ptName: ptName,
            pendingIds: pendingIds,
          );
          if (didSchedule) scheduled++;
        }
      }
      _logger.i(
        '✓ Contract ${contract.id}: Đã lên lịch $scheduled thông báo mới',
      );
    } catch (e) {
      _logger.e('❌ Lỗi khi lên lịch cho contract ${contract.id}: $e');
    }
    return scheduled;
  }

  /// Lên lịch thông báo cho một time slot cụ thể
  Future<bool> _scheduleNotificationForTimeSlot({
    required ContractModel contract,
    required SelectedTimeSlot slot,
    required String ptName,
    Set<int>? pendingIds,
  }) async {
    try {
      // Parse start time
      final timeParts = slot.startTime.split(':');
      final hour = int.parse(timeParts[0]);
      final minute = int.parse(timeParts[1]);

      // Tạo notification ID unique
      final notificationId = _generateNotificationId(
        contract.id,
        slot.dayOfWeek,
        hour,
        minute,
      );

      // Nếu đã có trong pending thì bỏ qua
      if (pendingIds != null && pendingIds.contains(notificationId)) {
        _logger.d('⏩ Bỏ qua notification đã tồn tại ID: $notificationId');
        return false;
      }

      _logger.i('➕ Schedule notification mới ID: $notificationId');

      // Tên ngày
      final dayName = _getDayName(slot.dayOfWeek);
      // Tính toán ngày tiếp theo có buổi tập
      final nextWorkoutDate = _getNextWorkoutDate(slot.dayOfWeek, hour, minute);
      if (nextWorkoutDate.isAfter(DateTime.now())) {
        final notificationTime = nextWorkoutDate.subtract(
          const Duration(days: 1),
        );
        if (notificationTime.isAfter(DateTime.now())) {
          await _notificationService.scheduleNotification(
            id: notificationId,
            title: '🏋️ Nhắc nhở: Hôm nay có buổi tập với $ptName!',
            body:
                '$dayName lúc ${slot.startTime} - ${slot.endTime}\nChuẩn bị tinh thần, trang phục và đồ tập nhé! 💪',
            scheduledTime: notificationTime,
            payload: 'contract:${contract.id}',
          );
          await NotificationModel.create(
            userId: contract.userId,
            title: '🏋️ Nhắc nhở: Hôm nay có buổi tập với $ptName!',
            body:
                '$dayName lúc ${slot.startTime} - ${slot.endTime}\nChuẩn bị tinh thần, trang phục và đồ tập nhé! 💪',
            type: 'pt_schedule',
            data: {
              'contractId': contract.id,
              'dayOfWeek': slot.dayOfWeek,
              'startTime': slot.startTime,
              'endTime': slot.endTime,
              'scheduledTime': notificationTime.toIso8601String(),
            },
          );
          _logger.d(
            '📅 Scheduled: $dayName ${slot.startTime} → Thông báo lúc $notificationTime',
          );
          return true;
        }
      }
      return false;
    } catch (e) {
      _logger.e('❌ Lỗi lên lịch thông báo cho slot: $e');
      return false;
    }
  }

  /// Tạo notification ID duy nhất từ contract và time slot
  int _generateNotificationId(
    String contractId,
    int dayOfWeek,
    int hour,
    int minute,
  ) {
    // Tạo ID nhỏ hơn để fit trong 32-bit
    // Range: [-2^31, 2^31 - 1] = [-2147483648, 2147483647]
    final contractHash =
        contractId.hashCode.abs() % 10000; // Giảm xuống 4 digits
    final timeCode = dayOfWeek * 10000 + hour * 100 + minute;
    final id = contractHash * 1000000 + timeCode;

    // Ensure it's within 32-bit range
    return id % 2147483647;
  }

  /// Tính toán ngày tiếp theo có buổi tập
  DateTime _getNextWorkoutDate(int targetDayOfWeek, int hour, int minute) {
    final now = DateTime.now();
    int daysToAdd = 0;

    // Flutter: 1 = Monday, 7 = Sunday
    // Our model: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    int currentDayOfWeek = now.weekday % 7; // Convert to 0-6

    if (currentDayOfWeek == targetDayOfWeek) {
      // Cùng ngày, kiểm tra giờ
      final workoutTime = DateTime(now.year, now.month, now.day, hour, minute);
      if (workoutTime.isAfter(now)) {
        daysToAdd = 0; // Hôm nay
      } else {
        daysToAdd = 7; // Tuần sau
      }
    } else if (targetDayOfWeek > currentDayOfWeek) {
      daysToAdd = targetDayOfWeek - currentDayOfWeek;
    } else {
      daysToAdd = 7 - (currentDayOfWeek - targetDayOfWeek);
    }

    return DateTime(now.year, now.month, now.day + daysToAdd, hour, minute);
  }

  /// Convert dayOfWeek number sang tên tiếng Việt
  String _getDayName(int dayOfWeek) {
    switch (dayOfWeek) {
      case 0:
        return 'Chủ nhật';
      case 1:
        return 'Thứ 2';
      case 2:
        return 'Thứ 3';
      case 3:
        return 'Thứ 4';
      case 4:
        return 'Thứ 5';
      case 5:
        return 'Thứ 6';
      case 6:
        return 'Thứ 7';
      default:
        return 'Không xác định';
    }
  }

  /// Hủy tất cả thông báo của một contract
  Future<void> cancelContractNotifications(ContractModel contract) async {
    try {
      for (final slot in contract.selectedTimeSlots) {
        final timeParts = slot.startTime.split(':');
        final hour = int.parse(timeParts[0]);
        final minute = int.parse(timeParts[1]);

        final notificationId = _generateNotificationId(
          contract.id,
          slot.dayOfWeek,
          hour,
          minute,
        );

        await _notificationService.cancelNotification(notificationId);
      }

      _logger.i('❌ Đã hủy tất cả thông báo của contract ${contract.id}');
    } catch (e) {
      _logger.e('❌ Lỗi khi hủy thông báo contract: $e');
    }
  }

  /// Xóa tất cả pending notifications trên thiết bị
  Future<void> cancelAllPendingNotifications() async {
    await _notificationService.cancelAllNotifications();
    _logger.i('❌ Đã xóa toàn bộ pending notifications');
  }

  /// Kiểm tra và hiển thị thông báo cho buổi tập sắp tới (trong vòng 1 giờ)
  Future<void> checkUpcomingWorkouts() async {
    try {
      final userId = await UserModel.getMemberId();
      if (userId == null || userId.isEmpty) return;

      final now = DateTime.now();
      final oneHourLater = now.add(const Duration(hours: 1));

      final snapshot = await FirebaseFirestore.instance
          .collection('contracts')
          .where('userId', isEqualTo: userId)
          .where('status', whereIn: ['active', 'approved', 'paid'])
          .get();

      for (final doc in snapshot.docs) {
        final contract = ContractModel.fromFirestore(doc);
        final currentDayOfWeek = now.weekday % 7;

        for (final slot in contract.selectedTimeSlots) {
          if (slot.dayOfWeek == currentDayOfWeek) {
            final timeParts = slot.startTime.split(':');
            final workoutTime = DateTime(
              now.year,
              now.month,
              now.day,
              int.parse(timeParts[0]),
              int.parse(timeParts[1]),
            );

            // Nếu buổi tập trong vòng 1 giờ tới
            if (workoutTime.isAfter(now) &&
                workoutTime.isBefore(oneHourLater)) {
              await _notificationService.showNotification(
                id: DateTime.now().millisecondsSinceEpoch,
                title: '⏰ Buổi tập sắp bắt đầu!',
                body:
                    'Lúc ${slot.startTime} - ${slot.endTime}\nChuẩn bị đi đến phòng tập nhé! 🏃',
                payload: 'contract:${contract.id}',
              );

              _logger.i(
                '🔔 Hiển thị thông báo cho buổi tập lúc ${slot.startTime}',
              );
            }
          }
        }
      }
    } catch (e) {
      _logger.e('❌ Lỗi khi kiểm tra buổi tập sắp tới: $e');
    }
  }

  /// Demo: Xóa toàn bộ pending notification và lên lịch lại
  Future<void> demoResetAndReschedule() async {
    await cancelAllPendingNotifications();
    await scheduleAllWorkoutNotifications();
    _logger.i('🔄 Đã xóa và lên lịch lại toàn bộ notification!');
  }
}
