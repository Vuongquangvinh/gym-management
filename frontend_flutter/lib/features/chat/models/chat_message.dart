import 'package:cloud_firestore/cloud_firestore.dart';

/// ChatMessage - Tin nhắn trong chat
///
/// Firestore fields (snake_case):
/// - sender_id: ID người gửi
/// - text: Nội dung tin nhắn
/// - timestamp: Thời gian gửi
/// - is_read: Đã đọc chưa
/// - image_url: URL hình ảnh (optional)
class ChatMessage {
  final String id;
  final String senderId;
  final String text;
  final DateTime timestamp;
  final bool isRead;
  final String? imageUrl; // ← Thêm field này

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.text,
    required this.timestamp,
    required this.isRead,
    this.imageUrl, // ← Thêm parameter này
  });

  /// Tạo ChatMessage từ Firestore DocumentSnapshot
  factory ChatMessage.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;

    // Convert Firestore Timestamp to DateTime
    DateTime timestamp;
    if (data['timestamp'] != null) {
      if (data['timestamp'] is Timestamp) {
        timestamp = (data['timestamp'] as Timestamp).toDate();
      } else {
        timestamp = DateTime.now();
      }
    } else {
      timestamp = DateTime.now();
    }

    return ChatMessage(
      id: doc.id,
      senderId: data['sender_id'] ?? '',
      text: data['text'] ?? '',
      timestamp: timestamp,
      isRead: data['is_read'] ?? false,
      imageUrl: data['image_url'], // ← Thêm field này
    );
  }

  /// Convert to Firestore document (snake_case fields)
  Map<String, dynamic> toFirestore() {
    final data = {
      'sender_id': senderId,
      'text': text,
      'timestamp': FieldValue.serverTimestamp(),
      'is_read': isRead,
    };

    // Thêm image_url nếu có
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      data['image_url'] = imageUrl!;
    }

    return data;
  }

  /// Copy with
  ChatMessage copyWith({
    String? id,
    String? senderId,
    String? text,
    DateTime? timestamp,
    bool? isRead,
    String? imageUrl,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      text: text ?? this.text,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
      imageUrl: imageUrl ?? this.imageUrl,
    );
  }
}
