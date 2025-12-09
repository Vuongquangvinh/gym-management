import 'package:cloud_firestore/cloud_firestore.dart';

/// Model for PT Review - User đánh giá PT sau khi hoàn thành contract
class PTReviewModel {
  final String id;
  final String contractId;
  final String userId; // Member ID
  final String ptId; // PT Employee ID
  final int rating; // 1-5 stars
  final String comment;
  final Timestamp createdAt;
  final Timestamp? updatedAt;

  // User info for display (cached từ users collection)
  final String? userName;
  final String? userAvatar;

  PTReviewModel({
    required this.id,
    required this.contractId,
    required this.userId,
    required this.ptId,
    required this.rating,
    required this.comment,
    required this.createdAt,
    this.updatedAt,
    this.userName,
    this.userAvatar,
  });

  /// Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    return {
      'contractId': contractId,
      'userId': userId,
      'ptId': ptId,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'userName': userName,
      'userAvatar': userAvatar,
    };
  }

  /// Create from Firestore document
  factory PTReviewModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data()!;
    return PTReviewModel(
      id: snapshot.id,
      contractId: data['contractId'] ?? '',
      userId: data['userId'] ?? '',
      ptId: data['ptId'] ?? '',
      rating: data['rating'] ?? 0,
      comment: data['comment'] ?? '',
      createdAt: data['createdAt'] ?? Timestamp.now(),
      updatedAt: data['updatedAt'],
      userName: data['userName'],
      userAvatar: data['userAvatar'],
    );
  }

  /// Create from Map
  factory PTReviewModel.fromMap(Map<String, dynamic> data, String id) {
    return PTReviewModel(
      id: id,
      contractId: data['contractId'] ?? '',
      userId: data['userId'] ?? '',
      ptId: data['ptId'] ?? '',
      rating: data['rating'] ?? 0,
      comment: data['comment'] ?? '',
      createdAt: data['createdAt'] ?? Timestamp.now(),
      updatedAt: data['updatedAt'],
      userName: data['userName'],
      userAvatar: data['userAvatar'],
    );
  }

  /// Validate rating value
  bool isValidRating() {
    return rating >= 1 && rating <= 5;
  }

  PTReviewModel copyWith({
    String? id,
    String? contractId,
    String? userId,
    String? ptId,
    int? rating,
    String? comment,
    Timestamp? createdAt,
    Timestamp? updatedAt,
    String? userName,
    String? userAvatar,
  }) {
    return PTReviewModel(
      id: id ?? this.id,
      contractId: contractId ?? this.contractId,
      userId: userId ?? this.userId,
      ptId: ptId ?? this.ptId,
      rating: rating ?? this.rating,
      comment: comment ?? this.comment,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      userName: userName ?? this.userName,
      userAvatar: userAvatar ?? this.userAvatar,
    );
  }
}
