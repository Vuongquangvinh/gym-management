import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../services/chat_service.dart';
import '../services/chat_notification_service.dart';
import '../models/chat_message.dart';
import '../../../config/image_config.dart';

/// ChatScreen - Màn hình chat giữa Client và PT
///
/// REALTIME: Tự động cập nhật khi có tin nhắn mới
/// Hỗ trợ gửi text và hình ảnh

class ChatScreen extends StatefulWidget {
  final String ptId;
  final String ptName;
  final String?
  clientId; // Optional: nếu có thì dùng trực tiếp, không cần query
  final String? ptAvatarUrl; // Thêm avatarUrl của PT

  const ChatScreen({
    Key? key,
    required this.ptId,
    required this.ptName,
    this.clientId,
    this.ptAvatarUrl,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  // Hàm chọn ảnh từ camera, xác nhận và gửi
  Future<void> _captureAndSendImage() async {
    if (_chatId == null || _currentUserId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Chat chưa sẵn sàng')));
      return;
    }

    try {
      // Mở camera chụp ảnh
      final XFile? capturedFile = await _imagePicker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (capturedFile == null) {
        print('User cancelled camera');
        return;
      }

      // Hiển thị dialog xác nhận ảnh
      bool? confirm = await showDialog<bool>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Xác nhận gửi ảnh'),
            content: Image.file(File(capturedFile.path), width: 250),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Huỷ'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Gửi'),
              ),
            ],
          );
        },
      );

      if (confirm != true) {
        print('User cancelled sending captured image');
        return;
      }

      setState(() => _isUploadingImage = true);

      // Upload ảnh lên Firebase Storage
      final String fileName =
          'chat_images/${_chatId}_${DateTime.now().millisecondsSinceEpoch}_camera.jpg';
      final Reference storageRef = FirebaseStorage.instance.ref().child(
        fileName,
      );

      final File imageFile = File(capturedFile.path);
      final UploadTask uploadTask = storageRef.putFile(imageFile);

      // Đợi upload hoàn thành
      final TaskSnapshot snapshot = await uploadTask;
      final String downloadUrl = await snapshot.ref.getDownloadURL();

      print('✅ Camera image uploaded: $downloadUrl');

      // Gửi tin nhắn với image_url
      await _chatService.sendMessage(
        chatId: _chatId!,
        senderId: _currentUserId!,
        text: '[Hình ảnh]',
        imageUrl: downloadUrl,
      );

      setState(() => _isUploadingImage = false);
      _scrollToBottom();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gửi hình ảnh từ camera')),
        );
      }
    } catch (e) {
      print('❌ Error capturing/sending camera image: $e');
      setState(() => _isUploadingImage = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi gửi hình từ camera: $e')));
      }
    }
  }

  final ChatService _chatService = ChatService();
  final ChatNotificationService _notificationService =
      ChatNotificationService();
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _imagePicker = ImagePicker();

  String? _currentUserId;
  String? _chatId;
  bool _isLoading = false;
  bool _isUploadingImage = false;
  int _lastMessageCount = 0; // Theo dõi số lượng tin nhắn

  @override
  void initState() {
    super.initState();
    _initializeChat();
    _initializeNotifications();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
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
        // CÁCH 1: Thử query users bằng email
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

  /// Khởi tạo notification service
  Future<void> _initializeNotifications() async {
    try {
      await _notificationService.initialize();

      // Lưu FCM token vào Firestore để backend có thể gửi notification
      if (_currentUserId != null) {
        await _notificationService.saveFCMTokenToFirestore(_currentUserId!);
      }

      // Lắng nghe foreground messages
      _notificationService.listenForegroundMessages();

      print('✅ Notification service initialized');
    } catch (e) {
      print('⚠️ Failed to initialize notifications: $e');
    }
  }

  /// Hiển thị notification khi nhận tin nhắn mới (không phải của mình)
  void _showNotificationForMessage(ChatMessage message) {
    // Không hiển thị notification cho tin nhắn của chính mình
    if (message.senderId == _currentUserId) {
      return;
    }

    // Lấy tên người gửi (PT name)
    final senderName = widget.ptName;

    // Tạo text cho notification
    String notificationText;
    if (message.imageUrl != null && message.imageUrl!.isNotEmpty) {
      // Tin nhắn có hình
      if (message.text.isNotEmpty) {
        notificationText = '📷 ${message.text}';
      } else {
        notificationText = '📷 Đã gửi một hình ảnh';
      }
    } else {
      // Tin nhắn text thường
      notificationText = message.text;
    }

    // Hiển thị notification
    _notificationService.showChatNotification(
      chatId: _chatId!,
      senderName: senderName,
      messageText: notificationText,
    );
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

      _scrollToBottom();
    } catch (e) {
      print('❌ Error sending message: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi gửi tin nhắn: $e')));
      }
    }
  }

  /// Chọn ảnh từ gallery và gửi
  Future<void> _pickAndSendImage() async {
    if (_chatId == null || _currentUserId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Chat chưa sẵn sàng')));
      return;
    }

    try {
      // Chọn ảnh từ gallery
      final XFile? pickedFile = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (pickedFile == null) {
        print('User cancelled image picker');
        return;
      }

      setState(() => _isUploadingImage = true);

      // Upload ảnh lên Firebase Storage
      final String fileName =
          'chat_images/${_chatId}_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final Reference storageRef = FirebaseStorage.instance.ref().child(
        fileName,
      );

      final File imageFile = File(pickedFile.path);
      final UploadTask uploadTask = storageRef.putFile(imageFile);

      // Đợi upload hoàn thành
      final TaskSnapshot snapshot = await uploadTask;
      final String downloadUrl = await snapshot.ref.getDownloadURL();

      print('✅ Image uploaded: $downloadUrl');

      // Gửi tin nhắn với image_url
      await _chatService.sendMessage(
        chatId: _chatId!,
        senderId: _currentUserId!,
        text: '[Hình ảnh]', // Text mặc định cho tin nhắn hình
        imageUrl: downloadUrl,
      );

      setState(() => _isUploadingImage = false);
      _scrollToBottom();

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Đã gửi hình ảnh')));
      }
    } catch (e) {
      print('❌ Error picking/sending image: $e');
      setState(() => _isUploadingImage = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi gửi hình: $e')));
      }
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.ptName,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const Text(
              'Chat với PT',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
            ),
          ],
        ),
        elevation: 1,
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

                            // Kiểm tra tin nhắn mới và hiển thị notification
                            if (messages.isNotEmpty &&
                                messages.length > _lastMessageCount) {
                              // Có tin nhắn mới
                              final latestMessage = messages.last;
                              _showNotificationForMessage(latestMessage);
                            }
                            _lastMessageCount = messages.length;

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
                                  ptAvatarUrl: widget.ptAvatarUrl,
                                );
                              },
                            );
                          },
                        ),
                ),

                // Loading indicator khi upload ảnh
                if (_isUploadingImage)
                  Container(
                    padding: const EdgeInsets.all(8),
                    color: Colors.blue[50],
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 8),
                        Text('Đang gửi hình ảnh...'),
                      ],
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
                        // Nút chọn hình ảnh từ gallery
                        IconButton(
                          icon: const Icon(Icons.image, color: Colors.blue),
                          onPressed: _isUploadingImage
                              ? null
                              : _pickAndSendImage,
                          tooltip: 'Gửi hình ảnh từ thư viện',
                        ),
                        // Nút mở camera chụp ảnh
                        IconButton(
                          icon: const Icon(
                            Icons.camera_alt,
                            color: Colors.green,
                          ),
                          onPressed: _isUploadingImage
                              ? null
                              : _captureAndSendImage,
                          tooltip: 'Chụp ảnh bằng camera',
                        ),
                        // Text input
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
                        // Nút gửi tin nhắn
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

/// MessageBubble - Bong bóng tin nhắn (hỗ trợ cả text và hình ảnh)

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;
  final String? ptAvatarUrl;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    this.ptAvatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    if (!isMe) {
      print('🖼️ [MessageBubble] ptAvatarUrl: $ptAvatarUrl');
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isMe
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        children: [
          if (!isMe) ...[
            ptAvatarUrl != null && ptAvatarUrl!.isNotEmpty
                ? CircleAvatar(
                    radius: 16,
                    backgroundColor: Colors.grey[300],
                    child: ClipOval(
                      child: Image.network(
                        ImageConfig.getImageUrl(ptAvatarUrl),
                        width: 32,
                        height: 32,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          print('❌ Error loading PT avatar: $error');
                          print('🖼️ Avatar URL was: $ptAvatarUrl');
                          print(
                            '🔗 Full URL tried: ${ImageConfig.getImageUrl(ptAvatarUrl)}',
                          );
                          return const Icon(Icons.person, size: 16);
                        },
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          );
                        },
                      ),
                    ),
                  )
                : CircleAvatar(
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
                  // Hiển thị hình ảnh nếu có
                  if (message.imageUrl != null &&
                      message.imageUrl!.isNotEmpty) ...[
                    GestureDetector(
                      onTap: () {
                        showDialog(
                          context: context,
                          builder: (context) {
                            final size = MediaQuery.of(context).size;
                            return Dialog(
                              backgroundColor: Colors.black.withOpacity(0.95),
                              insetPadding: EdgeInsets.zero,
                              child: Stack(
                                children: [
                                  Center(
                                    child: InteractiveViewer(
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(12),
                                        child: Image.network(
                                          message.imageUrl!,
                                          width: size.width,
                                          height: size.height,
                                          fit: BoxFit.contain,
                                          errorBuilder:
                                              (context, error, stackTrace) {
                                                return Container(
                                                  color: Colors.grey[300],
                                                  width: size.width * 0.8,
                                                  height: size.width * 0.8,
                                                  child: const Icon(
                                                    Icons.error,
                                                    size: 48,
                                                  ),
                                                );
                                              },
                                          loadingBuilder: (context, child, loadingProgress) {
                                            if (loadingProgress == null)
                                              return child;
                                            return SizedBox(
                                              width: size.width * 0.8,
                                              height: size.width * 0.8,
                                              child: Center(
                                                child: CircularProgressIndicator(
                                                  value:
                                                      loadingProgress
                                                              .expectedTotalBytes !=
                                                          null
                                                      ? loadingProgress
                                                                .cumulativeBytesLoaded /
                                                            loadingProgress
                                                                .expectedTotalBytes!
                                                      : null,
                                                ),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                    ),
                                  ),
                                  // (Đã bỏ nút xóa ở góc trên bên phải)
                                  // Nút đóng ở góc trên bên trái
                                  Positioned(
                                    top: 16,
                                    left: 16,
                                    child: IconButton(
                                      icon: const Icon(
                                        Icons.close,
                                        color: Colors.white,
                                        size: 32,
                                      ),
                                      tooltip: 'Đóng',
                                      onPressed: () =>
                                          Navigator.of(context).pop(),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        );
                      },
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          message.imageUrl!,
                          width: 200,
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return SizedBox(
                              width: 200,
                              height: 200,
                              child: Center(
                                child: CircularProgressIndicator(
                                  value:
                                      loadingProgress.expectedTotalBytes != null
                                      ? loadingProgress.cumulativeBytesLoaded /
                                            loadingProgress.expectedTotalBytes!
                                      : null,
                                ),
                              ),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              width: 200,
                              height: 200,
                              color: Colors.grey[300],
                              child: const Icon(Icons.error),
                            );
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                  ],
                  // Hiển thị text
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
