import "package:cloud_firestore/cloud_firestore.dart";
import "package:logger/logger.dart";

final logger = Logger();

// Model cho khung giờ được chọn trong contract
class SelectedTimeSlot {
  final String timeSlotId; // ID từ availableTimeSlots trong PTPackage
  final int dayOfWeek; // 0-6 (0 = Chủ nhật, 1 = Thứ 2, ...)
  final String startTime; // Format: "HH:mm"
  final String endTime; // Format: "HH:mm"
  final String note; // Ghi chú nếu có

  SelectedTimeSlot({
    required this.timeSlotId,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    this.note = '',
  });

  factory SelectedTimeSlot.fromMap(Map<String, dynamic> map) {
    return SelectedTimeSlot(
      timeSlotId: map['timeSlotId'] ?? '',
      dayOfWeek: map['dayOfWeek'] ?? 0,
      startTime: map['startTime'] ?? '',
      endTime: map['endTime'] ?? '',
      note: map['note'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'timeSlotId': timeSlotId,
      'dayOfWeek': dayOfWeek,
      'startTime': startTime,
      'endTime': endTime,
      'note': note,
    };
  }
}

// Model cho lịch tập hàng tuần (7 ngày) - dùng cho gói tháng
class WeeklySchedule {
  final Map<int, SelectedTimeSlot>
  schedule; // dayOfWeek (1-7) -> SelectedTimeSlot

  WeeklySchedule({required this.schedule});

  factory WeeklySchedule.fromMap(Map<String, dynamic> map) {
    final scheduleMap = <int, SelectedTimeSlot>{};
    map.forEach((key, value) {
      final dayOfWeek = int.parse(key);
      scheduleMap[dayOfWeek] = SelectedTimeSlot.fromMap(
        value as Map<String, dynamic>,
      );
    });
    return WeeklySchedule(schedule: scheduleMap);
  }

  Map<String, dynamic> toMap() {
    final map = <String, dynamic>{};
    schedule.forEach((dayOfWeek, slot) {
      map[dayOfWeek.toString()] = slot.toMap();
    });
    return map;
  }

  bool isComplete() => schedule.length == 7;

  List<String> getMissingDays() {
    const dayNames = [
      '',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
      'Chủ nhật',
    ];
    final missing = <String>[];
    for (int i = 1; i <= 7; i++) {
      if (!schedule.containsKey(i)) {
        missing.add(dayNames[i]);
      }
    }
    return missing;
  }
}

class ContractModel {
  final String id; // Document ID trong Firestore
  final String userId; // ID của user (member)
  final String ptId; // ID của PT
  final String ptPackageId; // ID của PT Package

  // Lịch tập hàng tuần - đây là lịch chính thức duy nhất
  // User có thể cập nhật lịch này sau khi mua gói
  final WeeklySchedule weeklySchedule;

  // Status flow: pending_payment → paid → active → completed/cancelled
  final String
  status; // 'pending_payment', 'paid', 'active', 'completed', 'cancelled'

  // Thông tin thanh toán
  final String? paymentOrderCode; // Mã đơn hàng PayOS
  final int? paymentAmount; // Số tiền thanh toán
  final String? paymentStatus; // 'PENDING', 'PAID', 'CANCELLED'
  final Timestamp? paidAt; // Thời gian thanh toán thành công

  // Thời gian
  final Timestamp createdAt; // Thời gian tạo contract
  final Timestamp? updatedAt; // Thời gian cập nhật
  final Timestamp? startDate; // Ngày bắt đầu contract (PT set khi lên lịch)
  final Timestamp? endDate; // Ngày kết thúc contract (PT set khi lên lịch)

  // Review tracking
  final bool isReviewed; // Đã đánh giá PT chưa
  final String? reviewId; // ID của review (nếu đã đánh giá)

  ContractModel({
    required this.id,
    required this.userId,
    required this.ptId,
    required this.ptPackageId,
    required this.weeklySchedule,
    required this.status,
    this.paymentOrderCode,
    this.paymentAmount,
    this.paymentStatus,
    this.paidAt,
    required this.createdAt,
    this.updatedAt,
    this.startDate,
    this.endDate,
    this.isReviewed = false,
    this.reviewId,
  });

  // Computed property để lấy danh sách time slots (cho backward compatibility)
  List<SelectedTimeSlot> get selectedTimeSlots {
    return weeklySchedule.schedule.values.toList()
      ..sort((a, b) => a.dayOfWeek.compareTo(b.dayOfWeek));
  }

  factory ContractModel.fromMap(Map<String, dynamic> map, {String id = ''}) {
    // Xử lý weeklySchedule - ưu tiên weeklySchedule, fallback về selectedTimeSlots nếu có
    WeeklySchedule? schedule;

    if (map['weeklySchedule'] != null) {
      // Có weeklySchedule - dùng luôn
      schedule = WeeklySchedule.fromMap(
        map['weeklySchedule'] as Map<String, dynamic>,
      );
    } else if (map['selectedTimeSlots'] != null) {
      // Không có weeklySchedule nhưng có selectedTimeSlots (data cũ)
      // Convert selectedTimeSlots thành weeklySchedule
      final slots = (map['selectedTimeSlots'] as List<dynamic>)
          .map((slot) => SelectedTimeSlot.fromMap(slot as Map<String, dynamic>))
          .toList();

      final scheduleMap = <int, SelectedTimeSlot>{};
      for (var slot in slots) {
        scheduleMap[slot.dayOfWeek] = slot;
      }
      schedule = WeeklySchedule(schedule: scheduleMap);
    } else {
      // Không có gì - tạo schedule rỗng
      schedule = WeeklySchedule(schedule: {});
    }

    return ContractModel(
      id: id,
      userId: map['userId'] ?? '',
      ptId: map['ptId'] ?? '',
      ptPackageId: map['ptPackageId'] ?? '',
      weeklySchedule: schedule,
      status: map['status'] ?? 'pending_payment',
      paymentOrderCode: map['paymentOrderCode'],
      paymentAmount: map['paymentAmount'],
      paymentStatus: map['paymentStatus'],
      paidAt: map['paidAt'] as Timestamp?,
      createdAt: map['createdAt'] ?? Timestamp.now(),
      updatedAt: map['updatedAt'] as Timestamp?,
      startDate: map['startDate'] as Timestamp?,
      endDate: map['endDate'] as Timestamp?,
      isReviewed: map['isReviewed'] ?? false,
      reviewId: map['reviewId'],
    );
  }

  factory ContractModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ContractModel.fromMap(data, id: doc.id);
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'ptId': ptId,
      'ptPackageId': ptPackageId,
      'weeklySchedule': weeklySchedule.toMap(),
      'status': status,
      'paymentOrderCode': paymentOrderCode,
      'paymentAmount': paymentAmount,
      'paymentStatus': paymentStatus,
      'paidAt': paidAt,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'startDate': startDate,
      'endDate': endDate,
      'isReviewed': isReviewed,
      'reviewId': reviewId,
    };
  }

  /// Tạo contract mới
  static Future<String> createContract({
    required String userId,
    required String ptId,
    required String ptPackageId,
    required WeeklySchedule weeklySchedule,
    String? paymentOrderCode,
    int? paymentAmount,
    Timestamp? startDate,
    Timestamp? endDate,
  }) async {
    try {
      final contractData = {
        'userId': userId,
        'ptId': ptId,
        'ptPackageId': ptPackageId,
        'weeklySchedule': weeklySchedule.toMap(),
        'status': 'pending_payment',
        'createdAt': Timestamp.now(),
        'updatedAt': Timestamp.now(),
        if (paymentOrderCode != null) 'paymentOrderCode': paymentOrderCode,
        if (paymentAmount != null) 'paymentAmount': paymentAmount,
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      };

      final docRef = await FirebaseFirestore.instance
          .collection('contracts')
          .add(contractData);

      logger.i('Contract created successfully with ID: ${docRef.id}');
      return docRef.id;
    } catch (e) {
      logger.e('Error creating contract: $e');
      rethrow;
    }
  }

  /// Lấy contract theo userId
  static Future<List<ContractModel>> getContractsByUserId(String userId) async {
    try {
      final querySnapshot = await FirebaseFirestore.instance
          .collection('contracts')
          .where('userId', isEqualTo: userId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ContractModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      logger.e('Error fetching contracts by userId: $e');
      rethrow;
    }
  }

  /// Lấy contract theo ptId
  static Future<List<ContractModel>> getContractsByPtId(String ptId) async {
    try {
      final querySnapshot = await FirebaseFirestore.instance
          .collection('contracts')
          .where('ptId', isEqualTo: ptId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ContractModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      logger.e('Error fetching contracts by ptId: $e');
      rethrow;
    }
  }

  /// Cập nhật trạng thái contract
  static Future<void> updateContractStatus({
    required String contractId,
    required String status,
    Timestamp? startDate,
    Timestamp? endDate,
  }) async {
    try {
      final updateData = {
        'status': status,
        'updatedAt': Timestamp.now(),
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      };

      await FirebaseFirestore.instance
          .collection('contracts')
          .doc(contractId)
          .update(updateData);

      logger.i('Contract status updated successfully');
    } catch (e) {
      logger.e('Error updating contract status: $e');
      rethrow;
    }
  }

  /// Cập nhật thông tin thanh toán
  static Future<void> updatePaymentInfo({
    required String contractId,
    required String paymentOrderCode,
    required int paymentAmount,
    required String paymentStatus,
    Timestamp? paidAt,
  }) async {
    try {
      await FirebaseFirestore.instance
          .collection('contracts')
          .doc(contractId)
          .update({
            'paymentOrderCode': paymentOrderCode,
            'paymentAmount': paymentAmount,
            'paymentStatus': paymentStatus,
            'paidAt': paidAt ?? Timestamp.now(),
            'status': paymentStatus == 'PAID' ? 'paid' : 'pending_payment',
            'updatedAt': Timestamp.now(),
          });

      logger.i('Payment info updated successfully');
    } catch (e) {
      logger.e('Error updating payment info: $e');
      rethrow;
    }
  }

  /// Cập nhật lịch tập (time slots) của contract
  static Future<void> updateContractTimeSlots({
    required String contractId,
    required List<SelectedTimeSlot> selectedTimeSlots,
  }) async {
    try {
      await FirebaseFirestore.instance
          .collection('contracts')
          .doc(contractId)
          .update({
            'selectedTimeSlots': selectedTimeSlots
                .map((slot) => slot.toMap())
                .toList(),
            'updatedAt': Timestamp.now(),
          });

      logger.i('Contract time slots updated successfully');
    } catch (e) {
      logger.e('Error updating contract time slots: $e');
      rethrow;
    }
  }

  ContractModel copyWith({
    String? id,
    String? userId,
    String? ptId,
    String? ptPackageId,
    WeeklySchedule? weeklySchedule,
    String? status,
    String? paymentOrderCode,
    int? paymentAmount,
    String? paymentStatus,
    Timestamp? paidAt,
    Timestamp? createdAt,
    Timestamp? updatedAt,
    Timestamp? startDate,
    Timestamp? endDate,
  }) {
    return ContractModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      ptId: ptId ?? this.ptId,
      ptPackageId: ptPackageId ?? this.ptPackageId,
      weeklySchedule: weeklySchedule ?? this.weeklySchedule,
      status: status ?? this.status,
      paymentOrderCode: paymentOrderCode ?? this.paymentOrderCode,
      paymentAmount: paymentAmount ?? this.paymentAmount,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paidAt: paidAt ?? this.paidAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
    );
  }
}
