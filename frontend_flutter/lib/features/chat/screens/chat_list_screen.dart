import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../features/model/contract.mode.dart';
import '../../../config/image_config.dart';
import 'chat_screen.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({Key? key}) : super(key: key);

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  String? _currentUserId;
  bool _isLoading = true;
  List<PTInfo> _ptList = [];
  // Map PT id sang userId (Firestore doc id) từ contract
  final Map<String, String> _ptIdToUserId = {};

  @override
  void initState() {
    super.initState();
    _loadPTList();
  }

  Future<String?> _findFirestoreUserDocId(String authUid) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      logger.i(
        '🔍 Finding Firestore doc for authUid: $authUid, email: ${user?.email}, phone: ${user?.phoneNumber}',
      );

      // Try direct doc id
      final direct = await _firestore.collection('users').doc(authUid).get();
      if (direct.exists) {
        logger.i('✅ Found by direct doc id: ${direct.id}');
        return direct.id;
      }

      // Try by phone variants
      if (user?.phoneNumber != null && user!.phoneNumber!.isNotEmpty) {
        final phone = user.phoneNumber!;
        final variants = [
          phone,
          phone.replaceAll(RegExp(r'[\s\-\.\+]'), ''),
          phone.startsWith('+84') ? phone.replaceFirst('+84', '0') : null,
        ].where((e) => e != null && e.isNotEmpty).toList();

        logger.i('📞 Trying phone variants: $variants');
        for (final variant in variants) {
          for (final field in ['phone_number', 'phoneNumber']) {
            final q = await _firestore
                .collection('users')
                .where(field, isEqualTo: variant)
                .limit(1)
                .get();
            if (q.docs.isNotEmpty) {
              logger.i('✅ Found by $field=$variant: ${q.docs.first.id}');
              return q.docs.first.id;
            }
          }
        }
      }

      // Try by email
      if (user?.email != null && user!.email!.isNotEmpty) {
        logger.i('📧 Trying email: ${user.email}');
        final q = await _firestore
            .collection('users')
            .where('email', isEqualTo: user.email)
            .limit(1)
            .get();
        if (q.docs.isNotEmpty) {
          logger.i('✅ Found by email: ${q.docs.first.id}');
          return q.docs.first.id;
        }
      }

      logger.w('❌ No Firestore user doc found for authUid: $authUid');
      return null;
    } catch (e) {
      logger.w('❌ Error finding user doc: $e');
      return null;
    }
  }

  Future<void> _loadPTList() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw Exception('User not authenticated');

      _currentUserId = user.uid;
      logger.i('👤 Current Auth UID: $_currentUserId');

      final firestoreDocId = await _findFirestoreUserDocId(_currentUserId!);
      final userId = firestoreDocId ?? _currentUserId;
      logger.i(
        '🎯 Using userId for query: $userId (Firestore doc id: $firestoreDocId)',
      );

      // Query contracts with userId field
      logger.i('🔎 Querying contracts with userId=$userId');
      var contracts = await _firestore
          .collection('contracts')
          .where('userId', isEqualTo: userId)
          .where('status', whereIn: ['paid', 'active'])
          .get();
      logger.i('📄 Found ${contracts.docs.length} contracts with userId field');

      if (contracts.docs.isEmpty) {
        logger.i('🔎 Trying alternate field: user_id=$userId');
        contracts = await _firestore
            .collection('contracts')
            .where('user_id', isEqualTo: userId)
            .where('status', whereIn: ['paid', 'active'])
            .get();
        logger.i(
          '📄 Found ${contracts.docs.length} contracts with user_id field',
        );
      }

      if (contracts.docs.isEmpty) {
        logger.w('❌ No contracts found for user: $userId');
        setState(() => _isLoading = false);
        return;
      }

      // Map PT id sang userId (Firestore doc id) từ contract
      _ptIdToUserId.clear();
      for (final doc in contracts.docs) {
        final contractUserId = doc.data()['userId'] ?? doc.data()['user_id'];
        final ptId = doc.data()['ptId'];

        logger.i(
          '📋 Contract ${doc.id}: userId=$contractUserId, ptId=$ptId, status=${doc.data()['status']}',
        );

        // Lưu mapping PT id -> User id (Firestore doc id)
        if (ptId != null && contractUserId != null) {
          _ptIdToUserId[ptId] = contractUserId;
          logger.i('🔗 Mapped PT $ptId -> User $contractUserId');
        }
      }

      // Get PT info
      final ptIds = _ptIdToUserId.keys.toSet();
      logger.i('👨‍🏫 Loading ${ptIds.length} PT(s): $ptIds');

      final ptList = <PTInfo>[];
      for (final ptId in ptIds) {
        try {
          final ptDoc = await _firestore
              .collection('employees')
              .doc(ptId)
              .get();
          if (ptDoc.exists) {
            final data = ptDoc.data()!;
            // Lấy userId (Firestore doc id) từ mapping
            final userId = _ptIdToUserId[ptId] ?? _currentUserId ?? '';
            // Lấy PT Auth UID (để tạo chatId giống contract detail)
            final ptUid = data['uid'] as String?;
            final ptIdForChat =
                ptUid ?? ptId; // Ưu tiên dùng uid, fallback về doc id

            logger.i(
              '🔑 PT data: docId=$ptId, uid=$ptUid, using for chat: $ptIdForChat',
            );

            final ptInfo = PTInfo(
              id: ptIdForChat, // Dùng uid thay vì doc id
              fullName: data['fullName'] ?? 'PT',
              email: data['email'] ?? '',
              avatarUrl: data['avatarUrl'] ?? '',
              userId: userId,
            );
            ptList.add(ptInfo);
            logger.i(
              '✅ Loaded PT: ${ptInfo.fullName} (chatId will be: ${ptIdForChat}_$userId)',
            );
          } else {
            logger.w('⚠️ PT doc not found: $ptId');
          }
        } catch (e) {
          logger.w('❌ Error loading PT $ptId: $e');
        }
      }

      logger.i('🎉 Successfully loaded ${ptList.length} PT(s)');
      setState(() {
        _ptList = ptList;
        _isLoading = false;
      });
    } catch (e) {
      logger.e('❌ Error in _loadPTList: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tin nhắn với PT')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _ptList.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.chat_bubble_outline,
                    size: 80,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  const Text('Chưa có PT nào'),
                ],
              ),
            )
          : ListView.builder(
              itemCount: _ptList.length,
              itemBuilder: (context, index) {
                final pt = _ptList[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundImage: pt.avatarUrl.isNotEmpty
                        ? NetworkImage(ImageConfig.getImageUrl(pt.avatarUrl))
                        : null,
                    child: pt.avatarUrl.isEmpty
                        ? Text(pt.fullName.substring(0, 1).toUpperCase())
                        : null,
                  ),
                  title: Text(pt.fullName),
                  subtitle: const Text('Huấn luyện viên'),
                  trailing: const Icon(Icons.chat_bubble),
                  onTap: () {
                    logger.i(
                      '💬 Opening chat: PT=${pt.id}, clientId=${pt.userId}, avatar=${pt.avatarUrl}',
                    );
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ChatScreen(
                          ptId: pt.id,
                          ptName: pt.fullName,
                          clientId: pt.userId, // Dùng userId từ PTInfo (JVp...)
                          ptAvatarUrl: pt.avatarUrl, // Truyền avatar URL của PT
                        ),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}

class PTInfo {
  final String id;
  final String fullName;
  final String email;
  final String avatarUrl;
  final String userId; // Firestore doc id của user (để tạo chatId đúng)

  PTInfo({
    required this.id,
    required this.fullName,
    required this.email,
    required this.avatarUrl,
    required this.userId,
  });
}
