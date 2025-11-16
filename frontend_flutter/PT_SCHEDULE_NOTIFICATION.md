# 🔔 PT Schedule Notification System

## 📋 Tổng quan

Hệ thống thông báo tự động cho các buổi tập PT, giúp user không bao giờ bỏ lỡ lịch tập.

### ✨ Tính năng chính

1. **Thông báo tự động**: Nhắc nhở trước 30 phút khi đến giờ tập
2. **Lên lịch thông minh**: Tự động lên lịch cho tất cả contracts active
3. **Cập nhật real-time**: Tự động cập nhật khi user thay đổi lịch
4. **Cross-platform**: Hỗ trợ Android & iOS

---

## 🏗️ Kiến trúc

### Services

```
lib/services/
├── notification_service.dart               # Core notification service
└── pt_schedule_notification_service.dart   # PT-specific scheduling logic
```

### 1. NotificationService

**Trách nhiệm**: Quản lý low-level notification operations

**Chức năng**:
- Khởi tạo Flutter Local Notifications Plugin
- Request permissions (Android 13+, iOS)
- Hiển thị notification ngay lập tức
- Lên lịch notification cho thời điểm cụ thể
- Hủy notifications

**API chính**:

```dart
// Khởi tạo service
await NotificationService().initialize();

// Hiển thị notification ngay
await NotificationService().showNotification(
  id: 1,
  title: 'Buổi tập sắp bắt đầu!',
  body: 'Chuẩn bị tinh thần nhé!',
);

// Lên lịch notification
await NotificationService().scheduleNotification(
  id: 2,
  title: 'Sắp đến giờ tập!',
  body: 'Thứ 2 lúc 09:00 - 10:00',
  scheduledTime: DateTime(2025, 11, 18, 8, 30), // 30 phút trước
);

// Hủy notification
await NotificationService().cancelNotification(1);

// Hủy tất cả
await NotificationService().cancelAllNotifications();
```

---

### 2. PTScheduleNotificationService

**Trách nhiệm**: Business logic cho việc lên lịch thông báo các buổi tập PT

**Chức năng**:
- Query tất cả contracts active của user
- Parse time slots từ contract
- Tính toán thời điểm thông báo (trước 30 phút)
- Tạo notification IDs unique
- Lên lịch cho từng buổi tập

**API chính**:

```dart
// Lên lịch tất cả thông báo cho user
await PTScheduleNotificationService().scheduleAllWorkoutNotifications();

// Kiểm tra buổi tập sắp tới (trong vòng 1 giờ)
await PTScheduleNotificationService().checkUpcomingWorkouts();

// Hủy thông báo của 1 contract
await PTScheduleNotificationService().cancelContractNotifications(contract);
```

---

## 📊 Data Flow

### 1. Khi user login

```
User login thành công
    ↓
main.dart → NotificationService().initialize()
    ↓
login_screen.dart → scheduleAllWorkoutNotifications()
    ↓
Query Firestore: contracts (userId, status: active/approved)
    ↓
For each contract:
    Parse weeklySchedule
    ↓
    For each time slot:
        - Tính ngày tập tiếp theo
        - Tính thời điểm thông báo (trước 30 phút)
        - Generate notification ID unique
        - Schedule notification
    ↓
Complete: X notifications scheduled
```

### 2. Khi user thanh toán PT package thành công

```
Payment success callback
    ↓
pt_packages_screen.dart → onPaymentSuccess
    ↓
PTScheduleNotificationService().scheduleAllWorkoutNotifications()
    ↓
Hủy tất cả notifications cũ
    ↓
Query contracts mới
    ↓
Lên lịch lại tất cả
```

### 3. Khi user edit schedule

```
User click "Cập nhật" trong EditTimeSlotDialog
    ↓
ContractScheduleService.updateTimeSlotForDay()
    ↓
Update Firestore contract
    ↓
edit_time_slot_dialog.dart → success callback
    ↓
PTScheduleNotificationService().scheduleAllWorkoutNotifications()
    ↓
Refresh notifications với lịch mới
```

---

## 🔢 Notification ID Generation

**Format**: `contractHash + dayOfWeek + hour + minute`

**Ví dụ**:
```dart
Contract ID: "abc123xyz"
Day: Monday (1)
Time: 09:00

→ contractHash = 12345 (from hashCode)
→ Notification ID = 123451900
```

**Tại sao unique?**
- Contract ID khác nhau → hash khác nhau
- Cùng contract, khác ngày → dayOfWeek khác nhau
- Cùng ngày, khác giờ → hour/minute khác nhau

---

## ⏰ Time Calculation

### Tính ngày tập tiếp theo

```dart
// Target: Thứ 3 (dayOfWeek = 2)
// Current: Thứ 5 (dayOfWeek = 4)

daysToAdd = 7 - (4 - 2) = 5 ngày
→ Buổi tập tiếp theo: Thứ 3 tuần sau
```

### Tính thời điểm thông báo

```dart
// Buổi tập: 09:00
// Thông báo trước: 30 phút

notificationTime = 09:00 - 00:30 = 08:30

// Edge case: Buổi tập 00:15
notificationTime = 00:15 - 00:30 = 23:45 (ngày hôm trước)
```

---

## 🎨 Notification UI

### Title Format
```
🏋️ Sắp đến giờ tập với [PT Name]!
```

### Body Format
```
[Ngày] lúc [startTime] - [endTime]
Chuẩn bị tinh thần và đồ tập nhé! 💪
```

### Ví dụ
```
Title: 🏋️ Sắp đến giờ tập với PT Minh!
Body: Thứ 2 lúc 09:00 - 10:00
      Chuẩn bị tinh thần và đồ tập nhé! 💪
```

---

## 📱 Platform-Specific

### Android

**Permissions** (AndroidManifest.xml):
```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/> <!-- Android 13+ -->
```

**Channel Settings**:
```dart
AndroidNotificationDetails(
  'gym_pt_channel',
  'PT Training Notifications',
  channelDescription: 'Thông báo về lịch tập với PT',
  importance: Importance.high,
  priority: Priority.high,
  showWhen: true,
)
```

### iOS

**Permissions**: Tự động request khi app khởi động

```dart
await iosPlugin.requestPermissions(
  alert: true,
  badge: true,
  sound: true,
);
```

---

## 🧪 Test Scenarios

### Test 1: User login với 1 contract active

**Setup**:
- User: `user123`
- Contract: 1 active contract
- Schedule: Thứ 2, 09:00-10:00 & Thứ 4, 15:00-16:00

**Expected**:
```
🔍 Đang load booked time slots...
📋 Tìm thấy 1 contracts active
✓ Contract abc123: Đã lên lịch 2 thông báo
✅ Đã lên lịch 2 thông báo thành công
📅 Tổng số pending notifications: 2

Notification 1:
  - ID: 123451900
  - Time: Monday 08:30
  - Title: 🏋️ Sắp đến giờ tập với PT Minh!
  
Notification 2:
  - ID: 123451500
  - Time: Wednesday 14:30
  - Title: 🏋️ Sắp đến giờ tập với PT Minh!
```

### Test 2: User edit schedule

**Setup**:
- User thay đổi Thứ 2 09:00 → 10:00
- Contract ID giữ nguyên

**Expected**:
```
Old notification (ID: 123451900) → Canceled
New notification (ID: 123451000) → Scheduled

📅 Scheduled: Thứ 2 10:00 → Thông báo lúc Monday 09:30
```

### Test 3: User có nhiều contracts

**Setup**:
- Contract A: 2 slots/week
- Contract B: 3 slots/week (PT khác)

**Expected**:
```
📦 Tìm thấy 2 contracts active
✓ Contract A: Đã lên lịch 2 thông báo
✓ Contract B: Đã lên lịch 3 thông báo
✅ Đã lên lịch 5 thông báo thành công
```

### Test 4: Buổi tập đã qua

**Setup**:
- Current: Thứ 3 10:00
- Schedule: Thứ 2 09:00 (đã qua)

**Expected**:
```
Next workout: Thứ 2 tuần sau 09:00
Notification: Thứ 2 tuần sau 08:30
(Không thông báo cho buổi đã qua)
```

---

## 🔍 Logging

### Initialization
```
✅ NotificationService khởi tạo thành công
```

### Scheduling
```
📋 Bắt đầu lên lịch thông báo cho các buổi tập...
📦 Tìm thấy 2 contracts active
✓ Contract abc123: Đã lên lịch 3 thông báo
  📅 Scheduled: Thứ 2 09:00 → Thông báo lúc 2025-11-18 08:30:00.000
  📅 Scheduled: Thứ 4 15:00 → Thông báo lúc 2025-11-20 14:30:00.000
  📅 Scheduled: Thứ 6 07:00 → Thông báo lúc 2025-11-22 06:30:00.000
✅ Đã lên lịch 3 thông báo thành công
📅 Tổng số pending notifications: 3
```

### Errors
```
❌ Lỗi khi load booked slots: [error message]
❌ Lỗi lên lịch thông báo cho slot: [error message]
⚠️ Không lấy được tên PT: [error message]
```

---

## 🔧 Configuration

### Thời gian thông báo trước

**Default**: 30 phút

**Thay đổi**: Edit trong `pt_schedule_notification_service.dart`

```dart
// Tính toán thời điểm thông báo (trước 30 phút)
var notificationMinute = minute - 30; // ← Thay đổi ở đây
```

### Notification channel

**Android**: `gym_pt_channel`

**Thay đổi**: Edit trong `notification_service.dart`

```dart
const androidDetails = AndroidNotificationDetails(
  'gym_pt_channel', // ← Channel ID
  'PT Training Notifications', // ← Channel name
  channelDescription: 'Thông báo về lịch tập với PT',
  ...
);
```

---

## 📝 Files Changed

### New Files

1. ✅ `lib/services/notification_service.dart` (270 lines)
   - Core notification service
   - Initialize, show, schedule, cancel operations

2. ✅ `lib/services/pt_schedule_notification_service.dart` (310 lines)
   - PT-specific scheduling logic
   - Query contracts, calculate times, schedule notifications

### Modified Files

1. ✅ `pubspec.yaml`
   - Added: `flutter_local_notifications: ^17.2.3`
   - Added: `timezone: ^0.9.4`
   - Added: `workmanager: ^0.5.2`

2. ✅ `lib/main.dart`
   - Import notification service
   - Initialize on app start

3. ✅ `lib/features/auth/screens/login_screen.dart`
   - Call `scheduleAllWorkoutNotifications()` after login

4. ✅ `lib/features/package/widgets/pt/pt_packages_screen.dart`
   - Call `scheduleAllWorkoutNotifications()` after payment success

5. ✅ `lib/features/personal_PT/widget/edit_time_slot_dialog.dart`
   - Call `scheduleAllWorkoutNotifications()` after schedule update

6. ✅ `android/app/src/main/AndroidManifest.xml`
   - Added notification permissions

---

## 🚀 Usage

### Tự động (Không cần code thêm)

1. **User login** → Tự động lên lịch
2. **User thanh toán gói PT** → Tự động lên lịch
3. **User edit schedule** → Tự động cập nhật

### Manual (Nếu cần)

```dart
// Lên lịch lại tất cả
await PTScheduleNotificationService().scheduleAllWorkoutNotifications();

// Kiểm tra buổi tập sắp tới
await PTScheduleNotificationService().checkUpcomingWorkouts();

// Xem pending notifications
final pending = await NotificationService().getPendingNotifications();
print('Pending: ${pending.length} notifications');
```

---

## 🐛 Troubleshooting

### Không nhận được thông báo

**Check**:
1. Permissions đã grant chưa? (Settings → App → Notifications)
2. Do Not Disturb mode có bật không?
3. App có bị force-stop không?

**Debug**:
```dart
final pending = await NotificationService().getPendingNotifications();
print('Pending notifications: ${pending.length}');
for (final n in pending) {
  print('ID: ${n.id}, Title: ${n.title}, Time: ${n.payload}');
}
```

### Thông báo trùng lặp

**Nguyên nhân**: Gọi `scheduleAllWorkoutNotifications()` nhiều lần

**Fix**: Service đã tự động hủy notifications cũ trước khi lên lịch mới

### Notification ID conflict

**Nguyên nhân**: 2 contracts khác nhau generate cùng ID

**Giải pháp**: Đã sử dụng `contractId.hashCode` để unique

---

## 💡 Future Improvements

### 1. Customizable notification time
Cho phép user chọn thông báo trước bao lâu (15/30/60 phút)

### 2. Rich notifications
- Thêm action buttons: "Xác nhận tham gia", "Hủy buổi tập"
- Hiển thị avatar PT
- Show map location

### 3. Sound & vibration customization
User tự chọn ringtone và vibration pattern

### 4. Summary notifications
Thông báo tổng hợp lịch tập cả tuần vào Chủ nhật tối

### 5. Real-time sync
Sử dụng Firebase Cloud Messaging để sync ngay khi PT thay đổi lịch

---

## ✅ Summary

**Feature**: PT Schedule Notification System

**Status**: ✅ Fully Implemented & Tested

**Impact**:
- ✅ User không bỏ lỡ buổi tập
- ✅ Tự động quản lý notifications
- ✅ Tự động cập nhật khi có thay đổi
- ✅ Cross-platform (Android & iOS)

**Files Added**: 2 services

**Files Modified**: 5 files

**Zero Breaking Changes**: 100% backward compatible

---

## 📞 Support

Nếu có vấn đề, check logs:

```dart
// Enable verbose logging
final _logger = Logger(
  level: Level.debug, // Show all logs
);
```

Tìm các log entries:
- `🔔` = Notification displayed
- `📅` = Notification scheduled
- `❌` = Error
- `⚠️` = Warning
