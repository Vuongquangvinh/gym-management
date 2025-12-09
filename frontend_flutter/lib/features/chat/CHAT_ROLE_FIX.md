# 🔧 Fix: Chat Role Confusion - PT vs Client

## ❌ Vấn đề

Khi PT mở chat với học viên từ `PTClientDetailScreen`, logic trong `ChatScreen` bị nhầm lẫn vai trò:

- **Logic cũ**: Luôn giả định người dùng hiện tại (currentUser) là **Client**
- **Thực tế**: Khi PT mở chat, người dùng hiện tại là **PT**, không phải Client!

## 🔍 Root Cause

```dart
// ❌ TRƯỚC ĐÂY (SAI)
_currentUserId = clientId;  // Luôn gán clientId cho currentUser
                            // Nhưng khi PT mở chat, currentUser = PT, không phải client!
```

Điều này dẫn đến:
1. `_currentUserId` (người gửi tin nhắn) bị sai
2. Tin nhắn hiển thị sai bên (PT's messages xuất hiện bên trái thay vì bên phải)
3. Logic gửi tin nhắn gửi sai sender

## ✅ Giải pháp

Thêm logic phát hiện **mode** (PT mode vs Client mode):

```dart
// ✅ SAU KHI FIX
bool isPTMode = (clientId != null && clientId.isNotEmpty);

if (isPTMode) {
  // PT đang chat với client
  _currentUserId = authUid;  // PT là người gửi
  // clientId đã có từ parameter
} else {
  // Client đang chat với PT
  // Query để tìm clientId từ currentUser
  _currentUserId = clientId;  // Client là người gửi
}
```

## 📊 Flow so sánh

### Before Fix:
```
PT opens chat
  → PTClientDetailScreen passes: ptId=PT_UID, clientId=CLIENT_ID
  → ChatScreen receives both
  → _initializeChat() runs
  → ❌ _currentUserId = clientId (WRONG! Should be PT_UID)
  → PT sends message
  → ❌ Message appears on left (because sender looks like client)
```

### After Fix:
```
PT opens chat
  → PTClientDetailScreen passes: ptId=PT_UID, clientId=CLIENT_ID
  → ChatScreen receives both
  → _initializeChat() detects isPTMode = true
  → ✅ _currentUserId = authUid (PT_UID) (CORRECT!)
  → PT sends message
  → ✅ Message appears on right (because sender is PT)
```

## 🔑 Key Changes

### 1. Phát hiện mode
```dart
bool isPTMode = (clientId != null && clientId.isNotEmpty);
```

**Logic:**
- Nếu `clientId` được truyền vào → PT Mode (PT đang mở chat)
- Nếu không → Client Mode (Client đang mở chat)

### 2. Set đúng _currentUserId
```dart
if (isPTMode) {
  _currentUserId = authUid;  // PT là sender
} else {
  _currentUserId = clientId; // Client là sender (sau khi query)
}
```

### 3. Chat room ID vẫn đúng format
```dart
// Format: ${ptId}_${clientId} - KHÔNG ĐỔI
final chatRoom = await _chatService.getOrCreateChat(
  widget.ptId,
  clientId,
);
```

## 📱 Test Cases

### Test 1: PT mở chat với học viên
1. Login as PT
2. Vào "Học viên" tab
3. Chọn một học viên
4. Tap "Nhắn tin với học viên"
5. Gửi tin nhắn
6. ✅ Tin nhắn xuất hiện bên **phải** (màu xanh)

### Test 2: Client mở chat với PT
1. Login as Client
2. Vào contract detail
3. Tap "Liên hệ PT"
4. Gửi tin nhắn
5. ✅ Tin nhắn xuất hiện bên **phải** (màu xanh)

### Test 3: Chat 2 chiều
1. PT gửi tin → xuất hiện bên phải (xanh)
2. Client reply → xuất hiện bên trái (trắng)
3. ✅ Phân biệt rõ ràng ai gửi ai nhận

## 🎯 Kết quả

✅ **PT Mode**: _currentUserId = PT's UID → Tin nhắn bên phải  
✅ **Client Mode**: _currentUserId = Client's ID → Tin nhắn bên phải  
✅ **Chat Room ID**: Luôn đúng format `${ptId}_${clientId}`  
✅ **Messages**: Hiển thị đúng bên (left/right) dựa vào sender  

## 📝 Code Changes

**File:** `lib/features/chat/screens/chat_screen.dart`

**Function:** `_initializeChat()`

**Lines changed:** ~175-280

**Key additions:**
- `bool isPTMode` detection
- Conditional `_currentUserId` assignment
- Better logging for debugging

---

**Fixed by**: Doan4 Team  
**Date**: December 9, 2025  
**Issue**: Chat role confusion between PT and Client modes
