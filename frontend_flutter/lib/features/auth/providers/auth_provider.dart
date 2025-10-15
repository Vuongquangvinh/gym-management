import 'dart:math';

import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import "package:logger/logger.dart";

final logger = Logger();

class AuthProvider with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  String? _verificationId;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

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
      return null; // Thành công
    }
  }
}
