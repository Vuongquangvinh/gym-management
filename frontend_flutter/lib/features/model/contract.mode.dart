import "package:cloud_firestore/cloud_firestore.dart";
import "package:logger/logger.dart";
import "package:shared_preferences/shared_preferences.dart";

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

class ContractModel {
  final String id; // Document ID trong Firestore
  final String userId; // ID của user (member)
  final String ptId; // ID của PT
  final String ptPackageId; // ID của PT Package
  final List<SelectedTimeSlot> selectedTimeSlots; // Danh sách khung giờ đã chọn
  final String
  status; // 'pending', 'approved', 'active', 'completed', 'cancelled'
  final Timestamp createdAt; // Thời gian tạo contract
  final Timestamp? updatedAt; // Thời gian cập nhật
  final Timestamp? startDate; // Ngày bắt đầu contract
  final Timestamp? endDate; // Ngày kết thúc contract
  final int totalSessions; // Tổng số buổi tập
  final int completedSessions; // Số buổi đã tập
  final String? note; // Ghi chú từ PT hoặc user

  ContractModel({
    required this.id,
    required this.userId,
    required this.ptId,
    required this.ptPackageId,
    required this.selectedTimeSlots,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    this.startDate,
    this.endDate,
    required this.totalSessions,
    this.completedSessions = 0,
    this.note,
  });

  factory ContractModel.fromMap(Map<String, dynamic> map, {String id = ''}) {
    return ContractModel(
      id: id,
      userId: map['userId'] ?? '',
      ptId: map['ptId'] ?? '',
      ptPackageId: map['ptPackageId'] ?? '',
      selectedTimeSlots:
          (map['selectedTimeSlots'] as List<dynamic>?)
              ?.map(
                (slot) =>
                    SelectedTimeSlot.fromMap(slot as Map<String, dynamic>),
              )
              .toList() ??
          [],
      status: map['status'] ?? 'pending',
      createdAt: map['createdAt'] ?? Timestamp.now(),
      updatedAt: map['updatedAt'] as Timestamp?,
      startDate: map['startDate'] as Timestamp?,
      endDate: map['endDate'] as Timestamp?,
      totalSessions: map['totalSessions'] ?? 0,
      completedSessions: map['completedSessions'] ?? 0,
      note: map['note'],
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
      'selectedTimeSlots': selectedTimeSlots
          .map((slot) => slot.toMap())
          .toList(),
      'status': status,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'startDate': startDate,
      'endDate': endDate,
      'totalSessions': totalSessions,
      'completedSessions': completedSessions,
      'note': note,
    };
  }

  /// Tạo contract mới
  static Future<String> createContract({
    required String userId,
    required String ptId,
    required String ptPackageId,
    required List<SelectedTimeSlot> selectedTimeSlots,
    required int totalSessions,
    String? note,
  }) async {
    try {
      final contractData = {
        'userId': userId,
        'ptId': ptId,
        'ptPackageId': ptPackageId,
        'selectedTimeSlots': selectedTimeSlots
            .map((slot) => slot.toMap())
            .toList(),
        'status': 'pending',
        'createdAt': Timestamp.now(),
        'updatedAt': Timestamp.now(),
        'totalSessions': totalSessions,
        'completedSessions': 0,
        if (note != null) 'note': note,
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

  /// Cập nhật số buổi đã hoàn thành
  static Future<void> updateCompletedSessions({
    required String contractId,
    required int completedSessions,
  }) async {
    try {
      await FirebaseFirestore.instance
          .collection('contracts')
          .doc(contractId)
          .update({
            'completedSessions': completedSessions,
            'updatedAt': Timestamp.now(),
          });

      logger.i('Completed sessions updated successfully');
    } catch (e) {
      logger.e('Error updating completed sessions: $e');
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
    List<SelectedTimeSlot>? selectedTimeSlots,
    String? status,
    Timestamp? createdAt,
    Timestamp? updatedAt,
    Timestamp? startDate,
    Timestamp? endDate,
    int? totalSessions,
    int? completedSessions,
    String? note,
  }) {
    return ContractModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      ptId: ptId ?? this.ptId,
      ptPackageId: ptPackageId ?? this.ptPackageId,
      selectedTimeSlots: selectedTimeSlots ?? this.selectedTimeSlots,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      totalSessions: totalSessions ?? this.totalSessions,
      completedSessions: completedSessions ?? this.completedSessions,
      note: note ?? this.note,
    );
  }
}
