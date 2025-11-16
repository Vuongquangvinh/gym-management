import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
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

  TimeSlot({
    required this.dayOfWeek,
    required this.endTime,
    required this.id,
    required this.isActive,
    required this.note,
    required this.startTime,
  });

  factory TimeSlot.fromMap(Map<String, dynamic> map) {
    return TimeSlot(
      dayOfWeek: map['dayOfWeek'] ?? 0,
      endTime: map['endTime'] ?? '',
      id: map['id'] ?? '',
      isActive: map['isActive'] ?? false,
      note: map['note'] ?? '',
      startTime: map['startTime'] ?? '',
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
    };
  }

  TimeSlot copyWith({
    int? dayOfWeek,
    String? endTime,
    String? id,
    bool? isActive,
    String? note,
    String? startTime,
  }) {
    return TimeSlot(
      dayOfWeek: dayOfWeek ?? this.dayOfWeek,
      endTime: endTime ?? this.endTime,
      id: id ?? this.id,
      isActive: isActive ?? this.isActive,
      note: note ?? this.note,
      startTime: startTime ?? this.startTime,
    );
  }

  /// Kiểm tra slot còn chỗ cho ngày cụ thể
  bool isAvailableForDate(
    DateTime date,
    List<BookedSession> bookedSessions,
    int maxClients,
  ) {
    final sessionsOnDate = bookedSessions.where((session) {
      final sessionDate = session.specificDate;
      return session.timeSlotId == id &&
          sessionDate.year == date.year &&
          sessionDate.month == date.month &&
          sessionDate.day == date.day &&
          session.status != 'cancelled';
    }).length;

    return sessionsOnDate < maxClients;
  }

  /// Lấy số slot đã đặt cho ngày cụ thể
  int getBookedCountForDate(DateTime date, List<BookedSession> bookedSessions) {
    return bookedSessions.where((session) {
      final sessionDate = session.specificDate;
      return session.timeSlotId == id &&
          sessionDate.year == date.year &&
          sessionDate.month == date.month &&
          sessionDate.day == date.day &&
          session.status != 'cancelled';
    }).length;
  }

  /// Lấy danh sách người đã đặt cho ngày cụ thể
  List<BookedSession> getBookedSessionsForDate(
    DateTime date,
    List<BookedSession> bookedSessions,
  ) {
    return bookedSessions.where((session) {
      final sessionDate = session.specificDate;
      return session.timeSlotId == id &&
          sessionDate.year == date.year &&
          sessionDate.month == date.month &&
          sessionDate.day == date.day &&
          session.status != 'cancelled';
    }).toList();
  }
}

class BookedSession {
  final String timeSlotId;
  final DateTime specificDate;
  final String userId;
  final Timestamp bookedAt;
  final String status; // 'pending_payment', 'confirmed', 'cancelled'
  final String? paymentOrderCode; // Mã đơn hàng PayOs
  final int? paymentAmount; // Số tiền thanh toán
  final String? paymentStatus; // 'PENDING', 'PAID', 'CANCELLED'
  final Timestamp? paidAt; // Thời gian thanh toán thành công

  BookedSession({
    required this.timeSlotId,
    required this.specificDate,
    required this.userId,
    required this.bookedAt,
    this.status = 'pending_payment',
    this.paymentOrderCode,
    this.paymentAmount,
    this.paymentStatus,
    this.paidAt,
  });

  factory BookedSession.fromMap(Map<String, dynamic> map) {
    return BookedSession(
      timeSlotId: map['timeSlotId'] ?? '',
      specificDate: (map['specificDate'] as Timestamp).toDate(),
      userId: map['userId'] ?? '',
      bookedAt: map['bookedAt'] as Timestamp,
      status: map['status'] ?? 'pending_payment',
      paymentOrderCode: map['paymentOrderCode'],
      paymentAmount: map['paymentAmount'],
      paymentStatus: map['paymentStatus'],
      paidAt: map['paidAt'] as Timestamp?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'timeSlotId': timeSlotId,
      'specificDate': Timestamp.fromDate(specificDate),
      'userId': userId,
      'bookedAt': bookedAt,
      'status': status,
      if (paymentOrderCode != null) 'paymentOrderCode': paymentOrderCode,
      if (paymentAmount != null) 'paymentAmount': paymentAmount,
      if (paymentStatus != null) 'paymentStatus': paymentStatus,
      if (paidAt != null) 'paidAt': paidAt,
    };
  }

  BookedSession copyWith({
    String? timeSlotId,
    DateTime? specificDate,
    String? userId,
    Timestamp? bookedAt,
    String? status,
    String? paymentOrderCode,
    int? paymentAmount,
    String? paymentStatus,
    Timestamp? paidAt,
  }) {
    return BookedSession(
      timeSlotId: timeSlotId ?? this.timeSlotId,
      specificDate: specificDate ?? this.specificDate,
      userId: userId ?? this.userId,
      bookedAt: bookedAt ?? this.bookedAt,
      status: status ?? this.status,
      paymentOrderCode: paymentOrderCode ?? this.paymentOrderCode,
      paymentAmount: paymentAmount ?? this.paymentAmount,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paidAt: paidAt ?? this.paidAt,
    );
  }
}

class PTPackageModel {
  final String id;

  /// Đặt buổi tập với ngày cụ thể
  static Future<void> bookSessionWithDate({
    required String ptPackageId,
    required String timeSlotId,
    required DateTime specificDate,
    String? userId,
  }) async {
    try {
      String? memberId;
      if (userId != null && userId.isNotEmpty) {
        memberId = userId;
      } else {
        memberId = await UserModel.getMemberId();
        if (memberId == null || memberId.isEmpty) {
          throw Exception('UserId (_id) not found');
        }
      }

      final docRef = FirebaseFirestore.instance
          .collection('ptPackages')
          .doc(ptPackageId);

      final docSnap = await docRef.get();
      if (!docSnap.exists) throw Exception('PT Package not found');

      final data = docSnap.data() as Map<String, dynamic>;
      final List<dynamic> sessions = data['bookedSessions'] ?? [];

      // Kiểm tra xem ngày đó đã full chưa
      final maxClients = data['maxClientsPerSlot'] ?? 1;
      final sessionsOnDate = sessions.where((s) {
        final sessionDate = (s['specificDate'] as Timestamp).toDate();
        return s['timeSlotId'] == timeSlotId &&
            sessionDate.year == specificDate.year &&
            sessionDate.month == specificDate.month &&
            sessionDate.day == specificDate.day &&
            s['status'] != 'cancelled';
      }).length;

      if (sessionsOnDate >= maxClients) {
        throw Exception(
          'Khung giờ này đã đầy cho ngày ${DateFormat('dd/MM/yyyy').format(specificDate)}',
        );
      }

      // Thêm booking mới với trạng thái confirmed (không cần thanh toán)
      final newBooking = BookedSession(
        timeSlotId: timeSlotId,
        specificDate: specificDate,
        userId: memberId,
        bookedAt: Timestamp.now(),
        status: 'confirmed',
      );

      await docRef.update({
        'bookedSessions': FieldValue.arrayUnion([newBooking.toMap()]),
      });

      logger.i(
        'Session booked successfully for ${DateFormat('dd/MM/yyyy').format(specificDate)}',
      );
    } catch (e) {
      logger.e('Error booking session with date: $e');
      rethrow;
    }
  }

  /// Tạo booking tạm với trạng thái pending_payment
  static Future<BookedSession> createPendingBooking({
    required String ptPackageId,
    required String timeSlotId,
    required DateTime specificDate,
    required String orderCode,
    required int amount,
    String? userId,
  }) async {
    try {
      String? memberId;
      if (userId != null && userId.isNotEmpty) {
        memberId = userId;
      } else {
        memberId = await UserModel.getMemberId();
        if (memberId == null || memberId.isEmpty) {
          throw Exception('UserId (_id) not found');
        }
      }

      final docRef = FirebaseFirestore.instance
          .collection('ptPackages')
          .doc(ptPackageId);

      final docSnap = await docRef.get();
      if (!docSnap.exists) throw Exception('PT Package not found');

      final data = docSnap.data() as Map<String, dynamic>;
      final List<dynamic> sessions = data['bookedSessions'] ?? [];

      // Kiểm tra xem ngày đó đã full chưa
      final maxClients = data['maxClientsPerSlot'] ?? 1;
      final sessionsOnDate = sessions.where((s) {
        final sessionDate = (s['specificDate'] as Timestamp).toDate();
        return s['timeSlotId'] == timeSlotId &&
            sessionDate.year == specificDate.year &&
            sessionDate.month == specificDate.month &&
            sessionDate.day == specificDate.day &&
            s['status'] != 'cancelled';
      }).length;

      if (sessionsOnDate >= maxClients) {
        throw Exception(
          'Khung giờ này đã đầy cho ngày ${DateFormat('dd/MM/yyyy').format(specificDate)}',
        );
      }

      // Tạo booking mới với trạng thái pending_payment
      final newBooking = BookedSession(
        timeSlotId: timeSlotId,
        specificDate: specificDate,
        userId: memberId,
        bookedAt: Timestamp.now(),
        status: 'pending_payment',
        paymentOrderCode: orderCode,
        paymentAmount: amount,
        paymentStatus: 'PENDING',
      );

      await docRef.update({
        'bookedSessions': FieldValue.arrayUnion([newBooking.toMap()]),
      });

      logger.i(
        'Pending booking created for ${DateFormat('dd/MM/yyyy').format(specificDate)}',
      );

      return newBooking;
    } catch (e) {
      logger.e('Error creating pending booking: $e');
      rethrow;
    }
  }

  /// Xác nhận thanh toán cho booking
  static Future<void> confirmPaymentForBooking({
    required String ptPackageId,
    required String orderCode,
  }) async {
    try {
      final docRef = FirebaseFirestore.instance
          .collection('ptPackages')
          .doc(ptPackageId);

      final docSnap = await docRef.get();
      if (!docSnap.exists) throw Exception('PT Package not found');

      final data = docSnap.data() as Map<String, dynamic>;
      final List<dynamic> sessions = data['bookedSessions'] ?? [];

      // Tìm booking với orderCode
      final bookingIndex = sessions.indexWhere(
        (s) => s['paymentOrderCode'] == orderCode,
      );

      if (bookingIndex == -1) {
        throw Exception('Booking not found with orderCode: $orderCode');
      }

      // Cập nhật trạng thái booking
      sessions[bookingIndex]['status'] = 'confirmed';
      sessions[bookingIndex]['paymentStatus'] = 'PAID';
      sessions[bookingIndex]['paidAt'] = Timestamp.now();

      await docRef.update({'bookedSessions': sessions});

      logger.i('Payment confirmed for booking with orderCode: $orderCode');
    } catch (e) {
      logger.e('Error confirming payment: $e');
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
  final List<BookedSession> bookedSessions;
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
    this.bookedSessions = const [],
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
      bookedSessions:
          (map['bookedSessions'] as List<dynamic>?)
              ?.map(
                (session) =>
                    BookedSession.fromMap(session as Map<String, dynamic>),
              )
              .toList() ??
          [],
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
      'bookedSessions': bookedSessions
          .map((session) => session.toMap())
          .toList(),
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
    List<BookedSession>? bookedSessions,
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
      bookedSessions: bookedSessions ?? this.bookedSessions,
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

  /// Lấy các ngày khả dụng cho một time slot (theo tuần)
  Map<int, List<DateTime>> getAvailableDatesByWeek(
    String timeSlotId, {
    int weeksAhead = 8,
  }) {
    final slot = availableTimeSlots.firstWhere((s) => s.id == timeSlotId);
    final today = DateTime.now();
    final Map<int, List<DateTime>> weekMap = {};

    for (int i = 0; i < weeksAhead * 7; i++) {
      final date = today.add(Duration(days: i));

      // Chỉ lấy ngày trùng với dayOfWeek của slot
      if (date.weekday % 7 == slot.dayOfWeek) {
        // Tính số tuần từ hôm nay
        final weekNumber = (i / 7).floor();

        if (!weekMap.containsKey(weekNumber)) {
          weekMap[weekNumber] = [];
        }

        weekMap[weekNumber]!.add(date);
      }
    }

    return weekMap;
  }
}
