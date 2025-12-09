import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';
import "package:logger/logger.dart";
import '../services/biometric_auth_service.dart';

final logger = Logger();

class AuthProvider with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  String? _verificationId;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final BiometricAuthService _biometricService = BiometricAuthService();

  Future<void> sendOTP(
    String phoneNumber,
    Function(String) codeSentCallback,
    Function(String) errorCallback,
  ) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (PhoneAuthCredential credential) async {
        await _auth.signInWithCredential(credential);
      },
      verificationFailed: (FirebaseAuthException e) {
        errorCallback('Phone verification failed: $e');
      },
      codeSent: (String verificationId, int? resendToken) {
        _verificationId = verificationId;
        codeSentCallback(verificationId);
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        _verificationId = verificationId;
      },
    );
  }

  // Xác thực OTP
  Future<UserCredential?> verifyOTP(String smsCode) async {
    if (_verificationId == null) return null;
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: smsCode,
      );
      return await _auth.signInWithCredential(credential);
    } catch (e) {
      logger.e('OTP error: $e');
      return null;
    }
  }

  Future<bool> transferSpendingUserToUsers(String phoneNumber) async {
    try {
      // Tìm user trong spending_users
      final query = await _firestore
          .collection('spending_users')
          .where('phone_number', isEqualTo: phoneNumber)
          .limit(1)
          .get();
      if (query.docs.isEmpty) return false;
      final spendingUserDoc = query.docs.first;
      final data = spendingUserDoc.data();

      // Tạo user mới trong collection users
      final usersRef = _firestore.collection('users').doc();
      await usersRef.set(data);

      // Xóa user khỏi spending_users
      await spendingUserDoc.reference.delete();
      return true;
    } catch (e) {
      debugPrint('Chuyển user lỗi: $e');
      return false;
    }
  }

  Future<String?> loginWithPhone(
    String phoneNumber,
    String smsCode,
    Function(String) codeSentCallback,
    Function(String) errorCallback,
  ) async {
    logger.i("Login with phone: $phoneNumber");
    // 1. Kiểm tra trong users
    final userQuery = await _firestore
        .collection('users')
        .where('phone_number', isEqualTo: phoneNumber)
        .limit(1)
        .get();

    if (userQuery.docs.isNotEmpty) {
      if (smsCode.isEmpty) {
        await sendOTP(phoneNumber, codeSentCallback, errorCallback);
        return null;
      } else {
        try {
          final userCredential = await verifyOTP(smsCode);
          if (userCredential == null) {
            return 'Xác thực OTP thất bại';
          }
          // Lưu userId vào SharedPreferences
          final userId = userQuery.docs.first.id;
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('userId', userId);
          await prefs.setString('userRole', 'user');
          await prefs.setBool('isLoggedIn', true); // Đánh dấu đã đăng nhập
          return null; // Thành công
        } catch (e, stack) {
          debugPrint('[OTP VERIFY ERROR] $e');
          debugPrint('[STACKTRACE] $stack');
          return 'Xác thực OTP thất bại: $e';
        }
      }
    }

    final spendingQuery = await _firestore
        .collection('spending_users')
        .where('phone_number', isEqualTo: phoneNumber)
        .limit(1)
        .get();

    if (spendingQuery.docs.isEmpty) {
      return 'Số điện thoại chưa được đăng ký';
    }

    if (smsCode.isEmpty) {
      await sendOTP(phoneNumber, codeSentCallback, errorCallback);
      return null;
    } else {
      final userCredential = await verifyOTP(smsCode);
      if (userCredential == null) {
        return 'Xác thực OTP thất bại';
      }
      final success = await transferSpendingUserToUsers(phoneNumber);
      if (!success) {
        return 'Không tìm thấy thông tin user hoặc chuyển đổi thất bại';
      }
      // Sau khi chuyển, lấy userId mới tạo và lưu vào SharedPreferences
      final userQuery = await _firestore
          .collection('users')
          .where('phone_number', isEqualTo: phoneNumber)
          .limit(1)
          .get();
      if (userQuery.docs.isNotEmpty) {
        final userId = userQuery.docs.first.id;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('userId', userId);
        await prefs.setString('userRole', 'user');
        await prefs.setBool('isLoggedIn', true);
      }
      return null; // Thành công
    }
  }

  // Đăng xuất
  Future<void> logout() async {
    try {
      // Đăng xuất Firebase
      await _auth.signOut();

      // Xóa thông tin đăng nhập trong SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('userId');
      await prefs.remove('userRole');
      await prefs.remove('employeeId');
      await prefs.remove('ptEmail');
      await prefs.setBool('isLoggedIn', false);

      // Không xóa thông tin sinh trắc học khi logout
      // Người dùng có thể tắt sinh trắc học trong settings nếu muốn

      notifyListeners();
      logger.i('Đăng xuất thành công');
    } catch (e) {
      logger.e('Lỗi khi đăng xuất: $e');
      rethrow;
    }
  }

  // Kiểm tra trạng thái đăng nhập
  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('isLoggedIn') ?? false;
  }

  // ========== BIOMETRIC AUTHENTICATION ==========

  /// Kiểm tra xem sinh trắc học có khả dụng không
  Future<bool> isBiometricAvailable() async {
    logger.i('[AUTH_PROVIDER] Checking biometric availability...');
    final result = await _biometricService.isBiometricAvailable();
    logger.i('[AUTH_PROVIDER] Biometric available: $result');
    return result;
  }

  /// Kiểm tra xem sinh trắc học đã được kích hoạt chưa
  Future<bool> isBiometricEnabled() async {
    logger.i('[AUTH_PROVIDER] Checking if biometric enabled...');
    final result = await _biometricService.isBiometricEnabled();
    logger.i('[AUTH_PROVIDER] Biometric enabled: $result');
    return result;
  }

  /// Đăng nhập bằng sinh trắc học
  Future<String?> loginWithBiometric() async {
    try {
      // Kiểm tra sinh trắc học có được kích hoạt không
      final isEnabled = await _biometricService.isBiometricEnabled();
      if (!isEnabled) {
        return 'Sinh trắc học chưa được kích hoạt';
      }

      // Lấy số điện thoại đã lưu
      final phoneNumber = await _biometricService.getSavedPhoneNumber();
      if (phoneNumber == null) {
        return 'Không tìm thấy thông tin đăng nhập';
      }

      // Xác thực sinh trắc học
      final biometricName = await _biometricService.getBiometricTypeName();
      final authenticated = await _biometricService.authenticate(
        reason: 'Xác thực $biometricName để đăng nhập',
      );

      if (!authenticated) {
        return 'Xác thực sinh trắc học thất bại';
      }

      // Kiểm tra user trong Firestore
      final userQuery = await _firestore
          .collection('users')
          .where('phone_number', isEqualTo: phoneNumber)
          .limit(1)
          .get();

      if (userQuery.docs.isEmpty) {
        // Xóa thông tin sinh trắc học nếu user không tồn tại
        await _biometricService.clearBiometricData();
        return 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.';
      }

      // Lưu thông tin đăng nhập
      final userId = userQuery.docs.first.id;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userId', userId);
      await prefs.setBool('isLoggedIn', true);

      logger.i('Biometric login successful for user: $userId');
      notifyListeners();
      return null; // Thành công
    } catch (e) {
      logger.e('Biometric login error: $e');
      return 'Lỗi đăng nhập sinh trắc học: $e';
    }
  }

  /// Kích hoạt/tắt sinh trắc học
  Future<String?> toggleBiometric(String phoneNumber, bool enable) async {
    try {
      logger.i('[AUTH_PROVIDER] ===== Toggle Biometric =====');
      logger.i('[AUTH_PROVIDER] Phone: $phoneNumber, Enable: $enable');

      if (enable) {
        // Kiểm tra khả dụng
        final isAvailable = await _biometricService.isBiometricAvailable();
        logger.i('[AUTH_PROVIDER] Biometric available: $isAvailable');

        if (!isAvailable) {
          logger.w('[AUTH_PROVIDER] Device does not support biometric');
          return 'Thiết bị không hỗ trợ sinh trắc học';
        }

        // Yêu cầu xác thực trước khi kích hoạt
        final biometricName = await _biometricService.getBiometricTypeName();
        logger.i('[AUTH_PROVIDER] Biometric name: $biometricName');
        logger.i('[AUTH_PROVIDER] Requesting authentication...');

        final authenticated = await _biometricService.authenticate(
          reason: 'Xác thực $biometricName để kích hoạt đăng nhập nhanh',
        );
        logger.i('[AUTH_PROVIDER] Authentication result: $authenticated');

        if (!authenticated) {
          logger.w('[AUTH_PROVIDER] Authentication failed');
          return 'Xác thực sinh trắc học thất bại';
        }
      }

      // Lưu hoặc xóa thông tin
      logger.i('[AUTH_PROVIDER] Saving credentials...');
      await _biometricService.saveBiometricCredentials(
        phoneNumber: phoneNumber,
        enabled: enable,
      );
      logger.i('[AUTH_PROVIDER] Credentials saved successfully');

      notifyListeners();
      logger.i('[AUTH_PROVIDER] ===== Toggle Complete =====');
      return null; // Thành công
    } catch (e) {
      logger.e('[AUTH_PROVIDER] Toggle biometric error: $e');
      return 'Lỗi khi cài đặt sinh trắc học: $e';
    }
  }

  /// Lấy tên phương thức sinh trắc học
  Future<String> getBiometricName() async {
    return await _biometricService.getBiometricTypeName();
  }
}
