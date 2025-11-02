import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';
import 'user.model.dart';

final Logger logger = Logger(
  printer: PrettyPrinter(
    methodCount: 0,
    errorMethodCount: 5,
    lineLength: 80,
    colors: true,
    printEmojis: true,
    printTime: false,
  ),
);

class TimeSlot {
  final int dayOfWeek;
  final String endTime;
  final String id;
  final bool isActive;
  final String note;
  final String startTime;
  final bool isChosen;
  final String userIdChosenPackage;

  TimeSlot({
    required this.dayOfWeek,
    required this.endTime,
    required this.id,
    required this.isActive,
    required this.note,
    required this.startTime,
    this.isChosen = false,
    this.userIdChosenPackage = '',
  });

  factory TimeSlot.fromMap(Map<String, dynamic> map) {
    return TimeSlot(
      dayOfWeek: map['dayOfWeek'] ?? 0,
      endTime: map['endTime'] ?? '',
      id: map['id'] ?? '',
      isActive: map['isActive'] ?? false,
      note: map['note'] ?? '',
      startTime: map['startTime'] ?? '',
      isChosen: map['isChosen'] ?? false,
      userIdChosenPackage: map['userIdChosenPackage'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'dayOfWeek': dayOfWeek,
      'endTime': endTime,
      'id': id,
      'isActive': isActive,
      'note': note,
      'startTime': startTime,
      'isChosen': isChosen,
      'userIdChosenPackage': userIdChosenPackage,
    };
  }
}

class PTPackageModel {
  final String id;

  /// Cập nhật trạng thái chọn khung giờ cho một package
  static Future<void> updateTimeSlotSelection({
    required String ptPackageId,
    required String timeSlotId,
    String? userId,
  }) async {
    try {
      String? memberId;
      if (userId != null && userId.isNotEmpty) {
        memberId = userId;
      } else {
        memberId = await UserModel.getMemberId();
        if (memberId == null || memberId.isEmpty)
          throw Exception('UserId (_id) not found');
      }
      final docRef = FirebaseFirestore.instance
          .collection('ptPackages')
          .doc(ptPackageId);
      final docSnap = await docRef.get();
      if (!docSnap.exists) throw Exception('PT Package not found');
      final data = docSnap.data() as Map<String, dynamic>;
      final List<dynamic> slots = data['availableTimeSlots'] ?? [];
      final updatedSlots = slots.map((slot) {
        if (slot['id'] == timeSlotId) {
          return {...slot, 'isChosen': true, 'userIdChosenPackage': memberId};
        }
        return slot;
      }).toList();
      await docRef.update({'availableTimeSlots': updatedSlots});
    } catch (e) {
      logger.e('Error updating time slot selection: $e');
      rethrow;
    }
  }

  final int advanceBookingHours;
  final List<TimeSlot> availableTimeSlots;
  final String billingType; // 'session', 'monthly', 'quarterly', 'yearly'
  final Timestamp? createdAt;
  final List<dynamic> customTimeSlots;
  final String description;
  final int discount;
  final int duration;
  final List<String> features;
  final bool isActive;
  final bool isPopular;
  final bool isChosen;
  final String userIdChosenPackage;
  final int maxClientsPerSlot;
  final int? months; // Số tháng (nếu là gói theo tháng)
  final String name;
  final int originalPrice;
  final String packageType; // 'single', 'group', 'couple'
  final int price;
  final String ptId;
  final bool requiresAdvanceBooking;
  final int sessionDuration;
  final int sessions;
  final Timestamp? updatedAt;

  PTPackageModel({
    required this.id,
    required this.advanceBookingHours,
    required this.availableTimeSlots,
    required this.billingType,
    this.createdAt,
    required this.customTimeSlots,
    required this.description,
    required this.discount,
    required this.duration,
    required this.features,
    required this.isActive,
    required this.isPopular,
    required this.isChosen,
    required this.userIdChosenPackage,
    required this.maxClientsPerSlot,
    this.months,
    required this.name,
    required this.originalPrice,
    required this.packageType,
    required this.price,
    required this.ptId,
    required this.requiresAdvanceBooking,
    required this.sessionDuration,
    required this.sessions,
    this.updatedAt,
  });

  // Getter cho packageType - Loại gói tập (chỉ có 2 loại)
  bool get isSinglePackage => packageType == 'single';
  bool get isGroupPackage => packageType == 'group';

  // Getter cho billingType - Cách tính phí (chỉ có 2 loại)
  bool get isSessionBilling => billingType == 'session';
  bool get isMonthlyBilling => billingType == 'monthly';

  // Helper method để lấy tên hiển thị packageType
  String get packageTypeDisplayName {
    return isSinglePackage ? 'Gói cá nhân' : 'Gói nhóm';
  }

  // Helper method để lấy tên hiển thị billingType
  String get billingTypeDisplayName {
    if (isSessionBilling) {
      return 'Theo buổi ($sessions buổi)';
    } else if (isMonthlyBilling && months != null) {
      return 'Theo tháng ($months tháng)';
    }
    return 'Chưa xác định';
  }

  // Mô tả chi tiết về gói
  String get durationDescription {
    String result = packageTypeDisplayName;

    if (isSessionBilling) {
      result += ' • $sessions buổi';
    } else if (isMonthlyBilling && months != null) {
      result += ' • $months tháng';
    }

    result += ' • $sessionDuration phút/buổi';

    if (isGroupPackage && maxClientsPerSlot > 1) {
      result += ' • Tối đa $maxClientsPerSlot người';
    }

    return result;
  }

  factory PTPackageModel.fromMap(Map<String, dynamic> map, {String id = ''}) {
    return PTPackageModel(
      id: id,
      advanceBookingHours: map['advanceBookingHours'] ?? 0,
      availableTimeSlots:
          (map['availableTimeSlots'] as List<dynamic>?)
              ?.map((slot) => TimeSlot.fromMap(slot as Map<String, dynamic>))
              .toList() ??
          [],
      billingType: map['billingType'] ?? 'session',
      createdAt: map['createdAt'] as Timestamp?,
      customTimeSlots: map['customTimeSlots'] ?? [],
      description: map['description'] ?? '',
      discount: map['discount'] ?? 0,
      duration: map['duration'] ?? 0,
      features:
          (map['features'] as List<dynamic>?)
              ?.map((feature) => feature.toString())
              .toList() ??
          [],
      isActive: map['isActive'] ?? false,
      isPopular: map['isPopular'] ?? false,
      isChosen: map['isChosen'] ?? false,
      userIdChosenPackage: map['userIdChosenPackage'] ?? '',
      maxClientsPerSlot: map['maxClientsPerSlot'] ?? 0,
      months: map['months'] as int?,
      name: map['name'] ?? '',
      originalPrice: map['originalPrice'] ?? 0,
      packageType: map['packageType'] ?? '',
      price: map['price'] ?? 0,
      ptId: map['ptId'] ?? '',
      requiresAdvanceBooking: map['requiresAdvanceBooking'] ?? false,
      sessionDuration: map['sessionDuration'] ?? 0,
      sessions: map['sessions'] ?? 0,
      updatedAt: map['updatedAt'] as Timestamp?,
    );
  }

  factory PTPackageModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return PTPackageModel.fromMap(data, id: doc.id);
  }

  // Lấy danh sách packages theo ptId
  static Future<List<PTPackageModel>> getPackagesByPtId(String ptId) async {
    try {
      logger.i('Fetching packages for PT ID: $ptId');

      final querySnapshot = await FirebaseFirestore.instance
          .collection('ptPackages')
          .where('ptId', isEqualTo: ptId)
          .get();

      logger.i('Found ${querySnapshot.docs.length} packages');

      return querySnapshot.docs
          .map((doc) => PTPackageModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      logger.e('Error fetching packages by ptId: $e');
      rethrow;
    }
  }

  Map<String, dynamic> toMap() {
    return {
      'advanceBookingHours': advanceBookingHours,
      'availableTimeSlots': availableTimeSlots
          .map((slot) => slot.toMap())
          .toList(),
      'billingType': billingType,
      'createdAt': createdAt,
      'customTimeSlots': customTimeSlots,
      'description': description,
      'discount': discount,
      'duration': duration,
      'features': features,
      'isActive': isActive,
      'isPopular': isPopular,
      'isChosen': isChosen,
      'userIdChosenPackage': userIdChosenPackage,
      'maxClientsPerSlot': maxClientsPerSlot,
      if (months != null) 'months': months,
      'name': name,
      'originalPrice': originalPrice,
      'packageType': packageType,
      'price': price,
      'ptId': ptId,
      'requiresAdvanceBooking': requiresAdvanceBooking,
      'sessionDuration': sessionDuration,
      'sessions': sessions,
      'updatedAt': updatedAt,
    };
  }

  PTPackageModel copyWith({
    String? id,
    int? advanceBookingHours,
    List<TimeSlot>? availableTimeSlots,
    String? billingType,
    Timestamp? createdAt,
    List<dynamic>? customTimeSlots,
    String? description,
    int? discount,
    int? duration,
    List<String>? features,
    bool? isActive,
    bool? isPopular,
    bool? isChosen,
    String? userIdChosenPackage,
    int? maxClientsPerSlot,
    int? months,
    String? name,
    int? originalPrice,
    String? packageType,
    int? price,
    String? ptId,
    bool? requiresAdvanceBooking,
    int? sessionDuration,
    int? sessions,
    Timestamp? updatedAt,
  }) {
    return PTPackageModel(
      id: id ?? this.id,
      advanceBookingHours: advanceBookingHours ?? this.advanceBookingHours,
      availableTimeSlots: availableTimeSlots ?? this.availableTimeSlots,
      billingType: billingType ?? this.billingType,
      createdAt: createdAt ?? this.createdAt,
      customTimeSlots: customTimeSlots ?? this.customTimeSlots,
      description: description ?? this.description,
      discount: discount ?? this.discount,
      duration: duration ?? this.duration,
      features: features ?? this.features,
      isActive: isActive ?? this.isActive,
      isPopular: isPopular ?? this.isPopular,
      isChosen: isChosen ?? this.isChosen,
      userIdChosenPackage: userIdChosenPackage ?? this.userIdChosenPackage,
      maxClientsPerSlot: maxClientsPerSlot ?? this.maxClientsPerSlot,
      months: months ?? this.months,
      name: name ?? this.name,
      originalPrice: originalPrice ?? this.originalPrice,
      packageType: packageType ?? this.packageType,
      price: price ?? this.price,
      ptId: ptId ?? this.ptId,
      requiresAdvanceBooking:
          requiresAdvanceBooking ?? this.requiresAdvanceBooking,
      sessionDuration: sessionDuration ?? this.sessionDuration,
      sessions: sessions ?? this.sessions,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
