# 🐛 Fix: Chủ nhật hiển thị "không còn khả dụng"

## 🔍 Vấn đề

Khi xem contract detail, ngày **Chủ nhật** hiển thị cảnh báo:
> ⚠️ Khung giờ này không còn khả dụng

Mặc dù slot Chủ nhật vẫn tồn tại trong PT Package.

---

## 🎯 Nguyên nhân

Có **sự không khớp** giữa cách lưu `dayOfWeek` cho Chủ nhật:

### 1. Trong PT Package (TimeSlot)
```dart
TimeSlot {
  id: "sunday_slot1",
  dayOfWeek: 0,  // ← Chuẩn JS/Dart (0 = Sunday)
  startTime: "08:00",
  endTime: "09:00"
}
```

### 2. Trong Contract (weeklySchedule)
```dart
weeklySchedule: {
  "7": {  // ← Alternative convention (7 = Sunday)
    timeSlotId: "sunday_slot1",
    dayOfWeek: 7,
    startTime: "08:00",
    endTime: "09:00"
  }
}
```

### 3. Trong Service parse
```dart
_parseDayOfWeekFromSlotId("sunday_slot1") → 0
```

**Kết quả:**
- Service parse `sunday_slot1` → nhóm vào key `0`
- Contract lưu Chủ nhật với key `7`
- Widget tìm `_slotsByDay[7]` nhưng service chỉ populate `_slotsByDay[0]`
- → Không tìm thấy → Hiển thị "không còn khả dụng"

---

## ✅ Giải pháp

Support **cả 2 convention** (0 và 7 đều là Chủ nhật):

### 1. Update Service (contract_schedule_service.dart)

**Trước:**
```dart
// Khởi tạo 0-6
for (int i = 0; i <= 6; i++) {
  grouped[i] = [];
}

// Parse sunday_slot1 → 0
grouped[0].add(slotWithStatus);
```

**Sau:**
```dart
// Khởi tạo 0-7
for (int i = 0; i <= 7; i++) {
  grouped[i] = [];
}

// Parse sunday_slot1 → 0, và CŨNG thêm vào 7
if (dayOfWeek == 0) {
  grouped[0]!.add(slotWithStatus);
  grouped[7]!.add(slotWithStatus); // ← Thêm vào cả key 7
  _logger.d('Slot $slotId -> Ngày 0 (Chủ nhật) - Thêm vào cả key 0 và 7');
}
```

### 2. Update Widgets

**editable_weekly_schedule_widget.dart:**
```dart
String _getDayName(int dayOfWeek) {
  switch (dayOfWeek) {
    case 0: // Sunday (JS/Dart convention)
    case 7: // Sunday (alternative convention)  ← Thêm case 7
      return 'Chủ nhật';
    case 1:
      return 'Thứ 2';
    // ...
  }
}
```

**edit_time_slot_dialog.dart:**
```dart
String _getDayName(int dayOfWeek) {
  switch (dayOfWeek) {
    case 0: // Sunday (JS/Dart convention)
    case 7: // Sunday (alternative convention)  ← Thêm case 7
      return 'Chủ nhật';
    // ...
  }
}
```

---

## 📊 Data Flow (Sau khi fix)

```
PT Package: sunday_slot1 (dayOfWeek: 0)
    ↓
Service parse: "sunday_slot1" → 0
    ↓
groupSlotsByDay:
  - grouped[0].add(slot)  ✅
  - grouped[7].add(slot)  ✅ (duplicate for compatibility)
    ↓
Contract: weeklySchedule["7"]
    ↓
Widget: _slotsByDay[7] → Found! ✅
    ↓
Hiển thị bình thường, KHÔNG có warning
```

---

## 🧪 Test Cases

### Test Case 1: Contract với Sunday = 0
```dart
weeklySchedule: {
  "0": { timeSlotId: "sunday_slot1", dayOfWeek: 0 }
}
```
**Expected:** ✅ Hiển thị bình thường

### Test Case 2: Contract với Sunday = 7
```dart
weeklySchedule: {
  "7": { timeSlotId: "sunday_slot1", dayOfWeek: 7 }
}
```
**Expected:** ✅ Hiển thị bình thường (nhờ duplicate vào key 7)

### Test Case 3: PT Package có sunday_slot1
```dart
availableTimeSlots: [
  { id: "sunday_slot1", dayOfWeek: 0, ... }
]
```
**Expected:** 
- ✅ Parse thành công
- ✅ Nhóm vào cả key 0 và 7
- ✅ Widget tìm thấy cho cả 2 convention

---

## 🔍 Logging

Sau khi fix, logs sẽ hiển thị:

```
📊 Đang nhóm slots theo ngày...
Slot monday_slot1 -> Ngày 1
Slot tuesday_slot1 -> Ngày 2
Slot sunday_slot1 -> Ngày 0 (Chủ nhật) - Thêm vào cả key 0 và 7  ← New log
...
Ngày 0: 2 slots
Ngày 1: 3 slots
Ngày 2: 2 slots
...
Ngày 7: 2 slots  ← Duplicate của ngày 0
```

---

## 📝 Summary

**Root Cause:** Mismatch giữa Sunday convention (0 vs 7)

**Fix Strategy:** Support cả 2 conventions bằng cách duplicate Sunday slots vào cả key 0 và 7

**Files Changed:**
- ✅ `contract_schedule_service.dart` - Duplicate Sunday vào key 7
- ✅ `editable_weekly_schedule_widget.dart` - Handle case 0 và 7
- ✅ `edit_time_slot_dialog.dart` - Handle case 0 và 7

**Status:** ✅ Fixed và tested

---

## 🚀 Deployment Notes

Không cần migrate data vì:
- Backend không đổi (contract vẫn lưu như cũ)
- Frontend chỉ thêm logic support thêm convention
- Backward compatible 100%

**Zero downtime, zero data migration required!** 🎉
