import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/chat_service.dart';
import '../models/chat_message.dart';

/// ChatScreen - Màn hình chat giữa Client và PT
///
/// REALTIME: Tự động cập nhật khi có tin nhắn mới
class ChatScreen extends StatefulWidget {
  final String ptId;
  final String ptName;
  final String?
  clientId; // Optional: nếu có thì dùng trực tiếp, không cần query

  const ChatScreen({
    Key? key,
    required this.ptId,
    required this.ptName,
    this.clientId, // ← Thêm parameter này
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ChatService _chatService = ChatService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  String? _currentUserId;
  String? _chatId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    setState(() => _isLoading = true);

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final authUid = user.uid;
      print('🔐 Auth UID: $authUid');
      print('📱 PT ID from widget: ${widget.ptId}');
      print('📧 Email: ${user.email}');

      String? clientId =
          widget.clientId; // ← Ưu tiên dùng clientId được truyền vào

      // Nếu không có clientId được truyền vào, thử các cách query
      if (clientId == null) {
        // CÁCH 1: Thử query users bằng email hoặc uid field
        try {
          print('🔍 Trying to find user by email...');
          final queryByEmail = await FirebaseFirestore.instance
              .collection('users')
              .where('email', isEqualTo: user.email)
              .limit(1)
              .get();

          if (queryByEmail.docs.isNotEmpty) {
            final doc = queryByEmail.docs.first;
            clientId = doc.data()['_id'] as String? ?? doc.id;
            print('✅ Found by email! _id: $clientId, doc.id: ${doc.id}');
          }
        } catch (e) {
          print('⚠️ Query by email failed: $e');
        }

        // CÁCH 2: Thử query bằng field uid
        if (clientId == null) {
          try {
            print('🔍 Trying to find user by uid field...');
            final queryByUid = await FirebaseFirestore.instance
                .collection('users')
                .where('uid', isEqualTo: authUid)
                .limit(1)
                .get();

            if (queryByUid.docs.isNotEmpty) {
              final doc = queryByUid.docs.first;
              clientId = doc.data()['_id'] as String? ?? doc.id;
              print('✅ Found by uid field! _id: $clientId, doc.id: ${doc.id}');
            }
          } catch (e) {
            print('⚠️ Query by uid failed: $e');
          }
        }

        // CÁCH 3: Thử lấy trực tiếp bằng authUid làm document ID
        if (clientId == null) {
          try {
            print('🔍 Trying to get user document by Auth UID as doc ID...');
            final docById = await FirebaseFirestore.instance
                .collection('users')
                .doc(authUid)
                .get();

            if (docById.exists) {
              clientId = docById.data()?['_id'] as String? ?? docById.id;
              print('✅ Found by doc ID! _id: $clientId');
            }
          } catch (e) {
            print('⚠️ Get by doc ID failed: $e');
          }
        }

        // CÁCH 4: Fallback - dùng authUid luôn
        if (clientId == null || clientId.isEmpty) {
          print('⚠️ All methods failed, using Auth UID as client ID');
          clientId = authUid;
        }
      } else {
        print('✅ Using provided clientId: $clientId');
      }

      _currentUserId = clientId;
      print('✅ Final Client ID: $_currentUserId');

      // Tạo hoặc lấy chat room - Format: ${ptId}_${clientId}
      final chatRoom = await _chatService.getOrCreateChat(
        widget.ptId,
        _currentUserId!,
      );

      setState(() {
        _chatId = chatRoom.id;
        _isLoading = false;
      });

      print('✅ Chat initialized: $_chatId');
      print('🔑 Expected format: ${widget.ptId}_$_currentUserId');
    } catch (e) {
      print('❌ Error initializing chat: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi khởi tạo chat: $e')));
      }
    }
  }

  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty ||
        _chatId == null ||
        _currentUserId == null) {
      return;
    }

    final text = _messageController.text.trim();
    _messageController.clear();

    try {
      await _chatService.sendMessage(
        chatId: _chatId!,
        senderId: _currentUserId!,
        text: text,
      );

      // Scroll to bottom
      _scrollToBottom();
    } catch (e) {
      print('❌ Error sending message: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Không thể gửi tin nhắn: $e')));
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: Theme.of(context).primaryColor,
              child: Text(
                widget.ptName.substring(0, 1).toUpperCase(),
                style: const TextStyle(color: Colors.white),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.ptName, style: const TextStyle(fontSize: 16)),
                  const Text(
                    'Huấn luyện viên',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Messages List - REALTIME
                Expanded(
                  child: _chatId == null
                      ? const Center(child: Text('Đang khởi tạo chat...'))
                      : StreamBuilder<List<ChatMessage>>(
                          stream: _chatService.subscribeToMessages(_chatId!),
                          builder: (context, snapshot) {
                            if (snapshot.hasError) {
                              return Center(
                                child: Text('Lỗi: ${snapshot.error}'),
                              );
                            }

                            if (!snapshot.hasData) {
                              return const Center(
                                child: CircularProgressIndicator(),
                              );
                            }

                            final messages = snapshot.data!;

                            if (messages.isEmpty) {
                              return const Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.chat_bubble_outline,
                                      size: 64,
                                      color: Colors.grey,
                                    ),
                                    SizedBox(height: 16),
                                    Text(
                                      'Chưa có tin nhắn nào',
                                      style: TextStyle(color: Colors.grey),
                                    ),
                                  ],
                                ),
                              );
                            }

                            // Scroll to bottom when new messages arrive
                            WidgetsBinding.instance.addPostFrameCallback((_) {
                              _scrollToBottom();
                            });

                            return ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.all(16),
                              itemCount: messages.length,
                              itemBuilder: (context, index) {
                                final message = messages[index];
                                final isMe = message.senderId == _currentUserId;

                                return _MessageBubble(
                                  message: message,
                                  isMe: isMe,
                                );
                              },
                            );
                          },
                        ),
                ),

                // Message Input
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 4,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _messageController,
                            decoration: InputDecoration(
                              hintText: 'Nhập tin nhắn...',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: BorderSide.none,
                              ),
                              filled: true,
                              fillColor: Colors.grey[100],
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                            ),
                            maxLines: null,
                            textCapitalization: TextCapitalization.sentences,
                            onSubmitted: (_) => _sendMessage(),
                          ),
                        ),
                        const SizedBox(width: 8),
                        CircleAvatar(
                          backgroundColor: Theme.of(context).primaryColor,
                          child: IconButton(
                            icon: const Icon(
                              Icons.send,
                              color: Colors.white,
                              size: 20,
                            ),
                            onPressed: _sendMessage,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

/// MessageBubble - Bong bóng tin nhắn
class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;

  const _MessageBubble({required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isMe
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        children: [
          if (!isMe) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.grey[300],
              child: const Icon(Icons.person, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isMe ? Theme.of(context).primaryColor : Colors.grey[200],
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.text,
                    style: TextStyle(
                      color: isMe ? Colors.white : Colors.black87,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTime(message.timestamp),
                    style: TextStyle(
                      color: isMe ? Colors.white70 : Colors.grey[600],
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isMe) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: Theme.of(context).primaryColor,
              child: const Icon(Icons.person, size: 16, color: Colors.white),
            ),
          ],
        ],
      ),
    );
  }

  String _formatTime(DateTime timestamp) {
    return '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
}
