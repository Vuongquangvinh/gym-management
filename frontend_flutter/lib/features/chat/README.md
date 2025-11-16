# 💬 Chat Feature - Flutter

## 📌 Overview
Realtime chat feature giữa Client (Flutter) và PT (React) sử dụng Firebase Firestore.

## 🔥 Key Features
- ✅ **Realtime messaging** - Tin nhắn cập nhật tức thì
- ✅ **Cross-platform** - Flutter ↔️ React synchronization
- ✅ **Same Chat Room** - Cùng format Chat ID: `${ptId}_${clientId}`
- ✅ **Firebase Firestore** - Backend realtime database
- ✅ **Stream-based** - Reactive UI updates

## 📁 Structure
```
lib/features/chat/
├── models/
│   ├── chat_message.dart    # Message model with Firestore mapping
│   └── chat_room.dart        # Chat room model with last message
├── services/
│   └── chat_service.dart     # Realtime chat operations
├── screens/
│   └── chat_screen.dart      # Chat UI with StreamBuilder
└── chat.dart                 # Feature exports
```

## 🚀 Quick Start

### 1. Import
```dart
import 'package:your_app/features/chat/screens/chat_screen.dart';
```

### 2. Navigate
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => ChatScreen(
      ptId: contract.ptId,
      ptName: ptEmployee.fullName,
    ),
  ),
);
```

### 3. Done!
Chat screen tự động:
- Tạo/lấy chat room với format `${ptId}_${clientId}`
- Subscribe realtime messages
- Hiển thị tin nhắn 2 chiều
- Gửi/nhận tức thì

## 🔧 Technical Details

### Chat ID Format (CRITICAL!)
```dart
final chatId = '${ptId}_${clientId}';
```
**Phải giống React:** `const chatId = \`\${ptId}_\${clientId}\`;`

### Firestore Fields (snake_case)
```dart
{
  'sender_id': string,
  'text': string,
  'timestamp': Timestamp,
  'is_read': boolean
}
```

### Realtime Stream
```dart
Stream<List<ChatMessage>> subscribeToMessages(String chatId) {
  return firestore
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp')
    .snapshots()  // ← Realtime!
    .map((snapshot) => /* map to ChatMessage list */);
}
```

## 📖 Documentation
- **Usage Guide:** `FLUTTER_CHAT_USAGE.md`
- **Full Integration:** `REALTIME_CHAT_GUIDE.md`

## ✅ Integration Status
- [x] Contract Detail Screen - "Liên hệ PT" button added
- [ ] PT Profile Screen
- [ ] Chat List Screen (all chats)
- [ ] Notification badge

## 🐛 Troubleshooting
See `FLUTTER_CHAT_USAGE.md` section "TROUBLESHOOTING"

---
**Created:** November 16, 2025
