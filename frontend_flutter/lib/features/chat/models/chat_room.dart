import 'package:cloud_firestore/cloud_firestore.dart';

/// ChatRoom - Phòng chat giữa PT và Client
///
/// Chat ID format: "${ptId}_${clientId}" - PHẢI GIỐNG REACT
///
/// Firestore fields (snake_case):
/// - pt_id: ID của PT
/// - client_id: ID của Client
/// - participants: Array chứa [ptId, clientId]
/// - last_message: Tin nhắn cuối cùng
/// - created_at: Thời gian tạo
/// - updated_at: Thời gian cập nhật
class ChatRoom {
  final String id;
  final String ptId;
  final String clientId;
  final List<String> participants;
  final LastMessage? lastMessage;
  final DateTime createdAt;
  final DateTime updatedAt;

  ChatRoom({
    required this.id,
    required this.ptId,
    required this.clientId,
    required this.participants,
    this.lastMessage,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Tạo ChatRoom từ Firestore DocumentSnapshot
  factory ChatRoom.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;

    // Convert timestamps
    DateTime createdAt = DateTime.now();
    DateTime updatedAt = DateTime.now();

    if (data['created_at'] != null && data['created_at'] is Timestamp) {
      createdAt = (data['created_at'] as Timestamp).toDate();
    }

    if (data['updated_at'] != null && data['updated_at'] is Timestamp) {
      updatedAt = (data['updated_at'] as Timestamp).toDate();
    }

    // Parse last_message
    LastMessage? lastMessage;
    if (data['last_message'] != null) {
      final lastMsgData = data['last_message'] as Map<String, dynamic>;
      lastMessage = LastMessage.fromMap(lastMsgData);
    }

    return ChatRoom(
      id: doc.id,
      ptId: data['pt_id'] ?? '',
      clientId: data['client_id'] ?? '',
      participants: List<String>.from(data['participants'] ?? []),
      lastMessage: lastMessage,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  /// Convert to Firestore document (snake_case fields)
  Map<String, dynamic> toFirestore() {
    return {
      'pt_id': ptId,
      'client_id': clientId,
      'participants': participants,
      'last_message': lastMessage?.toMap(),
      'created_at': FieldValue.serverTimestamp(),
      'updated_at': FieldValue.serverTimestamp(),
    };
  }

  /// Copy with
  ChatRoom copyWith({
    String? id,
    String? ptId,
    String? clientId,
    List<String>? participants,
    LastMessage? lastMessage,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ChatRoom(
      id: id ?? this.id,
      ptId: ptId ?? this.ptId,
      clientId: clientId ?? this.clientId,
      participants: participants ?? this.participants,
      lastMessage: lastMessage ?? this.lastMessage,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// LastMessage - Tin nhắn cuối cùng trong chat room
class LastMessage {
  final String text;
  final String senderId;
  final DateTime timestamp;
  final bool isRead;

  LastMessage({
    required this.text,
    required this.senderId,
    required this.timestamp,
    required this.isRead,
  });

  factory LastMessage.fromMap(Map<String, dynamic> map) {
    DateTime timestamp = DateTime.now();
    if (map['timestamp'] != null && map['timestamp'] is Timestamp) {
      timestamp = (map['timestamp'] as Timestamp).toDate();
    }

    return LastMessage(
      text: map['text'] ?? '',
      senderId: map['sender_id'] ?? '',
      timestamp: timestamp,
      isRead: map['is_read'] ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'text': text,
      'sender_id': senderId,
      'timestamp': FieldValue.serverTimestamp(),
      'is_read': isRead,
    };
  }
}
