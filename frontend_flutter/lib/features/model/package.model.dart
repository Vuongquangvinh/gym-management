import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';

final logger = Logger();

/// PackageModel - Model gói tập phía client (User)
/// Chỉ chứa các thông tin cần thiết để hiển thị và sử dụng gói tập
class PackageModel {
  String id; // Firestore document ID
  String packageId; // User-defined ID
  String packageName;
  String packageType; // 'time' (theo thời gian) hoặc 'session' (theo buổi)
  String? description;
  int duration; // Số ngày (cho gói theo thời gian)
  double price;
  String status; // 'active' hoặc 'inactive'
  int? numberOfSession; // Số buổi tập (cho gói theo buổi)
  double? discount; // % giảm giá
  DateTime? startDayDiscount;
  DateTime? endDayDiscount;
  String? usageCondition;
  DateTime? createdAt;
  DateTime? updatedAt;

  PackageModel({
    required this.id,
    required this.packageId,
    required this.packageName,
    required this.packageType,
    this.description,
    required this.duration,
    required this.price,
    this.status = 'active',
    this.numberOfSession,
    this.discount,
    this.startDayDiscount,
    this.endDayDiscount,
    this.usageCondition,
    this.createdAt,
    this.updatedAt,
  });

  // Chuyển đổi từ Firestore DocumentSnapshot sang PackageModel
  factory PackageModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return PackageModel.fromMap(data, doc.id);
  }

  // Chuyển đổi từ Map sang PackageModel
  factory PackageModel.fromMap(Map<String, dynamic> data, String docId) {
    return PackageModel(
      id: docId,
      packageId: data['PackageId'] ?? '',
      packageName: data['PackageName'] ?? '',
      packageType: data['PackageType'] ?? 'time',
      description: data['Description'],
      duration: _parseInt(data['Duration']) ?? 0,
      price: _parseDouble(data['Price']) ?? 0.0,
      status: data['Status'] ?? 'active',
      numberOfSession: _parseInt(data['NumberOfSession']),
      discount: _parseDouble(data['Discount']),
      startDayDiscount: _parseTimestamp(data['StartDayDiscount']),
      endDayDiscount: _parseTimestamp(data['EndDayDiscount']),
      usageCondition: data['UsageCondition'],
      createdAt: _parseTimestamp(data['CreatedAt']),
      updatedAt: _parseTimestamp(data['UpdatedAt']),
    );
  }

  // Chuyển đổi sang Map
  Map<String, dynamic> toMap() {
    return {
      'PackageId': packageId,
      'PackageName': packageName,
      'PackageType': packageType,
      'Description': description,
      'Duration': duration,
      'Price': price,
      'Status': status,
      'NumberOfSession': numberOfSession,
      'Discount': discount,
      'StartDayDiscount': startDayDiscount?.toIso8601String(),
      'EndDayDiscount': endDayDiscount?.toIso8601String(),
      'UsageCondition': usageCondition,
    };
  }

  // Helper: Parse Timestamp từ Firestore
  static DateTime? _parseTimestamp(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        logger.e('Không thể parse DateTime từ string: $value');
        return null;
      }
    }
    return null;
  }

  // Helper: Parse int
  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      try {
        return int.parse(value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Helper: Parse double
  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      try {
        return double.parse(value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // ========== STATIC METHODS - READ OPERATIONS (User Side) ==========

  /// Lấy package theo PackageId (user-defined ID)
  /// Đây là method chính dùng cho user side
  static Future<PackageModel?> getByPackageId(String packageId) async {
    try {
      logger.d('🔍 Đang tìm package với PackageId: "$packageId"');
      // Đảm bảo truyền đúng giá trị và tên trường phân biệt hoa thường
      final querySnapshot = await FirebaseFirestore.instance
          .collection('packages')
          .where('PackageId', isEqualTo: packageId)
          .limit(1)
          .get();

      logger.d('📊 Số lượng documents tìm thấy: ${querySnapshot.docs.length}');
      if (querySnapshot.docs.isEmpty) {
        logger.w(
          '❌ Không tìm thấy package với PackageId: "$packageId". Hãy kiểm tra lại giá trị truyền vào và tên trường trong Firestore (phân biệt hoa thường).',
        );
        return null;
      }

      final doc = querySnapshot.docs.first;
      final data = doc.data();
      logger.d(
        '✅ Tìm thấy package: ${data['PackageName']} (PackageId: ${data['PackageId']}, Status: ${data['Status']})',
      );
      return PackageModel.fromFirestore(doc);
    } catch (e) {
      logger.e('💥 Lỗi khi lấy package theo PackageId: $e');
      return null;
    }
  }

  // lấy ra tất cả các package
  static Future<List<PackageModel>> getAllPackages() async {
    try {
      final querySnapshot = await FirebaseFirestore.instance
          .collection('packages')
          .get();
      return querySnapshot.docs
          .map((doc) => PackageModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      logger.e('Lỗi khi lấy tất cả package: $e');
      return [];
    }
  }

  /// Copy with method
  PackageModel copyWith({
    String? id,
    String? packageId,
    String? packageName,
    String? packageType,
    String? description,
    int? duration,
    double? price,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? numberOfSession,
    double? discount,
    DateTime? startDayDiscount,
    DateTime? endDayDiscount,
    String? usageCondition,
  }) {
    return PackageModel(
      id: id ?? this.id,
      packageId: packageId ?? this.packageId,
      packageName: packageName ?? this.packageName,
      packageType: packageType ?? this.packageType,
      description: description ?? this.description,
      duration: duration ?? this.duration,
      price: price ?? this.price,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      numberOfSession: numberOfSession ?? this.numberOfSession,
      discount: discount ?? this.discount,
      startDayDiscount: startDayDiscount ?? this.startDayDiscount,
      endDayDiscount: endDayDiscount ?? this.endDayDiscount,
      usageCondition: usageCondition ?? this.usageCondition,
    );
  }
}
