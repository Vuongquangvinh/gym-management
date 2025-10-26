import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<Map<String, dynamic>?> getSpendingUserByPhone(
    String phoneNumber,
  ) async {
    final query = await _firestore
        .collection('spending_users')
        .where('phone_number', isEqualTo: phoneNumber)
        .limit(1)
        .get();
    if (query.docs.isEmpty) return null;
    return query.docs.first.data();
  }

  Future<bool> transferSpendingUserToUsers(String phoneNumber) async {
    final query = await _firestore
        .collection('spending_users')
        .where('phone_number', isEqualTo: phoneNumber)
        .limit(1)
        .get();
    if (query.docs.isEmpty) return false;
    final spendingUserDoc = query.docs.first;
    final data = spendingUserDoc.data();

    final usersRef = _firestore.collection('users').doc();
    await usersRef.set(data);

    await spendingUserDoc.reference.delete();
    return true;
  }
}
