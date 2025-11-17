# 🧪 Quick Test - Background Notification

## ⚡ Chuẩn Bị

### 1. Deploy Cloud Function
```powershell
# Từ thư mục gốc
.\deploy_chat_notification.ps1

# Hoặc manual:
cd backend\functions
npm install
npm run build
firebase deploy --only functions:onNewChatMessage
```

### 2. Verify Deployment
Mở Firebase Console → Functions → Tìm `onNewChatMessage` ✅

---

## 📱 Test Cases

### Test 1: App Foreground (Đang Mở)
```
✅ Steps:
1. Mở Flutter app
2. Login và vào ChatScreen với PT
3. Kiểm tra console log: "✅ FCM token saved..."
4. Từ React website → Gửi tin nhắn "Test foreground"

✅ Expected:
- Local notification xuất hiện ngay lập tức
- Title: PT name
- Body: "Test foreground"
```

### Test 2: App Background (Minimize)
```
✅ Steps:
1. Mở Flutter app và vào ChatScreen
2. Press Home button (minimize app)
3. Từ React website → Gửi tin nhắn "Test background"

✅ Expected:
- Push notification xuất hiện trong tray
- Title: PT name
- Body: "Test background"
- Tap notification → App resume
```

### Test 3: App Terminated (Đóng Hoàn Toàn)
```
✅ Steps:
1. Đóng hoàn toàn Flutter app (swipe kill)
2. Từ React website → Gửi tin nhắn "Test terminated"

✅ Expected:
- Push notification xuất hiện
- Tap notification → App khởi động
```

### Test 4: Image Message
```
✅ Steps:
1. Minimize Flutter app
2. Từ React website → Gửi hình ảnh với caption "Bài tập"

✅ Expected:
- Notification: "📷 Bài tập"
- Tap → App mở
```

### Test 5: Image Only (No Text)
```
✅ Steps:
1. Minimize Flutter app
2. Từ React website → Gửi hình ảnh không có text

✅ Expected:
- Notification: "📷 Đã gửi một hình ảnh"
```

---

## 🔍 Debugging

### Check FCM Token
```dart
// Add to ChatScreen after _initializeNotifications()
final token = await _notificationService.getFCMToken();
print('🔑 My FCM Token: $token');
```

Hoặc check trong Firestore Console:
```
users/{userId} → fcmToken: "eXaMpLe..."
```

### Check Cloud Function Logs
```powershell
# Real-time logs
cd backend\functions
firebase functions:log --only onNewChatMessage

# Hoặc xem trong Firebase Console
Functions → onNewChatMessage → Logs tab
```

### Manual Test FCM
Test trực tiếp từ Firebase Console:
```
1. Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Notification text: "Test"
4. Target: Single device
5. FCM token: [paste token từ step 1]
6. Send
```

---

## ✅ Success Criteria

| Test Case | Expected Result |
|-----------|----------------|
| Foreground notification | ✅ Local notification shows immediately |
| Background notification | ✅ Push notification in tray |
| Terminated notification | ✅ Push notification + app launch |
| Image message | ✅ Shows "📷 ..." in notification |
| Notification tap | ✅ App opens/resumes |
| Self-message | ✅ No notification (correct!) |
| FCM token saved | ✅ Exists in Firestore users/{userId} |
| Cloud Function runs | ✅ Logs show "✅ Notification sent" |

---

## 🐛 Common Issues

### Issue 1: No notification received
```
❌ Symptom: Send message but no notification

✅ Checks:
1. FCM token saved? → Firestore users/{userId}.fcmToken
2. Cloud Function deployed? → Firebase Console Functions
3. Function running? → Check logs
4. Device has internet?
5. Notification permission granted?
```

### Issue 2: Function error in logs
```
❌ Error: "Receiver not found"

✅ Fix:
- Check chat.participants array includes both IDs
- Verify sender_id matches one participant
```

### Issue 3: Token not saved
```
❌ Symptom: Firestore users/{userId} has no fcmToken

✅ Fix:
- Check ChatScreen._initializeNotifications() is called
- Verify _currentUserId is not null
- Check console logs for errors
```

---

## 📊 Expected Logs

### Flutter App
```
🔐 Auth UID: abc123
✅ Chat initialized: pt123_client456
✅ Notification service initialized
📱 FCM Token: eXaMpLe...
✅ FCM token saved to Firestore for user: client456
```

### Cloud Function
```
ℹ New chat message {chatId: pt123_client456, senderId: pt123}
ℹ ✅ Notification sent successfully {receiver: client456, sender: PT Minh}
```

### Device (when notification received)
```
🔔 Background message received!
Title: PT Minh
Body: Test message
Data: {chatId: pt123_client456, messageId: msg_abc}
```

---

## 🎯 Quick Validation Script

Paste vào Flutter ChatScreen để test:

```dart
// Thêm button test trong ChatScreen
ElevatedButton(
  onPressed: () async {
    // 1. Check token
    final token = await _notificationService.getFCMToken();
    print('🔑 FCM Token: $token');
    
    // 2. Check saved in Firestore
    final userDoc = await FirebaseFirestore.instance
        .collection('users')
        .doc(_currentUserId)
        .get();
    print('💾 Saved token: ${userDoc.data()?['fcmToken']}');
    
    // 3. Show local test notification
    await _notificationService.showChatNotification(
      chatId: 'test_chat',
      senderName: 'Test Sender',
      messageText: 'Test notification',
    );
  },
  child: Text('Test Notification'),
),
```

---

## 🚀 Run All Tests

```powershell
# 1. Deploy function
.\deploy_chat_notification.ps1

# 2. Run Flutter app
cd frontend_flutter
flutter run

# 3. Run React app
cd ..\frontend_react
npm run dev

# 4. Follow test cases above
```

---

**Ready to test!** 🎉
