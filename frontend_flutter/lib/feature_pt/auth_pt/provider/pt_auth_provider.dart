import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class PtAuthProvider with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<UserCredential?> signInWithEmail(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      // Tìm trong collection 'employees' với email trùng với email đăng nhập
      final query = await _firestore
          .collection('employees')
          .where('email', isEqualTo: email)
          .limit(1)
          .get();
      if (query.docs.isEmpty) {
        throw Exception('Tài khoản không phải PT hoặc chưa được cấp quyền.');
      }
      return credential;
    } on FirebaseAuthException catch (e) {
      throw Exception(e.message ?? 'Đăng nhập thất bại');
    } catch (e) {
      throw Exception('Đăng nhập thất bại: $e');
    }
  }
}
