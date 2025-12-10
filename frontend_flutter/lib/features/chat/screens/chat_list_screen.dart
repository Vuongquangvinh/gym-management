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
  bool _isLoadingMore = false;
  List<PTInfo> _ptList = [];
  final List<String> _allPtIds = []; // Tất cả PT IDs cần load
  int _currentBatchIndex = 0;
  static const int _batchSize = 10; // Load 10 PT mỗi lần
  final ScrollController _scrollController = ScrollController();
  // Map PT id sang userId (Firestore doc id) từ contract
  final Map<String, String> _ptIdToUserId = {};

  @override
  void initState() {
    super.initState();
    _loadPTList();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent * 0.8 &&
        !_isLoadingMore &&
        _currentBatchIndex * _batchSize < _allPtIds.length) {
      _loadMorePTs();
    }
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
      final String userId = firestoreDocId ?? _currentUserId!;
      logger.i(
        '🎯 Using userId for query: $userId (Firestore doc id: $firestoreDocId)',
      );

      _ptIdToUserId.clear();
      final ptIdsFromContracts = <String>{};
      final ptIdsFromChats = <String>{};

      // ========== 1. Load từ contracts (existing logic) ==========
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

      for (final doc in contracts.docs) {
        final contractUserId = doc.data()['userId'] ?? doc.data()['user_id'];
        final ptId = doc.data()['ptId'];

        logger.i(
          '📋 Contract ${doc.id}: userId=$contractUserId, ptId=$ptId, status=${doc.data()['status']}',
        );

        if (ptId != null && contractUserId != null) {
          _ptIdToUserId[ptId] = contractUserId;
          ptIdsFromContracts.add(ptId);
          logger.i(
            '🔗 Mapped PT $ptId -> User $contractUserId (from contract)',
          );
        }
      }

      // ========== 2. Load từ chats collection ==========
      logger.i('💬 Querying chats for userId=$userId');
      try {
        final chatsSnapshot = await _firestore
            .collection('chats')
            .where('participants', arrayContains: userId)
            .get();

        logger.i('💬 Found ${chatsSnapshot.docs.length} chat(s)');

        for (final chatDoc in chatsSnapshot.docs) {
          final chatId = chatDoc.id;
          // chatId format: {ptId}_{userId}
          final parts = chatId.split('_');
          if (parts.length == 2) {
            final ptId = parts[0];
            final chatUserId = parts[1];

            if (chatUserId == userId && ptId.isNotEmpty) {
              ptIdsFromChats.add(ptId);
              // Nếu chưa có mapping từ contract, tạo mapping mới
              if (!_ptIdToUserId.containsKey(ptId)) {
                _ptIdToUserId[ptId] = userId; // userId is non-null here
                logger.i('🔗 Mapped PT $ptId -> User $userId (from chat)');
              }
            }
          }
        }
      } catch (e) {
        logger.w('⚠️ Error loading chats: $e');
      }

      // ========== 3. Merge PT IDs từ cả 2 nguồn ==========
      _allPtIds.clear();
      _allPtIds.addAll({...ptIdsFromContracts, ...ptIdsFromChats});
      logger.i(
        '👨‍🏫 Total unique PT(s): ${_allPtIds.length} (${ptIdsFromContracts.length} from contracts, ${ptIdsFromChats.length} from chats)',
      );
      logger.i('🔑 PT IDs: $_allPtIds');
      logger.i('🗺️ PT-to-User mapping: $_ptIdToUserId');

      if (_allPtIds.isEmpty) {
        logger.w('❌ No PT found from contracts or chats');
        setState(() => _isLoading = false);
        return;
      }

      // ========== 4. Load first batch ==========
      await _loadMorePTs();
      setState(() => _isLoading = false);
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

  Future<void> _loadMorePTs() async {
    if (_isLoadingMore || _currentBatchIndex * _batchSize >= _allPtIds.length) {
      return;
    }

    setState(() => _isLoadingMore = true);

    try {
      final startIndex = _currentBatchIndex * _batchSize;
      final endIndex = (_currentBatchIndex + 1) * _batchSize;
      final batchIds = _allPtIds.sublist(
        startIndex,
        endIndex.clamp(0, _allPtIds.length),
      );

      logger.i(
        '📦 Loading batch $_currentBatchIndex: ${batchIds.length} PT(s) (from $startIndex to ${endIndex.clamp(0, _allPtIds.length)})',
      );

      for (final ptId in batchIds) {
        try {
          // Try direct doc lookup first
          var ptDoc = await _firestore.collection('employees').doc(ptId).get();

          // If not found, try query by uid field (for Auth UID)
          if (!ptDoc.exists) {
            final ptQuery = await _firestore
                .collection('employees')
                .where('uid', isEqualTo: ptId)
                .limit(1)
                .get();

            if (ptQuery.docs.isNotEmpty) {
              ptDoc = ptQuery.docs.first;
            }
          }

          if (ptDoc.exists) {
            final data = ptDoc.data()!;
            final userId = _ptIdToUserId[ptId] ?? _currentUserId ?? '';
            final ptUid = data['uid'] as String?;
            final ptIdForChat = ptUid ?? ptId;

            // Kiểm tra duplicate trước khi thêm
            final isDuplicate = _ptList.any((pt) => pt.id == ptIdForChat);

            if (!isDuplicate) {
              final ptInfo = PTInfo(
                id: ptIdForChat,
                fullName: data['fullName'] ?? 'PT',
                email: data['email'] ?? '',
                avatarUrl: data['avatarUrl'] ?? '',
                userId: userId,
              );

              setState(() => _ptList.add(ptInfo));
              logger.i('✅ Loaded PT: ${ptInfo.fullName}');
            } else {
              logger.i(
                '⏭️ Skipped duplicate PT: $ptIdForChat (${data['fullName']})',
              );
            }
          }
        } catch (e) {
          logger.w('❌ Error loading PT $ptId: $e');
        }
      }

      _currentBatchIndex++;
      logger.i('🎉 Batch $_currentBatchIndex loaded. Total: ${_ptList.length}');
    } finally {
      setState(() => _isLoadingMore = false);
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
              controller: _scrollController,
              itemCount: _ptList.length + (_isLoadingMore ? 1 : 0),
              itemBuilder: (context, index) {
                // Loading indicator ở cuối
                if (index == _ptList.length) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

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
