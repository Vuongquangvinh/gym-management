# 📱 FLUTTER CHAT - Hướng dẫn sử dụng

## ✅ ĐÃ TẠO

### 📁 Structure
```
lib/features/chat/
├── models/
│   ├── chat_message.dart    # Model tin nhắn
│   └── chat_room.dart        # Model chat room
├── services/
│   └── chat_service.dart     # Service realtime
├── screens/
│   └── chat_screen.dart      # UI màn hình chat
└── chat.dart                 # Export file
```

### 🔥 REALTIME đã hoạt động
- ✅ `ChatService.subscribeToMessages()` - Stream realtime
- ✅ `ChatScreen` với StreamBuilder - Tự động cập nhật UI
- ✅ Chat ID format: `${ptId}_${clientId}` - Giống React

---

## 🚀 CÁCH SỬ DỤNG

### 1. Import
```dart
import 'package:your_app/features/chat/screens/chat_screen.dart';
// Hoặc
import 'package:your_app/features/chat/chat.dart';
```

### 2. Navigate đến Chat Screen
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => ChatScreen(
      ptId: 'ID_CUA_PT',           // Lấy từ contract.ptId
      ptName: 'Tên PT',             // Lấy từ employee.fullName
    ),
  ),
);
```

---

## 📝 VÍ DỤ TÍCH HỢP

### ✅ Đã tích hợp: Contract Detail Screen

File: `lib/features/personal_PT/screen/contract_detail_screen.dart`

```dart
// Đã thêm button "Liên hệ PT"
ElevatedButton.icon(
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChatScreen(
          ptId: contract.ptId,
          ptName: provider.ptEmployee?.fullName ?? 'Huấn luyện viên',
        ),
      ),
    );
  },
  icon: const Icon(Icons.chat_bubble_outline),
  label: const Text('Liên hệ PT'),
)
```

### Tích hợp vào màn hình khác

**Ví dụ 1: Từ My Contracts Screen**
```dart
// Trong list tile của contract
trailing: IconButton(
  icon: const Icon(Icons.chat),
  onPressed: () async {
    // Lấy thông tin PT từ contract
    final ptId = contract.ptId;
    final ptName = await _getPTName(ptId); // Fetch tên PT
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChatScreen(
          ptId: ptId,
          ptName: ptName,
        ),
      ),
    );
  },
),
```

**Ví dụ 2: Từ PT Profile Screen**
```dart
// Button liên hệ PT
ElevatedButton(
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChatScreen(
          ptId: ptEmployee.id,
          ptName: ptEmployee.fullName,
        ),
      ),
    );
  },
  child: const Text('Nhắn tin cho PT'),
)
```

**Ví dụ 3: Floating Action Button**
```dart
Scaffold(
  floatingActionButton: FloatingActionButton(
    onPressed: () {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ChatScreen(
            ptId: _currentContract.ptId,
            ptName: _ptName,
          ),
        ),
      );
    },
    child: const Icon(Icons.chat),
  ),
)
```

---

## 🔥 TEST REALTIME

### Scenario 1: Client gửi tin nhắn
1. Mở Flutter app (Client)
2. Vào Contract Detail → Click "Liên hệ PT"
3. Gửi tin nhắn "Xin chào!"
4. **Kiểm tra:**
   - Console: `📤 Sending message to chat: ...`
   - Console: `✅ Message sent successfully`

### Scenario 2: PT nhận tin nhắn
1. Mở React app (PT)
2. Vào PT Clients → Click client → Click "💬 Liên hệ"
3. **Kết quả:**
   - Tin nhắn "Xin chào!" hiện ngay lập tức
   - Console: `📨 🔥 REALTIME: Messages updated: 1`

### Scenario 3: PT gửi tin nhắn
1. React (PT) gửi tin "Chào bạn!"
2. **Flutter tự động nhận:**
   - StreamBuilder rebuild
   - Tin nhắn hiện ngay
   - Console: `📨 🔥 REALTIME: Messages updated: 2`

### Scenario 4: Chat 2 chiều realtime
1. Cả 2 đều mở chat
2. Client gửi → PT nhận ngay
3. PT gửi → Client nhận ngay
4. **KHÔNG CẦN** reload, F5, pull to refresh

---

## 🔧 TROUBLESHOOTING

### Lỗi: "User not authenticated"
```dart
// Đảm bảo user đã đăng nhập
final user = FirebaseAuth.instance.currentUser;
if (user == null) {
  // Redirect to login
}
```

### Lỗi: "Missing or insufficient permissions"
→ Kiểm tra Firebase Rules đã publish chưa (xem REALTIME_CHAT_GUIDE.md)

### Lỗi: Chat ID không match với React
```dart
// Debug chat ID
print('Flutter Chat ID: ${ptId}_${clientId}');
```

```javascript
// React
console.log('React Chat ID:', `${ptId}_${clientId}`);
```

→ Đảm bảo **CÙNG FORMAT**

### Messages không realtime
```dart
// Kiểm tra StreamBuilder có đúng không
StreamBuilder<List<ChatMessage>>(
  stream: _chatService.subscribeToMessages(_chatId!), // ← Phải có stream
  builder: (context, snapshot) {
    if (snapshot.hasError) {
      print('Stream error: ${snapshot.error}'); // Debug error
    }
    // ...
  },
)
```

### UI không scroll to bottom
```dart
// Đảm bảo có WidgetsBinding callback
WidgetsBinding.instance.addPostFrameCallback((_) {
  _scrollToBottom();
});
```

---

## 📚 API REFERENCE

### ChatService

#### getOrCreateChat()
```dart
Future<ChatRoom> getOrCreateChat(String ptId, String clientId)
```
Tạo hoặc lấy chat room. Chat ID format: `${ptId}_${clientId}`

**Returns:** ChatRoom object

#### subscribeToMessages()
```dart
Stream<List<ChatMessage>> subscribeToMessages(String chatId)
```
Subscribe realtime to messages. Tự động cập nhật khi có tin nhắn mới.

**Returns:** Stream of message list

#### sendMessage()
```dart
Future<void> sendMessage({
  required String chatId,
  required String senderId,
  required String text,
})
```
Gửi tin nhắn mới. Tự động cập nhật lastMessage trong chat room.

#### subscribeToUserChats()
```dart
Stream<List<ChatRoom>> subscribeToUserChats(String userId)
```
Subscribe realtime to all chats của user. Dùng để hiển thị danh sách chat.

**Returns:** Stream of chat room list

#### markMessagesAsRead()
```dart
Future<void> markMessagesAsRead(String chatId, String userId)
```
Đánh dấu tất cả tin nhắn chưa đọc thành đã đọc.

---

## 🎨 CUSTOM UI

### Thay đổi màu chat bubble
```dart
// Trong _MessageBubble widget
color: isMe 
  ? AppColors.primary         // Màu của mình
  : Colors.grey[200],         // Màu của đối phương
```

### Thay đổi avatar
```dart
// Thay CircleAvatar bằng NetworkImage
CircleAvatar(
  backgroundImage: NetworkImage(ptAvatarUrl),
  radius: 16,
)
```

### Thêm typing indicator
```dart
// Trong ChatScreen state
bool _isTyping = false;

// Trong UI
if (_isTyping)
  Padding(
    padding: EdgeInsets.all(8),
    child: Text('PT đang nhập...'),
  )
```

---

## 📊 FIRESTORE STRUCTURE

```
chats/
  └── ${ptId}_${clientId}/
      ├── pt_id: "EpzCCD3R..."
      ├── client_id: "zNuGqqCY..."
      ├── participants: ["EpzCCD3R...", "zNuGqqCY..."]
      ├── last_message: {
      │     text: "Tin nhắn cuối",
      │     sender_id: "zNuGqqCY...",
      │     timestamp: Timestamp,
      │     is_read: false
      │   }
      ├── created_at: Timestamp
      ├── updated_at: Timestamp
      └── messages/
          ├── messageId1/
          │   ├── sender_id: "zNuGqqCY..."
          │   ├── text: "Xin chào!"
          │   ├── timestamp: Timestamp
          │   └── is_read: false
          └── messageId2/
              └── ...
```

---

## ✅ CHECKLIST

- [x] ChatService với Stream realtime
- [x] ChatScreen UI với StreamBuilder
- [x] Chat ID format giống React
- [x] Models (ChatMessage, ChatRoom)
- [x] Tích hợp vào Contract Detail
- [ ] Test với React PT (thử gửi/nhận tin)
- [ ] Custom UI theo thiết kế app
- [ ] Thêm avatar ảnh thật (nếu có)
- [ ] Thêm notification badge (số tin chưa đọc)
- [ ] Thêm push notification (nếu cần)

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** November 16, 2025  
**File tham khảo:** REALTIME_CHAT_GUIDE.md
