# 🔔 Hướng dẫn Test Notification cho Buổi tập PT

## 🎯 Mục đích

Khi đến ngày và giờ tập với PT, app sẽ tự động gửi thông báo nhắc nhở user trước 30 phút.

---

## 📱 Cách test

### Bước 1: Chạy app

```bash
cd f:\Doan4\frontend_flutter
flutter run
```

### Bước 2: Login

- App sẽ tự động lên lịch thông báo cho tất cả contracts active
- Check console log:

```
✅ NotificationService khởi tạo thành công
📋 Bắt đầu lên lịch thông báo cho các buổi tập...
📦 Tìm thấy 2 contracts active
✓ Contract abc123: Đã lên lịch 3 thông báo
✅ Đã lên lịch 3 thông báo thành công
```

### Bước 3: Check pending notifications

Thêm code debug (tạm thời):

```dart
// Trong login_screen.dart, sau khi login thành công
final pending = await NotificationService().getPendingNotifications();
print('📅 Có ${pending.length} thông báo đang chờ');
for (final n in pending) {
  print('  - ID: ${n.id}, Title: ${n.title}');
}
```

### Bước 4: Test với thời gian thật

**Option 1: Đợi thông báo thật** (nếu có buổi tập sắp tới)
- Nếu hôm nay có buổi tập lúc 15:00
- Thông báo sẽ xuất hiện lúc 14:30

**Option 2: Test ngay lập tức** (debug)

Thêm method test trong `pt_schedule_notification_service.dart`:

```dart
/// Test notification ngay lập tức
Future<void> testNotificationNow() async {
  await _notificationService.showNotification(
    id: DateTime.now().millisecondsSinceEpoch,
    title: '🏋️ TEST: Sắp đến giờ tập với PT!',
    body: 'Thứ 2 lúc 09:00 - 10:00\nChuẩn bị tinh thần và đồ tập nhé! 💪',
    payload: 'test:123',
  );
}
```

Gọi trong login screen:

```dart
if (errorMsg == null) {
  // Test ngay
  await PTScheduleNotificationService().testNotificationNow();
  
  // Lên lịch thật
  PTScheduleNotificationService().scheduleAllWorkoutNotifications();
  
  Navigator.pushReplacementNamed(context, '/home');
}
```

---

## 🧪 Test Cases

### Case 1: User mới login

**Expected**:
- ✅ Console log hiển thị số contracts và notifications
- ✅ Notification được lên lịch
- ✅ Không có lỗi

### Case 2: User thanh toán gói PT

**Trước thanh toán**: 0 contracts
**Sau thanh toán**: 1 contract mới

**Expected**:
- ✅ Notifications được lên lịch cho contract mới
- ✅ Toast hiển thị "Đăng ký gói PT tháng thành công!"

### Case 3: User edit schedule

**Trước**: Thứ 2 09:00
**Sau**: Thứ 2 10:00

**Expected**:
- ✅ Notification cũ (08:30) bị hủy
- ✅ Notification mới (09:30) được tạo
- ✅ Toast "Cập nhật lịch tập thành công!"

### Case 4: Kiểm tra Android Settings

**Bước**:
1. Mở Settings → Apps
2. Tìm app "frontend_flutter"
3. Vào Notifications

**Expected**:
- ✅ Có channel "PT Training Notifications"
- ✅ Notifications được bật
- ✅ Importance: High

---

## 🐛 Nếu không nhận được thông báo

### Check 1: Permissions

**Android 13+**:
```dart
// App sẽ tự động request, nhưng user có thể deny
// Check trong Settings → Apps → Notifications
```

**iOS**:
```dart
// App request khi khởi động lần đầu
// Check trong Settings → Notifications → App name
```

### Check 2: Pending notifications

```dart
final pending = await NotificationService().getPendingNotifications();
print('Pending: ${pending.length}');
```

Nếu `pending.length == 0` → Không có notification nào được lên lịch
→ Check xem user có contracts active không

### Check 3: Logs

Tìm trong console:
- ❌ "Lỗi khi lên lịch thông báo"
- ⚠️ "Không tìm thấy user ID"
- ℹ️ "User không có contract nào đang active"

---

## 💡 Tips

### Tip 1: Test nhanh với schedule gần

Tạo contract với time slot trong 1 giờ tới:
- Current time: 14:00
- Schedule: 14:30
- Notification: 14:00 (ngay lập tức) hoặc 14:00 + vài phút

### Tip 2: Clear tất cả notifications

```dart
await NotificationService().cancelAllNotifications();
print('Đã xóa tất cả notifications');
```

### Tip 3: Force reschedule

```dart
// Trong bất kỳ screen nào
await PTScheduleNotificationService().scheduleAllWorkoutNotifications();
```

---

## 📊 Example Output

### Successful scheduling:

```
🔍 Đang load booked time slots...
📦 Tìm thấy 1 contracts active
📅 WeeklySchedule có 3 slots
📅 Scheduled: Thứ 2 09:00 → Thông báo lúc 2025-11-18 08:30:00.000
📅 Scheduled: Thứ 4 15:00 → Thông báo lúc 2025-11-20 14:30:00.000
📅 Scheduled: Thứ 6 07:00 → Thông báo lúc 2025-11-22 06:30:00.000
✓ Contract abc123: Đã lên lịch 3 thông báo
✅ Đã lên lịch 3 thông báo thành công
📅 Tổng số pending notifications: 3
```

### Notification appears:

```
┌─────────────────────────────────────┐
│ 🏋️ Sắp đến giờ tập với PT Minh!    │
│                                     │
│ Thứ 2 lúc 09:00 - 10:00           │
│ Chuẩn bị tinh thần và đồ tập nhé! 💪│
│                                     │
│ 08:30                              │
└─────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Đã chạy `flutter pub get`
- [ ] Đã thêm permissions vào AndroidManifest.xml
- [ ] App khởi động không lỗi
- [ ] Login thành công
- [ ] Console log hiển thị "Đã lên lịch X thông báo"
- [ ] Pending notifications > 0
- [ ] Notification xuất hiện đúng giờ

---

## 🎉 Done!

Hệ thống notification đã hoạt động! User sẽ nhận được thông báo tự động khi đến giờ tập với PT.

**Next steps**:
- Thêm customization (chọn thời gian thông báo)
- Thêm action buttons (Xác nhận, Hủy)
- Thêm Firebase Cloud Messaging cho real-time sync
