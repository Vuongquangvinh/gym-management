import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WaterTrackingService {
  static const String _waterPrefixKey = 'water_intake_';

  /// Lưu số ly nước đã uống vào SharedPreferences (theo ngày)
  static Future<void> saveWaterIntake(String userId, int glasses) async {
    final prefs = await SharedPreferences.getInstance();
    final today = _getTodayKey();
    await prefs.setInt('$_waterPrefixKey${userId}_$today', glasses);
  }

  /// Lấy số ly nước đã uống từ SharedPreferences (ngày hôm nay)
  static Future<int> getWaterIntake(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    final today = _getTodayKey();
    return prefs.getInt('$_waterPrefixKey${userId}_$today') ?? 0;
  }

  /// Lưu lịch sử uống nước vào Firestore (cuối ngày hoặc khi cần)
  static Future<void> saveWaterHistoryToFirestore(
    String userId,
    int glasses,
    double totalLiters,
    double targetLiters,
  ) async {
    try {
      final today = DateTime.now();
      final dateKey =
          '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

      await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('water_tracking')
          .doc(dateKey)
          .set({
            'date': Timestamp.fromDate(today),
            'glasses_completed': glasses,
            'total_liters': totalLiters,
            'target_liters': targetLiters,
            'completion_percentage': (totalLiters / targetLiters * 100).round(),
            'updated_at': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
    } catch (e) {
      print('❌ Error saving water history to Firestore: $e');
    }
  }

  /// Lấy lịch sử uống nước từ Firestore (7 ngày gần nhất)
  static Future<List<Map<String, dynamic>>> getWaterHistory(
    String userId, {
    int days = 7,
  }) async {
    try {
      final now = DateTime.now();
      final startDate = now.subtract(Duration(days: days));

      final snapshot = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('water_tracking')
          .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(startDate))
          .orderBy('date', descending: true)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        return {
          'date': (data['date'] as Timestamp).toDate(),
          'glasses_completed': data['glasses_completed'] ?? 0,
          'total_liters': data['total_liters'] ?? 0.0,
          'target_liters': data['target_liters'] ?? 0.0,
          'completion_percentage': data['completion_percentage'] ?? 0,
        };
      }).toList();
    } catch (e) {
      print('❌ Error loading water history: $e');
      return [];
    }
  }

  /// Xóa dữ liệu cũ (tự động xóa sau 30 ngày)
  static Future<void> cleanOldData(String userId) async {
    try {
      final thirtyDaysAgo = DateTime.now().subtract(const Duration(days: 30));

      final snapshot = await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .collection('water_tracking')
          .where('date', isLessThan: Timestamp.fromDate(thirtyDaysAgo))
          .get();

      for (var doc in snapshot.docs) {
        await doc.reference.delete();
      }

      print('✅ Cleaned ${snapshot.docs.length} old water tracking records');
    } catch (e) {
      print('❌ Error cleaning old data: $e');
    }
  }

  /// Helper: Lấy key ngày hôm nay (format: YYYY-MM-DD)
  static String _getTodayKey() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  /// Kiểm tra xem có phải ngày mới không (để reset)
  static Future<bool> isNewDay(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    final lastSavedDate = prefs.getString('last_water_date_$userId');
    final today = _getTodayKey();

    if (lastSavedDate != today) {
      await prefs.setString('last_water_date_$userId', today);
      return true;
    }
    return false;
  }

  /// Lấy tổng số ly nước trong tuần
  static Future<int> getWeeklyTotal(String userId) async {
    final history = await getWaterHistory(userId, days: 7);
    return history.fold<int>(
      0,
      (sum, item) => sum + (item['glasses_completed'] as int),
    );
  }

  /// Lấy số ngày hoàn thành mục tiêu trong tuần
  static Future<int> getDaysCompletedThisWeek(String userId) async {
    final history = await getWaterHistory(userId, days: 7);
    return history.where((item) {
      final percentage = item['completion_percentage'] as int;
      return percentage >= 100;
    }).length;
  }
}
