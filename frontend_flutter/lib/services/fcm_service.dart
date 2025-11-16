import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'notification_service.dart';

/// Service để xử lý Firebase Cloud Messaging (FCM)
/// Push notifications - có thể nhận thông báo dù app đang tắt
class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final NotificationService _notificationService = NotificationService();

  /// Khởi tạo FCM service
  Future<void> initialize() async {
    // 1. Request permission để hiển thị notifications
    await _requestPermission();

    // 2. Lấy FCM token
    await _getFCMToken();

    // 3. Lắng nghe khi nhận foreground messages
    _listenToForegroundMessages();

    // 4. Xử lý khi người dùng tap vào notification
    _handleNotificationTap();

    // 5. Lắng nghe khi token refresh
    _listenToTokenRefresh();
  }

  /// Request permission để hiển thị notifications
  Future<void> _requestPermission() async {
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    if (kDebugMode) {
      print('🔔 FCM Permission status: ${settings.authorizationStatus}');
    }
  }

  /// Lấy FCM token và lưu lên Firestore
  Future<String?> _getFCMToken() async {
    try {
      String? token = await _firebaseMessaging.getToken();
      if (token != null) {
        if (kDebugMode) {
          print('📱 FCM Token: $token');
        }
        // Lưu token lên Firestore để backend có thể gửi notification
        await _saveTokenToFirestore(token);
        return token;
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error getting FCM token: $e');
      }
    }
    return null;
  }

  /// Lưu FCM token lên Firestore
  Future<void> _saveTokenToFirestore(String token) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        // 🔥 FIX: Tìm user document theo Auth UID, email, hoặc phone_number
        // Vì document ID có thể khác với Auth UID

        // Thử 1: Tìm theo Auth UID trước
        final userDocByUid = FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid);

        final docSnapshot = await userDocByUid.get();

        if (docSnapshot.exists) {
          // Tìm thấy theo Auth UID
          await userDocByUid.set({
            'fcmToken': token,
            'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
          if (kDebugMode) {
            print('✅ FCM token saved to Firestore (by Auth UID: ${user.uid})');
          }
        } else {
          // Thử 2: Tìm theo email
          if (kDebugMode) {
            print('⚠️ User doc not found by Auth UID, trying by email...');
          }

          final queryByEmail = await FirebaseFirestore.instance
              .collection('users')
              .where('email', isEqualTo: user.email)
              .limit(1)
              .get();

          if (queryByEmail.docs.isNotEmpty) {
            final userDoc = queryByEmail.docs.first;
            await userDoc.reference.set({
              'fcmToken': token,
              'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
            }, SetOptions(merge: true));
            if (kDebugMode) {
              print(
                '✅ FCM token saved to Firestore (by email: ${user.email}, doc ID: ${userDoc.id})',
              );
            }
          } else {
            // Thử 3: Tìm theo số điện thoại
            if (kDebugMode) {
              print(
                '⚠️ User doc not found by email, trying by phone_number...',
              );
            }

            final phoneNumber = user.phoneNumber;
            if (phoneNumber != null && phoneNumber.isNotEmpty) {
              final queryByPhone = await FirebaseFirestore.instance
                  .collection('users')
                  .where('phone_number', isEqualTo: phoneNumber)
                  .limit(1)
                  .get();

              if (queryByPhone.docs.isNotEmpty) {
                final userDoc = queryByPhone.docs.first;
                await userDoc.reference.set({
                  'fcmToken': token,
                  'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
                }, SetOptions(merge: true));
                if (kDebugMode) {
                  print(
                    '✅ FCM token saved to Firestore (by phone_number: $phoneNumber, doc ID: ${userDoc.id})',
                  );
                }
              } else {
                if (kDebugMode) {
                  print('❌ User document not found in Firestore');
                  print('   Auth UID: ${user.uid}');
                  print('   Email: ${user.email}');
                  print('   Phone: $phoneNumber');
                }
              }
            } else {
              if (kDebugMode) {
                print('❌ User document not found in Firestore');
                print('   Auth UID: ${user.uid}');
                print('   Email: ${user.email}');
                print('   Phone: null');
              }
            }
          }
        }
      } else {
        if (kDebugMode) {
          print('⚠️ No authenticated user, cannot save FCM token');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error saving FCM token: $e');
      }
    }
  }

  /// Lắng nghe foreground messages (app đang mở)
  void _listenToForegroundMessages() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        print('📬 Received foreground message:');
        print('Title: ${message.notification?.title}');
        print('Body: ${message.notification?.body}');
        print('Data: ${message.data}');
      }

      // Hiển thị local notification khi app đang mở
      if (message.notification != null) {
        _notificationService.showInstantNotification(
          title: message.notification!.title ?? 'Thông báo',
          body: message.notification!.body ?? '',
          payload: message.data.toString(),
        );
      }
    });
  }

  /// Xử lý khi người dùng tap vào notification
  void _handleNotificationTap() {
    // Xử lý khi app được mở từ terminated state
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) {
        _handleNotificationData(message.data);
      }
    });

    // Xử lý khi app đang ở background và người dùng tap notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (kDebugMode) {
        print('📲 Notification tapped! Data: ${message.data}');
      }
      _handleNotificationData(message.data);
    });
  }

  /// Xử lý data từ notification
  void _handleNotificationData(Map<String, dynamic> data) {
    // TODO: Navigate to specific screen based on notification data
    // Ví dụ:
    // if (data.containsKey('contractId')) {
    //   navigateToContractDetail(data['contractId']);
    // }
    if (kDebugMode) {
      print('🔍 Handling notification data: $data');
    }
  }

  /// Lắng nghe khi FCM token refresh
  void _listenToTokenRefresh() {
    _firebaseMessaging.onTokenRefresh.listen((String token) {
      if (kDebugMode) {
        print('🔄 FCM token refreshed: $token');
      }
      _saveTokenToFirestore(token);
    });
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
    if (kDebugMode) {
      print('🔕 Unsubscribed from topic: $topic');
    }
  }

  /// Subscribe to topic (để nhận notifications theo topic)
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
    if (kDebugMode) {
      print('🔔 Subscribed to topic: $topic');
    }
  }

  /// Xóa FCM token
  Future<void> deleteToken() async {
    await _firebaseMessaging.deleteToken();
    if (kDebugMode) {
      print('🗑️ FCM token deleted');
    }
  }

  /// 🔧 PUBLIC: Force save FCM token (gọi sau khi login hoặc khi cần)
  Future<void> saveFCMTokenManually() async {
    if (kDebugMode) {
      print('🔧 Manually saving FCM token...');
    }
    final token = await _firebaseMessaging.getToken();
    if (token != null) {
      await _saveTokenToFirestore(token);
    } else {
      if (kDebugMode) {
        print('❌ No FCM token available');
      }
    }
  }

  /// 🔍 PUBLIC: Get current FCM token
  Future<String?> getCurrentToken() async {
    return await _firebaseMessaging.getToken();
  }
}
