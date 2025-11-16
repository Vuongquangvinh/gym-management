import 'package:cloud_firestore/cloud_firestore.dart';

/// Model cho notification history
class NotificationModel {
  final String id;
  final String userId;
  final String title;
  final String body;
  final String type; // 'pt_schedule', 'payment', 'general'
  final bool isRead;
  final Timestamp createdAt;
  final Map<String, dynamic>? data; // Extra data (contractId, etc.)

  NotificationModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.body,
    required this.type,
    this.isRead = false,
    required this.createdAt,
    this.data,
  });

  factory NotificationModel.fromMap(
    Map<String, dynamic> map, {
    String id = '',
  }) {
    return NotificationModel(
      id: id,
      userId: map['userId'] ?? '',
      title: map['title'] ?? '',
      body: map['body'] ?? '',
      type: map['type'] ?? 'general',
      isRead: map['isRead'] ?? false,
      createdAt: map['createdAt'] ?? Timestamp.now(),
      data: map['data'] as Map<String, dynamic>?,
    );
  }

  factory NotificationModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return NotificationModel.fromMap(data, id: doc.id);
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'title': title,
      'body': body,
      'type': type,
      'isRead': isRead,
      'createdAt': createdAt,
      if (data != null) 'data': data,
    };
  }

  /// Tạo notification mới trong Firestore
  static Future<String> create({
    required String userId,
    required String title,
    required String body,
    String type = 'general',
    Map<String, dynamic>? data,
  }) async {
    final notificationData = {
      'userId': userId,
      'title': title,
      'body': body,
      'type': type,
      'isRead': false,
      'createdAt': Timestamp.now(),
      if (data != null) 'data': data,
    };

    final docRef = await FirebaseFirestore.instance
        .collection('notifications')
        .add(notificationData);

    return docRef.id;
  }

  /// Đánh dấu đã đọc
  static Future<void> markAsRead(String notificationId) async {
    await FirebaseFirestore.instance
        .collection('notifications')
        .doc(notificationId)
        .update({'isRead': true});
  }

  /// Đánh dấu tất cả đã đọc
  static Future<void> markAllAsRead(String userId) async {
    final snapshot = await FirebaseFirestore.instance
        .collection('notifications')
        .where('userId', isEqualTo: userId)
        .where('isRead', isEqualTo: false)
        .get();

    final batch = FirebaseFirestore.instance.batch();
    for (final doc in snapshot.docs) {
      batch.update(doc.reference, {'isRead': true});
    }
    await batch.commit();
  }

  /// Xóa notification
  static Future<void> delete(String notificationId) async {
    await FirebaseFirestore.instance
        .collection('notifications')
        .doc(notificationId)
        .delete();
  }
}
