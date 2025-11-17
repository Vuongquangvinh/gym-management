# 🔔 Background Chat Notifications - Hướng Dẫn Deploy

## 📋 Tổng Quan
Hệ thống notification trong nền (background) đã được thiết lập hoàn chỉnh:

✅ **Flutter App**: Lưu FCM token vào Firestore  
✅ **Cloud Function**: Tự động gửi notification khi có tin nhắn mới  
✅ **Notification Tap**: Navigate đến chat khi tap notification

---

## 🚀 Bước 1: Deploy Cloud Function

### 1.1 Build TypeScript
```bash
cd backend/functions
npm install
npm run build
```

### 1.2 Deploy Function
```bash
# Deploy toàn bộ functions
npm run deploy

# Hoặc deploy riêng function này
firebase deploy --only functions:onNewChatMessage
```

### 1.3 Verify Deployment
Sau khi deploy, check Firebase Console:
1. Mở **Firebase Console** → **Functions**
2. Tìm function: `onNewChatMessage`
3. Status: ✅ **Active**
4. Trigger: `chats/{chatId}/messages/{messageId}`

---

## 📱 Bước 2: Test Notification

### Test 1: Foreground (App Đang Mở)
```
1. Mở Flutter app
2. Vào ChatScreen với PT
3. Từ React website → Gửi tin nhắn
   ✅ Notification xuất hiện ngay (local notification)
```

### Test 2: Background (App Minimize)
```
1. Mở Flutter app và vào ChatScreen
2. Minimize app (Home button)
3. Từ React website → Gửi tin nhắn
   ✅ Notification xuất hiện trong notification tray
   ✅ Tap notification → App mở
```

### Test 3: Terminated (App Đóng Hoàn Toàn)
```
1. Đóng hoàn toàn Flutter app (swipe kill)
2. Từ React website → Gửi tin nhắn
   ✅ Notification xuất hiện
   ✅ Tap notification → App khởi động
```

---

## 🔧 Cloud Function Chi Tiết

### Trigger Event
```typescript
onDocumentCreated("chats/{chatId}/messages/{messageId}")
```

Khi có document mới trong:
```
chats/
  ├─ pt123_client456/
      └─ messages/
          └─ msg_abc123  ← Trigger ở đây
```

### Logic Flow
```
1. New message created in Firestore
   ├─ messageData: {sender_id, text, image_url, ...}
   └─ chatId: "pt123_client456"

2. Get chat participants
   ├─ participants: ["pt123", "client456"]
   └─ Find receiver: participant != sender_id

3. Get receiver's FCM token
   ├─ Query: users/{receiverId}
   └─ Field: fcmToken

4. Get sender's name
   ├─ Query: users/{senderId}
   └─ Field: name

5. Build notification payload
   ├─ Title: sender name
   ├─ Body: message text (or "📷 Đã gửi một hình ảnh")
   └─ Data: {chatId, messageId, senderId}

6. Send FCM
   └─ admin.messaging().send(message)
```

---

## 📊 Firestore Structure

### Users Collection
```javascript
users/{userId}
├─ name: "PT Minh"
├─ email: "pt@example.com"
├─ fcmToken: "eXaMpLeToKeN..."  ← Saved by Flutter app
└─ fcmTokenUpdatedAt: Timestamp
```

### Chats Collection
```javascript
chats/{chatId}
├─ participants: ["pt123", "client456"]
├─ created_at: Timestamp
└─ messages/
    └─ {messageId}
        ├─ sender_id: "pt123"
        ├─ text: "Hello"
        ├─ image_url: "https://..."  (optional)
        └─ created_at: Timestamp
```

---

## 🔐 FCM Token Management

### Lưu Token (Flutter)
```dart
// Tự động gọi trong ChatScreen.initState()
await _notificationService.saveFCMTokenToFirestore(_currentUserId!);
```

Cập nhật vào Firestore:
```dart
users/{userId}.update({
  'fcmToken': token,
  'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
})
```

### Xóa Token (Logout)
```dart
// Khi user logout
await ChatNotificationService().removeFCMToken(userId);
```

---

## 🎨 Notification Payload

### Text Message
```json
{
  "token": "device_fcm_token",
  "notification": {
    "title": "PT Minh",
    "body": "Hôm nay tập gì?"
  },
  "data": {
    "chatId": "pt123_client456",
    "messageId": "msg_abc",
    "senderId": "pt123",
    "isImage": "false",
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "chat_messages",
      "sound": "default"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1
      }
    }
  }
}
```

### Image Message
```json
{
  "notification": {
    "title": "PT Minh",
    "body": "📷 Bài tập hôm nay"  // hoặc "📷 Đã gửi một hình ảnh"
  },
  "data": {
    "isImage": "true"
  }
}
```

---

## 🐛 Debugging

### Check FCM Token Saved
```dart
// In Flutter app
final token = await ChatNotificationService().getFCMToken();
print('FCM Token: $token');

// Check in Firestore Console
users/{userId} → fcmToken field
```

### Check Cloud Function Logs
```bash
# Real-time logs
firebase functions:log --only onNewChatMessage

# Or in Firebase Console
Functions → onNewChatMessage → Logs
```

### Common Issues

#### 1. No notification received
```
✅ Check: FCM token saved in Firestore?
   → users/{userId}.fcmToken exists

✅ Check: Cloud Function deployed?
   → firebase deploy --only functions

✅ Check: Function logs for errors?
   → firebase functions:log
```

#### 2. Function error: "Receiver not found"
```
✅ Check: Chat participants array correct?
   → chats/{chatId}.participants = ["pt123", "client456"]

✅ Check: Sender ID matches participant?
   → message.sender_id in participants array
```

#### 3. Notification tap not working
```
✅ Check: FirebaseMessaging listeners in main.dart
✅ Check: data['chatId'] exists in payload
```

---

## 📝 Code Changes Summary

### 1. ChatNotificationService (Flutter)
**File:** `lib/features/chat/services/chat_notification_service.dart`

**New Functions:**
- `saveFCMTokenToFirestore(userId)` - Lưu FCM token vào Firestore
- `removeFCMToken(userId)` - Xóa token khi logout

### 2. ChatScreen (Flutter)
**File:** `lib/features/chat/screens/chat_screen.dart`

**Changes:**
```dart
Future<void> _initializeNotifications() async {
  await _notificationService.initialize();
  
  // Lưu FCM token
  if (_currentUserId != null) {
    await _notificationService.saveFCMTokenToFirestore(_currentUserId!);
  }
  
  // Lắng nghe foreground messages
  _notificationService.listenForegroundMessages();
}
```

### 3. Main.dart (Flutter)
**File:** `lib/main.dart`

**Changes:**
```dart
// Handle notification tap
final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
if (initialMessage != null) {
  _handleNotificationTap(initialMessage);
}

FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
```

### 4. Cloud Function (Backend)
**File:** `backend/functions/src/index.ts`

**New Function:**
```typescript
export const onNewChatMessage = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    // 1. Get message data
    // 2. Find receiver
    // 3. Get FCM token
    // 4. Send notification
  }
);
```

---

## ✅ Deployment Checklist

### Backend
- [ ] `cd backend/functions`
- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm run deploy`
- [ ] Verify function deployed in Firebase Console

### Flutter App
- [ ] Code already updated (no rebuild needed)
- [ ] FCM token auto-saved when user opens chat
- [ ] Test foreground notification
- [ ] Test background notification
- [ ] Test terminated notification

### Firebase Console
- [ ] Functions → `onNewChatMessage` → Status: Active
- [ ] Firestore → `users/{userId}` → Has `fcmToken` field
- [ ] Cloud Messaging → iOS APNs auth key uploaded (if testing iOS)

---

## 🔮 Next Steps (Optional)

### 1. Navigate on Tap
Implement navigation when user taps notification:
```dart
void _handleNotificationTap(RemoteMessage message) {
  final chatId = message.data['chatId'];
  // TODO: Navigate to ChatScreen
  // Navigator.pushNamed(context, '/chat', arguments: chatId);
}
```

### 2. Badge Count
Update app icon badge:
```dart
// In Cloud Function
apns: {
  payload: {
    aps: {
      badge: unreadCount + 1  // Get from Firestore
    }
  }
}
```

### 3. Notification Grouping
Group multiple messages from same sender:
```dart
android: {
  notification: {
    tag: chatId,  // Same tag = replace notification
  }
}
```

---

## 📞 Support

Nếu gặp lỗi:
1. Check Cloud Function logs: `firebase functions:log`
2. Check FCM token trong Firestore
3. Test với FCM test message từ Firebase Console
4. Verify device có internet và notification permission

---

**Tác giả:** AI Assistant  
**Ngày:** 2024  
**Version:** 1.0 - Background Notifications
