# 🔔 Chat Background Notification - Backend API Implementation

## 🎯 Tổng Quan

Thay vì dùng Cloud Function, hệ thống sử dụng **backend Node.js hiện tại** để gửi notification:

✅ **Backend API**: `/api/chat/notification` - Gửi FCM notification  
✅ **React**: Gọi API sau khi gửi tin nhắn  
✅ **Flutter**: Gọi API sau khi gửi tin nhắn  
✅ **No Cloud Function needed** - Tận dụng backend sẵn có

---

## 📁 Cấu Trúc Backend

```
backend/src/features/chat/
├── chat.routes.js       # Route định nghĩa
└── chat.controller.js   # Logic gửi notification
```

---

## 🔧 Backend Implementation

### 1. Chat Routes
**File:** `backend/src/features/chat/chat.routes.js`

```javascript
import express from "express";
import { sendChatNotification } from "./chat.controller.js";

const router = express.Router();

/**
 * POST /api/chat/notification
 * Gửi notification khi có tin nhắn chat mới
 */
router.post("/notification", sendChatNotification);

export default router;
```

### 2. Chat Controller
**File:** `backend/src/features/chat/chat.controller.js`

**Logic:**
```javascript
1. Nhận request với: chatId, senderId, receiverId, messageText, imageUrl
2. Get FCM token của receiver từ Firestore (users/{receiverId})
3. Get tên người gửi từ Firestore (users/{senderId})
4. Build notification payload
5. Gửi FCM qua admin.messaging().send()
6. Return response
```

**Request Body:**
```json
{
  "chatId": "pt123_client456",
  "senderId": "pt123",
  "receiverId": "client456",
  "messageText": "Hôm nay tập gì?",
  "imageUrl": "https://..." // optional
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Notification sent",
  "messageId": "projects/..."
}
```

**Response (No FCM Token):**
```json
{
  "success": true,
  "message": "Receiver has no FCM token (notification skipped)",
  "skipped": true
}
```

### 3. App Registration
**File:** `backend/src/app.js`

```javascript
import chatRoutes from "./features/chat/chat.routes.js";

// Routes
app.use("/api/chat", chatRoutes);
```

---

## 📱 Frontend Integration

### React ChatService
**File:** `frontend_react/src/features/pt/services/ChatService.js`

**Thêm function mới:**
```javascript
static async sendNotification(chatId, senderId, messageText, imageUrl = null) {
  const participants = chatId.split('_');
  const receiverId = participants.find(id => id !== senderId);

  const response = await fetch('http://localhost:3000/api/chat/notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId,
      senderId,
      receiverId,
      messageText,
      imageUrl,
    }),
  });

  const result = await response.json();
  console.log("✅ Notification sent:", result.message);
}
```

**Cập nhật sendMessage:**
```javascript
static async sendMessage(chatId, senderId, text, imageUrl = null) {
  // ... save to Firestore ...
  
  // Gửi notification qua backend API
  await this.sendNotification(chatId, senderId, text, imageUrl);
}
```

### Flutter ChatService
**File:** `lib/features/chat/services/chat_service.dart`

**Thêm function mới:**
```dart
Future<void> _sendNotification({
  required String chatId,
  required String senderId,
  required String messageText,
  String? imageUrl,
}) async {
  final participants = chatId.split('_');
  final receiverId = participants.firstWhere((id) => id != senderId);

  final response = await http.post(
    Uri.parse('http://localhost:3000/api/chat/notification'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({
      'chatId': chatId,
      'senderId': senderId,
      'receiverId': receiverId,
      'messageText': messageText,
      if (imageUrl != null) 'imageUrl': imageUrl,
    }),
  );
}
```

**Cập nhật sendMessage:**
```dart
Future<void> sendMessage({
  required String chatId,
  required String senderId,
  required String text,
  String? imageUrl,
}) async {
  // ... save to Firestore ...
  
  // Gửi notification qua backend API
  await _sendNotification(
    chatId: chatId,
    senderId: senderId,
    messageText: text,
    imageUrl: imageUrl,
  );
}
```

---

## 🚀 Deployment & Testing

### 1. Khởi Động Backend
```powershell
cd backend\src
node server.js
```

**Expected output:**
```
Server is running on port 3000
Firebase app initialized successfully.
```

### 2. Test API Endpoint
```powershell
# Test với curl hoặc Postman
curl -X POST http://localhost:3000/api/chat/notification `
  -H "Content-Type: application/json" `
  -d '{
    "chatId": "pt123_client456",
    "senderId": "pt123",
    "receiverId": "client456",
    "messageText": "Test notification"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Notification sent",
  "messageId": "..."
}
```

### 3. Test End-to-End

#### Test 1: React → Flutter
```
1. Backend running: node server.js
2. Flutter app running: flutter run
3. React website: npm run dev

4. From React: Gửi tin nhắn "Test from React"
   → Backend log: "📬 Sending chat notification..."
   → Backend log: "✅ Notification sent successfully"
   → Flutter: Notification xuất hiện 🔔
```

#### Test 2: Flutter → React
```
1. Backend running
2. Both apps running

3. From Flutter: Gửi tin nhắn "Test from Flutter"
   → Backend log: "📬 Sending chat notification..."
   → React user: Check notification (nếu có FCM token)
```

---

## 🔍 Flow Diagram

```
┌─────────────────┐
│  User A (React) │
│  Gửi tin nhắn   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ChatService   │
│  sendMessage()  │
└────────┬────────┘
         │
         ├──► Firestore: Save message
         │
         └──► Backend API: POST /api/chat/notification
                  │
                  ▼
         ┌─────────────────┐
         │ Chat Controller │
         │ sendChat        │
         │ Notification()  │
         └────────┬────────┘
                  │
                  ├──► Get receiver FCM token (Firestore)
                  ├──► Get sender name (Firestore)
                  ├──► Build notification payload
                  └──► admin.messaging().send()
                           │
                           ▼
                  ┌─────────────────┐
                  │ Firebase Cloud  │
                  │   Messaging     │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  User B Device  │
                  │  Notification   │
                  │      🔔         │
                  └─────────────────┘
```

---

## ✅ Advantages vs Cloud Function

| Aspect | Cloud Function | Backend API |
|--------|----------------|-------------|
| **Cost** | ❌ Pay per invocation | ✅ Free (already running) |
| **Deployment** | ❌ Separate deploy | ✅ Same codebase |
| **Debugging** | ❌ Check logs in Firebase | ✅ Local logs instantly |
| **Development** | ❌ Deploy to test | ✅ Test locally |
| **Control** | ❌ Limited | ✅ Full control |
| **Latency** | ✅ Auto-scale | ⚠️ Depends on backend |

---

## 🐛 Debugging

### Backend Logs
```javascript
// In chat.controller.js
console.log("📬 Sending chat notification:", { chatId, senderId, receiverId });
console.log("✅ Notification sent successfully:", response);
```

**Expected logs:**
```
📨 POST /api/chat/notification
📦 Body: {"chatId":"pt123_client456",...}
📬 Sending chat notification: {...}
✅ Notification sent successfully: projects/...
```

### Frontend Logs

**React:**
```javascript
console.log("✅ Notification sent:", result.message);
```

**Flutter:**
```dart
print('✅ Notification sent: ${result['message']}');
```

### Common Issues

#### 1. Backend not running
```
❌ Error: fetch failed (connect ECONNREFUSED)

✅ Fix: cd backend\src && node server.js
```

#### 2. No FCM token
```
⚠️ Notification failed: Receiver has no FCM token

✅ Check: users/{receiverId}.fcmToken exists in Firestore
✅ Fix: Open Flutter app → vào ChatScreen → Token auto-saved
```

#### 3. Notification not received
```
✅ Check backend logs: Message sent?
✅ Check Flutter logs: FCM token saved?
✅ Check Firestore: users/{userId}.fcmToken exists?
✅ Check device: Notification permission granted?
```

---

## 📊 Production Considerations

### Environment Variables
**File:** `backend/src/.env`
```env
PORT=3000
FIREBASE_SERVICE_ACCOUNT_PATH=../gym-managment-aa0a1-firebase-adminsdk-*.json
```

### Backend URL in Production
```javascript
// Development
const BACKEND_URL = 'http://localhost:3000';

// Production
const BACKEND_URL = 'https://your-backend.com';
```

**React:**
```javascript
const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/notification`, ...);
```

**Flutter:**
```dart
const backendUrl = String.fromEnvironment('BACKEND_URL', 
  defaultValue: 'http://localhost:3000');
```

### Error Handling
```javascript
// In ChatService
try {
  await this.sendNotification(...);
} catch (error) {
  console.error("❌ Notification failed:", error);
  // Don't throw - message already saved to Firestore
}
```

---

## 🎯 Summary

### What Changed from Cloud Function:

1. ❌ **Removed:** `backend/functions/src/index.ts` - `onNewChatMessage` function
2. ✅ **Added:** `backend/src/features/chat/` - API routes & controller
3. ✅ **Updated:** React ChatService - Call backend API
4. ✅ **Updated:** Flutter ChatService - Call backend API
5. ✅ **Updated:** `app.js` - Register chat routes

### Advantages:
- ✅ Tận dụng backend sẵn có
- ✅ Không cần deploy Cloud Function
- ✅ Debug dễ dàng hơn
- ✅ Tiết kiệm chi phí
- ✅ Faster development cycle

### To Run:
```powershell
# 1. Start backend
cd backend\src
node server.js

# 2. Start React
cd frontend_react
npm run dev

# 3. Start Flutter
cd frontend_flutter
flutter run

# 4. Test: Send message and check notification! 🎉
```

---

**Tác giả:** AI Assistant  
**Ngày:** 2024  
**Version:** 2.0 - Backend API (No Cloud Function)
