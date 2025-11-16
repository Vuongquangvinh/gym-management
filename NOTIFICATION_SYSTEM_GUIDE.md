# Hướng Dẫn Hệ Thống Thông Báo PT Schedule

## 📋 Tổng Quan

Hệ thống thông báo tự động nhắc nhở người dùng về các buổi tập với PT (Personal Trainer). Thông báo được gửi **1 ngày trước** buổi tập, vào cùng giờ với lịch tập.

**Ví dụ:** 
- Buổi tập: Thứ 3, 15/11/2025, 14:00-15:00
- Thông báo: Thứ 2, 14/11/2025, 14:00

---

## 🏗️ Kiến Trúc Hệ Thống

### 1. **Các Component Chính**

```
┌─────────────────────────────────────────────────────────────┐
│                     User Actions                             │
│  (Login / Payment / Edit Schedule)                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│        PTScheduleNotificationService                         │
│  - scheduleAllWorkoutNotifications()                        │
│  - Query contracts từ Firestore                             │
│  - Tính toán thời gian thông báo                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│            NotificationService                               │
│  - scheduleNotification()                                   │
│  - Sử dụng flutter_local_notifications                     │
│  - Lên lịch thông báo với OS                               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│         Android Notification Manager                         │
│  - Lưu trữ pending notifications                           │
│  - Trigger notification đúng giờ                            │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Firestore (History)                             │
│  - Lưu lịch sử thông báo                                   │
│  - Collection: 'notifications'                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Cấu Trúc File

### **1. NotificationService** 
📍 `lib/services/notification_service.dart`

**Nhiệm vụ:** Quản lý notification ở tầng thấp (wrapper cho flutter_local_notifications)

**Các method chính:**
```dart
// Khởi tạo notification system
Future<void> initialize()

// Hiển thị notification ngay lập tức
Future<void> showNotification({
  required int id,
  required String title,
  required String body,
})

// Lên lịch notification cho tương lai
Future<void> scheduleNotification({
  required int id,
  required String title,
  required String body,
  required DateTime scheduledTime,
  String? payload,
})

// Hủy notification
Future<void> cancelNotification(int id)

// Lấy danh sách notifications đang pending
Future<List<PendingNotificationRequest>> getPendingNotifications()
```

**Chi tiết hoạt động:**

```dart
// 1. Initialize (được gọi trong main.dart khi app khởi động)
await NotificationService().initialize();
// ↓
// - Cấu hình Android notification channel
// - Yêu cầu permissions (Android 13+)
// - Setup timezone (cho scheduling)

// 2. Schedule notification
await scheduleNotification(
  id: 123456,
  title: "🏋️ Nhắc nhở tập với PT!",
  body: "Thứ 3 lúc 14:00-15:00",
  scheduledTime: DateTime(2025, 11, 14, 14, 0),
);
// ↓
// - Convert DateTime sang TZDateTime (timezone-aware)
// - Sử dụng AndroidScheduleMode.inexactAllowWhileIdle
//   (Không cần SCHEDULE_EXACT_ALARM permission)
// - Lưu vào Android AlarmManager
```

**Android Configuration:**
```dart
const androidPlatformChannelSpecifics = AndroidNotificationDetails(
  'pt_workout_channel',           // Channel ID
  'PT Workout Reminders',          // Channel Name
  channelDescription: 'Nhắc nhở về buổi tập PT',
  importance: Importance.high,     // Hiển thị đầy đủ
  priority: Priority.high,         // Ưu tiên cao
  ticker: 'PT Workout',
);

// Schedule mode (QUAN TRỌNG!)
AndroidScheduleMode.inexactAllowWhileIdle
// - Không cần exact alarm permission
// - Có thể delay vài phút (chấp nhận được)
// - Hoạt động ngay cả khi device ở chế độ Doze
```

---

### **2. PTScheduleNotificationService**
📍 `lib/services/pt_schedule_notification_service.dart`

**Nhiệm vụ:** Business logic cho PT schedule notifications

**Flow hoạt động:**

```dart
// 1. USER LOGIN/PAYMENT/EDIT SCHEDULE
await PTScheduleNotificationService().scheduleAllWorkoutNotifications();

// 2. QUERY FIRESTORE
final contracts = await FirebaseFirestore.instance
  .collection('contracts')
  .where('userId', isEqualTo: currentUserId)
  .where('status', whereIn: ['active', 'approved', 'paid'])
  .get();

// 3. LOOP QUA TỪNG CONTRACT
for (contract in contracts) {
  // 4. LOOP QUA TỪNG TIME SLOT
  for (timeSlot in contract.selectedTimeSlots) {
    // Parse thời gian: "14:00"
    final hour = 14;
    final minute = 0;
    
    // 5. TÍNH NGÀY TẬP TIẾP THEO
    final nextWorkoutDate = _getNextWorkoutDate(
      dayOfWeek: timeSlot.dayOfWeek,  // 0=CN, 1=T2, ..., 6=T7
      hour: hour,
      minute: minute,
    );
    // Ví dụ: Hôm nay là T2 (12/11/2025 8:00)
    //        Tìm Thứ 3 14:00 tiếp theo
    //        → 13/11/2025 14:00
    
    // 6. TRỪ 1 NGÀY ĐỂ CÓ THỜI ĐIỂM THÔNG BÁO
    final notificationTime = nextWorkoutDate.subtract(Duration(days: 1));
    // → 12/11/2025 14:00 (hôm nay lúc 14:00)
    
    // 7. KIỂM TRA THỜI ĐIỂM THÔNG BÁO CHƯA QUA
    if (notificationTime.isAfter(DateTime.now())) {
      // 8. TẠO NOTIFICATION ID DUY NHẤT
      final notificationId = _generateNotificationId(
        contract.id,
        timeSlot.dayOfWeek,
        hour,
        minute,
      );
      // ID format: contractHash * 1000000 + timeCode
      // Đảm bảo fit trong 32-bit integer
      
      // 9. LÊN LỊCH THÔNG BÁO
      await NotificationService().scheduleNotification(
        id: notificationId,
        title: "🏋️ Nhắc nhở: Ngày mai có buổi tập với PT!",
        body: "Thứ 3 lúc 14:00 - 15:00\nChuẩn bị tinh thần, trang phục và đồ tập nhé! 💪",
        scheduledTime: notificationTime,
        payload: "contract:${contract.id}",
      );
      
      // 10. LƯU VÀO FIRESTORE (LỊCH SỬ)
      await NotificationModel.create(
        userId: contract.userId,
        title: "🏋️ Nhắc nhở: Ngày mai có buổi tập với PT!",
        body: "Thứ 3 lúc 14:00 - 15:00...",
        type: 'pt_schedule',
        data: {
          'contractId': contract.id,
          'scheduledTime': notificationTime.toIso8601String(),
        },
      );
    }
  }
}
```

**Chi tiết các helper functions:**

#### `_getNextWorkoutDate()`
```dart
// Mục đích: Tìm ngày tập tiếp theo dựa trên dayOfWeek
DateTime _getNextWorkoutDate(int targetDayOfWeek, int hour, int minute) {
  final now = DateTime.now();
  
  // Flutter weekday: 1=Monday, 7=Sunday
  // Model: 0=Sunday, 1=Monday, ..., 6=Saturday
  int currentDayOfWeek = now.weekday % 7; // Convert sang 0-6
  
  int daysToAdd;
  
  if (currentDayOfWeek == targetDayOfWeek) {
    // Cùng ngày trong tuần
    final workoutTime = DateTime(now.year, now.month, now.day, hour, minute);
    if (workoutTime.isAfter(now)) {
      daysToAdd = 0; // Còn kịp hôm nay
    } else {
      daysToAdd = 7; // Tuần sau
    }
  } else if (targetDayOfWeek > currentDayOfWeek) {
    // Ngày trong tuần này
    daysToAdd = targetDayOfWeek - currentDayOfWeek;
  } else {
    // Tuần sau
    daysToAdd = 7 - (currentDayOfWeek - targetDayOfWeek);
  }
  
  return DateTime(
    now.year,
    now.month,
    now.day + daysToAdd,
    hour,
    minute,
  );
}

// VÍ DỤ:
// Hôm nay: T2 (12/11/2025) 8:00
// Target: Thứ 3 (dayOfWeek=2) 14:00
// currentDayOfWeek = 1 (T2)
// targetDayOfWeek = 2 (T3)
// → daysToAdd = 2 - 1 = 1
// → Return: 13/11/2025 14:00
```

#### `_generateNotificationId()`
```dart
// Mục đích: Tạo ID duy nhất cho mỗi notification
// Yêu cầu: Phải < 2^31 (2,147,483,647) vì Android dùng int32
int _generateNotificationId(
  String contractId, 
  int dayOfWeek, 
  int hour, 
  int minute
) {
  // 1. Hash contractId
  final contractHash = contractId.hashCode.abs();
  
  // 2. Tạo time code từ dayOfWeek + hour + minute
  final timeCode = (dayOfWeek * 10000) + (hour * 100) + minute;
  // Ví dụ: Thứ 3 (2) 14:00 → 2*10000 + 14*100 + 0 = 21400
  
  // 3. Kết hợp
  final id = ((contractHash % 10000) * 1000000) + timeCode;
  
  // 4. Ensure 32-bit
  return id % 2147483647;
}

// VÍ DỤ:
// contractId = "abc123" → hash = 948372615
// dayOfWeek = 2, hour = 14, minute = 0
// contractHash % 10000 = 2615
// timeCode = 21400
// id = 2615 * 1000000 + 21400 = 2615021400
// final = 2615021400 % 2147483647 = 467537753 ✅
```

---

### **3. NotificationModel**
📍 `lib/features/notifications/models/notification_model.dart`

**Nhiệm vụ:** Firestore model để lưu lịch sử thông báo

**Schema:**
```dart
Collection: 'notifications'
Document: auto-generated ID
Fields:
  - userId: String           // ID người dùng
  - title: String            // "🏋️ Nhắc nhở: Ngày mai có buổi tập với PT!"
  - body: String             // "Thứ 3 lúc 14:00 - 15:00..."
  - type: String             // 'pt_schedule' | 'payment' | 'general'
  - isRead: bool             // false (mặc định)
  - createdAt: Timestamp     // Thời điểm tạo record
  - data: Map<String, dynamic> // Metadata (contractId, scheduledTime, etc.)
```

**Các method:**
```dart
// Tạo notification mới
static Future<void> create({
  required String userId,
  required String title,
  required String body,
  String type = 'general',
  Map<String, dynamic>? data,
})

// Đánh dấu đã đọc
static Future<void> markAsRead(String notificationId)

// Đánh dấu tất cả đã đọc
static Future<void> markAllAsRead(String userId)

// Xóa notification
static Future<void> delete(String notificationId)
```

**Firestore Index (QUAN TRỌNG!):**
```json
// File: backend/firestore.indexes.json
{
  "collectionGroup": "notifications",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "mode": "ASCENDING" },
    { "fieldPath": "createdAt", "mode": "DESCENDING" }
  ]
}
```
⚠️ **Phải deploy index:** `firebase deploy --only firestore:indexes`

---

### **4. NotificationsScreen**
📍 `lib/features/notifications/screens/notifications_screen.dart`

**Nhiệm vụ:** UI hiển thị lịch sử thông báo

**Cấu trúc:**
```dart
// 1. StreamBuilder lắng nghe Firestore real-time
StreamBuilder<QuerySnapshot>(
  stream: FirebaseFirestore.instance
    .collection('notifications')
    .where('userId', isEqualTo: currentUserId)
    .orderBy('createdAt', descending: true)
    .snapshots(),
  builder: (context, snapshot) {
    // 2. Xử lý states
    if (snapshot.hasError) {
      // Kiểm tra nếu index đang building
      if (error.contains('index')) {
        return "Đang chuẩn bị... Vui lòng thử lại sau 2-3 phút";
      }
      return "Có lỗi xảy ra";
    }
    
    if (snapshot.connectionState == ConnectionState.waiting) {
      return CircularProgressIndicator();
    }
    
    // 3. Hiển thị danh sách
    final notifications = snapshot.data!.docs;
    
    return ListView.builder(
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        final notif = notifications[index];
        
        // 4. Dismissible để swipe xóa
        return Dismissible(
          key: Key(notif.id),
          direction: DismissDirection.endToStart,
          onDismissed: (direction) {
            NotificationModel.delete(notif.id);
          },
          background: Container(color: Colors.red),
          child: NotificationCard(...),
        );
      },
    );
  },
)
```

**Features:**
- ✅ Real-time updates (StreamBuilder)
- ✅ Swipe to delete
- ✅ Mark as read
- ✅ Custom time ago ("2 giờ trước", "1 ngày trước")
- ✅ Navigate based on type
- ✅ Unread badge

---

## 🔄 Luồng Hoạt Động Đầy Đủ

### **Scenario 1: User đăng nhập lần đầu**

```
1. User nhập email/password → Login
   ↓
2. LoginScreen → scheduleAllWorkoutNotifications()
   ↓
3. Query contracts từ Firestore
   Status: ['active', 'approved', 'paid']
   ↓
4. Tìm thấy 2 contracts:
   - Contract A: 7 time slots
   - Contract B: 7 time slots
   ↓
5. Loop qua 14 time slots
   For each slot:
   - Tính nextWorkoutDate
   - Trừ 1 ngày → notificationTime
   - Nếu notificationTime > now:
     + Schedule với OS
     + Save vào Firestore
   ↓
6. Kết quả: "✅ Đã lên lịch 14 thông báo thành công"
   ↓
7. Android lưu 14 pending notifications
   ↓
8. Firestore có 14 documents trong collection 'notifications'
```

### **Scenario 2: Đến giờ thông báo**

```
1. Android AlarmManager trigger đúng giờ
   Example: 12/11/2025 14:00
   ↓
2. flutter_local_notifications show notification
   Title: "🏋️ Nhắc nhở: Ngày mai có buổi tập với PT!"
   Body: "Thứ 3 lúc 14:00 - 15:00..."
   ↓
3. User thấy notification trên status bar
   ↓
4. User tap vào notification
   ↓
5. App mở và navigate đến contract detail
   (Dựa vào payload: "contract:abc123")
```

### **Scenario 3: User xem lịch sử**

```
1. User tap vào icon 🔔 ở HomeScreen
   ↓
2. Navigate to NotificationsScreen
   ↓
3. StreamBuilder query Firestore:
   .where('userId', isEqualTo: userId)
   .orderBy('createdAt', descending: true)
   ↓
4. Hiển thị danh sách (real-time)
   ↓
5. User swipe để xóa
   ↓
6. Call NotificationModel.delete(id)
   ↓
7. Firestore xóa document
   ↓
8. StreamBuilder tự động update UI
```

---

## ⚙️ Cấu Hình Quan Trọng

### **1. Android Permissions**
📍 `android/app/src/main/AndroidManifest.xml`

```xml
<!-- Notification permissions -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>

<!-- Không cần SCHEDULE_EXACT_ALARM vì dùng inexactAllowWhileIdle -->
```

### **2. Core Library Desugaring**
📍 `android/app/build.gradle.kts`

```kotlin
android {
    compileOptions {
        // Required by flutter_local_notifications
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")
}
```

**Tại sao cần?** 
- `flutter_local_notifications` sử dụng Java 8+ APIs
- Android cũ không support → Cần desugaring

### **3. Flutter Dependencies**
📍 `pubspec.yaml`

```yaml
dependencies:
  flutter_local_notifications: ^17.2.3  # Core notification
  timezone: ^0.9.4                      # Timezone support
  cloud_firestore: ^5.5.0               # Lưu lịch sử
  firebase_auth: ^5.3.3                 # User authentication
```

---

## 🐛 Troubleshooting

### **Lỗi 1: "Exact alarms are not permitted"**
```
PlatformException(exact_alarms_not_permitted, Exact alarms are not permitted)
```

**Nguyên nhân:** Dùng `exactAllowWhileIdle` nhưng chưa có permission

**Giải pháp:**
```dart
// Đổi sang inexactAllowWhileIdle
usingAlarmManager: true,
allowWhileIdle: true,
androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
```

### **Lỗi 2: Notification ID overflow**
```
Notification ID 9489910600 exceeds 2^31
```

**Nguyên nhân:** ID > 2,147,483,647

**Giải pháp:**
```dart
final id = _generateNotificationId(...);
return id % 2147483647; // Ensure 32-bit
```

### **Lỗi 3: "The query requires an index"**
```
FAILED_PRECONDITION: The query requires an index
```

**Nguyên nhân:** Query `userId + createdAt` chưa có index

**Giải pháp:**
1. Thêm vào `firestore.indexes.json`
2. Deploy: `firebase deploy --only firestore:indexes`
3. Chờ 2-5 phút để build

### **Lỗi 4: Không nhận được notification**

**Checklist:**
```
✅ Đã gọi NotificationService().initialize() trong main()?
✅ Đã request permission (Android 13+)?
✅ Thời gian notificationTime có > DateTime.now()?
✅ Có pending notifications trong getPendingNotifications()?
✅ App có bị force stop không? (Clear từ Recent Apps)
✅ Battery optimization có block notification không?
```

**Debug:**
```dart
// Check pending notifications
final pending = await NotificationService().getPendingNotifications();
print('Pending: ${pending.length}');
pending.forEach((p) {
  print('ID: ${p.id}, Title: ${p.title}, Time: ${p.payload}');
});
```

---

## 📱 Testing Guide

### **Test 1: Lên lịch thông báo**
```dart
// 1. Login vào app
// 2. Check logs
I/flutter: ✅ Đã lên lịch 14 thông báo thành công
I/flutter: 📅 Tổng số pending notifications: 14

// 3. Verify Firestore
// Mở Firebase Console → Firestore → notifications collection
// Phải thấy 14 documents
```

### **Test 2: Nhận thông báo**
```dart
// Option 1: Đổi thời gian test (1 phút sau)
final notificationTime = DateTime.now().add(Duration(minutes: 1));

// Option 2: Test ngay lập tức
await NotificationService().showNotification(
  id: 999,
  title: "Test",
  body: "This is a test",
);
```

### **Test 3: UI Lịch sử**
```dart
// 1. Tap icon 🔔 ở HomeScreen
// 2. Phải thấy danh sách notifications
// 3. Swipe để xóa
// 4. Tap để navigate
```

---

## 🚀 Deployment Checklist

- [ ] Deploy Firestore indexes
- [ ] Test trên real device (không phải emulator)
- [ ] Test với Android 13+ (permission flow)
- [ ] Test battery optimization
- [ ] Test sau khi restart device
- [ ] Test notification payload navigation
- [ ] Verify Firestore lưu đúng dữ liệu
- [ ] Check badge count ở HomeScreen

---

## 📚 Tài Liệu Tham Khảo

- [flutter_local_notifications](https://pub.dev/packages/flutter_local_notifications)
- [Android Notification Best Practices](https://developer.android.com/develop/ui/views/notifications)
- [Firestore Queries and Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Android AlarmManager](https://developer.android.com/reference/android/app/AlarmManager)

---

## 💡 Tips & Best Practices

1. **Luôn kiểm tra thời gian trước khi schedule**
   ```dart
   if (notificationTime.isAfter(DateTime.now())) {
     await scheduleNotification(...);
   }
   ```

2. **Sử dụng inexactAllowWhileIdle thay vì exact**
   - Không cần permission phức tạp
   - Battery friendly
   - Delay vài phút là chấp nhận được

3. **Tạo ID duy nhất cho mỗi notification**
   - Tránh trùng lặp
   - Đảm bảo < 2^31
   - Dễ debug

4. **Lưu vào Firestore để có lịch sử**
   - User có thể xem lại
   - Sync across devices
   - Analytics

5. **Handle edge cases**
   - Contract bị cancel → Hủy notifications
   - User edit schedule → Re-schedule
   - App reinstall → Schedule lại

---

**Created:** November 12, 2025  
**Version:** 1.0  
**Author:** PT Schedule Notification System
