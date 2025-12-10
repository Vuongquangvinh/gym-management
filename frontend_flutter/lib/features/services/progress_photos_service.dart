import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:frontend_flutter/features/model/progress_photo.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:gal/gal.dart';

class ProgressPhotosService {
  static final _firestore = FirebaseFirestore.instance;
  static final _storage = FirebaseStorage.instance;
  static final _auth = FirebaseAuth.instance;
  static final _imagePicker = ImagePicker();

  /// Chụp ảnh từ camera
  static Future<File?> capturePhoto() async {
    try {
      final XFile? photo = await _imagePicker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (photo == null) return null;
      return File(photo.path);
    } catch (e) {
      print('❌ Error capturing photo: $e');
      return null;
    }
  }

  /// Chọn ảnh từ thư viện
  static Future<File?> pickPhotoFromGallery() async {
    try {
      final XFile? photo = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (photo == null) return null;
      return File(photo.path);
    } catch (e) {
      print('❌ Error picking photo: $e');
      return null;
    }
  }

  /// Upload ảnh lên Firebase Storage và lưu metadata vào Firestore
  static Future<ProgressPhoto?> uploadProgressPhoto({
    required String userId,
    required File imageFile,
    required String angle,
    double? weight,
    String? notes,
    bool isPrivate = true,
  }) async {
    try {
      print('📸 Uploading progress photo...');
      print('🔐 Firestore userId: $userId');

      // Lấy Firebase Auth UID
      final currentUser = _auth.currentUser;
      if (currentUser == null) {
        print('❌ No authenticated user!');
        return null;
      }

      final authUid = currentUser.uid;
      print('🔐 Firebase Auth UID: $authUid');

      // 1. Upload ảnh lên Firebase Storage (dùng Auth UID)
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = '${angle}_$timestamp.jpg';
      final storagePath = 'progress_photos/$authUid/$fileName';
      print('📁 Storage path: $storagePath');

      final storageRef = _storage.ref().child(storagePath);

      final uploadTask = await storageRef.putFile(
        imageFile,
        SettableMetadata(contentType: 'image/jpeg'),
      );

      final photoUrl = await uploadTask.ref.getDownloadURL();
      print('✅ Photo uploaded: $photoUrl');

      // 2. Tạo ProgressPhoto object
      final photo = ProgressPhoto(
        id: '',
        userId: userId,
        photoUrl: photoUrl,
        angle: angle,
        takenAt: DateTime.now(),
        weight: weight,
        notes: notes,
        isPrivate: isPrivate,
      );

      // 3. Lưu metadata vào Firestore
      final docRef = await _firestore
          .collection('users')
          .doc(userId)
          .collection('progress_photos')
          .add(photo.toFirestore());

      print('✅ Progress photo saved with ID: ${docRef.id}');

      return photo.copyWith(id: docRef.id);
    } catch (e) {
      print('❌ Error uploading progress photo: $e');
      return null;
    }
  }

  /// Cập nhật thông tin ảnh
  static Future<bool> updatePhoto(
    String userId,
    ProgressPhoto photo, {
    String? angle,
    double? weight,
    String? notes,
  }) async {
    try {
      final updateData = <String, dynamic>{};

      if (angle != null) updateData['angle'] = angle;
      if (weight != null) updateData['weight'] = weight;
      if (notes != null) updateData['notes'] = notes;

      if (updateData.isEmpty) return true;

      await _firestore
          .collection('users')
          .doc(userId)
          .collection('progress_photos')
          .doc(photo.id)
          .update(updateData);

      print('✅ Photo updated: ${photo.id}');
      return true;
    } catch (e) {
      print('❌ Error updating photo: $e');
      return false;
    }
  }

  /// Tải ảnh về máy
  static Future<bool> downloadPhoto(ProgressPhoto photo) async {
    try {
      // 1. Download ảnh từ URL
      final response = await http.get(Uri.parse(photo.photoUrl));
      if (response.statusCode != 200) {
        print('❌ Failed to download image');
        return false;
      }

      // 2. Lưu vào thư mục tạm
      final tempDir = await getTemporaryDirectory();
      final fileName =
          'progress_${photo.angle}_${photo.takenAt.millisecondsSinceEpoch}.jpg';
      final filePath = '${tempDir.path}/$fileName';
      final file = File(filePath);
      await file.writeAsBytes(response.bodyBytes);

      // 3. Lưu vào gallery
      await Gal.putImage(filePath, album: 'Progress Photos');

      print('✅ Photo saved to gallery: $fileName');
      return true;
    } catch (e) {
      print('❌ Error downloading photo: $e');
      return false;
    }
  }

  /// Lấy tất cả ảnh của user
  static Future<List<ProgressPhoto>> getAllPhotos(String userId) async {
    try {
      final snapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('progress_photos')
          .orderBy('taken_at', descending: true)
          .get();

      return snapshot.docs
          .map((doc) => ProgressPhoto.fromFirestore(doc))
          .toList();
    } catch (e) {
      print('❌ Error getting progress photos: $e');
      return [];
    }
  }

  /// Lấy ảnh theo angle
  static Future<List<ProgressPhoto>> getPhotosByAngle(
    String userId,
    String angle,
  ) async {
    try {
      final snapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('progress_photos')
          .where('angle', isEqualTo: angle)
          .orderBy('taken_at', descending: true)
          .get();

      return snapshot.docs
          .map((doc) => ProgressPhoto.fromFirestore(doc))
          .toList();
    } catch (e) {
      print('❌ Error getting photos by angle: $e');
      return [];
    }
  }

  /// Nhóm ảnh theo tháng
  static List<PhotosByMonth> groupPhotosByMonth(List<ProgressPhoto> photos) {
    final Map<String, List<ProgressPhoto>> grouped = {};

    for (final photo in photos) {
      final monthKey = '${photo.takenAt.year}-${photo.takenAt.month}';
      grouped.putIfAbsent(monthKey, () => []).add(photo);
    }

    return grouped.entries.map((entry) {
      final photos = entry.value;
      final month = DateTime(
        photos.first.takenAt.year,
        photos.first.takenAt.month,
      );

      // Tính cân nặng trung bình của tháng
      final weightsInMonth = photos
          .where((p) => p.weight != null)
          .map((p) => p.weight!)
          .toList();
      final avgWeight = weightsInMonth.isNotEmpty
          ? weightsInMonth.reduce((a, b) => a + b) / weightsInMonth.length
          : null;

      return PhotosByMonth(
        month: month,
        photos: photos,
        averageWeight: avgWeight,
      );
    }).toList()..sort((a, b) => b.month.compareTo(a.month)); // Mới nhất trước
  }

  /// Xóa ảnh
  static Future<void> deletePhoto(String userId, ProgressPhoto photo) async {
    try {
      // 1. Xóa file trên Storage
      try {
        final ref = _storage.refFromURL(photo.photoUrl);
        await ref.delete();
        print('✅ Photo deleted from Storage');
      } catch (e) {
        print('⚠️ Could not delete from Storage (may already be deleted): $e');
      }

      // 2. Xóa document trên Firestore
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('progress_photos')
          .doc(photo.id)
          .delete();

      print('✅ Photo metadata deleted from Firestore');
    } catch (e) {
      print('❌ Error deleting photo: $e');
      rethrow;
    }
  }

  /// Update privacy setting
  static Future<void> updatePrivacy(
    String userId,
    String photoId,
    bool isPrivate,
  ) async {
    try {
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('progress_photos')
          .doc(photoId)
          .update({'is_private': isPrivate});

      print('✅ Privacy updated');
    } catch (e) {
      print('❌ Error updating privacy: $e');
      rethrow;
    }
  }

  /// Lấy ảnh cũ nhất và mới nhất để compare
  static Future<Map<String, ProgressPhoto?>> getBeforeAfterPhotos(
    String userId,
    String angle,
  ) async {
    try {
      final photos = await getPhotosByAngle(userId, angle);
      if (photos.isEmpty) {
        return {'before': null, 'after': null};
      }

      // Sort theo thời gian
      photos.sort((a, b) => a.takenAt.compareTo(b.takenAt));

      return {
        'before': photos.first, // Ảnh cũ nhất
        'after': photos.last, // Ảnh mới nhất
      };
    } catch (e) {
      print('❌ Error getting before/after photos: $e');
      return {'before': null, 'after': null};
    }
  }

  /// Lấy ảnh đầu tiên của mỗi tháng (cho timeline compact)
  static List<ProgressPhoto> getMonthlySnapshots(List<ProgressPhoto> photos) {
    final photosByMonth = groupPhotosByMonth(photos);
    return photosByMonth.map((month) => month.photos.first).toList();
  }
}
