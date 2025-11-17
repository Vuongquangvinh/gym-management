import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:logger/logger.dart';

/// ChatNotificationService - Quản lý thông báo tin nhắn chat
///
/// Hỗ trợ:
/// - Local notification khi nhận tin nhắn mới (app đang mở)
/// - FCM push notification (app đóng/background)
class ChatNotificationService {
  static final ChatNotificationService _instance =
      ChatNotificationService._internal();
  factory ChatNotificationService() => _instance;
  ChatNotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final Logger _logger = Logger();
  bool _initialized = false;

  /// Khởi tạo notification service
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // Khởi tạo local notifications
      const initializationSettingsAndroid = AndroidInitializationSettings(
        '@mipmap/ic_launcher',
      );
      const initializationSettingsIOS = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsIOS,
      );

      await _localNotifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );

      // Request permissions
      await _requestPermissions();

      _initialized = true;
      _logger.i('✅ Chat notification service initialized');
    } catch (e) {
      _logger.e('❌ Error initializing chat notifications: $e');
    }
  }

  /// Request notification permissions
  Future<void> _requestPermissions() async {
    // Android
    final androidPlugin = _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidPlugin?.requestNotificationsPermission();

    // iOS
    final iosPlugin = _localNotifications
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >();
    await iosPlugin?.requestPermissions(alert: true, badge: true, sound: true);

    // FCM permission
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
  }

  /// Hiển thị notification khi nhận tin nhắn mới
  Future<void> showChatNotification({
    required String chatId,
    required String senderName,
    required String messageText,
    bool isImage = false,
  }) async {
    try {
      final notificationId = chatId.hashCode;

      const androidDetails = AndroidNotificationDetails(
        'chat_messages', // channel ID
        'Tin nhắn Chat', // channel name
        channelDescription: 'Thông báo tin nhắn mới từ PT',
        importance: Importance.high,
        priority: Priority.high,
        showWhen: true,
        icon: '@mipmap/ic_launcher',
      );

      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      const notificationDetails = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      final displayText = isImage ? '📷 Đã gửi một hình ảnh' : messageText;

      await _localNotifications.show(
        notificationId,
        '💬 $senderName',
        displayText,
        notificationDetails,
        payload: chatId, // Để navigate đến chat khi tap
      );

      _logger.i('✅ Notification shown for chat: $chatId');
    } catch (e) {
      _logger.e('❌ Error showing notification: $e');
    }
  }

  /// Xử lý khi user tap vào notification
  void _onNotificationTapped(NotificationResponse response) {
    final chatId = response.payload;
    if (chatId != null) {
      _logger.i('🔔 Notification tapped, chat ID: $chatId');
      // TODO: Navigate to chat screen
      // Bạn có thể dùng Navigator hoặc go_router để navigate
    }
  }

  /// Cancel notification cho một chat
  Future<void> cancelNotification(String chatId) async {
    final notificationId = chatId.hashCode;
    await _localNotifications.cancel(notificationId);
  }

  /// Cancel tất cả notifications
  Future<void> cancelAllNotifications() async {
    await _localNotifications.cancelAll();
  }

  /// Đăng ký FCM token để nhận push notification
  Future<String?> getFCMToken() async {
    try {
      final messaging = FirebaseMessaging.instance;
      final token = await messaging.getToken();
      _logger.i('📱 FCM Token: $token');
      return token;
    } catch (e) {
      _logger.e('❌ Error getting FCM token: $e');
      return null;
    }
  }

  /// Listen FCM foreground messages
  void listenForegroundMessages() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _logger.i(
        '🔔 FCM message received (foreground): ${message.notification?.title}',
      );

      if (message.notification != null) {
        showChatNotification(
          chatId: message.data['chatId'] ?? '',
          senderName: message.notification!.title ?? 'Tin nhắn mới',
          messageText: message.notification!.body ?? '',
          isImage: message.data['isImage'] == 'true',
        );
      }
    });
  }

  /// Lưu FCM token vào Firestore để backend có thể gửi notification
  Future<void> saveFCMTokenToFirestore(String userId) async {
    try {
      final token = await getFCMToken();
      if (token != null) {
        await FirebaseFirestore.instance.collection('users').doc(userId).update(
          {
            'fcmToken': token,
            'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
          },
        );
        _logger.i('✅ FCM token saved to Firestore for user: $userId');
      }
    } catch (e) {
      _logger.e('❌ Error saving FCM token: $e');
    }
  }

  /// Xóa FCM token khi user logout
  Future<void> removeFCMToken(String userId) async {
    try {
      await FirebaseFirestore.instance.collection('users').doc(userId).update({
        'fcmToken': FieldValue.delete(),
        'fcmTokenUpdatedAt': FieldValue.delete(),
      });
      _logger.i('✅ FCM token removed for user: $userId');
    } catch (e) {
      _logger.e('❌ Error removing FCM token: $e');
    }
  }
}
