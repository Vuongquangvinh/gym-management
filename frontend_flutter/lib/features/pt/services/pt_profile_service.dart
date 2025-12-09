import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:logger/logger.dart';
import '../models/pt_edit_request_model.dart';

final _logger = Logger();

/// Service for PT profile management using pendingRequests collection
/// Compatible with web admin panel
class PTProfileService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FirebaseStorage _storage = FirebaseStorage.instance;
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  static const String COLLECTION = 'pendingRequests';

  /// Upload certificate images to Firebase Storage
  /// Returns list of download URLs
  static Future<List<String>> uploadCertificateImages(
    String ptId,
    List<File> imageFiles,
  ) async {
    try {
      _logger.i(
        '📤 Uploading ${imageFiles.length} certificate images for PT: $ptId',
      );

      final List<String> downloadUrls = [];
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      for (int i = 0; i < imageFiles.length; i++) {
        final file = imageFiles[i];
        final fileName = 'cert_${ptId}_${timestamp}_$i.jpg';
        final ref = _storage.ref().child('pt_certificates/$ptId/$fileName');

        _logger.i('📤 Uploading image $i: $fileName');

        // Upload file
        final uploadTask = await ref.putFile(file);
        final downloadUrl = await uploadTask.ref.getDownloadURL();

        downloadUrls.add(downloadUrl);
        _logger.i('✅ Image $i uploaded: $downloadUrl');
      }

      _logger.i('✅ All ${downloadUrls.length} images uploaded successfully');
      return downloadUrls;
    } catch (e, stackTrace) {
      _logger.e(
        '❌ Error uploading certificate images',
        error: e,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  /// Submit PT profile edit request
  /// Returns the created request ID
  static Future<String> submitEditRequest({
    required String employeeId,
    required String employeeEmail,
    required String employeeName,
    required String requestedBy,
    required String requestedByName,
    String? employeeAvatar,
    required Map<String, dynamic> data,
    required Map<String, dynamic> previousData,
  }) async {
    try {
      _logger.i(
        '📝 Submitting edit request for PT: $employeeName ($employeeId)',
      );

      final request = PTEditRequestModel(
        id: '', // Will be set by Firestore
        type: 'employee_update',
        employeeId: employeeId,
        employeeEmail: employeeEmail,
        employeeName: employeeName,
        requestedBy: requestedBy,
        requestedByName: requestedByName,
        employeeAvatar: employeeAvatar,
        data: data,
        previousData: previousData,
        status: 'pending',
        createdAt: DateTime.now(),
      );

      final docRef = await _firestore
          .collection(COLLECTION)
          .add(request.toFirestore());

      _logger.i('✅ Edit request created with ID: ${docRef.id}');
      return docRef.id;
    } catch (e, stackTrace) {
      _logger.e(
        '❌ Error submitting edit request',
        error: e,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  /// Get pending edit requests for a PT
  static Future<List<PTEditRequestModel>> getPendingRequests(
    String requestedBy,
  ) async {
    try {
      _logger.i('📋 Fetching pending requests for user: $requestedBy');

      final querySnapshot = await _firestore
          .collection(COLLECTION)
          .where('requestedBy', isEqualTo: requestedBy)
          .where('type', isEqualTo: 'employee_update')
          .where('status', isEqualTo: 'pending')
          .orderBy('createdAt', descending: true)
          .get();

      final requests = querySnapshot.docs
          .map((doc) => PTEditRequestModel.fromFirestore(doc))
          .toList();

      _logger.i('✅ Found ${requests.length} pending requests');
      return requests;
    } catch (e, stackTrace) {
      _logger.e(
        '❌ Error fetching pending requests',
        error: e,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  /// Get all edit requests for a PT (pending, approved, rejected, cancelled)
  static Future<List<PTEditRequestModel>> getAllRequests(
    String requestedBy,
  ) async {
    try {
      _logger.i('📋 Fetching all requests for user: $requestedBy');

      final querySnapshot = await _firestore
          .collection(COLLECTION)
          .where('requestedBy', isEqualTo: requestedBy)
          .where('type', isEqualTo: 'employee_update')
          .orderBy('createdAt', descending: true)
          .get();

      final requests = querySnapshot.docs
          .map((doc) => PTEditRequestModel.fromFirestore(doc))
          .toList();

      _logger.i('✅ Found ${requests.length} total requests');
      return requests;
    } catch (e, stackTrace) {
      _logger.e(
        '❌ Error fetching all requests',
        error: e,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  /// Get current PT employee data
  static Future<Map<String, dynamic>?> getCurrentPTData() async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        _logger.w('⚠️ No authenticated user');
        return null;
      }

      _logger.i('📋 Fetching PT data for email: ${user.email}');

      final employeeQuery = await _firestore
          .collection('employees')
          .where('email', isEqualTo: user.email)
          .limit(1)
          .get();

      if (employeeQuery.docs.isEmpty) {
        _logger.w('⚠️ No employee found with email: ${user.email}');
        return null;
      }

      final employeeDoc = employeeQuery.docs.first;
      final data = employeeDoc.data();

      _logger.i('✅ PT data found: ${data['fullName']}');
      return {'id': employeeDoc.id, ...data};
    } catch (e, stackTrace) {
      _logger.e('❌ Error fetching PT data', error: e, stackTrace: stackTrace);
      rethrow;
    }
  }

  /// Delete certificate image from storage
  static Future<void> deleteCertificateImage(String imageUrl) async {
    try {
      _logger.i('🗑️ Deleting certificate image: $imageUrl');

      final ref = _storage.refFromURL(imageUrl);
      await ref.delete();

      _logger.i('✅ Certificate image deleted');
    } catch (e, stackTrace) {
      _logger.e(
        '❌ Error deleting certificate image',
        error: e,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  /// Cancel pending edit request
  static Future<void> cancelEditRequest(String requestId) async {
    try {
      _logger.i('🚫 Cancelling edit request: $requestId');

      // Get request data to delete certificate images
      final doc = await _firestore.collection(COLLECTION).doc(requestId).get();

      if (!doc.exists) {
        _logger.w('⚠️ Request not found: $requestId');
        return;
      }

      final request = PTEditRequestModel.fromFirestore(doc);

      // Delete certificate images from storage
      for (final imageUrl in request.certificateImages) {
        try {
          await deleteCertificateImage(imageUrl);
        } catch (e) {
          _logger.w('⚠️ Failed to delete image: $imageUrl - $e');
        }
      }

      // Update status to cancelled (don't delete, keep for history)
      await _firestore.collection(COLLECTION).doc(requestId).update({
        'status': 'cancelled',
        'cancelledAt': FieldValue.serverTimestamp(),
      });

      _logger.i('✅ Edit request cancelled and images deleted');
    } catch (e, stackTrace) {
      _logger.e(
        '❌ Error cancelling edit request',
        error: e,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  /// Stream of pending requests for a PT
  static Stream<List<PTEditRequestModel>> streamPendingRequests(
    String requestedBy,
  ) {
    try {
      _logger.i('👂 Starting stream for pending requests: $requestedBy');

      return _firestore
          .collection(COLLECTION)
          .where('requestedBy', isEqualTo: requestedBy)
          .where('type', isEqualTo: 'employee_update')
          .where('status', isEqualTo: 'pending')
          .orderBy('createdAt', descending: true)
          .snapshots()
          .map((snapshot) {
            return snapshot.docs
                .map((doc) => PTEditRequestModel.fromFirestore(doc))
                .toList();
          });
    } catch (e, stackTrace) {
      _logger.e('❌ Error creating stream', error: e, stackTrace: stackTrace);
      rethrow;
    }
  }

  /// Check if PT has any pending requests
  static Future<bool> hasPendingRequests(String requestedBy) async {
    try {
      final querySnapshot = await _firestore
          .collection(COLLECTION)
          .where('requestedBy', isEqualTo: requestedBy)
          .where('type', isEqualTo: 'employee_update')
          .where('status', isEqualTo: 'pending')
          .limit(1)
          .get();

      return querySnapshot.docs.isNotEmpty;
    } catch (e) {
      _logger.e('❌ Error checking pending requests: $e');
      return false;
    }
  }
}
