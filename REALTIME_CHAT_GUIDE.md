# 🔥 REALTIME CHAT - React PT ↔️ Flutter Client

## 📌 CƠ CHẾ HOẠT ĐỘNG

### Chat ID Format (QUAN TRỌNG!)
```
chatId = "${ptId}_${clientId}"
```

**VÍ DỤ:**
- PT ID: `EpzCCD3RCdaPsocYAXwlrhkawCD3`
- Client ID: `zNuGqqCYqwm6PNJCiu7Y`
- **Chat ID:** `EpzCCD3RCdaPsocYAXwlrhkawCD3_zNuGqqCYqwm6PNJCiu7Y`

### Firestore Structure
```
chats/
  └── ${ptId}_${clientId}/          ← Chat Room Document
      ├── pt_id: string
      ├── client_id: string
      ├── participants: [ptId, clientId]
      ├── last_message: object
      ├── created_at: timestamp
      ├── updated_at: timestamp
      └── messages/                  ← Messages Subcollection
          ├── message1/
          │   ├── sender_id: string
          │   ├── text: string
          │   ├── timestamp: timestamp
          │   └── is_read: boolean
          ├── message2/
          └── ...
```

---

## 🚀 REACT (PT) - Đã hoàn thành

### ChatService.js
```javascript
// ✅ Tạo/lấy chat
static async getOrCreateChat(ptId, clientId) {
  const chatId = `${ptId}_${clientId}`;  // Format chuẩn
  // ...
}

// ✅ Subscribe realtime messages
static subscribeToMessages(chatId, callback) {
  return onSnapshot(q, (snapshot) => {
    callback(messages); // Tự động cập nhật
  });
}

// ✅ Gửi tin nhắn
static async sendMessage(chatId, senderId, text) {
  // Thêm vào subcollection messages
}
```

### PTChat.jsx Component
```jsx
// ✅ Subscribe realtime
useEffect(() => {
  unsubscribe = ChatService.subscribeToMessages(chatId, (msgs) => {
    setMessages(msgs); // Tự động cập nhật UI
  });
  
  return () => unsubscribe(); // Cleanup
}, [chatId]);
```

---

## 📱 FLUTTER (CLIENT) - Vừa tạo

### Files đã tạo:
1. **`lib/models/chat_message.dart`** - Model tin nhắn
2. **`lib/models/chat_room.dart`** - Model chat room
3. **`lib/services/chat_service.dart`** - Service quản lý chat
4. **`lib/screens/chat_screen.dart`** - UI màn hình chat

### ChatService (Flutter)
```dart
// ✅ Tạo/lấy chat - GIỐNG FORMAT REACT
Future<ChatRoom> getOrCreateChat(String ptId, String clientId) async {
  final chatId = '${ptId}_${clientId}';  // Format chuẩn
  // ...
}

// ✅ Subscribe realtime messages
Stream<List<ChatMessage>> subscribeToMessages(String chatId) {
  return firestore
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('timestamp')
    .snapshots()  // Realtime!
    .map((snapshot) => /* convert to messages */);
}

// ✅ Gửi tin nhắn
Future<void> sendMessage({
  required String chatId,
  required String senderId,
  required String text,
}) {
  // Thêm vào subcollection messages
}
```

### ChatScreen Widget
```dart
// ✅ Realtime StreamBuilder
StreamBuilder<List<ChatMessage>>(
  stream: _chatService.subscribeToMessages(_chatId!),
  builder: (context, snapshot) {
    // Tự động rebuild khi có tin nhắn mới
    return ListView.builder(/* ... */);
  },
)
```

---

## 🔧 CÁCH TÍCH HỢP VÀO FLUTTER APP

### Bước 1: Thêm dependency
Kiểm tra `pubspec.yaml` đã có:
```yaml
dependencies:
  firebase_core: ^latest
  firebase_auth: ^latest
  cloud_firestore: ^latest
```

### Bước 2: Import và sử dụng
```dart
// Ví dụ: Từ màn hình Contract Detail
import '../screens/chat_screen.dart';

// Trong Contract Detail widget
ElevatedButton(
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatScreen(
          ptId: contract.ptId,           // ID của PT
          ptName: contract.ptName ?? 'PT', // Tên PT
        ),
      ),
    );
  },
  child: Text('💬 Liên hệ PT'),
)
```

### Bước 3: Test Realtime

**Scenario 1: PT gửi tin nhắn trước**
1. React (PT) mở chat với client → Tạo chat room
2. React gửi tin "Xin chào!"
3. Flutter (Client) mở chat → Nhận ngay tin "Xin chào!"

**Scenario 2: Client gửi tin nhắn trước**
1. Flutter (Client) mở chat → Tạo chat room với format `${ptId}_${clientId}`
2. Flutter gửi tin "Em muốn hỏi..."
3. React (PT) → Danh sách chat tự động hiện client mới
4. React mở chat → Nhận ngay tin của client

**Scenario 3: Realtime 2 chiều**
1. Cả 2 đều mở chat
2. PT gửi tin → Client nhận **NGAY LẬP TỨC**
3. Client gửi tin → PT nhận **NGAY LẬP TỨC**
4. Không cần F5, không cần reload!

---

## 🔐 FIREBASE RULES (Đã cập nhật)

```javascript
match /chats/{chatId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  
  match /messages/{messageId} {
    allow read: if request.auth != null;
    allow create: if request.auth != null;
    allow update: if request.auth != null;
  }
}
```

---

## ✅ CHECKLIST

### React (PT)
- [x] ChatService.js với onSnapshot realtime
- [x] PTChat.jsx component
- [x] Subscribe/unsubscribe cleanup
- [x] Chat ID format: `${ptId}_${clientId}`

### Flutter (Client)
- [x] chat_message.dart model
- [x] chat_room.dart model
- [x] chat_service.dart với Stream realtime
- [x] chat_screen.dart UI
- [x] Chat ID format: `${ptId}_${clientId}`
- [ ] **TỚI ĐÂY** → Tích hợp vào app (thêm button "Liên hệ PT")

### Firebase
- [x] Firestore rules cho chats collection
- [x] Messages subcollection rules
- [x] Indexes (nếu cần)

---

## 🎯 VÍ DỤ FLOW HOÀN CHỈNH

### Client muốn chat với PT:
```dart
// 1. Client đã có contract với PT
final contract = await ContractService.getContract(contractId);

// 2. Mở màn hình chat
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => ChatScreen(
      ptId: contract.ptId,       // ← PT ID từ contract
      ptName: 'Huấn luyện viên', 
    ),
  ),
);

// 3. ChatScreen tự động:
//    - Lấy clientId từ FirebaseAuth.currentUser.uid
//    - Tạo chatId = "${ptId}_${clientId}"
//    - Subscribe realtime messages
//    - Client gửi/nhận tin nhắn REALTIME
```

### PT muốn chat với Client:
```javascript
// 1. PT click "💬 Liên hệ" trong ClientDetailModal
const handleContactClick = () => {
  setShowChat(true); // Mở PTChat component
};

// 2. PTChat.jsx tự động:
//    - Lấy ptId từ auth.currentUser.uid
//    - Nhận clientId từ props (initialClient.id)
//    - Tạo chatId = `${ptId}_${clientId}`
//    - Subscribe realtime messages
//    - PT gửi/nhận tin nhắn REALTIME
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Missing or insufficient permissions"
→ Kiểm tra Firebase Rules đã publish chưa

### Lỗi: Không nhận được tin nhắn realtime
→ Kiểm tra:
1. Chat ID format có giống nhau không
2. `onSnapshot` (React) / `snapshots()` (Flutter) đã subscribe chưa
3. Console log: `🔥 REALTIME:` có hiện không

### Lỗi: Chat ID không match
→ Debug:
```dart
// Flutter
print('Chat ID: ${ptId}_${clientId}');

// React
console.log('Chat ID:', `${ptId}_${clientId}`);
```

---

## 🎉 KẾT QUẢ MONG ĐỢI

- ✅ PT (React) gửi tin → Client (Flutter) nhận **NGAY LẬP TỨC**
- ✅ Client (Flutter) gửi tin → PT (React) nhận **NGAY LẬP TỨC**
- ✅ Không cần reload, F5 hay pull to refresh
- ✅ Cả 2 bên dùng **CÙNG 1 CHAT ROOM** với format `${ptId}_${clientId}`
- ✅ Firestore tự động đồng bộ realtime

---

**Tạo bởi:** GitHub Copilot
**Ngày:** November 16, 2025
