import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AuthProvider with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  String? _verificationId;

  // Đăng ký bằng email & password
  Future<String?> registerWithEmail(String email, String password) async {
    if (email.isEmpty || password.isEmpty) {
      return 'Email hoặc mật khẩu không được để trống';
    }
    // Kiểm tra định dạng email bằng regex

    // Kiểm tra độ dài mật khẩu
    const int minPasswordLength = 6;
    if (password.length < minPasswordLength) {
      return 'Mật khẩu phải từ $minPasswordLength ký tự trở lên';
    }
    try {
      await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      return null; // null nghĩa là thành công
    } catch (e) {
      return 'Lỗi đăng ký: $e';
    }
  }

  // Đăng ký bằng số điện thoại
  Future<void> registerWithPhone(
    String phoneNumber,
    Function(String) codeSentCallback,
  ) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (PhoneAuthCredential credential) async {
        await _auth.signInWithCredential(credential);
      },
      verificationFailed: (FirebaseAuthException e) {
        debugPrint('Phone verification failed: $e');
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
      debugPrint('OTP error: $e');
      return null;
    }
  }
}
