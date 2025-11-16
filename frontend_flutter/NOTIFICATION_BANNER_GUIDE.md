# 🔔 Hướng Dẫn Notification Banner

## 📌 Tổng Quan

Banner thông báo trên `HomeScreen` hiển thị khi có thông báo mới, bao gồm:
- **Firestore notifications**: Thông báo đã nhận (chưa đọc)
- **Pending notifications**: Thông báo đã lên lịch (chưa gửi)

---

## 🔍 Vấn Đề Ban Đầu

### Triệu Chứng
```
I/flutter ( 7938): 🔔 Banner check: unreadCount=0, _lastUnreadCount=0, _showBanner=false
I/flutter ( 7938): 🔔 Banner: Không hiển thị (unreadCount: 0 <= lastCount: 0)
I/flutter ( 7938): 📅 Tổng số pending notifications: 2  ❌ Nhưng banner KHÔNG hiện
```

### Nguyên Nhân
Banner chỉ đếm **Firestore notifications** (`isRead = false`), KHÔNG đếm **pending local notifications** (đã lên lịch nhưng chưa gửi).

#### Luồng Hoạt Động Ban Đầu:

```
1️⃣ PTScheduleNotificationService lên lịch 2 notifications
   ├─ ID: 952031200 → Thứ 4, 12:00 (18/11/2025)
   └─ ID: 604063506 → Thứ 4, 08:00 (18/11/2025)
   
2️⃣ Notifications lưu trong FlutterLocalNotifications (pending)
   └─ KHÔNG có trong Firestore
   
3️⃣ HomeScreen query Firestore:
   .where('userId', isEqualTo: userId)
   .where('isRead', isEqualTo: false)
   └─ Kết quả: 0 documents ❌
   
4️⃣ Banner check: unreadCount = 0 → Không hiển thị
```

---

## ✅ Giải Pháp

### Cách Hoạt Động Mới

```dart
// 1. Load pending notifications khi khởi tạo
Future<void> _loadPendingNotifications() async {
  final notificationService = NotificationService();
  final pending = await notificationService.getPendingNotifications();
  setState(() {
    _pendingNotificationCount = pending.length;  // = 2
  });
}

// 2. Tính tổng số thông báo
void _showNotificationBanner(int firestoreUnreadCount) {
  final totalUnreadCount = firestoreUnreadCount + _pendingNotificationCount;
  // totalUnreadCount = 0 (Firestore) + 2 (pending) = 2 ✅
  
  if (totalUnreadCount > _lastUnreadCount && !_showBanner) {
    setState(() {
      _showBanner = true;
      _lastUnreadCount = totalUnreadCount;
    });
  }
}

// 3. Hiển thị badge trên icon
final totalUnreadCount = firestoreUnreadCount + _pendingNotificationCount;
if (totalUnreadCount > 0)
  Container(
    child: Text(totalUnreadCount > 9 ? '9+' : '$totalUnreadCount'),
  )
```

### Luồng Hoạt Động Mới:

```
📱 App Start
 │
 ├─ initState()
 │   ├─ _loadUserInfo()
 │   └─ _loadPendingNotifications()
 │       └─ NotificationService.getPendingNotifications()
 │           └─ _pendingNotificationCount = 2 ✅
 │
 ├─ StreamBuilder (Firestore)
 │   ├─ Query: .where('isRead', isEqualTo: false)
 │   ├─ firestoreUnreadCount = 0
 │   └─ totalUnreadCount = 0 + 2 = 2 ✅
 │
 └─ _showNotificationBanner(0)
     ├─ totalUnreadCount = 2
     ├─ 2 > 0 → TRUE
     └─ setState({ _showBanner = true }) ✅
```

---

## 🎯 Kết Quả

### Log Khi Chạy:
```
🔔 Pending notifications loaded: 2
🔔 Banner check: firestoreUnread=0, pending=2, total=2, _lastUnreadCount=0, _showBanner=false
🔔 Banner: Hiển thị vì có 2 thông báo (Firestore: 0, Pending: 2) ✅
```

### Banner Hiển thị:
```
┌─────────────────────────────────────────────┐
│ 🔔 Bạn có 2 thông báo (2 sắp tới)          │
└─────────────────────────────────────────────┘
```

### Badge Trên Icon:
```
🔔 [2]  ← Hiển thị tổng số (Firestore + Pending)
```

---

## 📊 So Sánh

| Tính Năng | Trước | Sau |
|-----------|-------|-----|
| **Firestore notifications** | ✅ Đếm | ✅ Đếm |
| **Pending notifications** | ❌ Không đếm | ✅ Đếm |
| **Banner khi có pending** | ❌ Không hiện | ✅ Hiện |
| **Badge total** | Chỉ Firestore | Firestore + Pending |
| **Thông tin chi tiết** | "X thông báo mới" | "X thông báo (Y sắp tới)" |

---

## 🔧 Cách Sử Dụng

### 1. Banner Tự Động Hiện
Khi load app với pending notifications, banner sẽ tự hiện trong 5 giây.

### 2. Xem Thông Báo
Click vào banner hoặc icon để mở màn hình notifications.

### 3. Banner Logic
```dart
if (totalUnreadCount > _lastUnreadCount && !_showBanner) {
  // Hiện banner khi:
  // - Có thông báo mới (tổng tăng)
  // - Banner chưa đang hiển thị
  _showBanner = true;
}
```

### 4. Auto Dismiss
Banner tự ẩn sau 5 giây hoặc khi user click.

---

## 🚀 Kịch Bản Thực Tế

### Scenario 1: Lần Đầu Mở App (Có Pending)
```
1. App start → _loadPendingNotifications() → pending = 2
2. StreamBuilder → firestoreUnread = 0
3. totalUnread = 0 + 2 = 2
4. Banner hiện: "Bạn có 2 thông báo (2 sắp tới)" ✅
```

### Scenario 2: Nhận Notification Mới Từ Firestore
```
1. Firestore thêm notification (push từ server)
2. StreamBuilder rebuild → firestoreUnread = 1
3. totalUnread = 1 + 2 = 3
4. 3 > 2 → Banner hiện: "Bạn có 3 thông báo (2 sắp tới)" ✅
```

### Scenario 3: Pending Notification Được Gửi
```
1. Đến thời gian → Local notification gửi
2. PTScheduleNotificationService tạo Firestore record
3. StreamBuilder → firestoreUnread = 1
4. _pendingNotificationCount giảm (sau khi reload)
5. totalUnread = 1 + 1 = 2
```

---

## 📝 Code Changes

### HomeScreen State
```dart
class _HomeScreenState extends State<HomeScreen> {
  int _lastUnreadCount = 0;
  bool _showBanner = false;
  int _pendingNotificationCount = 0;  // ➕ NEW
  
  @override
  void initState() {
    super.initState();
    _loadUserInfo();
    _loadPendingNotifications();  // ➕ NEW
  }
}
```

### Load Pending
```dart
Future<void> _loadPendingNotifications() async {
  final notificationService = NotificationService();
  final pending = await notificationService.getPendingNotifications();
  setState(() {
    _pendingNotificationCount = pending.length;
  });
}
```

### Banner Logic
```dart
void _showNotificationBanner(int firestoreUnreadCount) {
  final totalUnreadCount = firestoreUnreadCount + _pendingNotificationCount;
  
  if (totalUnreadCount > _lastUnreadCount && !_showBanner) {
    setState(() {
      _showBanner = true;
      _lastUnreadCount = totalUnreadCount;
    });
  }
}
```

### Display
```dart
StreamBuilder<QuerySnapshot>(
  builder: (context, snapshot) {
    final firestoreUnreadCount = snapshot.data?.docs.length ?? 0;
    final totalUnreadCount = firestoreUnreadCount + _pendingNotificationCount;
    
    // Badge
    Text(totalUnreadCount > 9 ? '9+' : '$totalUnreadCount')
  }
)
```

---

## ⚠️ Lưu Ý

1. **Pending count không tự động cập nhật**: Cần reload app hoặc gọi `_loadPendingNotifications()` sau khi schedule/cancel.

2. **Không thể refresh real-time**: Local notifications không có stream, phải poll thủ công.

3. **Banner chỉ hiện khi tăng**: Nếu pending = 2 → 1, banner không hiện (số giảm).

4. **Initial load**: Banner chỉ hiện lần đầu nếu `totalUnreadCount > 0` (vì `_lastUnreadCount = 0`).

---

## 🎨 UI Components

### Banner
```
┌─────────────────────────────────────────────────────┐
│ 🔔 Bạn có 5 thông báo (2 sắp tới)            →     │
└─────────────────────────────────────────────────────┘
   ↓ Click để xem
```

### Badge
```
🔔 ⓿ ← Không có thông báo
🔔 ❷ ← 2 thông báo (Firestore + Pending)
🔔 9+ ← > 9 thông báo
```

---

## 🐛 Debug

### Check Pending Count
```dart
final service = NotificationService();
final pending = await service.getPendingNotifications();
print('Pending: ${pending.length}');
pending.forEach((p) => print('- ID: ${p.id}, Title: ${p.title}'));
```

### Check Firestore Count
```dart
final snapshot = await FirebaseFirestore.instance
    .collection('notifications')
    .where('userId', isEqualTo: userId)
    .where('isRead', isEqualTo: false)
    .get();
print('Firestore unread: ${snapshot.docs.length}');
```

### Manual Trigger Banner
```dart
setState(() {
  _lastUnreadCount = 0;  // Reset
});
_showNotificationBanner(firestoreUnreadCount);  // Trigger
```

---

## ✨ Tính Năng Mở Rộng

### Refresh Pending Count
```dart
void _refreshNotifications() async {
  await _loadPendingNotifications();
  // Trigger rebuild StreamBuilder
}
```

### Periodic Check
```dart
Timer.periodic(Duration(minutes: 5), (_) {
  _loadPendingNotifications();
});
```

### Separate Display
```dart
'Bạn có $firestoreUnreadCount thông báo mới'
'$_pendingNotificationCount lời nhắc sắp tới'
```

---

**Tác giả:** GitHub Copilot  
**Ngày:** 12/11/2025  
**Version:** 1.0
