# 📬 Chat Notification Feature - Hướng Dẫn

## 🎯 Tổng Quan
Hệ thống thông báo chat đã được tích hợp vào ứng dụng Flutter, hỗ trợ:
- ✅ **Local Notifications**: Hiển thị thông báo khi app đang mở (foreground)
- ✅ **Push Notifications**: Nhận thông báo qua FCM khi app đóng (background/terminated)
- ✅ **Smart Detection**: Chỉ hiển thị thông báo cho tin nhắn từ người khác
- ✅ **Image Support**: Nhận diện và hiển thị icon 📷 cho tin nhắn có hình

---

## 📁 Cấu Trúc File

### 1. **ChatNotificationService** 
📂 `lib/features/chat/services/chat_notification_service.dart`

**Chức năng:**
- Quản lý notification plugin
- Khởi tạo channel cho Android
- Request permissions cho iOS
- Hiển thị local notifications
- Xử lý FCM tokens

**API chính:**
```dart
// Singleton instance
final service = ChatNotificationService();

// Khởi tạo service
await service.initialize();

// Hiển thị notification
await service.showChatNotification(
  chatId: 'chat_123',
  senderName: 'PT Minh',
  messageText: 'Hôm nay tập gì?',
);

// Lấy FCM token
String? token = await service.getFCMToken();
```

---

## 🔧 Tích Hợp Vào ChatScreen

### ChatScreen Updates
📂 `lib/features/chat/screens/chat_screen.dart`

**Các thay đổi:**

1. **Import service:**
```dart
import '../services/chat_notification_service.dart';
```

2. **Khởi tạo instance:**
```dart
final ChatNotificationService _notificationService = ChatNotificationService();
int _lastMessageCount = 0; // Track message count
```

3. **Initialize trong `initState`:**
```dart
@override
void initState() {
  super.initState();
  _initializeChat();
  _initializeNotifications();
}

Future<void> _initializeNotifications() async {
  try {
    await _notificationService.initialize();
    print('✅ Notification service initialized');
  } catch (e) {
    print('⚠️ Failed to initialize notifications: $e');
  }
}
```

4. **Logic hiển thị notification:**
```dart
void _showNotificationForMessage(ChatMessage message) {
  // Không hiển thị cho tin nhắn của mình
  if (message.senderId == _currentUserId) {
    return;
  }

  final senderName = widget.ptName;
  
  String notificationText;
  if (message.imageUrl != null && message.imageUrl!.isNotEmpty) {
    if (message.text.isNotEmpty) {
      notificationText = '📷 ${message.text}';
    } else {
      notificationText = '📷 Đã gửi một hình ảnh';
    }
  } else {
    notificationText = message.text;
  }

  _notificationService.showChatNotification(
    chatId: _chatId!,
    senderName: senderName,
    messageText: notificationText,
  );
}
```

5. **Detect tin nhắn mới trong StreamBuilder:**
```dart
final messages = snapshot.data!;

// Kiểm tra tin nhắn mới
if (messages.isNotEmpty && messages.length > _lastMessageCount) {
  final latestMessage = messages.last;
  _showNotificationForMessage(latestMessage);
}
_lastMessageCount = messages.length;
```

---

## 🚀 App Initialization

### Main.dart Updates
📂 `lib/main.dart`

**Khởi tạo service khi app start:**

```dart
import 'features/chat/services/chat_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await initializeDateFormatting('vi', null);

  // Đăng ký background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Khởi tạo các services
  await NotificationService().initialize();
  await FCMService().initialize();
  await ChatNotificationService().initialize(); // ← Chat notifications

  runApp(/* ... */);
}
```

---

## 📱 Notification Behavior

### Khi App Đang Mở (Foreground)
```
PT Minh: "Hôm nay tập gì?"
├─ Detect: messages.length > _lastMessageCount
├─ Check: senderId != _currentUserId ✅
├─ Show: Local notification với FlutterLocalNotificationsPlugin
└─ Display: "PT Minh" - "Hôm nay tập gì?"
```

### Khi App Background/Terminated
```
Backend sends FCM → Firebase Cloud Messaging
├─ Device receives push notification
├─ Android: Notification tray
├─ iOS: Banner notification
└─ Tap: Opens app (can navigate to chat)
```

---

## 🎨 Notification Content

### Text Message
```
┌─────────────────────────┐
│ 💬 Chat Message         │
│                         │
│ PT Minh                 │
│ Hôm nay tập gì?        │
└─────────────────────────┘
```

### Image Message with Caption
```
┌─────────────────────────┐
│ 💬 Chat Message         │
│                         │
│ PT Minh                 │
│ 📷 Bài tập hôm nay     │
└─────────────────────────┘
```

### Image Only
```
┌─────────────────────────┐
│ 💬 Chat Message         │
│                         │
│ PT Minh                 │
│ 📷 Đã gửi một hình ảnh │
└─────────────────────────┘
```

---

## ⚙️ Configuration

### Android Notification Channel
```dart
const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'chat_messages',
  'Chat Messages',
  description: 'Thông báo tin nhắn chat',
  importance: Importance.high,
  playSound: true,
  enableVibration: true,
);
```

### iOS Settings
```dart
await messaging.requestPermission(
  alert: true,
  badge: true,
  sound: true,
);

await messaging.setForegroundNotificationPresentationOptions(
  alert: true,
  badge: true,
  sound: true,
);
```

---

## 🧪 Testing Steps

### 1. Test Local Notifications (App Open)
```
1. Mở app Flutter trên device/emulator
2. Vào ChatScreen với một PT
3. Từ React website, gửi tin nhắn text
   → Notification xuất hiện ngay lập tức
4. Gửi tin nhắn có hình
   → Notification hiển thị "📷 Đã gửi một hình ảnh"
```

### 2. Test Self-Message (No Notification)
```
1. Mở ChatScreen trên Flutter
2. Gửi tin nhắn từ chính Flutter app
   → Không có notification (đúng behavior)
```

### 3. Test Background Notifications
```
1. Get FCM token:
   final token = await ChatNotificationService().getFCMToken();
   print('Token: $token');

2. Send test FCM from backend:
   POST https://fcm.googleapis.com/v1/projects/YOUR_PROJECT/messages:send
   {
     "message": {
       "token": "DEVICE_FCM_TOKEN",
       "notification": {
         "title": "PT Minh",
         "body": "Test message"
       },
       "data": {
         "chatId": "pt123_client456"
       }
     }
   }

3. Close app (background/kill)
4. Send FCM → Notification xuất hiện
5. Tap notification → App opens
```

---

## 🔐 Permissions

### Android (`AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.VIBRATE"/>
```

### iOS (`Info.plist`)
iOS tự động request permission khi gọi `requestPermission()`

---

## 🐛 Debugging

### Check Initialization
```dart
Future<void> _initializeNotifications() async {
  try {
    await _notificationService.initialize();
    print('✅ Notification service initialized');
  } catch (e) {
    print('⚠️ Failed to initialize notifications: $e');
  }
}
```

### Check Message Detection
```dart
if (messages.isNotEmpty && messages.length > _lastMessageCount) {
  print('🆕 New message detected!');
  print('Last count: $_lastMessageCount');
  print('Current count: ${messages.length}');
  final latestMessage = messages.last;
  print('Message from: ${latestMessage.senderId}');
  _showNotificationForMessage(latestMessage);
}
```

### Check Notification Display
```dart
void _showNotificationForMessage(ChatMessage message) {
  if (message.senderId == _currentUserId) {
    print('⏭️ Skipping notification (own message)');
    return;
  }
  
  print('🔔 Showing notification for message: ${message.text}');
  _notificationService.showChatNotification(
    chatId: _chatId!,
    senderName: widget.ptName,
    messageText: notificationText,
  );
}
```

---

## 📊 Flow Diagram

```
┌─────────────────────┐
│   App Startup       │
│   main.dart         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Initialize Services │
│ - NotificationService
│ - FCMService        │
│ - ChatNotification  │◄─── Singleton instance created
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ChatScreen Open    │
│  initState()        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ StreamBuilder       │
│ Listen Messages     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      YES    ┌──────────────────┐
│ New Message?        ├────────────►│ Is from others?  │
│ length > last       │             └────────┬─────────┘
└─────────────────────┘                      │ YES
                                             ▼
                                    ┌──────────────────┐
                                    │ Show Notification│
                                    │ - Title: PT name │
                                    │ - Body: Message  │
                                    │ - Icon: 📷/💬   │
                                    └──────────────────┘
```

---

## ✅ Checklist

### Implementation
- [x] ChatNotificationService created
- [x] Integrated into ChatScreen
- [x] Initialized in main.dart
- [x] Message detection logic added
- [x] Self-message filtering implemented
- [x] Image message icon support

### Testing
- [ ] Test local notification (app open)
- [ ] Test text message notification
- [ ] Test image message notification
- [ ] Test self-message (no notification)
- [ ] Test FCM token retrieval
- [ ] Test background notification (requires FCM backend)

### Backend (Optional - For Push Notifications)
- [ ] Store FCM tokens in Firestore
- [ ] Send FCM when new message created
- [ ] Handle notification tapping (deep linking)

---

## 🔮 Next Steps

### 1. Store FCM Token
Update user document với FCM token:
```dart
// In ChatNotificationService
Future<void> saveFCMToken(String userId) async {
  final token = await getFCMToken();
  if (token != null) {
    await FirebaseFirestore.instance
      .collection('users')
      .doc(userId)
      .update({'fcmToken': token});
  }
}
```

### 2. Backend Trigger
Khi có tin nhắn mới, backend gửi FCM:
```javascript
// functions/index.js
exports.onNewChatMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const receiverId = /* logic to get receiver */;
    
    // Get receiver FCM token
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(receiverId)
      .get();
    
    const fcmToken = userDoc.data()?.fcmToken;
    
    // Send FCM
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: message.senderName,
        body: message.text || '📷 Đã gửi một hình ảnh',
      },
      data: {
        chatId: context.params.chatId,
      },
    });
  });
```

### 3. Handle Notification Tap
Navigate to chat when user taps notification:
```dart
// In ChatNotificationService.initialize()
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  final chatId = message.data['chatId'];
  // Navigate to ChatScreen with chatId
  // Navigator.push(...)
});
```

---

## 📝 Notes

1. **Local vs Push:**
   - Local: Hiện tại đang dùng, chỉ hoạt động khi app mở
   - Push (FCM): Cần backend integration, hoạt động mọi lúc

2. **Message Count Tracking:**
   - Dùng `_lastMessageCount` để detect tin nhắn mới
   - Reset khi vào/rời ChatScreen không ảnh hưởng

3. **Permissions:**
   - Android 13+: Cần POST_NOTIFICATIONS permission
   - iOS: Auto request khi gọi `requestPermission()`

4. **Self-Message Filter:**
   - Check `senderId == _currentUserId` để tránh tự thông báo

---

**Tác giả:** AI Assistant  
**Ngày tạo:** 2024  
**Phiên bản:** 1.0
