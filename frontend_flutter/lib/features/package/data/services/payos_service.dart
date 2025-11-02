import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import '../../../../config/api_config.dart';

final logger = Logger();

class PayOSService {
  // URL của backend - lấy từ ApiConfig
  static String get baseUrl => ApiConfig.payosApi;

  /// Tạo payment link cho gói tập gym
  ///
  /// Trả về:
  /// ```dart
  /// {
  ///   "success": true,
  ///   "message": "Tạo payment link thành công",
  ///   "data": {
  ///     "orderCode": 1234567890,
  ///     "checkoutUrl": "https://pay.payos.vn/web/...",
  ///     "qrCode": "https://img.vietqr.io/image/...",
  ///     "amount": 500000,
  ///     "description": "Goi tap ABC"
  ///   }
  /// }
  /// ```
  static Future<Map<String, dynamic>> createGymPayment({
    required String packageId,
    required String packageName,
    required int packagePrice,
    required int packageDuration,
    required String userId,
    required String userName,
    String? userEmail,
    String? userPhone,
    String? returnUrl,
    String? cancelUrl,
  }) async {
    try {
      logger.i('Đang tạo payment link cho gói tập...');
      logger.d('Package: $packageName, Price: $packagePrice');

      final response = await http.post(
        Uri.parse('$baseUrl/create-gym-payment'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'packageId': packageId,
          'packageName': packageName,
          'packagePrice': packagePrice,
          'packageDuration': packageDuration,
          'userId': userId,
          'userName': userName,
          if (userEmail != null) 'userEmail': userEmail,
          if (userPhone != null) 'userPhone': userPhone,
          if (returnUrl != null) 'returnUrl': returnUrl,
          if (cancelUrl != null) 'cancelUrl': cancelUrl,
        }),
      );

      logger.d('Response status: ${response.statusCode}');
      logger.d('Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        logger.i('Tạo payment link thành công!');
<<<<<<< HEAD
        logger.d('📦 Full response data: ${jsonEncode(data)}');
        logger.d('  - success: ${data['success']}');
        logger.d('  - data: ${data['data']}');

        if (data['data'] != null) {
          logger.d('  - checkoutUrl: ${data['data']['checkoutUrl']}');
          logger.d('  - qrCode: ${data['data']['qrCode']}');
          logger.d('  - orderCode: ${data['data']['orderCode']}');
          logger.d('  - amount: ${data['data']['amount']}');
        }

=======
>>>>>>> 28/10-tach-nhanh
        return data;
      } else {
        final error = jsonDecode(response.body);
        logger.e('Lỗi từ server: ${error['message']}');
        throw Exception(error['message'] ?? 'Không thể tạo payment link');
      }
    } catch (e) {
      logger.e('Lỗi khi tạo payment link: $e');
      rethrow;
    }
  }

  /// Lấy trạng thái thanh toán
  static Future<Map<String, dynamic>> getPaymentStatus(String orderCode) async {
    try {
      logger.i('🔍 Đang lấy trạng thái thanh toán: $orderCode');

      final response = await http.get(Uri.parse('$baseUrl/payment/$orderCode'));

      logger.d('📡 Response status code: ${response.statusCode}');
      logger.d('📦 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // Log chi tiết cấu trúc data
        logger.i('✅ Response parsed successfully');
        logger.d('📊 Success: ${data['success']}');
        logger.d('📊 Has data: ${data['data'] != null}');

        if (data['data'] != null) {
          logger.i('💳 Payment status: ${data['data']['status']}');
          logger.d('💳 Full payment data: ${data['data']}');
        }

        return data;
      } else {
        logger.e('❌ Error response: ${response.statusCode}');
        final error = jsonDecode(response.body);
        logger.e('❌ Error message: ${error['message']}');
        throw Exception(error['message'] ?? 'Không thể lấy trạng thái');
      }
    } catch (e) {
      logger.e('💥 Exception khi lấy trạng thái thanh toán: $e');
      logger.e('💥 Stack trace: ${StackTrace.current}');
      rethrow;
    }
  }

  /// Hủy thanh toán
  static Future<Map<String, dynamic>> cancelPayment(
    String orderCode, {
    String? reason,
  }) async {
    try {
      logger.i('Đang hủy thanh toán: $orderCode');

      final response = await http.post(
        Uri.parse('$baseUrl/cancel/$orderCode'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'reason': reason ?? 'Người dùng hủy thanh toán'}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        logger.i('Hủy thanh toán thành công');
        return data;
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Không thể hủy thanh toán');
      }
    } catch (e) {
      logger.e('Lỗi khi hủy thanh toán: $e');
      rethrow;
    }
  }
<<<<<<< HEAD

  /// Xác nhận thanh toán thủ công (sau khi chuyển khoản)
  static Future<Map<String, dynamic>> confirmPayment(String orderCode) async {
    try {
      logger.i('🔄 Đang xác nhận thanh toán: $orderCode');

      final response = await http.post(
        Uri.parse('$baseUrl/confirm-payment'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'orderCode': int.parse(orderCode)}),
      );

      logger.d('📡 Response status: ${response.statusCode}');
      logger.d('📦 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        logger.i('✅ Xác nhận thanh toán thành công');
        return data;
      } else {
        final error = jsonDecode(response.body);
        logger.e('❌ Lỗi xác nhận: ${error['message']}');
        throw Exception(error['message'] ?? 'Không thể xác nhận thanh toán');
      }
    } catch (e) {
      logger.e('💥 Lỗi khi xác nhận thanh toán: $e');
      rethrow;
    }
  }
=======
>>>>>>> 28/10-tach-nhanh
}
