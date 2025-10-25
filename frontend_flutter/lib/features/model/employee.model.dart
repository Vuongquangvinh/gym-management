import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';

final logger = Logger();

/// PTInfo - Thông tin chi tiết dành cho Personal Trainer
class PTInfo {
  List<String> specialties; // Chuyên môn
  int experience; // Số năm kinh nghiệm
  double rating; // Đánh giá trung bình (0-5)
  int totalRatings; // Tổng số lượt đánh giá
  String bio; // Mô tả bản thân
  List<dynamic> certificates; // Chứng chỉ (có thể là String hoặc Object)
  List<String> availableHours; // Khung giờ làm việc
  int maxClientsPerDay; // Số khách hàng tối đa/ngày
  bool isAcceptingNewClients; // Có nhận khách mới không
  List<String> languages; // Ngôn ngữ
  List<dynamic> achievements; // Thành tích (có thể là String hoặc Object)
  Map<String, String> socialMedia; // Mạng xã hội

  PTInfo({
    this.specialties = const [],
    this.experience = 0,
    this.rating = 0.0,
    this.totalRatings = 0,
    this.bio = '',
    this.certificates = const [],
    this.availableHours = const [],
    this.maxClientsPerDay = 8,
    this.isAcceptingNewClients = true,
    this.languages = const ['vi'],
    this.achievements = const [],
    this.socialMedia = const {},
  });

  factory PTInfo.fromMap(Map<String, dynamic> data) {
    return PTInfo(
      specialties: List<String>.from(data['specialties'] ?? []),
      experience: data['experience'] ?? 0,
      rating: (data['rating'] ?? 0).toDouble(),
      totalRatings: data['totalRatings'] ?? 0,
      bio: data['bio'] ?? '',
      certificates: List<dynamic>.from(data['certificates'] ?? []),
      availableHours: List<String>.from(data['availableHours'] ?? []),
      maxClientsPerDay: data['maxClientsPerDay'] ?? 8,
      isAcceptingNewClients: data['isAcceptingNewClients'] ?? true,
      languages: List<String>.from(data['languages'] ?? ['vi']),
      achievements: List<dynamic>.from(data['achievements'] ?? []),
      socialMedia: Map<String, String>.from(data['socialMedia'] ?? {}),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'specialties': specialties,
      'experience': experience,
      'rating': rating,
      'totalRatings': totalRatings,
      'bio': bio,
      'certificates': certificates,
      'availableHours': availableHours,
      'maxClientsPerDay': maxClientsPerDay,
      'isAcceptingNewClients': isAcceptingNewClients,
      'languages': languages,
      'achievements': achievements,
      'socialMedia': socialMedia,
    };
  }

  /// Get formatted rating text (e.g., "4.5 ⭐")
  String get formattedRating {
    return '${rating.toStringAsFixed(1)} ⭐';
  }

  /// Get experience text (e.g., "5 năm kinh nghiệm")
  String get experienceText {
    if (experience == 0) return 'Mới vào nghề';
    if (experience == 1) return '1 năm kinh nghiệm';
    return '$experience năm kinh nghiệm';
  }

  /// Check if has high rating (>= 4.5)
  bool get hasHighRating => rating >= 4.5;

  /// Check if experienced (>= 3 years)
  bool get isExperienced => experience >= 3;
}

/// EmployeeModel - Model nhân viên phía client
class EmployeeModel {
  String id; // Firestore document ID
  String fullName;
  String gender; // 'male', 'female', 'other'
  DateTime? dateOfBirth;
  String phone;
  String email;
  String address;
  String
  position; // 'PT', 'Lễ tân', 'Quản lý', 'Kế toán', 'Bảo vệ', 'Vệ sinh', 'Khác'
  DateTime? startDate;
  String status; // 'active', 'inactive', 'resigned', 'suspended'
  String shift; // 'morning', 'afternoon', 'evening', 'full-time', 'part-time'
  String? uid; // Firebase Auth UID
  String role; // 'employee', 'pt', 'manager', 'admin'
  DateTime? createdAt;
  DateTime? updatedAt;
  double salary;
  double commissionRate; // Tỷ lệ hoa hồng (%)
  int totalClients; // Tổng số khách hàng (dùng cho PT)
  String avatarUrl;
  String idCard; // CMND/CCCD
  String notes;
  PTInfo? ptInfo; // Thông tin PT (chỉ có khi position = 'PT')

  EmployeeModel({
    this.id = '',
    this.fullName = '',
    this.gender = 'male',
    this.dateOfBirth,
    this.phone = '',
    this.email = '',
    this.address = '',
    this.position = '',
    this.startDate,
    this.status = 'active',
    this.shift = '',
    this.uid,
    this.role = 'employee',
    this.createdAt,
    this.updatedAt,
    this.salary = 0.0,
    this.commissionRate = 0.0,
    this.totalClients = 0,
    this.avatarUrl = '',
    this.idCard = '',
    this.notes = '',
    this.ptInfo,
  });

  /// Chuyển đổi từ Firestore DocumentSnapshot
  factory EmployeeModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return EmployeeModel.fromMap(data, doc.id);
  }

  /// Chuyển đổi từ Map
  factory EmployeeModel.fromMap(Map<String, dynamic> data, String docId) {
    return EmployeeModel(
      id: docId,
      fullName: data['fullName'] ?? '',
      gender: data['gender'] ?? 'male',
      dateOfBirth: _parseTimestamp(data['dateOfBirth']),
      phone: data['phone'] ?? '',
      email: data['email'] ?? '',
      address: data['address'] ?? '',
      position: data['position'] ?? '',
      startDate: _parseTimestamp(data['startDate']),
      status: data['status'] ?? 'active',
      shift: data['shift'] ?? '',
      uid: data['uid'],
      role: data['role'] ?? 'employee',
      createdAt: _parseTimestamp(data['createdAt']),
      updatedAt: _parseTimestamp(data['updatedAt']),
      salary: _parseDouble(data['salary']) ?? 0.0,
      commissionRate: _parseDouble(data['commissionRate']) ?? 0.0,
      totalClients: data['totalClients'] ?? 0,
      avatarUrl: data['avatarUrl'] ?? '',
      idCard: data['idCard'] ?? '',
      notes: data['notes'] ?? '',
      ptInfo: data['ptInfo'] != null
          ? PTInfo.fromMap(data['ptInfo'] as Map<String, dynamic>)
          : null,
    );
  }

  /// Chuyển đổi sang Map để lưu vào Firestore
  Map<String, dynamic> toMap() {
    final map = {
      'fullName': fullName,
      'gender': gender,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'phone': phone,
      'email': email,
      'address': address,
      'position': position,
      'startDate': startDate?.toIso8601String(),
      'status': status,
      'shift': shift,
      'uid': uid,
      'role': role,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'salary': salary,
      'commissionRate': commissionRate,
      'totalClients': totalClients,
      'avatarUrl': avatarUrl,
      'idCard': idCard,
      'notes': notes,
    };

    // Chỉ thêm ptInfo nếu là PT
    if (position == 'PT' && ptInfo != null) {
      map['ptInfo'] = ptInfo!.toMap();
    }

    return map;
  }

  /// Helper: Parse Timestamp từ Firestore
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

  /// Helper: Parse double
  static double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      try {
        return double.parse(value);
      } catch (e) {
        logger.e('Không thể parse double từ string: $value');
        return null;
      }
    }
    return null;
  }

  // ==================== COMPUTED PROPERTIES ====================

  /// Check if employee is PT
  bool get isPT => position == 'PT';

  /// Check if active
  bool get isActive => status == 'active';

  /// Get age from date of birth
  int? get age {
    if (dateOfBirth == null) return null;
    final now = DateTime.now();
    int age = now.year - dateOfBirth!.year;
    if (now.month < dateOfBirth!.month ||
        (now.month == dateOfBirth!.month && now.day < dateOfBirth!.day)) {
      age--;
    }
    return age;
  }

  /// Get years of service
  int? get yearsOfService {
    if (startDate == null) return null;
    final now = DateTime.now();
    int years = now.year - startDate!.year;
    if (now.month < startDate!.month ||
        (now.month == startDate!.month && now.day < startDate!.day)) {
      years--;
    }
    return years < 0 ? 0 : years;
  }

  /// Get status display text in Vietnamese
  String get statusText {
    switch (status) {
      case 'active':
        return 'Đang làm việc';
      case 'inactive':
        return 'Tạm nghỉ';
      case 'resigned':
        return 'Đã nghỉ việc';
      case 'suspended':
        return 'Bị đình chỉ';
      default:
        return 'Không xác định';
    }
  }

  /// Get shift display text in Vietnamese
  String get shiftText {
    switch (shift) {
      case 'morning':
        return 'Ca sáng';
      case 'afternoon':
        return 'Ca chiều';
      case 'evening':
        return 'Ca tối';
      case 'full-time':
        return 'Toàn thời gian';
      case 'part-time':
        return 'Bán thời gian';
      default:
        return 'Chưa xác định';
    }
  }

  /// Get gender display text in Vietnamese
  String get genderText {
    switch (gender) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      case 'other':
        return 'Khác';
      default:
        return 'Chưa xác định';
    }
  }

  // ==================== STATIC METHODS ====================

  /// Lấy nhân viên theo ID
  static Future<EmployeeModel?> getById(String id) async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('employees')
          .doc(id)
          .get();
      if (doc.exists) {
        return EmployeeModel.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      logger.e('Error getting employee by ID: $e');
      return null;
    }
  }

  /// Lấy tất cả PT (Personal Trainers)
  static Future<List<EmployeeModel>> getAllPTs({
    bool onlyActive = true,
    bool onlyAcceptingClients = false,
  }) async {
    try {
      Query query = FirebaseFirestore.instance
          .collection('employees')
          .where('position', isEqualTo: 'PT');

      if (onlyActive) {
        query = query.where('status', isEqualTo: 'active');
      }

      final querySnapshot = await query.get();

      List<EmployeeModel> pts = querySnapshot.docs
          .map((doc) => EmployeeModel.fromFirestore(doc))
          .toList();

      // Filter by accepting clients (client-side vì không thể query nested field)
      if (onlyAcceptingClients) {
        pts = pts
            .where((pt) => pt.ptInfo?.isAcceptingNewClients ?? false)
            .toList();
      }

      // Sort by rating
      pts.sort((a, b) {
        final aRating = a.ptInfo?.rating ?? 0;
        final bRating = b.ptInfo?.rating ?? 0;
        return bRating.compareTo(aRating);
      });
      logger.i('Fetched ${pts.length} PTs from Firestore');

      return pts;
    } catch (e) {
      logger.e('Error getting all PTs: $e');
      return [];
    }
  }

  /// Lấy PTs theo chuyên môn
  static Future<List<EmployeeModel>> getPTsBySpecialty(
    String specialty, {
    bool onlyActive = true,
  }) async {
    try {
      final allPTs = await getAllPTs(onlyActive: onlyActive);

      // Filter by specialty (client-side filtering)
      final filteredPTs = allPTs.where((pt) {
        return pt.ptInfo?.specialties.contains(specialty) ?? false;
      }).toList();

      return filteredPTs;
    } catch (e) {
      logger.e('Error getting PTs by specialty: $e');
      return [];
    }
  }

  /// Lấy top rated PTs
  static Future<List<EmployeeModel>> getTopRatedPTs({int limit = 5}) async {
    try {
      final allPTs = await getAllPTs(onlyActive: true);

      // Sort by rating and total ratings
      allPTs.sort((a, b) {
        final aRating = a.ptInfo?.rating ?? 0;
        final bRating = b.ptInfo?.rating ?? 0;
        final aTotal = a.ptInfo?.totalRatings ?? 0;
        final bTotal = b.ptInfo?.totalRatings ?? 0;

        // Primary sort: rating
        final ratingCompare = bRating.compareTo(aRating);
        if (ratingCompare != 0) return ratingCompare;

        // Secondary sort: total ratings
        return bTotal.compareTo(aTotal);
      });

      return allPTs.take(limit).toList();
    } catch (e) {
      logger.e('Error getting top rated PTs: $e');
      return [];
    }
  }

  /// Search employees
  static Future<List<EmployeeModel>> searchEmployees(
    String searchQuery, {
    String? position,
    String? status,
    int limit = 20,
  }) async {
    try {
      Query query = FirebaseFirestore.instance.collection('employees');

      if (position != null && position.isNotEmpty) {
        query = query.where('position', isEqualTo: position);
      }

      if (status != null && status.isNotEmpty) {
        query = query.where('status', isEqualTo: status);
      }

      query = query.limit(limit);

      final querySnapshot = await query.get();
      List<EmployeeModel> employees = querySnapshot.docs
          .map((doc) => EmployeeModel.fromFirestore(doc))
          .toList();

      // Client-side search filtering
      if (searchQuery.isNotEmpty) {
        final lowerQuery = searchQuery.toLowerCase();
        employees = employees.where((emp) {
          return emp.fullName.toLowerCase().contains(lowerQuery) ||
              emp.email.toLowerCase().contains(lowerQuery) ||
              emp.phone.contains(lowerQuery);
        }).toList();
      }

      return employees;
    } catch (e) {
      logger.e('Error searching employees: $e');
      return [];
    }
  }

  /// Get employee statistics
  static Future<Map<String, int>> getStatistics() async {
    try {
      final querySnapshot = await FirebaseFirestore.instance
          .collection('employees')
          .get();

      int total = querySnapshot.docs.length;
      int active = 0;
      int pts = 0;
      int inactive = 0;

      for (var doc in querySnapshot.docs) {
        final data = doc.data();
        if (data['status'] == 'active') active++;
        if (data['position'] == 'PT') pts++;
        if (data['status'] == 'inactive' || data['status'] == 'resigned') {
          inactive++;
        }
      }

      return {
        'total': total,
        'active': active,
        'pts': pts,
        'inactive': inactive,
      };
    } catch (e) {
      logger.e('Error getting employee statistics: $e');
      return {'total': 0, 'active': 0, 'pts': 0, 'inactive': 0};
    }
  }
}
