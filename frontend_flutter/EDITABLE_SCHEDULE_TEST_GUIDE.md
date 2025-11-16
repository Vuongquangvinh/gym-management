# Quick Test Guide - Editable Schedule Feature

## Chuẩn bị dữ liệu test

### 1. Tạo PT Package với nhiều time slots
```javascript
// Trong Firebase Console hoặc backend
{
  "ptId": "pt_001",
  "name": "Gói PT tháng",
  "billingType": "monthly",
  "availableTimeSlots": [
    // Thứ 2
    { "id": "monday_slot1", "dayOfWeek": 1, "startTime": "06:00", "endTime": "07:00", "note": "Sáng sớm", "isActive": true },
    { "id": "monday_slot2", "dayOfWeek": 1, "startTime": "07:00", "endTime": "08:00", "note": "Sáng", "isActive": true },
    { "id": "monday_slot3", "dayOfWeek": 1, "startTime": "18:00", "endTime": "19:00", "note": "Chiều", "isActive": true },
    
    // Thứ 3
    { "id": "tuesday_slot1", "dayOfWeek": 2, "startTime": "06:00", "endTime": "07:00", "note": "Sáng sớm", "isActive": true },
    { "id": "tuesday_slot2", "dayOfWeek": 2, "startTime": "18:00", "endTime": "19:00", "note": "Chiều", "isActive": true },
    
    // Thứ 4
    { "id": "wednesday_slot1", "dayOfWeek": 3, "startTime": "06:00", "endTime": "07:00", "note": "Sáng sớm", "isActive": true },
    { "id": "wednesday_slot2", "dayOfWeek": 3, "startTime": "18:00", "endTime": "19:00", "note": "Chiều", "isActive": true },
    
    // Thứ 5
    { "id": "thursday_slot1", "dayOfWeek": 4, "startTime": "06:00", "endTime": "07:00", "note": "Sáng sớm", "isActive": true },
    { "id": "thursday_slot2", "dayOfWeek": 4, "startTime": "18:00", "endTime": "19:00", "note": "Chiều", "isActive": true },
    
    // Thứ 6
    { "id": "friday_slot1", "dayOfWeek": 5, "startTime": "06:00", "endTime": "07:00", "note": "Sáng sớm", "isActive": true },
    { "id": "friday_slot2", "dayOfWeek": 5, "startTime": "18:00", "endTime": "19:00", "note": "Chiều", "isActive": true },
    
    // Thứ 7
    { "id": "saturday_slot1", "dayOfWeek": 6, "startTime": "08:00", "endTime": "09:00", "note": "Cuối tuần", "isActive": true },
    { "id": "saturday_slot2", "dayOfWeek": 6, "startTime": "09:00", "endTime": "10:00", "note": "Cuối tuần", "isActive": true },
    
    // Chủ nhật
    { "id": "sunday_slot1", "dayOfWeek": 0, "startTime": "08:00", "endTime": "09:00", "note": "Cuối tuần", "isActive": true },
    { "id": "sunday_slot2", "dayOfWeek": 0, "startTime": "09:00", "endTime": "10:00", "note": "Cuối tuần", "isActive": true }
  ],
  "maxClientsPerSlot": 1
}
```

### 2. Tạo Contract test cho User A
```javascript
{
  "userId": "user_A",
  "ptId": "pt_001",
  "ptPackageId": "package_001",
  "weeklySchedule": {
    "1": { "timeSlotId": "monday_slot1", "dayOfWeek": 1, "startTime": "06:00", "endTime": "07:00", "note": "Sáng sớm" },
    "3": { "timeSlotId": "wednesday_slot1", "dayOfWeek": 3, "startTime": "06:00", "endTime": "07:00", "note": "Sáng sớm" },
    "5": { "timeSlotId": "friday_slot1", "dayOfWeek": 5, "startTime": "06:00", "endTime": "07:00", "note": "Sáng sớm" }
  },
  "status": "active",
  "createdAt": Timestamp.now()
}
```

### 3. Tạo Contract test cho User B (để test blocking)
```javascript
{
  "userId": "user_B",
  "ptId": "pt_001",
  "ptPackageId": "package_001",
  "weeklySchedule": {
    "1": { "timeSlotId": "monday_slot2", "dayOfWeek": 1, "startTime": "07:00", "endTime": "08:00", "note": "Sáng" },
    "2": { "timeSlotId": "tuesday_slot1", "dayOfWeek": 2, "startTime": "06:00", "endTime": "07:00", "note": "Sáng sớm" }
  },
  "status": "active",
  "createdAt": Timestamp.now()
}
```

## Test Scenarios

### ✅ Test 1: Xem lịch tập hiện tại
1. Login với User A
2. Vào Personal PT → Contracts → Click vào contract
3. Scroll xuống phần "Lịch tập hàng tuần"
4. **Expected:**
   - Thấy 3 ngày: Thứ 2, Thứ 4, Thứ 6
   - Mỗi ngày có time: 06:00 - 07:00
   - Mỗi ngày có nút Edit (icon bút chì)

### ✅ Test 2: Edit slot - Chọn slot còn trống
1. Click nút Edit ở "Thứ 2"
2. Dialog mở ra
3. **Expected:**
   - Title: "Chỉnh sửa khung giờ tập"
   - Subtitle: "Thứ 2"
   - Thấy list 3 slots:
     * ✅ 06:00 - 07:00 (đang tập) - có badge "Đang tập"
     * ❌ 07:00 - 08:00 (đã đầy) - gạch ngang + badge "Đã đầy"
     * ✅ 18:00 - 19:00 (còn trống) - có thể chọn
4. Click radio button ở "18:00 - 19:00"
5. Click "Cập nhật"
6. **Expected:**
   - Button hiển thị loading spinner
   - Toast "Cập nhật lịch tập thành công!"
   - Dialog đóng
   - UI reload → Thứ 2 bây giờ là 18:00 - 19:00

**Check logs:**
```
🔍 Đang tìm tất cả time slots đã được book...
📋 Tìm thấy 2 contracts
  ✓ Slot đã book: monday_slot1 (Contract: ...)
  ✓ Slot đã book: monday_slot2 (Contract: ...)
  ✓ Slot đã book: wednesday_slot1 (Contract: ...)
  ✓ Slot đã book: tuesday_slot1 (Contract: ...)
✅ Tổng cộng 4 time slots đã được book
🎯 Đang lấy available time slots với trạng thái...
Slot monday_slot1: ❌ ĐÃ BOOK
Slot monday_slot2: ❌ ĐÃ BOOK
Slot monday_slot3: ✅ CÒN TRỐNG
...
📝 Mở dialog edit time slot
🔄 Bắt đầu update time slot...
Contract ID: xxx
Day of Week: 1
New Slot ID: monday_slot3
✅ Update time slot thành công!
```

### ✅ Test 3: Không có slot nào available
1. Giả sử tất cả slots Thứ 7 đã đầy
2. Click Edit ở "Thứ 7"
3. **Expected:**
   - Dialog hiển thị icon calendar + text "Không có khung giờ khả dụng"
   - Chỉ có nút "Hủy"
   - Không thể update

### ✅ Test 4: Refresh danh sách slots
1. Mở contract detail screen
2. Trong khi đó, User B tạo contract mới book thêm slot
3. Click nút Refresh (icon refresh ở góc phải header "Lịch tập hàng tuần")
4. **Expected:**
   - Loading spinner hiện ra
   - Reload slots với status mới
   - Slot vừa được book bây giờ sẽ bị disable

### ✅ Test 5: Cancel edit
1. Click Edit ở bất kỳ ngày nào
2. Click vào 1 slot khác
3. Click "Hủy"
4. **Expected:**
   - Dialog đóng
   - Không có thay đổi nào
   - Không có network request

### ✅ Test 6: Network error
1. Tắt internet
2. Click Edit → Chọn slot → Click "Cập nhật"
3. **Expected:**
   - Button loading
   - Toast hiển thị error message
   - Dialog vẫn mở (không đóng)
   - User có thể thử lại

### ✅ Test 7: Slot hiện tại không còn available
1. User A có contract với monday_slot1
2. Admin/PT thay đổi package → Remove monday_slot1 khỏi availableTimeSlots
3. User A mở contract detail
4. **Expected:**
   - Thứ 2 vẫn hiển thị 06:00 - 07:00
   - Có warning text: "⚠️ Khung giờ này không còn khả dụng"
   - Click Edit → Không thấy monday_slot1 trong list (hoặc bị disable)

## Debug với Flutter DevTools

### 1. Check logs
```bash
# Trong terminal chạy app
flutter run

# Tìm logs:
🔍 Đang tìm tất cả time slots đã được book...
📋 Tìm thấy X contracts
✅ Tổng cộng Y time slots đã được book
```

### 2. Check Firestore
```javascript
// Mở Firebase Console → Firestore
// Collection: contracts
// Document: <contract_id>
// Field: weeklySchedule

// Trước update:
{
  "1": { "timeSlotId": "monday_slot1", ... }
}

// Sau update:
{
  "1": { "timeSlotId": "monday_slot3", ... }
}

// Field: updatedAt
// Giá trị mới: Timestamp(...)
```

### 3. Check Provider state
```dart
// Trong DevTools → Widget Inspector
// Tìm EditableWeeklyScheduleWidget
// State:
_isLoading: false
_slotsByDay: {1: [TimeSlotWithStatus(...), ...], ...}
_error: null
```

## Common Issues & Solutions

### ❌ Issue 1: "Slot đã đầy" nhưng thực tế không có ai
**Nguyên nhân:** Contract có status khác 'active'/'paid'
**Solution:** Check query filter
```dart
.where('status', whereIn: ['paid', 'active'])
```

### ❌ Issue 2: Sunday không parse được dayOfWeek
**Nguyên nhân:** timeSlotId không có prefix "sunday"
**Solution:** Check timeSlotId format: `"sunday_slot1"` (lowercase)

### ❌ Issue 3: Update thành công nhưng UI không reload
**Nguyên nhân:** Callback `onScheduleUpdated` không được gọi
**Solution:** Check trong EditTimeSlotDialog
```dart
widget.onUpdated(); // Phải gọi trước khi Navigator.pop
```

### ❌ Issue 4: Không thấy EditableWeeklyScheduleWidget
**Nguyên nhân:** `provider.package` null
**Solution:** Check ContractDetailProvider đã load package chưa
```dart
if (provider.package != null)
  EditableWeeklyScheduleWidget(...)
```

## Performance Testing

### Test load time
```dart
// Thêm vào contract_schedule_service.dart
final stopwatch = Stopwatch()..start();
// ... operations
stopwatch.stop();
_logger.i('⏱️ Load slots: ${stopwatch.elapsedMilliseconds}ms');
```

**Expected:** < 1000ms với ~50 contracts

### Test UI responsiveness
- Scroll lên xuống → Smooth 60fps
- Click Edit → Dialog mở trong < 200ms
- Update → Spinner < 1s

## Checklist trước khi release

- [ ] Test với contract có 1 ngày
- [ ] Test với contract có 7 ngày
- [ ] Test với tất cả slots đã đầy
- [ ] Test với 0 slots available
- [ ] Test network error
- [ ] Test với slow connection (throttle network)
- [ ] Test dark mode
- [ ] Test light mode
- [ ] Test trên Android emulator
- [ ] Test trên iOS simulator (nếu có)
- [ ] Check logs không có error
- [ ] Check memory leaks (DevTools)
- [ ] Test với nhiều users cùng lúc
