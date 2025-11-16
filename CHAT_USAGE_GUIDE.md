# Hướng dẫn sử dụng Chat Feature

## 📋 Tổng quan

Hệ thống chat real-time giữa PT (Personal Trainer) và Client sử dụng Firebase Firestore.

## 🏗️ Kiến trúc

### 1. **Models** (`ChatModel.js`)
- `ChatModel`: Quản lý cuộc trò chuyện
- `MessageModel`: Quản lý tin nhắn

### 2. **Services** (`ChatService.js`)
- `getOrCreateChat()`: Tạo hoặc lấy chat
- `sendMessage()`: Gửi tin nhắn
- `subscribeToMessages()`: Real-time messages
- `subscribeToPTChats()`: Real-time chat list
- `markMessagesAsRead()`: Đánh dấu đã đọc
- `getUnreadCount()`: Đếm tin nhắn chưa đọc

### 3. **Component** (`PTChat.jsx`)
- Chat UI với sidebar và message area
- Real-time updates
- Loading states
- Empty states

## 🚀 Cách sử dụng

### 1. Từ Client Detail Modal:
```jsx
// Click nút "Liên hệ" trong ClientDetailModal
<button onClick={() => setShowChat(true)}>💬 Liên hệ</button>

// PTChat sẽ mở với initialClient
<PTChat 
  initialClient={{ id: clientId, name: clientName }} 
  onClose={() => setShowChat(false)} 
/>
```

### 2. Standalone Chat Page:
```jsx
// Không truyền initialClient để hiển thị danh sách
<PTChat onClose={handleClose} />
```

## 📊 Cấu trúc Firestore

```
chats/
  └── {ptId}_{clientId}/
      ├── pt_id
      ├── client_id
      ├── participants: [ptId, clientId]
      ├── last_message: {...}
      ├── created_at
      ├── updated_at
      └── messages/
          └── {messageId}/
              ├── sender_id
              ├── text
              ├── timestamp
              └── is_read
```

## ⚙️ Setup

### 1. Deploy Firestore Rules:
```bash
cd backend
firebase deploy --only firestore:rules
```

### 2. Tạo Indexes (tự động hoặc manual):
- Firebase Console sẽ tự đề xuất indexes khi query lần đầu
- Hoặc deploy manual: `firebase deploy --only firestore:indexes`

### 3. Test trong Firebase Console:
- Firestore > Rules > Rules Playground
- Test read/write permissions

## 🔒 Security

- ✅ Chỉ PT và Client trong chat mới có quyền truy cập
- ✅ Sender phải là current user
- ✅ Không thể đọc tin nhắn của người khác
- ✅ Không thể fake sender_id

## 🎯 Features

- ✅ Real-time messaging
- ✅ Read receipts (đã đọc)
- ✅ Last message preview
- ✅ Timestamp formatting
- ✅ Loading states
- ✅ Error handling
- ✅ Auto scroll to bottom
- ✅ Responsive design
- ✅ Góc phải màn hình

## 📝 TODO (Tương lai)

- [ ] Lấy tên thật của Client từ Firestore (hiện tại dùng ID)
- [ ] Typing indicator (đang nhắn...)
- [ ] Image/File upload
- [ ] Notification khi có tin nhắn mới
- [ ] Emoji picker
- [ ] Message reactions
- [ ] Delete/Edit messages
- [ ] Search messages

## 🐛 Debug

### Nếu không load được tin nhắn:
1. Kiểm tra Firebase Authentication: `auth.currentUser`
2. Kiểm tra Firestore Rules
3. Kiểm tra Console errors
4. Kiểm tra Network tab trong DevTools

### Nếu không gửi được tin nhắn:
1. Kiểm tra `currentChatId` có giá trị
2. Kiểm tra `currentUserId` có giá trị
3. Kiểm tra Firestore permissions
4. Xem error message trong alert

## 📞 Example Usage

```jsx
// Trong PTClients.jsx hoặc bất kỳ component nào
import PTChat from './PTChat';

function MyComponent() {
  const [showChat, setShowChat] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const handleContactClient = (client) => {
    setSelectedClient(client);
    setShowChat(true);
  };

  return (
    <>
      <button onClick={() => handleContactClient(client)}>
        Liên hệ
      </button>
      
      {showChat && (
        <PTChat 
          initialClient={selectedClient} 
          onClose={() => setShowChat(false)} 
        />
      )}
    </>
  );
}
```

## 🎨 Customization

### Thay đổi vị trí chat window:
Chỉnh trong `PTChat.css`:
```css
.pt-chat-container {
  position: fixed;
  right: 20px;   /* Thay đổi vị trí ngang */
  bottom: 20px;  /* Thay đổi vị trí dọc */
  /* ... */
}
```

### Thay đổi kích thước:
```css
.pt-chat-container {
  width: 450px;   /* Thay đổi chiều rộng */
  height: 600px;  /* Thay đổi chiều cao */
}
```
