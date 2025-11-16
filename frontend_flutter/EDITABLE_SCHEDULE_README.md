# Chức năng chỉnh sửa lịch tập PT Contract

## Tổng quan

Chức năng cho phép người dùng chỉnh sửa lịch tập hàng tuần trong PT Contract của họ. Hệ thống sẽ tự động kiểm tra và chỉ cho phép chọn những khung giờ còn trống (chưa có người đăng ký).

## Cấu trúc dữ liệu

### 1. Contract (collection: `contracts`)
```typescript
{
  id: string,
  userId: string,
  ptId: string,
  ptPackageId: string,
  weeklySchedule: {
    [dayOfWeek: number]: {
      timeSlotId: string,      // Ví dụ: "monday_slot1", "tuesday_slot2"
      dayOfWeek: number,        // 0-6 (0 = Chủ nhật, 1 = Thứ 2, ...)
      startTime: string,        // "06:00"
      endTime: string,          // "07:00"
      note: string
    }
  },
  status: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. PT Package (collection: `ptPackages`)
```typescript
{
  id: string,
  ptId: string,
  availableTimeSlots: [
    {
      id: string,              // "monday_slot1" - TRÙNG với timeSlotId trong contract
      dayOfWeek: number,       // 0-6
      startTime: string,
      endTime: string,
      note: string,
      isActive: boolean
    }
  ],
  maxClientsPerSlot: number,
  ...
}
```

## Luồng hoạt động

### Bước 1: Load Available Time Slots
```dart
// Service: contract_schedule_service.dart
getAvailableTimeSlotsWithStatus()
  ↓
1. Lấy tất cả contracts của PT (trừ contract hiện tại)
2. Thu thập tất cả timeSlotId đã được book
3. So sánh với availableTimeSlots từ PT Package
4. Trả về Map<String, TimeSlotWithStatus>
```

**Log output:**
```
🔍 Đang tìm tất cả time slots đã được book...
📋 Tìm thấy 5 contracts
  ✓ Slot đã book: monday_slot1 (Contract: abc12345)
  ✓ Slot đã book: tuesday_slot2 (Contract: def67890)
✅ Tổng cộng 2 time slots đã được book:
  - monday_slot1
  - tuesday_slot2
🎯 Đang lấy available time slots với trạng thái...
Slot monday_slot1: ❌ ĐÃ BOOK
Slot monday_slot2: ✅ CÒN TRỐNG
Slot tuesday_slot1: ✅ CÒN TRỐNG
Slot tuesday_slot2: ❌ ĐÃ BOOK
✅ Hoàn thành! 14 slots với trạng thái
  - Còn trống: 12 slots
  - Đã book: 2 slots
```

### Bước 2: Nhóm slots theo ngày trong tuần
```dart
groupSlotsByDay()
  ↓
1. Parse timeSlotId để lấy dayOfWeek
   - "monday_slot1" → 1 (Thứ 2)
   - "tuesday_slot2" → 2 (Thứ 3)
   - "sunday_slot1" → 0 (Chủ nhật)
2. Nhóm slots vào Map<int, List<TimeSlotWithStatus>>
```

**Mapping ngày trong tuần:**
```dart
final dayMap = {
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
  'sunday': 0,
};
```

### Bước 3: Hiển thị UI
```dart
// Widget: editable_weekly_schedule_widget.dart
EditableWeeklyScheduleWidget
  ↓
- Load tất cả available slots với trạng thái
- Hiển thị lịch hiện tại của contract
- Mỗi ngày có nút "Edit"
- Click Edit → Mở dialog chọn slot mới
```

### Bước 4: Chọn slot mới
```dart
// Widget: edit_time_slot_dialog.dart
EditTimeSlotDialog
  ↓
- Hiển thị danh sách slots cho ngày đó
- Slots đã book → Gạch bỏ + disable + badge "Đã đầy"
- Slots còn trống → Có thể chọn
- Chọn xong → Update Firestore
```

### Bước 5: Update Contract
```dart
updateTimeSlotForDay()
  ↓
1. Tạo SelectedTimeSlot object mới
2. Update Firestore: weeklySchedule.{dayOfWeek}
3. Update updatedAt timestamp
```

**Firestore update:**
```dart
await _firestore.collection('contracts').doc(contractId).update({
  'weeklySchedule.$dayOfWeek': {
    'timeSlotId': newTimeSlot.id,
    'dayOfWeek': dayOfWeek,
    'startTime': newTimeSlot.startTime,
    'endTime': newTimeSlot.endTime,
    'note': newTimeSlot.note,
  },
  'updatedAt': FieldValue.serverTimestamp(),
});
```

## Files tạo mới

### 1. `contract_schedule_service.dart`
**Mục đích:** Service xử lý logic business cho việc quản lý lịch tập

**Các methods chính:**
- `getBookedTimeSlots()` - Lấy tất cả slots đã được book
- `getAvailableTimeSlotsWithStatus()` - Lấy slots + trạng thái (booked/available)
- `groupSlotsByDay()` - Nhóm slots theo ngày trong tuần
- `updateTimeSlotForDay()` - Update slot cho 1 ngày cụ thể
- `_parseDayOfWeekFromSlotId()` - Parse ngày từ timeSlotId

**Model:**
- `TimeSlotWithStatus` - Wrapper chứa TimeSlot + trạng thái isBooked

### 2. `edit_time_slot_dialog.dart`
**Mục đích:** Dialog cho phép user chọn slot mới

**Features:**
- Hiển thị danh sách slots cho ngày được chọn
- Gạch bỏ + disable slots đã book
- Radio selection
- Loading state khi đang update
- Success/Error toast

### 3. `editable_weekly_schedule_widget.dart`
**Mục đích:** Widget hiển thị lịch tuần + nút edit cho từng ngày

**Features:**
- Load + cache slots với status
- Hiển thị lịch hiện tại
- Nút edit cho mỗi ngày
- Refresh button
- Loading/Error/Empty states
- Auto reload sau khi update

## Cách sử dụng

### Trong Contract Detail Screen
```dart
// Thay thế TimeSlotsWidget cũ bằng:
if (provider.package != null)
  EditableWeeklyScheduleWidget(
    contract: contract,
    package: provider.package!,
    onScheduleUpdated: () {
      // Reload contract detail sau khi update
      context
          .read<ContractDetailProvider>()
          .loadContractDetail(contract.id);
    },
  ),
```

## Validation & Business Rules

### 1. Kiểm tra slot còn trống
```dart
// Chỉ lấy contracts đang active
.where('status', whereIn: ['paid', 'active'])
```

### 2. Bỏ qua contract hiện tại
```dart
if (contractDoc.id == currentContractId) {
  continue; // Không tính vào booked slots
}
```

### 3. Parse dayOfWeek từ timeSlotId
```dart
"monday_slot1".startsWith("monday") → dayOfWeek = 1
"sunday_slot2".startsWith("sunday") → dayOfWeek = 0
```

## UI/UX Features

### 1. Slot đã book
- ❌ Icon block
- 🚫 Gạch ngang text
- 🔴 Badge "Đã đầy"
- ⚫ Disabled state

### 2. Slot hiện tại
- 🔵 Badge "Đang tập"
- 💙 Highlight khác biệt

### 3. Slot có thể chọn
- ✅ Radio button active
- ✏️ Có thể click
- 🟢 Primary color

### 4. Loading states
- 🔄 Spinner khi load slots
- ⏳ Button disabled khi đang update
- 🔃 Refresh button

### 5. Feedback
- ✅ Toast success khi update thành công
- ❌ Toast error khi có lỗi
- ⚠️ Warning nếu slot hiện tại không còn available

## Logging

Tất cả operations đều có logging chi tiết:

```dart
_logger.i('🔍 Đang tìm tất cả time slots đã được book...');
_logger.d('PT ID: $ptId');
_logger.d('Current Contract ID: $currentContractId');
_logger.i('✅ Tổng cộng ${bookedSlots.length} time slots đã được book');
_logger.d('  - monday_slot1');
_logger.w('⚠️ Không parse được dayOfWeek từ slotId: $slotId');
_logger.e('❌ Lỗi khi update time slot', error: e, stackTrace: stackTrace);
```

## Testing Scenarios

### Test Case 1: User muốn đổi từ Thứ 2 slot1 → Thứ 2 slot2
1. User click Edit ở Thứ 2
2. Dialog hiển thị all slots của Thứ 2
3. slot1 (đang tập) highlighted
4. slot2 available → User chọn
5. Click "Cập nhật"
6. Firestore update weeklySchedule.1
7. UI reload → Hiển thị slot2

### Test Case 2: Tất cả slots Thứ 3 đã đầy
1. User click Edit ở Thứ 3
2. Dialog hiển thị all slots của Thứ 3
3. Tất cả đều có badge "Đã đầy" + gạch ngang
4. User không thể chọn slot nào
5. Chỉ có thể click "Hủy"

### Test Case 3: Slot hiện tại bị người khác book
1. User có contract với monday_slot1
2. Sau đó người khác cũng đăng ký monday_slot1 (PT cho phép nhiều người)
3. Khi user mở edit → monday_slot1 sẽ ❌ Đã đầy
4. Widget hiển thị ⚠️ "Khung giờ này không còn khả dụng"
5. User buộc phải đổi sang slot khác

## Performance Considerations

### 1. Caching
- `_slotsByDay` được cache trong widget state
- Chỉ reload khi:
  - Widget mount lần đầu
  - User click refresh
  - Sau khi update thành công

### 2. Optimistic Updates
- Không dùng optimistic update
- Luôn chờ Firestore confirm
- Đảm bảo data consistency

### 3. Query Optimization
```dart
// Chỉ query contracts của PT này
.where('ptId', isEqualTo: ptId)
// Chỉ lấy contracts active
.where('status', whereIn: ['paid', 'active'])
```

## Error Handling

### 1. Network errors
```dart
try {
  // ... operations
} catch (e, stackTrace) {
  _logger.e('❌ Lỗi khi ...', error: e, stackTrace: stackTrace);
  rethrow; // Để UI xử lý
}
```

### 2. UI error states
- Loading state với spinner
- Error state với icon + message + retry button
- Empty state với friendly message

### 3. User feedback
- SnackBar cho success/error
- Dialog auto close on success
- Disabled buttons during operations

## Future Improvements

1. **Real-time updates:** Listen to contracts collection để update real-time khi có người book
2. **Conflict resolution:** Xử lý case 2 người cùng chọn 1 slot cùng lúc
3. **Undo functionality:** Cho phép user undo trong vòng X giây
4. **History tracking:** Log tất cả schedule changes
5. **Notification:** Thông báo PT khi user đổi lịch
6. **Batch update:** Cho phép đổi nhiều ngày cùng lúc
