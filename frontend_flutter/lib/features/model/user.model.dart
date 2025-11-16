import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package.model.dart';

final logger = Logger();

class UserModel {
  String id;
  String fullName;
  String phoneNumber;
  String email;
  String avatarUrl;
  DateTime? dateOfBirth;
  String gender;
  String membershipStatus;
  String currentPackageId;
  DateTime? packageEndDate;
  int? remainingSessions;
  List<FrozenHistory> frozenHistory;
  DateTime? joinDate;
  String assignedStaffId;
  DateTime? lastCheckinTime;
  String leadSource;
  List<String> fitnessGoal;
  List<String> medicalConditions;
  Map<String, dynamic> initialMeasurements;
  bool isActive;
  DateTime? createdAt;
  DateTime? updatedAt;

  UserModel({
    this.id = '',
    this.fullName = '',
    this.phoneNumber = '',
    this.email = '',
    this.avatarUrl = '',
    this.dateOfBirth,
    this.gender = 'other',
    this.membershipStatus = 'Active',
    this.currentPackageId = '',
    this.packageEndDate,
    this.remainingSessions,
    this.frozenHistory = const [],
    this.joinDate,
    this.assignedStaffId = '',
    this.lastCheckinTime,
    this.leadSource = '',
    this.fitnessGoal = const [],
    this.medicalConditions = const [],
    this.initialMeasurements = const {},
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  // Chuyển đổi từ Firestore DocumentSnapshot sang UserModel
  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserModel.fromMap(data, doc.id);
  }

  // Chuyển đổi từ Map sang UserModel
  factory UserModel.fromMap(Map<String, dynamic> data, String docId) {
    return UserModel(
      id: docId,
      fullName: data['full_name'] ?? '',
      phoneNumber: data['phone_number'] ?? '',
      email: data['email'] ?? '',
      avatarUrl: data['avatar_url'] ?? '',
      dateOfBirth: _parseTimestamp(data['date_of_birth']),
      gender: data['gender'] ?? 'other',
      membershipStatus: data['membership_status'] ?? 'Active',
      currentPackageId: data['current_package_id'] ?? '',
      packageEndDate: _parseTimestamp(data['package_end_date']),
      remainingSessions: data['remaining_sessions'],
      frozenHistory: _parseFrozenHistory(data['frozen_history']),
      joinDate: _parseTimestamp(data['join_date']),
      assignedStaffId: data['assigned_staff_id'] ?? '',
      lastCheckinTime: _parseTimestamp(data['last_checkin_time']),
      leadSource: data['lead_source'] ?? '',
      fitnessGoal: List<String>.from(data['fitness_goal'] ?? []),
      medicalConditions: List<String>.from(data['medical_conditions'] ?? []),
      initialMeasurements: Map<String, dynamic>.from(
        data['initial_measurements'] ?? {},
      ),
      isActive: data['isActive'] ?? true,
      createdAt: _parseTimestamp(data['createdAt']),
      updatedAt: _parseTimestamp(data['updatedAt']),
    );
  }

  // Chuyển đổi sang Map để lưu vào Firestore
  Map<String, dynamic> toFirestore() {
    return {
      '_id': id,
      'full_name': fullName,
      'phone_number': phoneNumber,
      'email': email,
      'avatar_url': avatarUrl,
      'date_of_birth': dateOfBirth != null
          ? Timestamp.fromDate(dateOfBirth!)
          : null,
      'gender': gender,
      'membership_status': membershipStatus,
      'current_package_id': currentPackageId,
      'package_end_date': packageEndDate != null
          ? Timestamp.fromDate(packageEndDate!)
          : null,
      'remaining_sessions': remainingSessions,
      'frozen_history': frozenHistory.map((fh) => fh.toMap()).toList(),
      'join_date': joinDate != null ? Timestamp.fromDate(joinDate!) : null,
      'assigned_staff_id': assignedStaffId,
      'last_checkin_time': lastCheckinTime != null
          ? Timestamp.fromDate(lastCheckinTime!)
          : null,
      'lead_source': leadSource,
      'fitness_goal': fitnessGoal,
      'medical_conditions': medicalConditions,
      'initial_measurements': initialMeasurements,
      'isActive': isActive,
      'createdAt': createdAt != null
          ? Timestamp.fromDate(createdAt!)
          : FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
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

  // Helper: Parse frozen history
  static List<FrozenHistory> _parseFrozenHistory(dynamic value) {
    if (value == null) return [];
    if (value is! List) return [];

    return value.map((item) {
      if (item is Map<String, dynamic>) {
        return FrozenHistory.fromMap(item);
      }
      return FrozenHistory(start: DateTime.now(), end: DateTime.now());
    }).toList();
  }

  // ========== STATIC METHODS - CRUD OPERATIONS ==========

  /// Lấy user theo ID
  static Future<UserModel?> getById(String id) async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(id)
          .get();

      if (!doc.exists) return null;
      return UserModel.fromFirestore(doc);
    } catch (e) {
      logger.e('Lỗi khi lấy user theo ID: $e');
      return null;
    }
  }

  /// Lấy user theo số điện thoại
  static Future<UserModel?> getByPhoneNumber(String phoneNumber) async {
    try {
      final querySnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('phone_number', isEqualTo: phoneNumber)
          .limit(1)
          .get();

      if (querySnapshot.docs.isEmpty) return null;
      return UserModel.fromFirestore(querySnapshot.docs.first);
    } catch (e) {
      logger.e('Lỗi khi lấy user theo số điện thoại: $e');
      return null;
    }
  }

  static Future<String?> getMemberId() async {
    try {
      // Lấy userId (document ID) từ SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      final userDocId = prefs.getString('userId');

      if (userDocId == null || userDocId.isEmpty) {
        logger.w('Không tìm thấy userId trong SharedPreferences');
        return null;
      }

      // Không cần lấy field _id, chỉ cần documentId thực tế
      // Đảm bảo document tồn tại
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(userDocId)
          .get();

      if (!userDoc.exists) {
        logger.w('Không tìm thấy user document với ID: $userDocId');
        return null;
      }

      // Trả về documentId thực tế
      return userDocId;
    } catch (e) {
      logger.e('Lỗi khi lấy memberId: $e');
      return null;
    }
  }

  /// Lấy danh sách user với filter và phân trang
  static Future<UserListResult> getAll({
    Map<String, dynamic>? filters,
    int limit = 10,
    DocumentSnapshot? startAfterDoc,
  }) async {
    try {
      Query query = FirebaseFirestore.instance.collection('users');

      // Apply filters
      if (filters != null) {
        if (filters['status'] == 'about-to-expire') {
          final today = DateTime.now();
          final aWeekFromNow = DateTime.now().add(const Duration(days: 7));

          query = query
              .where(
                'package_end_date',
                isGreaterThanOrEqualTo: Timestamp.fromDate(today),
              )
              .where(
                'package_end_date',
                isLessThanOrEqualTo: Timestamp.fromDate(aWeekFromNow),
              )
              .orderBy('package_end_date');
        } else if (filters['status'] != null) {
          query = query.where(
            'membership_status',
            isEqualTo: filters['status'],
          );
        } else {
          query = query.orderBy('createdAt', descending: true);
        }
      } else {
        query = query.orderBy('createdAt', descending: true);
      }

      // Apply pagination
      query = query.limit(limit);
      if (startAfterDoc != null) {
        query = query.startAfterDocument(startAfterDoc);
      }

      final querySnapshot = await query.get();

      List<UserModel> users = querySnapshot.docs
          .map((doc) => UserModel.fromFirestore(doc))
          .toList();

      // Client-side filtering for search query
      if (filters != null && filters['searchQuery'] != null) {
        final searchQuery = filters['searchQuery']
            .toString()
            .toLowerCase()
            .trim();
        users = users.where((user) {
          final fullNameMatch = user.fullName.toLowerCase().contains(
            searchQuery,
          );
          final phoneMatch = user.phoneNumber.contains(searchQuery);
          final emailMatch = user.email.toLowerCase().contains(searchQuery);
          return fullNameMatch || phoneMatch || emailMatch;
        }).toList();
      }

      final lastDoc = querySnapshot.docs.isNotEmpty
          ? querySnapshot.docs.last
          : null;
      final hasMore = querySnapshot.docs.length == limit;

      return UserListResult(users: users, lastDoc: lastDoc, hasMore: hasMore);
    } catch (e) {
      logger.e('Lỗi khi lấy danh sách user: $e');
      return UserListResult(users: [], lastDoc: null, hasMore: false);
    }
  }

  /// Lấy user theo packageId
  static Future<List<UserModel>> getUsersByPackageId(String packageId) async {
    try {
      final querySnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('current_package_id', isEqualTo: packageId)
          .get();

      return querySnapshot.docs
          .map((doc) => UserModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      logger.e('Lỗi khi lấy user theo packageId: $e');
      return [];
    }
  }

  /// Cập nhật thông tin user
  static Future<void> update(String id, Map<String, dynamic> updateData) async {
    try {
      // Convert DateTime to Timestamp
      final dataToUpdate = <String, dynamic>{};
      updateData.forEach((key, value) {
        if (value is DateTime) {
          dataToUpdate[key] = Timestamp.fromDate(value);
        } else {
          dataToUpdate[key] = value;
        }
      });

      dataToUpdate['updatedAt'] = FieldValue.serverTimestamp();

      await FirebaseFirestore.instance
          .collection('users')
          .doc(id)
          .update(dataToUpdate);

      logger.d('Cập nhật user thành công: $id');
    } catch (e) {
      logger.e('Lỗi khi cập nhật user: $e');
      rethrow;
    }
  }

  /// Lưu hoặc cập nhật user
  Future<void> save() async {
    try {
      final docRef = FirebaseFirestore.instance.collection('users').doc(id);
      await docRef.set(toFirestore(), SetOptions(merge: true));
      logger.d('Lưu user thành công: $id');
    } catch (e) {
      logger.e('Lỗi khi lưu user: $e');
      rethrow;
    }
  }

  /// Lấy số liệu thống kê dashboard
  static Future<DashboardStats> getDashboardStats() async {
    try {
      final totalSnapshot = await FirebaseFirestore.instance
          .collection('users')
          .count()
          .get();

      final activeSnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('membership_status', isEqualTo: 'Active')
          .count()
          .get();

      final today = DateTime.now();
      final aWeekFromNow = today.add(const Duration(days: 7));

      final expiringSnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where(
            'package_end_date',
            isGreaterThanOrEqualTo: Timestamp.fromDate(today),
          )
          .where(
            'package_end_date',
            isLessThanOrEqualTo: Timestamp.fromDate(aWeekFromNow),
          )
          .count()
          .get();

      return DashboardStats(
        total: totalSnapshot.count ?? 0,
        active: activeSnapshot.count ?? 0,
        expiring: expiringSnapshot.count ?? 0,
      );
    } catch (e) {
      logger.e('Lỗi khi lấy dashboard stats: $e');
      return DashboardStats(total: 0, active: 0, expiring: 0);
    }
  }

  // ========== INSTANCE METHODS - PACKAGE OPERATIONS ==========

  /// Kiểm tra gói tập có còn hiệu lực không
  bool isPackageActive() {
    if (packageEndDate == null) return false;
    return DateTime.now().isBefore(packageEndDate!);
  }

  /// Lấy số ngày còn lại của gói tập
  int getDaysRemaining() {
    if (packageEndDate == null) return 0;
    final today = DateTime.now();
    final diffDays = packageEndDate!.difference(today).inDays;
    return diffDays > 0 ? diffDays : 0;
  }

  /// Sử dụng 1 buổi tập (cho gói theo buổi)
  Future<SessionResult> useSession() async {
    try {
      if (remainingSessions == null || remainingSessions! <= 0) {
        throw Exception('Không còn buổi tập');
      }

      final newRemainingSessions = remainingSessions! - 1;

      await UserModel.update(id, {
        'remaining_sessions': newRemainingSessions,
        'last_checkin_time': DateTime.now(),
      });

      remainingSessions = newRemainingSessions;
      lastCheckinTime = DateTime.now();

      // Nếu hết buổi tập, đổi status thành Expired
      if (newRemainingSessions == 0) {
        await UserModel.update(id, {'membership_status': 'Expired'});
        membershipStatus = 'Expired';
      }

      return SessionResult(
        success: true,
        remainingSessions: newRemainingSessions,
      );
    } catch (e) {
      logger.e('Lỗi khi sử dụng buổi tập: $e');
      rethrow;
    }
  }

  /// Đăng ký gói tập mới
  Future<RegisterPackageResult> registerPackage(
    String packageId, {
    DateTime? startDate,
  }) async {
    try {
      final start = startDate ?? DateTime.now();

      // Note: Bạn cần tạo PackageModel tương tự để lấy thông tin package
      // Tạm thời giả định endDate (cần implement PackageModel sau)
      final endDate = start.add(const Duration(days: 30)); // Placeholder

      await UserModel.update(id, {
        'current_package_id': packageId,
        'package_end_date': endDate,
        'membership_status': 'Active',
      });

      currentPackageId = packageId;
      packageEndDate = endDate;
      membershipStatus = 'Active';

      return RegisterPackageResult(
        success: true,
        endDate: endDate,
        message: 'Đăng ký gói tập thành công',
      );
    } catch (e) {
      logger.e('Lỗi khi đăng ký gói tập: $e');
      rethrow;
    }
  }

  /// Lấy thông tin package hiện tại của user
  Future<PackageModel?> getCurrentPackage() async {
    try {
      if (currentPackageId.isEmpty) {
        logger.w('User chưa có gói tập');
        return null;
      }

      final package = await PackageModel.getByPackageId(currentPackageId);
      logger.i("Obtained package: $package");
      if (package == null) {
        logger.w('Không tìm thấy package với ID: $currentPackageId');
      }
      return package;
    } catch (e) {
      logger.e('Lỗi khi lấy thông tin package: $e');
      return null;
    }
  }

  /// Lấy thông tin user kèm package của user đang đăng nhập
  /// Dùng cho màn hình cần hiển thị thông tin đầy đủ
  static Future<UserPackageInfo?> getCurrentUserWithPackage() async {
    try {
      // 1. Lấy userId từ SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('userId');
      logger.i("Obtained userId: $userId");

      if (userId == null) {
        logger.w('Không tìm thấy userId trong SharedPreferences');
        return null;
      }

      // 2. Lấy thông tin user
      final user = await UserModel.getById(userId);
      if (user == null) {
        logger.w('Không tìm thấy user với ID: $userId');
        return null;
      }

      // 3. Lấy thông tin package (nếu có)
      PackageModel? package;
      if (user.currentPackageId.isNotEmpty) {
        package = await user.getCurrentPackage();
      }

      return UserPackageInfo(user: user, package: package);
    } catch (e) {
      logger.e('Lỗi khi lấy thông tin user và package: $e');
      return null;
    }
  }

  /// Gia hạn gói tập hiện tại
  Future<RenewPackageResult> renewPackage() async {
    try {
      if (currentPackageId.isEmpty) {
        throw Exception('Không có gói tập để gia hạn');
      }

      // Tính ngày bắt đầu mới (từ ngày hết hạn cũ hoặc hôm nay)
      final today = DateTime.now();
      final startDate = packageEndDate != null && packageEndDate!.isAfter(today)
          ? packageEndDate!
          : today;

      // Placeholder: cần implement PackageModel để tính chính xác
      final newEndDate = startDate.add(const Duration(days: 30));

      await UserModel.update(id, {
        'package_end_date': newEndDate,
        'membership_status': 'Active',
      });

      packageEndDate = newEndDate;
      membershipStatus = 'Active';

      return RenewPackageResult(
        success: true,
        endDate: newEndDate,
        message: 'Gia hạn gói tập thành công',
      );
    } catch (e) {
      logger.e('Lỗi khi gia hạn gói tập: $e');
      rethrow;
    }
  }

  /// Copy with method để tạo bản sao với một số thay đổi
  UserModel copyWith({
    String? id,
    String? fullName,
    String? phoneNumber,
    String? email,
    String? avatarUrl,
    DateTime? dateOfBirth,
    String? gender,
    String? membershipStatus,
    String? currentPackageId,
    DateTime? packageEndDate,
    int? remainingSessions,
    List<FrozenHistory>? frozenHistory,
    DateTime? joinDate,
    String? assignedStaffId,
    DateTime? lastCheckinTime,
    String? leadSource,
    List<String>? fitnessGoal,
    List<String>? medicalConditions,
    Map<String, dynamic>? initialMeasurements,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      membershipStatus: membershipStatus ?? this.membershipStatus,
      currentPackageId: currentPackageId ?? this.currentPackageId,
      packageEndDate: packageEndDate ?? this.packageEndDate,
      remainingSessions: remainingSessions ?? this.remainingSessions,
      frozenHistory: frozenHistory ?? this.frozenHistory,
      joinDate: joinDate ?? this.joinDate,
      assignedStaffId: assignedStaffId ?? this.assignedStaffId,
      lastCheckinTime: lastCheckinTime ?? this.lastCheckinTime,
      leadSource: leadSource ?? this.leadSource,
      fitnessGoal: fitnessGoal ?? this.fitnessGoal,
      medicalConditions: medicalConditions ?? this.medicalConditions,
      initialMeasurements: initialMeasurements ?? this.initialMeasurements,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

// ========== HELPER CLASSES ==========

/// Lịch sử đóng băng gói tập
class FrozenHistory {
  final DateTime start;
  final DateTime end;

  FrozenHistory({required this.start, required this.end});

  factory FrozenHistory.fromMap(Map<String, dynamic> map) {
    return FrozenHistory(
      start: UserModel._parseTimestamp(map['start']) ?? DateTime.now(),
      end: UserModel._parseTimestamp(map['end']) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {'start': Timestamp.fromDate(start), 'end': Timestamp.fromDate(end)};
  }
}

/// Kết quả trả về khi lấy danh sách user
class UserListResult {
  final List<UserModel> users;
  final DocumentSnapshot? lastDoc;
  final bool hasMore;

  UserListResult({
    required this.users,
    required this.lastDoc,
    required this.hasMore,
  });
}

/// Thông tin user kèm package - dùng cho màn hình cần hiển thị đầy đủ
class UserPackageInfo {
  final UserModel user;
  final PackageModel? package;

  UserPackageInfo({required this.user, this.package});

  /// Kiểm tra user có gói tập active không
  bool hasActivePackage() {
    return package != null && user.isPackageActive();
  }

  /// Lấy tên gói tập hoặc thông báo chưa có gói
  String getPackageName() {
    return package?.packageName ?? 'Chưa có gói tập';
  }

  /// Lấy số ngày còn lại
  int getDaysRemaining() {
    return user.getDaysRemaining();
  }

  /// Lấy số ngày còn lại (alias cho getDaysLeft)
  int getDaysLeft() {
    return getDaysRemaining();
  }

  /// Format ngày hết hạn
  String getFormattedEndDate() {
    if (user.packageEndDate == null) return 'N/A';
    final date = user.packageEndDate!;
    return '${date.day}/${date.month}/${date.year}';
  }
}

/// Số liệu thống kê dashboard
class DashboardStats {
  final int total;
  final int active;
  final int expiring;

  DashboardStats({
    required this.total,
    required this.active,
    required this.expiring,
  });
}

/// Kết quả sử dụng buổi tập
class SessionResult {
  final bool success;
  final int remainingSessions;

  SessionResult({required this.success, required this.remainingSessions});
}

/// Kết quả đăng ký gói tập
class RegisterPackageResult {
  final bool success;
  final DateTime endDate;
  final String message;

  RegisterPackageResult({
    required this.success,
    required this.endDate,
    required this.message,
  });
}

/// Kết quả gia hạn gói tập
class RenewPackageResult {
  final bool success;
  final DateTime endDate;
  final String message;

  RenewPackageResult({
    required this.success,
    required this.endDate,
    required this.message,
  });
}
