import 'package:cloud_firestore/cloud_firestore.dart';

/// Model cho ảnh tiến độ tập luyện
class ProgressPhoto {
  final String id;
  final String userId;
  final String photoUrl;
  final String angle; // 'front', 'side', 'back'
  final DateTime takenAt;
  final double? weight; // Cân nặng tại thời điểm chụp (optional)
  final String? notes; // Ghi chú (optional)
  final bool isPrivate; // Riêng tư hay share với PT

  ProgressPhoto({
    required this.id,
    required this.userId,
    required this.photoUrl,
    required this.angle,
    required this.takenAt,
    this.weight,
    this.notes,
    this.isPrivate = true,
  });

  /// Tạo từ Firestore document
  factory ProgressPhoto.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ProgressPhoto(
      id: doc.id,
      userId: data['user_id'] ?? '',
      photoUrl: data['photo_url'] ?? '',
      angle: data['angle'] ?? 'front',
      takenAt: (data['taken_at'] as Timestamp).toDate(),
      weight: data['weight']?.toDouble(),
      notes: data['notes'],
      isPrivate: data['is_private'] ?? true,
    );
  }

  /// Chuyển sang Map để lưu Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'user_id': userId,
      'photo_url': photoUrl,
      'angle': angle,
      'taken_at': Timestamp.fromDate(takenAt),
      if (weight != null) 'weight': weight,
      if (notes != null) 'notes': notes,
      'is_private': isPrivate,
    };
  }

  /// Copy với thay đổi
  ProgressPhoto copyWith({
    String? id,
    String? userId,
    String? photoUrl,
    String? angle,
    DateTime? takenAt,
    double? weight,
    String? notes,
    bool? isPrivate,
  }) {
    return ProgressPhoto(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      photoUrl: photoUrl ?? this.photoUrl,
      angle: angle ?? this.angle,
      takenAt: takenAt ?? this.takenAt,
      weight: weight ?? this.weight,
      notes: notes ?? this.notes,
      isPrivate: isPrivate ?? this.isPrivate,
    );
  }
}

/// Helper để nhóm ảnh theo tháng
class PhotosByMonth {
  final DateTime month; // Tháng (year + month)
  final List<ProgressPhoto> photos;
  final double? averageWeight;

  PhotosByMonth({
    required this.month,
    required this.photos,
    this.averageWeight,
  });

  /// Format tháng hiển thị
  String get monthLabel {
    final months = [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ];
    return '${months[month.month - 1]} ${month.year}';
  }
}
