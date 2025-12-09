import 'package:cloud_firestore/cloud_firestore.dart';

/// Model for PT profile edit requests using pendingRequests collection
/// Compatible with web admin panel structure
class PTEditRequestModel {
  final String id;
  final String type; // 'employee_update'
  final String employeeId;
  final String employeeEmail;
  final String employeeName;
  final String requestedBy;
  final String requestedByName;
  final String? employeeAvatar;

  // Data to be updated after approval
  final Map<String, dynamic> data;
  final Map<String, dynamic> previousData;

  // Request status
  final String status; // pending, approved, rejected, cancelled

  // Timestamps
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? approvedAt;
  final DateTime? rejectedAt;
  final DateTime? cancelledAt;

  // Admin info
  final String? approvedBy;
  final String? rejectedBy;
  final String? rejectionReason;

  PTEditRequestModel({
    required this.id,
    required this.type,
    required this.employeeId,
    required this.employeeEmail,
    required this.employeeName,
    required this.requestedBy,
    required this.requestedByName,
    this.employeeAvatar,
    required this.data,
    required this.previousData,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    this.approvedAt,
    this.rejectedAt,
    this.cancelledAt,
    this.approvedBy,
    this.rejectedBy,
    this.rejectionReason,
  });

  /// Create from Firestore document
  factory PTEditRequestModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;

    return PTEditRequestModel(
      id: doc.id,
      type: data['type'] ?? 'employee_update',
      employeeId: data['employeeId'] ?? '',
      employeeEmail: data['employeeEmail'] ?? '',
      employeeName: data['employeeName'] ?? '',
      requestedBy: data['requestedBy'] ?? '',
      requestedByName: data['requestedByName'] ?? '',
      employeeAvatar: data['employeeAvatar'],
      data: data['data'] ?? {},
      previousData: data['previousData'] ?? {},
      status: data['status'] ?? 'pending',
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      updatedAt: data['updatedAt'] != null
          ? (data['updatedAt'] as Timestamp).toDate()
          : null,
      approvedAt: data['approvedAt'] != null
          ? (data['approvedAt'] as Timestamp).toDate()
          : null,
      rejectedAt: data['rejectedAt'] != null
          ? (data['rejectedAt'] as Timestamp).toDate()
          : null,
      cancelledAt: data['cancelledAt'] != null
          ? (data['cancelledAt'] as Timestamp).toDate()
          : null,
      approvedBy: data['approvedBy'],
      rejectedBy: data['rejectedBy'],
      rejectionReason: data['rejectionReason'],
    );
  }

  /// Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    return {
      'type': type,
      'employeeId': employeeId,
      'employeeEmail': employeeEmail,
      'employeeName': employeeName,
      'requestedBy': requestedBy,
      'requestedByName': requestedByName,
      'employeeAvatar': employeeAvatar,
      'data': data,
      'previousData': previousData,
      'status': status,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': updatedAt != null ? Timestamp.fromDate(updatedAt!) : null,
      'approvedAt': approvedAt != null ? Timestamp.fromDate(approvedAt!) : null,
      'rejectedAt': rejectedAt != null ? Timestamp.fromDate(rejectedAt!) : null,
      'cancelledAt': cancelledAt != null
          ? Timestamp.fromDate(cancelledAt!)
          : null,
      'approvedBy': approvedBy,
      'rejectedBy': rejectedBy,
      'rejectionReason': rejectionReason,
    };
  }

  /// Get status text in Vietnamese
  String get statusText {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Đã từ chối';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  }

  /// Get status color
  String get statusColor {
    switch (status) {
      case 'pending':
        return '#FFA500'; // Orange
      case 'approved':
        return '#4CAF50'; // Green
      case 'rejected':
        return '#F44336'; // Red
      case 'cancelled':
        return '#9E9E9E'; // Grey
      default:
        return '#9E9E9E'; // Grey
    }
  }

  /// Check if request is pending
  bool get isPending => status == 'pending';

  /// Check if request is approved
  bool get isApproved => status == 'approved';

  /// Check if request is rejected
  bool get isRejected => status == 'rejected';

  /// Check if request is cancelled
  bool get isCancelled => status == 'cancelled';

  /// Format created date
  String get formattedCreatedAt {
    return '${createdAt.day}/${createdAt.month}/${createdAt.year} ${createdAt.hour}:${createdAt.minute.toString().padLeft(2, '0')}';
  }

  /// Format approved date
  String? get formattedApprovedAt {
    if (approvedAt == null) return null;
    return '${approvedAt!.day}/${approvedAt!.month}/${approvedAt!.year} ${approvedAt!.hour}:${approvedAt!.minute.toString().padLeft(2, '0')}';
  }

  /// Format rejected date
  String? get formattedRejectedAt {
    if (rejectedAt == null) return null;
    return '${rejectedAt!.day}/${rejectedAt!.month}/${rejectedAt!.year} ${rejectedAt!.hour}:${rejectedAt!.minute.toString().padLeft(2, '0')}';
  }

  /// Get certificate images from data.ptInfo
  List<String> get certificateImages {
    final ptInfo = data['ptInfo'] as Map<String, dynamic>?;
    if (ptInfo == null) return [];

    final certs = ptInfo['certificates'] as List?;
    if (certs == null) return [];

    return certs
        .where((cert) {
          if (cert is String && cert.startsWith('http')) return true;
          if (cert is Map) {
            final images = cert['images'] as List?;
            return images != null && images.isNotEmpty;
          }
          return false;
        })
        .expand((cert) {
          if (cert is String) return [cert];
          if (cert is Map) {
            final images = cert['images'] as List? ?? [];
            return images.map((img) => img['url'] as String);
          }
          return <String>[];
        })
        .toList();
  }

  @override
  String toString() {
    return 'PTEditRequestModel(id: $id, employeeName: $employeeName, status: $status, createdAt: $formattedCreatedAt)';
  }
}
