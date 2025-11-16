import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';
import '../../model/ptPackage.mode.dart';

final _logger = Logger();

/// Service để quản lý việc update lịch tập trong contract
class ContractScheduleService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Lấy tất cả timeSlotIds đã được đăng ký bởi các contracts khác
  /// (không bao gồm contract hiện tại)
  ///
  /// Return: Set<String> - Danh sách timeSlotId đã bị book
  Future<Set<String>> getBookedTimeSlots({
    required String ptId,
    required String currentContractId,
  }) async {
    try {
      _logger.i('🔍 Đang tìm tất cả time slots đã được book...');
      _logger.d('PT ID: $ptId');
      _logger.d('Current Contract ID: $currentContractId (sẽ bỏ qua)');

      final bookedSlots = <String>{};

      // Query tất cả contracts của PT này (trừ contract hiện tại)
      final contractsSnapshot = await _firestore
          .collection('contracts')
          .where('ptId', isEqualTo: ptId)
          .where(
            'status',
            whereIn: ['paid', 'active'],
          ) // Chỉ lấy contract đang active
          .get();

      _logger.i('📋 Tìm thấy ${contractsSnapshot.docs.length} contracts');

      // Duyệt qua từng contract
      for (var contractDoc in contractsSnapshot.docs) {
        // Bỏ qua contract hiện tại
        if (contractDoc.id == currentContractId) {
          _logger.d('⏭️ Bỏ qua contract hiện tại: ${contractDoc.id}');
          continue;
        }

        final data = contractDoc.data();
        final weeklySchedule = data['weeklySchedule'] as Map<String, dynamic>?;

        if (weeklySchedule == null) {
          _logger.w('⚠️ Contract ${contractDoc.id} không có weeklySchedule');
          continue;
        }

        _logger.d(
          '📅 Contract ${contractDoc.id} có ${weeklySchedule.length} ngày',
        );

        // Duyệt qua từng ngày trong weeklySchedule
        weeklySchedule.forEach((dayKey, dayData) {
          final dayMap = dayData as Map<String, dynamic>;
          final timeSlotId = dayMap['timeSlotId'] as String?;

          if (timeSlotId != null) {
            bookedSlots.add(timeSlotId);
            _logger.d(
              '  ✓ Slot đã book: $timeSlotId (Contract: ${contractDoc.id.substring(0, 8)})',
            );
          }
        });
      }

      _logger.i('✅ Tổng cộng ${bookedSlots.length} time slots đã được book:');
      for (var slot in bookedSlots) {
        _logger.d('  - $slot');
      }

      return bookedSlots;
    } catch (e, stackTrace) {
      _logger.e(
        '❌ Lỗi khi lấy booked time slots',
        error: e,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  /// Lấy danh sách available time slots từ PT Package
  /// và đánh dấu những slot nào đã bị book
  ///
  /// Return: Map với key là timeSlotId, value là object chứa thông tin slot và trạng thái
  Future<Map<String, TimeSlotWithStatus>> getAvailableTimeSlotsWithStatus({
    required PTPackageModel package,
    required String ptId,
    required String currentContractId,
  }) async {
    try {
      _logger.i('🎯 Đang lấy available time slots với trạng thái...');

      // Bước 1: Lấy tất cả slots đã được book
      final bookedSlots = await getBookedTimeSlots(
        ptId: ptId,
        currentContractId: currentContractId,
      );

      // Bước 2: Map available slots với trạng thái
      final slotsWithStatus = <String, TimeSlotWithStatus>{};

      for (var slot in package.availableTimeSlots) {
        final isBooked = bookedSlots.contains(slot.id);

        slotsWithStatus[slot.id] = TimeSlotWithStatus(
          slot: slot,
          isBooked: isBooked,
        );

        _logger.d('Slot ${slot.id}: ${isBooked ? "❌ ĐÃ BOOK" : "✅ CÒN TRỐNG"}');
      }

      _logger.i('✅ Hoàn thành! ${slotsWithStatus.length} slots với trạng thái');
      final availableCount = slotsWithStatus.values
          .where((s) => !s.isBooked)
          .length;
      final bookedCount = slotsWithStatus.values
          .where((s) => s.isBooked)
          .length;
      _logger.i('  - Còn trống: $availableCount slots');
      _logger.i('  - Đã book: $bookedCount slots');

      return slotsWithStatus;
    } catch (e, stackTrace) {
      _logger.e(
        '❌ Lỗi khi lấy available time slots',
        error: e,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  /// Update lịch tập cho 1 ngày cụ thể trong contract
  ///
  /// Params:
  /// - contractId: ID của contract cần update
  /// - dayOfWeek: Ngày trong tuần (1-7)
  /// - newTimeSlot: Time slot mới (từ PT Package)
  Future<bool> updateTimeSlotForDay({
    required String contractId,
    required int dayOfWeek,
    required TimeSlot newTimeSlot,
  }) async {
    try {
      _logger.i('🔄 Đang update time slot cho contract...');
      _logger.d('Contract ID: $contractId');
      _logger.d('Day of Week: $dayOfWeek');
      _logger.d('New Time Slot ID: ${newTimeSlot.id}');

      // Tạo SelectedTimeSlot từ TimeSlot
      final selectedTimeSlot = {
        'timeSlotId': newTimeSlot.id,
        'dayOfWeek': dayOfWeek,
        'startTime': newTimeSlot.startTime,
        'endTime': newTimeSlot.endTime,
        'note': newTimeSlot.note,
      };

      // Update vào Firestore
      await _firestore.collection('contracts').doc(contractId).update({
        'weeklySchedule.$dayOfWeek': selectedTimeSlot,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      _logger.i('✅ Update time slot thành công!');
      return true;
    } catch (e, stackTrace) {
      _logger.e('❌ Lỗi khi update time slot', error: e, stackTrace: stackTrace);
      return false;
    }
  }

  /// Nhóm available time slots theo ngày trong tuần
  ///
  /// Return: Map với key là dayOfWeek (0-6), value là list các slots
  Map<int, List<TimeSlotWithStatus>> groupSlotsByDay(
    Map<String, TimeSlotWithStatus> slotsWithStatus,
  ) {
    _logger.i('📊 Đang nhóm slots theo ngày...');

    final grouped = <int, List<TimeSlotWithStatus>>{};

    // Khởi tạo tất cả các ngày (0-6 và thêm 7 cho Sunday convention)
    for (int i = 0; i <= 7; i++) {
      grouped[i] = [];
    }

    // Nhóm slots theo ngày (parse từ timeSlotId)
    slotsWithStatus.forEach((slotId, slotWithStatus) {
      // Parse dayOfWeek từ timeSlotId (ví dụ: "monday_slot1" -> 1)
      final dayOfWeek = _parseDayOfWeekFromSlotId(slotId);

      if (dayOfWeek != null) {
        grouped[dayOfWeek]!.add(slotWithStatus);

        // Nếu là Sunday (0), cũng thêm vào key 7 để support cả 2 convention
        if (dayOfWeek == 0) {
          grouped[7]!.add(slotWithStatus);
          _logger.d(
            'Slot $slotId -> Ngày 0 (Chủ nhật) - Thêm vào cả key 0 và 7',
          );
        } else {
          _logger.d('Slot $slotId -> Ngày $dayOfWeek');
        }
      } else {
        _logger.w('⚠️ Không parse được dayOfWeek từ slotId: $slotId');
      }
    });

    // Log kết quả
    grouped.forEach((day, slots) {
      if (slots.isNotEmpty) {
        _logger.d('Ngày $day: ${slots.length} slots');
      }
    });

    return grouped;
  }

  /// Parse dayOfWeek từ timeSlotId (ví dụ: "monday_slot1" -> 1)
  int? _parseDayOfWeekFromSlotId(String slotId) {
    final dayMap = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0,
    };

    final lowerSlotId = slotId.toLowerCase();

    for (var entry in dayMap.entries) {
      if (lowerSlotId.startsWith(entry.key)) {
        return entry.value;
      }
    }

    return null;
  }
}

/// Model chứa thông tin time slot và trạng thái (booked hay không)
class TimeSlotWithStatus {
  final TimeSlot slot;
  final bool isBooked;

  TimeSlotWithStatus({required this.slot, required this.isBooked});

  bool get isAvailable => !isBooked;
}
