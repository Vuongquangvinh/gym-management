import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class PendingRequestService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Create a pending request for PT package creation
  Future<void> createPackageCreateRequest({
    required Map<String, dynamic> packageData,
    required String ptId,
    required String ptName,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final requestData = {
      'type': 'package_create',
      'status': 'pending',
      'ptId': ptId,
      'employeeId': ptId,
      'employeeName': ptName,
      'data': packageData,
      'requestedBy': user.uid,
      'requestedByName': ptName,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'rejectionReason': '',
    };

    await _firestore.collection('pendingRequests').add(requestData);
  }

  /// Create a pending request for PT package update
  Future<void> createPackageUpdateRequest({
    required String packageId,
    required Map<String, dynamic> newData,
    required Map<String, dynamic> previousData,
    required String ptId,
    required String ptName,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final requestData = {
      'type': 'package_update',
      'status': 'pending',
      'packageId': packageId,
      'ptId': ptId,
      'employeeId': ptId,
      'employeeName': ptName,
      'data': newData,
      'previousData': previousData,
      'requestedBy': user.uid,
      'requestedByName': ptName,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'rejectionReason': '',
    };

    await _firestore.collection('pendingRequests').add(requestData);
  }

  /// Create a pending request for PT package disable
  Future<void> createPackageDisableRequest({
    required String packageId,
    required Map<String, dynamic> packageData,
    required String ptId,
    required String ptName,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final requestData = {
      'type': 'package_disable',
      'status': 'pending',
      'packageId': packageId,
      'ptId': ptId,
      'employeeId': ptId,
      'employeeName': ptName,
      'data': {...packageData, 'isActive': false},
      'previousData': packageData,
      'requestedBy': user.uid,
      'requestedByName': ptName,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'rejectionReason': '',
    };

    await _firestore.collection('pendingRequests').add(requestData);
  }

  /// Create a pending request for PT package enable
  Future<void> createPackageEnableRequest({
    required String packageId,
    required Map<String, dynamic> packageData,
    required String ptId,
    required String ptName,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final requestData = {
      'type': 'package_enable',
      'status': 'pending',
      'packageId': packageId,
      'ptId': ptId,
      'employeeId': ptId,
      'employeeName': ptName,
      'data': {...packageData, 'isActive': true},
      'previousData': packageData,
      'requestedBy': user.uid,
      'requestedByName': ptName,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'rejectionReason': '',
    };

    await _firestore.collection('pendingRequests').add(requestData);
  }

  /// Create a pending request for PT package deletion
  Future<void> createPackageDeleteRequest({
    required String packageId,
    required Map<String, dynamic> packageData,
    required String ptId,
    required String ptName,
  }) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('User not authenticated');

    final requestData = {
      'type': 'package_delete',
      'status': 'pending',
      'packageId': packageId,
      'ptId': ptId,
      'employeeId': ptId,
      'employeeName': ptName,
      'data': packageData,
      'previousData': packageData,
      'requestedBy': user.uid,
      'requestedByName': ptName,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'rejectionReason': '',
    };

    await _firestore.collection('pendingRequests').add(requestData);
  }

  /// Get employee info for current user
  Future<Map<String, dynamic>?> getCurrentEmployeeInfo() async {
    final user = _auth.currentUser;
    if (user == null) return null;

    final employeeQuery = await _firestore
        .collection('employees')
        .where('email', isEqualTo: user.email)
        .limit(1)
        .get();

    if (employeeQuery.docs.isEmpty) return null;

    final doc = employeeQuery.docs.first;
    return {'id': doc.id, ...doc.data()};
  }
}
