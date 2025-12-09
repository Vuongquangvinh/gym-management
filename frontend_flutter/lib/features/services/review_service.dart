import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:frontend_flutter/features/model/pt_review.model.dart';

class ReviewService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Tạo review mới cho PT sau khi contract hoàn thành
  ///
  /// Thực hiện:
  /// 1. Validate rating (1-5) và contract chưa được review
  /// 2. Tạo document trong pt_reviews collection
  /// 3. Update contract: set isReviewed=true, reviewId
  /// 4. Tính lại và cập nhật rating trung bình của PT
  ///
  /// Returns: reviewId nếu thành công, throw exception nếu lỗi
  Future<String> createReview({
    required String contractId,
    required String userId,
    required String ptId,
    required int rating,
    required String comment,
    String? userName,
    String? userAvatar,
  }) async {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw Exception('Rating phải từ 1 đến 5');
    }

    // Kiểm tra contract có tồn tại và chưa được review
    final contractDoc = await _firestore
        .collection('contracts')
        .doc(contractId)
        .get();

    if (!contractDoc.exists) {
      throw Exception('Contract không tồn tại');
    }

    final contractData = contractDoc.data()!;
    if (contractData['isReviewed'] == true) {
      throw Exception('Contract này đã được đánh giá rồi');
    }

    if (contractData['status'] != 'completed') {
      throw Exception('Chỉ có thể đánh giá contract đã hoàn thành');
    }

    try {
      // 1. Tạo review document
      final reviewRef = _firestore.collection('pt_reviews').doc();
      final reviewId = reviewRef.id;

      final review = PTReviewModel(
        id: reviewId,
        contractId: contractId,
        userId: userId,
        ptId: ptId,
        rating: rating,
        comment: comment,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userName: userName,
        userAvatar: userAvatar,
      );

      // 2. Batch write: tạo review + update contract
      final batch = _firestore.batch();

      batch.set(reviewRef, review.toFirestore());

      batch.update(contractDoc.reference, {
        'isReviewed': true,
        'reviewId': reviewId,
        'updatedAt': Timestamp.now(),
      });

      await batch.commit();

      // 3. Cập nhật rating của PT (đợi hoàn thành để đảm bảo data đồng bộ)
      await calculateAndUpdatePTRating(ptId);

      return reviewId;
    } catch (e) {
      throw Exception('Lỗi khi tạo review: $e');
    }
  }

  /// Lấy tất cả reviews của một PT
  ///
  /// Returns: List các PTReviewModel, sorted theo createdAt desc (mới nhất trước)
  Future<List<PTReviewModel>> getReviewsByPtId(String ptId) async {
    try {
      final querySnapshot = await _firestore
          .collection('pt_reviews')
          .where('ptId', isEqualTo: ptId)
          // TODO: Uncomment sau khi Firestore index được tạo
          // .orderBy('createdAt', descending: true)
          .get();

      // Sort manually trong code (tạm thời cho đến khi có index)
      final reviews = querySnapshot.docs
          .map((doc) => PTReviewModel.fromFirestore(doc))
          .toList();

      reviews.sort((a, b) => b.createdAt.compareTo(a.createdAt));

      return reviews;
    } catch (e) {
      throw Exception('Lỗi khi lấy reviews: $e');
    }
  }

  /// Lấy review của một contract cụ thể
  Future<PTReviewModel?> getReviewByContractId(String contractId) async {
    try {
      final querySnapshot = await _firestore
          .collection('pt_reviews')
          .where('contractId', isEqualTo: contractId)
          .limit(1)
          .get();

      if (querySnapshot.docs.isEmpty) {
        return null;
      }

      return PTReviewModel.fromFirestore(querySnapshot.docs.first);
    } catch (e) {
      throw Exception('Lỗi khi lấy review: $e');
    }
  }

  /// Lấy thống kê reviews của PT
  ///
  /// Returns: Map với keys:
  /// - totalReviews: tổng số reviews
  /// - averageRating: điểm trung bình
  /// - ratingDistribution: phân bố theo sao {1: count, 2: count, ...}
  Future<Map<String, dynamic>> getPTReviewStats(String ptId) async {
    try {
      final reviews = await getReviewsByPtId(ptId);

      if (reviews.isEmpty) {
        return {
          'totalReviews': 0,
          'averageRating': 0.0,
          'ratingDistribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        };
      }

      // Tính average rating
      final totalRating = reviews.fold<int>(
        0,
        (sum, review) => sum + review.rating,
      );
      final averageRating = totalRating / reviews.length;

      // Phân bố rating
      final distribution = <int, int>{1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
      for (var review in reviews) {
        distribution[review.rating] = (distribution[review.rating] ?? 0) + 1;
      }

      return {
        'totalReviews': reviews.length,
        'averageRating': averageRating,
        'ratingDistribution': distribution,
      };
    } catch (e) {
      throw Exception('Lỗi khi lấy thống kê: $e');
    }
  }

  /// Tính lại và cập nhật rating trung bình của PT trong employees collection
  ///
  /// **PUBLIC METHOD** - Có thể gọi từ bên ngoài để recalculate rating
  ///
  /// Được gọi tự động sau khi:
  /// - Tạo review mới
  /// - Update review (nếu rating thay đổi)
  /// - Delete review
  ///
  /// Update fields: rating (double), totalReviews (int)
  ///
  /// **Algorithm:**
  /// 1. Query all reviews của PT từ pt_reviews collection
  /// 2. Tính average rating = sum(ratings) / count
  /// 3. Update vào employees.rating và employees.totalReviews
  /// 4. Sử dụng transaction để đảm bảo data consistency
  Future<void> calculateAndUpdatePTRating(String ptId) async {
    try {
      final stats = await getPTReviewStats(ptId);

      // Sử dụng transaction để đảm bảo atomic update
      await _firestore.runTransaction((transaction) async {
        final ptRef = _firestore.collection('employees').doc(ptId);

        // Update cả 2 chỗ:
        // 1. Top-level rating (mới)
        // 2. ptInfo.rating (legacy - để backward compatible)
        transaction.update(ptRef, {
          'rating': stats['averageRating'],
          'totalReviews': stats['totalReviews'],
          'ptInfo.rating': stats['averageRating'], // ✅ Update ptInfo.rating
          'ptInfo.totalRatings':
              stats['totalReviews'], // ✅ Update ptInfo.totalRatings
          'updatedAt': Timestamp.now(),
        });
      });

      print(
        '✅ PT rating updated: ptId=$ptId, '
        'rating=${stats['averageRating'].toStringAsFixed(2)}, '
        'totalReviews=${stats['totalReviews']}',
      );
    } catch (e) {
      // Throw error để caller biết có vấn đề
      print('❌ Error updating PT rating: $e');
      throw Exception('Không thể cập nhật rating của PT: $e');
    }
  }

  /// Xóa review (admin only)
  Future<void> deleteReview(String reviewId, String contractId) async {
    try {
      final batch = _firestore.batch();

      // Xóa review document
      batch.delete(_firestore.collection('pt_reviews').doc(reviewId));

      // Update contract
      batch.update(_firestore.collection('contracts').doc(contractId), {
        'isReviewed': false,
        'reviewId': null,
        'updatedAt': Timestamp.now(),
      });

      // Lấy ptId TRƯỚC KHI xóa review
      final reviewDoc = await _firestore
          .collection('pt_reviews')
          .doc(reviewId)
          .get();

      String? ptId;
      if (reviewDoc.exists) {
        ptId = reviewDoc.data()?['ptId'];
      }

      await batch.commit();

      // Update rating sau khi xóa
      if (ptId != null) {
        await calculateAndUpdatePTRating(ptId);
      }
    } catch (e) {
      throw Exception('Lỗi khi xóa review: $e');
    }
  }

  /// Update review (chỉnh sửa rating hoặc comment)
  Future<void> updateReview({
    required String reviewId,
    required String ptId,
    int? newRating,
    String? newComment,
  }) async {
    if (newRating != null && (newRating < 1 || newRating > 5)) {
      throw Exception('Rating phải từ 1 đến 5');
    }

    try {
      final updateData = <String, dynamic>{'updatedAt': Timestamp.now()};

      if (newRating != null) {
        updateData['rating'] = newRating;
      }
      if (newComment != null) {
        updateData['comment'] = newComment;
      }

      await _firestore
          .collection('pt_reviews')
          .doc(reviewId)
          .update(updateData);

      // Recalculate PT rating nếu rating thay đổi
      if (newRating != null) {
        await calculateAndUpdatePTRating(ptId);
      }
    } catch (e) {
      throw Exception('Lỗi khi cập nhật review: $e');
    }
  }

  /// **ADMIN ONLY** - Recalculate ratings cho TẤT CẢ PT
  ///
  /// Use case:
  /// - Data migration sau khi thêm review system
  /// - Fix data inconsistency
  /// - Manual maintenance
  ///
  /// WARNING: Có thể tốn nhiều Firestore reads!
  Future<Map<String, dynamic>> recalculateAllPTRatings() async {
    try {
      print('🔄 Starting recalculate all PT ratings...');

      // 1. Lấy danh sách tất cả PT employees
      final employeesSnapshot = await _firestore
          .collection('employees')
          .where('role', isEqualTo: 'pt')
          .get();

      int successCount = 0;
      int errorCount = 0;
      final errors = <String, String>{};

      // 2. Loop qua từng PT và recalculate
      for (var employeeDoc in employeesSnapshot.docs) {
        final ptId = employeeDoc.id;
        final ptName = employeeDoc.data()['fullName'] ?? 'Unknown';

        try {
          await calculateAndUpdatePTRating(ptId);
          successCount++;
          print('✅ Updated rating for PT: $ptName ($ptId)');
        } catch (e) {
          errorCount++;
          errors[ptId] = e.toString();
          print('❌ Error for PT $ptName ($ptId): $e');
        }
      }

      final result = {
        'success': true,
        'totalPTs': employeesSnapshot.docs.length,
        'successCount': successCount,
        'errorCount': errorCount,
        'errors': errors,
      };

      print(
        '🎉 Recalculate completed: $successCount success, $errorCount errors',
      );
      return result;
    } catch (e) {
      throw Exception('Lỗi khi recalculate all ratings: $e');
    }
  }
}
