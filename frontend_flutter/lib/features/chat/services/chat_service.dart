import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/chat_message.dart';
import '../models/chat_room.dart';

/// ChatService - Quản lý tin nhắn realtime giữa PT và Client
///
/// QUAN TRỌNG: Chat ID format phải giống React: "${ptId}_${clientId}"
class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Tạo hoặc lấy chat room giữa PT và Client
  ///
  /// Chat ID format: "${ptId}_${clientId}" - PHẢI GIỐNG REACT
  Future<ChatRoom> getOrCreateChat(String ptId, String clientId) async {
    try {
      print('🔍 Getting chat for PT: $ptId, Client: $clientId');

      // Tạo chatId theo format giống React
      final chatId = '${ptId}_${clientId}';
      print('📝 Chat ID: $chatId');

      final chatRef = _firestore.collection('chats').doc(chatId);
      final chatDoc = await chatRef.get();

      if (chatDoc.exists) {
        print('✅ Chat exists');
        return ChatRoom.fromFirestore(chatDoc);
      }

      // Tạo chat mới
      print('📝 Creating new chat...');
      final newChat = ChatRoom(
        id: chatId,
        ptId: ptId,
        clientId: clientId,
        participants: [ptId, clientId],
        lastMessage: null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await chatRef.set(newChat.toFirestore());
      print('✅ Chat created successfully');
      return newChat;
    } catch (e) {
      print('❌ Error getting or creating chat: $e');
      rethrow;
    }
  }

  /// Subscribe realtime to messages - TỰ ĐỘNG CẬP NHẬT
  ///
  /// Trả về Stream để listen realtime updates
  Stream<List<ChatMessage>> subscribeToMessages(String chatId) {
    print('👂 🔥 REALTIME: Listening to messages for chat: $chatId');

    return _firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', descending: false)
        .snapshots()
        .map((snapshot) {
          final messages = snapshot.docs
              .map((doc) => ChatMessage.fromFirestore(doc))
              .toList();

          print('📨 🔥 REALTIME: Messages updated: ${messages.length}');
          return messages;
        });
  }

  /// Gửi tin nhắn
  Future<void> sendMessage({
    required String chatId,
    required String senderId,
    required String text,
  }) async {
    try {
      print('📤 Sending message to chat: $chatId');

      final messagesRef = _firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages');

      final message = ChatMessage(
        id: '', // Firestore sẽ tự tạo ID
        senderId: senderId,
        text: text,
        timestamp: DateTime.now(),
        isRead: false,
      );

      // Thêm tin nhắn vào subcollection
      await messagesRef.add(message.toFirestore());

      // Cập nhật lastMessage trong chat document
      final chatRef = _firestore.collection('chats').doc(chatId);
      await chatRef.update({
        'last_message': {
          'text': text,
          'sender_id': senderId,
          'timestamp': FieldValue.serverTimestamp(),
          'is_read': false,
        },
        'updated_at': FieldValue.serverTimestamp(),
      });

      print('✅ Message sent successfully');
    } catch (e) {
      print('❌ Error sending message: $e');
      rethrow;
    }
  }

  /// Subscribe realtime to all chats của user (PT hoặc Client)
  Stream<List<ChatRoom>> subscribeToUserChats(String userId) {
    print('👂 🔥 REALTIME: Listening to chats for user: $userId');

    return _firestore
        .collection('chats')
        .where('participants', arrayContains: userId)
        .orderBy('updated_at', descending: true)
        .snapshots()
        .map((snapshot) {
          final chats = snapshot.docs
              .map((doc) => ChatRoom.fromFirestore(doc))
              .toList();

          print('💬 🔥 REALTIME: Chats updated: ${chats.length}');
          return chats;
        });
  }

  /// Đánh dấu tin nhắn đã đọc
  Future<void> markMessagesAsRead(String chatId, String userId) async {
    try {
      final messagesRef = _firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages');

      final unreadMessages = await messagesRef
          .where('sender_id', isNotEqualTo: userId)
          .where('is_read', isEqualTo: false)
          .get();

      final batch = _firestore.batch();
      for (var doc in unreadMessages.docs) {
        batch.update(doc.reference, {'is_read': true});
      }

      await batch.commit();
      print('✅ Marked ${unreadMessages.docs.length} messages as read');
    } catch (e) {
      print('❌ Error marking messages as read: $e');
    }
  }

  /// Lấy thông tin chat room
  Future<ChatRoom?> getChatRoom(String chatId) async {
    try {
      final doc = await _firestore.collection('chats').doc(chatId).get();
      if (doc.exists) {
        return ChatRoom.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      print('❌ Error getting chat room: $e');
      return null;
    }
  }
}
