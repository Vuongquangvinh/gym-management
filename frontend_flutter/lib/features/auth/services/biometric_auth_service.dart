import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';

final logger = Logger();

class BiometricAuthService {
  final LocalAuthentication _localAuth = LocalAuthentication();

  /// Kiểm tra xem thiết bị có hỗ trợ sinh trắc học không
  Future<bool> isBiometricAvailable() async {
    try {
      logger.i('[BIOMETRIC] Checking biometric availability...');
      final isAvailable = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      logger.i('[BIOMETRIC] canCheckBiometrics: $isAvailable');
      logger.i('[BIOMETRIC] isDeviceSupported: $isDeviceSupported');
      final result = isAvailable && isDeviceSupported;
      logger.i('[BIOMETRIC] Final availability: $result');
      return result;
    } catch (e) {
      logger.e('[BIOMETRIC] Error checking biometric availability: $e');
      return false;
    }
  }

  /// Lấy danh sách các phương thức sinh trắc học có sẵn
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      logger.i('[BIOMETRIC] Getting available biometrics...');
      final biometrics = await _localAuth.getAvailableBiometrics();
      logger.i('[BIOMETRIC] Available biometrics: $biometrics');
      return biometrics;
    } catch (e) {
      logger.e('[BIOMETRIC] Error getting available biometrics: $e');
      return [];
    }
  }

  /// Xác thực bằng sinh trắc học
  Future<bool> authenticate({
    String reason = 'Vui lòng xác thực để đăng nhập',
  }) async {
    try {
      final isAvailable = await isBiometricAvailable();
      if (!isAvailable) {
        logger.w('Biometric authentication not available');
        return false;
      }

      return await _localAuth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth:
              true, // Giữ dialog xác thực cho đến khi thành công hoặc người dùng hủy
          biometricOnly:
              true, // Chỉ sử dụng sinh trắc học, không cho phép PIN/Password
        ),
      );
    } on PlatformException catch (e) {
      logger.e('Authentication error: ${e.message}');
      return false;
    } catch (e) {
      logger.e('Unexpected error during authentication: $e');
      return false;
    }
  }

  /// Lưu thông tin đăng nhập để sử dụng cho sinh trắc học
  Future<void> saveBiometricCredentials({
    required String phoneNumber,
    required bool enabled,
  }) async {
    try {
      logger.i(
        '[BIOMETRIC] Saving credentials - phone: $phoneNumber, enabled: $enabled',
      );
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('biometric_enabled', enabled);
      if (enabled) {
        await prefs.setString('biometric_phone', phoneNumber);
      } else {
        await prefs.remove('biometric_phone');
      }
      logger.i('[BIOMETRIC] Credentials saved successfully');

      // Verify saved data
      final savedEnabled = prefs.getBool('biometric_enabled');
      final savedPhone = prefs.getString('biometric_phone');
      logger.i(
        '[BIOMETRIC] Verified saved data - enabled: $savedEnabled, phone: $savedPhone',
      );
    } catch (e) {
      logger.e('[BIOMETRIC] Error saving biometric credentials: $e');
    }
  }

  /// Kiểm tra xem sinh trắc học đã được kích hoạt chưa
  Future<bool> isBiometricEnabled() async {
    try {
      logger.i('[BIOMETRIC] Checking if biometric is enabled...');
      final prefs = await SharedPreferences.getInstance();
      final enabled = prefs.getBool('biometric_enabled') ?? false;
      final phone = prefs.getString('biometric_phone');
      logger.i('[BIOMETRIC] Enabled: $enabled, Phone: $phone');
      return enabled;
    } catch (e) {
      logger.e('[BIOMETRIC] Error checking biometric status: $e');
      return false;
    }
  }

  /// Lấy số điện thoại đã lưu cho sinh trắc học
  Future<String?> getSavedPhoneNumber() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('biometric_phone');
    } catch (e) {
      logger.e('Error getting saved phone number: $e');
      return null;
    }
  }

  /// Xóa thông tin sinh trắc học
  Future<void> clearBiometricData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('biometric_enabled');
      await prefs.remove('biometric_phone');
      logger.i('Biometric data cleared');
    } catch (e) {
      logger.e('Error clearing biometric data: $e');
    }
  }

  /// Lấy tên phương thức sinh trắc học (vân tay, khuôn mặt, etc.)
  Future<String> getBiometricTypeName() async {
    final biometrics = await getAvailableBiometrics();
    if (biometrics.isEmpty) {
      return 'Sinh trắc học';
    }

    if (biometrics.contains(BiometricType.face)) {
      return 'Face ID';
    } else if (biometrics.contains(BiometricType.fingerprint)) {
      return 'Vân tay';
    } else if (biometrics.contains(BiometricType.iris)) {
      return 'Mống mắt';
    } else {
      return 'Sinh trắc học';
    }
  }
}
