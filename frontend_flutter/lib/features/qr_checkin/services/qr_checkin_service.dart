import 'package:cloud_firestore/cloud_firestore.dart';

class QRCheckinService {
  static Future<String?> getUserFullName(String userId) async {
    final userDoc = await FirebaseFirestore.instance
        .collection('users')
        .doc(userId)
        .get();
    if (userDoc.exists) {
      return userDoc.data()?['full_name'] ?? '';
    }
    return null;
  }

  static Future<void> saveCheckin({
    required String? userId,
    required String? fullName,
    required String qrCode,
  }) async {
    await FirebaseFirestore.instance.collection('checkins').add({
      'userId': userId,
      'memberName': fullName,
      'qrCode': qrCode,
      'checkedAt': FieldValue.serverTimestamp(),
      'createdAt': FieldValue.serverTimestamp(),
    });
  }
}
