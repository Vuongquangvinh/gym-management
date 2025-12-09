import 'package:cloud_firestore/cloud_firestore.dart';

class BodyMeasurement {
  final String id;
  final double weight; // kg
  final double height; // cm
  final DateTime measuredAt;
  final String? notes;
  final double? bmi;

  BodyMeasurement({
    required this.id,
    required this.weight,
    required this.height,
    required this.measuredAt,
    this.notes,
    this.bmi,
  });

  // Tính BMI
  double calculateBMI() {
    if (height == 0) return 0;
    return weight / ((height / 100) * (height / 100));
  }

  factory BodyMeasurement.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return BodyMeasurement(
      id: doc.id,
      weight: (data['weight'] ?? 0).toDouble(),
      height: (data['height'] ?? 0).toDouble(),
      measuredAt: (data['measured_at'] as Timestamp).toDate(),
      notes: data['notes'],
      bmi: data['bmi']?.toDouble(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'weight': weight,
      'height': height,
      'measured_at': Timestamp.fromDate(measuredAt),
      'notes': notes,
      'bmi': calculateBMI(),
      'created_at': FieldValue.serverTimestamp(),
    };
  }
}

class BodyMeasurementService {
  static final _firestore = FirebaseFirestore.instance;

  /// Thêm một lần đo mới
  static Future<void> addMeasurement({
    required String userId,
    required double weight,
    required double height,
    String? notes,
  }) async {
    try {
      final measurement = BodyMeasurement(
        id: '',
        weight: weight,
        height: height,
        measuredAt: DateTime.now(),
        notes: notes,
      );

      // Lưu vào subcollection
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('body_measurements')
          .add(measurement.toFirestore());

      // Cập nhật giá trị hiện tại trong user document
      await _firestore.collection('users').doc(userId).update({
        'initial_measurements.weight': weight,
        'initial_measurements.height': height,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      print('✅ Body measurement added successfully');
    } catch (e) {
      print('❌ Error adding measurement: $e');
      rethrow;
    }
  }

  /// Lấy lịch sử đo (sắp xếp theo thời gian mới nhất)
  static Future<List<BodyMeasurement>> getMeasurementHistory(
    String userId, {
    int limit = 30,
  }) async {
    try {
      final snapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('body_measurements')
          .orderBy('measured_at', descending: true)
          .limit(limit)
          .get();

      return snapshot.docs
          .map((doc) => BodyMeasurement.fromFirestore(doc))
          .toList();
    } catch (e) {
      print('❌ Error getting measurement history: $e');
      return [];
    }
  }

  /// Lấy đo gần nhất
  static Future<BodyMeasurement?> getLatestMeasurement(String userId) async {
    try {
      final snapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('body_measurements')
          .orderBy('measured_at', descending: true)
          .limit(1)
          .get();

      if (snapshot.docs.isEmpty) return null;

      return BodyMeasurement.fromFirestore(snapshot.docs.first);
    } catch (e) {
      print('❌ Error getting latest measurement: $e');
      return null;
    }
  }

  /// Lấy thống kê thay đổi (so với lần đo đầu tiên)
  static Future<Map<String, dynamic>> getProgressStats(String userId) async {
    try {
      final measurements = await getMeasurementHistory(userId, limit: 100);

      if (measurements.isEmpty) {
        return {
          'total_measurements': 0,
          'weight_change': 0.0,
          'height_change': 0.0,
          'bmi_change': 0.0,
        };
      }

      final latest = measurements.first;
      final oldest = measurements.last;

      return {
        'total_measurements': measurements.length,
        'weight_change': latest.weight - oldest.weight,
        'height_change': latest.height - oldest.height,
        'bmi_change': latest.calculateBMI() - oldest.calculateBMI(),
        'latest_weight': latest.weight,
        'latest_height': latest.height,
        'latest_bmi': latest.calculateBMI(),
        'first_weight': oldest.weight,
        'first_height': oldest.height,
        'first_bmi': oldest.calculateBMI(),
        'days_tracked': latest.measuredAt.difference(oldest.measuredAt).inDays,
      };
    } catch (e) {
      print('❌ Error getting progress stats: $e');
      return {};
    }
  }

  /// Xóa một lần đo
  static Future<void> deleteMeasurement(
    String userId,
    String measurementId,
  ) async {
    try {
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('body_measurements')
          .doc(measurementId)
          .delete();

      print('✅ Measurement deleted successfully');
    } catch (e) {
      print('❌ Error deleting measurement: $e');
      rethrow;
    }
  }

  /// Cập nhật ghi chú cho một lần đo
  static Future<void> updateMeasurementNotes(
    String userId,
    String measurementId,
    String notes,
  ) async {
    try {
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('body_measurements')
          .doc(measurementId)
          .update({'notes': notes, 'updated_at': FieldValue.serverTimestamp()});

      print('✅ Measurement notes updated');
    } catch (e) {
      print('❌ Error updating notes: $e');
      rethrow;
    }
  }

  /// Lấy dữ liệu cho biểu đồ (weight over time)
  static Future<List<Map<String, dynamic>>> getWeightChartData(
    String userId, {
    int days = 30,
  }) async {
    try {
      final startDate = DateTime.now().subtract(Duration(days: days));

      final snapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('body_measurements')
          .where(
            'measured_at',
            isGreaterThanOrEqualTo: Timestamp.fromDate(startDate),
          )
          .orderBy('measured_at', descending: false)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        return {
          'date': (data['measured_at'] as Timestamp).toDate(),
          'weight': (data['weight'] ?? 0).toDouble(),
          'bmi': (data['bmi'] ?? 0).toDouble(),
        };
      }).toList();
    } catch (e) {
      print('❌ Error getting chart data: $e');
      return [];
    }
  }
}
