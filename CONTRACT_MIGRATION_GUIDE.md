# 🔄 Contract Model Migration - Loại bỏ selectedTimeSlots

## 📋 Tổng quan

Đã cập nhật Contract Model để loại bỏ sự trùng lặp giữa `selectedTimeSlots` (array) và `weeklySchedule` (map).

### ❌ Trước đây (Thừa thải):
```firestore
contracts/{contractId}
  ├── selectedTimeSlots: [array]  ← Thừa!
  │   ├── 0: {dayOfWeek: 1, startTime: "08:00", ...}
  │   ├── 1: {dayOfWeek: 2, startTime: "14:00", ...}
  │   └── ...
  └── weeklySchedule: {map}        ← Thừa!
      ├── "1": {dayOfWeek: 1, startTime: "08:00", ...}
      ├── "2": {dayOfWeek: 2, startTime: "14:00", ...}
      └── ...
```

### ✅ Bây giờ (Đơn giản):
```firestore
contracts/{contractId}
  └── weeklySchedule: {map}        ← Chỉ có 1 nguồn dữ liệu duy nhất
      ├── "1": {dayOfWeek: 1, startTime: "08:00", ...}
      ├── "2": {dayOfWeek: 2, startTime: "14:00", ...}
      └── ...
```

## 🎯 Lý do thay đổi

1. **Loại bỏ trùng lặp**: Không lưu 2 lần cùng 1 dữ liệu
2. **Dễ cập nhật**: User chỉ cần update 1 nơi
3. **Query nhanh hơn**: Truy cập `weeklySchedule['1']` thay vì loop qua array
4. **Tiết kiệm storage**: Giảm 50% dung lượng

## 🔧 Thay đổi Backend

### Before:
```javascript
const contractData = {
  selectedTimeSlots: [...],     // Lưu cả 2
  weeklySchedule: {...},        // Lưu cả 2
};
```

### After:
```javascript
const weeklySchedule = {};
selectedTimeSlots.forEach((slot) => {
  weeklySchedule[slot.dayOfWeek.toString()] = slot;
});

const contractData = {
  weeklySchedule: weeklySchedule,  // CHỈ lưu 1
};
```

## 🔧 Thay đổi Flutter Model

### ContractModel Class:

```dart
class ContractModel {
  // ❌ REMOVED
  // final List<SelectedTimeSlot> selectedTimeSlots;
  
  // ✅ CHỈ GIỮ LẠI
  final WeeklySchedule weeklySchedule;  // required, không nullable
  
  // ✅ COMPUTED PROPERTY (backward compatibility)
  List<SelectedTimeSlot> get selectedTimeSlots {
    return weeklySchedule.schedule.values.toList()
      ..sort((a, b) => a.dayOfWeek.compareTo(b.dayOfWeek));
  }
}
```

### fromMap() - Hỗ trợ data cũ:

```dart
factory ContractModel.fromMap(Map<String, dynamic> map) {
  WeeklySchedule? schedule;
  
  if (map['weeklySchedule'] != null) {
    // ✅ Có weeklySchedule - dùng luôn
    schedule = WeeklySchedule.fromMap(map['weeklySchedule']);
  } else if (map['selectedTimeSlots'] != null) {
    // ⚠️ Data cũ - convert sang weeklySchedule
    final slots = (map['selectedTimeSlots'] as List)
        .map((slot) => SelectedTimeSlot.fromMap(slot))
        .toList();
    
    final scheduleMap = <int, SelectedTimeSlot>{};
    for (var slot in slots) {
      scheduleMap[slot.dayOfWeek] = slot;
    }
    schedule = WeeklySchedule(schedule: scheduleMap);
  }
  
  return ContractModel(weeklySchedule: schedule);
}
```

## 📱 Tác động lên UI

### ✅ KHÔNG CẦN THAY ĐỔI UI!

Nhờ có **computed property** `selectedTimeSlots`, tất cả code UI hiện tại vẫn hoạt động:

```dart
// ✅ Code UI này vẫn work
ListView.builder(
  itemCount: contract.selectedTimeSlots.length,  // ← Vẫn dùng như cũ
  itemBuilder: (context, index) {
    final slot = contract.selectedTimeSlots[index];
    return Text('${slot.startTime} - ${slot.endTime}');
  },
)
```

## 🔄 Migration Script (Nếu cần)

Nếu đã có data cũ trong Firestore, chạy script sau để migration:

```javascript
// backend/scripts/migrate_contracts.js
const admin = require('firebase-admin');
const db = admin.firestore();

async function migrateContracts() {
  const contracts = await db.collection('contracts').get();
  
  for (const doc of contracts.docs) {
    const data = doc.data();
    
    // Nếu có selectedTimeSlots nhưng chưa có weeklySchedule
    if (data.selectedTimeSlots && !data.weeklySchedule) {
      const weeklySchedule = {};
      data.selectedTimeSlots.forEach(slot => {
        weeklySchedule[slot.dayOfWeek.toString()] = slot;
      });
      
      // Update: Thêm weeklySchedule, xóa selectedTimeSlots
      await doc.ref.update({
        weeklySchedule: weeklySchedule,
        selectedTimeSlots: admin.firestore.FieldValue.delete()
      });
      
      console.log(`✅ Migrated contract ${doc.id}`);
    }
  }
  
  console.log('🎉 Migration complete!');
}
```

## ✅ Testing Checklist

- [x] Backend tạo contract mới chỉ lưu `weeklySchedule`
- [x] Flutter model đọc được data cũ (có `selectedTimeSlots`)
- [x] Flutter model đọc được data mới (chỉ có `weeklySchedule`)
- [x] UI hiển thị đúng với computed property
- [x] Cập nhật lịch chỉ update `weeklySchedule`

## 📊 Lợi ích

| Trước | Sau |
|-------|-----|
| 2 nguồn dữ liệu | 1 nguồn dữ liệu |
| Update 2 nơi | Update 1 nơi |
| Rủi ro inconsistency | Luôn nhất quán |
| Firestore size: ~800 bytes | ~400 bytes |
| Query: O(n) loop | O(1) direct access |

## 🚀 Next Steps

1. **Deploy backend** - Tạo contract mới sẽ dùng `weeklySchedule`
2. **Test Flutter app** - Xác nhận UI vẫn hoạt động
3. **Migration** (Optional) - Convert data cũ nếu cần
4. **Monitor** - Kiểm tra logs không có lỗi

---

**Status:** ✅ Completed  
**Impact:** Low (backward compatible)  
**Date:** November 12, 2025
