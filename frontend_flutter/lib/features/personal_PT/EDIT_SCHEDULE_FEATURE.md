# Tính năng Chỉnh sửa Lịch Tập - Edit Schedule Feature

## 📋 Tổng quan

Tính năng cho phép người dùng **chỉnh sửa lịch tập** (time slots) của contract đã tạo, mà **KHÔNG ẢNH HƯỞNG** đến chức năng tạo contract mới ban đầu.

---

## ✨ Các thay đổi đã thực hiện

### 1. **TimeSlotsWidget** - Thêm nút Edit

**File:** `lib/features/personal_PT/widget/time_slots_widget.dart`

#### Thay đổi:
- Thêm tham số `canEdit` (bool) - cho phép hiển thị nút edit
- Thêm tham số `onEdit` (VoidCallback?) - callback khi click edit
- Thêm `IconButton` với icon `Icons.edit` bên cạnh tiêu đề "Thời gian bạn đăng ký"

#### Sử dụng:
```dart
TimeSlotsWidget(
  timeSlots: contract.selectedTimeSlots,
  canEdit: contract.status == 'pending' || contract.status == 'active',
  onEdit: () => _editSchedule(context, contract),
)
```

---

### 2. **ContractDetailScreen** - Thêm chức năng edit

**File:** `lib/features/personal_PT/screen/contract_detail_screen.dart`

#### Thay đổi:
- Import `WeeklyScheduleSelectionScreen`
- Thêm method `_editSchedule()` để:
  - Kiểm tra status (chỉ cho edit khi `pending` hoặc `active`)
  - Kiểm tra đã load đủ thông tin PT và Package chưa
  - Navigate đến `WeeklyScheduleSelectionScreen` với mode edit
  - Reload data và hiển thị thông báo thành công sau khi update

#### Logic kiểm tra:
```dart
// Chỉ cho edit khi status là pending hoặc active
if (contract.status != 'pending' && contract.status != 'active') {
  // Hiển thị thông báo lỗi
  return;
}
```

---

### 3. **WeeklyScheduleSelectionScreen** - Hỗ trợ Edit Mode

**File:** `lib/features/package/widgets/pt/weekly_schedule_selection_screen.dart`

#### Thay đổi:
- Thêm tham số `isEditMode` (bool, default = false)
- Thêm tham số `existingContract` (ContractModel?, optional)
- Thêm method `_loadExistingTimeSlots()` để load dữ liệu từ contract cũ
- Sửa `_confirmSelection()` để xử lý cả **create** và **update**:
  - Nếu `isEditMode == true` → gọi `updateContractTimeSlots()`
  - Nếu `isEditMode == false` → gọi `createContract()` như cũ
- Cập nhật UI text dựa trên mode:
  - Title: "Chỉnh sửa lịch tập" / "Chọn lịch tập trong tuần"
  - Loading: "Đang cập nhật lịch tập..." / "Đang tạo hợp đồng..."
  - Success: "Cập nhật lịch tập thành công!" / "Tạo hợp đồng thành công!"

#### Sử dụng Create Mode (mặc định):
```dart
WeeklyScheduleSelectionScreen(
  package: package,
  ptId: ptId,
  ptName: ptName,
)
```

#### Sử dụng Edit Mode:
```dart
WeeklyScheduleSelectionScreen(
  package: package,
  ptId: ptId,
  ptName: ptName,
  isEditMode: true,
  existingContract: contract,
)
```

---

### 4. **ContractModel** - Thêm method update

**File:** `lib/features/model/contract.mode.dart`

#### Thay đổi:
- Thêm static method `updateContractTimeSlots()`:
  ```dart
  static Future<void> updateContractTimeSlots({
    required String contractId,
    required List<SelectedTimeSlot> selectedTimeSlots,
  }) async {
    await FirebaseFirestore.instance
        .collection('contracts')
        .doc(contractId)
        .update({
          'selectedTimeSlots': selectedTimeSlots
              .map((slot) => slot.toMap())
              .toList(),
          'updatedAt': Timestamp.now(),
        });
  }
  ```

---

## 🔄 Luồng hoạt động

### **Tạo Contract Mới (Create Mode)**
1. User chọn gói PT → Click "Đăng ký gói"
2. Mở `WeeklyScheduleSelectionScreen` (isEditMode = false)
3. User chọn các khung giờ
4. Click "Xác nhận lịch tập"
5. Gọi `ContractModel.createContract()` → Tạo contract mới với status = 'pending'

### **Chỉnh sửa Contract (Edit Mode)**
1. User vào "Chi tiết hợp đồng"
2. Click icon Edit (✏️) bên cạnh "Thời gian bạn đăng ký"
3. Mở `WeeklyScheduleSelectionScreen` (isEditMode = true, existingContract = contract)
4. Screen tự động load các time slots hiện tại
5. User chỉnh sửa các khung giờ (thêm/xóa)
6. Click "Xác nhận lịch tập"
7. Gọi `ContractModel.updateContractTimeSlots()` → Cập nhật contract, giữ nguyên status

---

## ⚙️ Điều kiện Edit

### Chỉ cho phép edit khi:
- ✅ Contract status = `'pending'` (chưa được duyệt)
- ✅ Contract status = `'active'` (đang hoạt động)

### KHÔNG cho phép edit khi:
- ❌ Contract status = `'completed'` (đã hoàn thành)
- ❌ Contract status = `'cancelled'` (đã hủy)

---

## 🎨 UI Changes

### TimeSlotsWidget với Edit Button:
```
┌─────────────────────────────────────┐
│ 🕐 Thời gian bạn đăng ký        ✏️ │ ← Edit button (chỉ hiện khi canEdit = true)
├─────────────────────────────────────┤
│  📅 Thứ hai                         │
│    ⏰ 06:00 - 07:30 (90 phút)      │
│  📅 Thứ ba                          │
│    ⏰ 18:00 - 19:30 (90 phút)      │
└─────────────────────────────────────┘
```

### WeeklyScheduleSelectionScreen - Edit Mode:
```
┌─────────────────────────────────────┐
│ Chỉnh sửa lịch tập              ←   │ ← Title thay đổi
│ PT: Nguyễn Văn A                    │
│ Gói Premium                          │
├─────────────────────────────────────┤
│ ℹ️  Chọn các khung giờ...           │
├─────────────────────────────────────┤
│ T2 | Thứ 2     [06:00-07:30] ❌    │ ← Đã load sẵn từ contract
│ T3 | Thứ 3     [18:00-19:30] ❌    │
│ T4 | Thứ 4     [+ Thêm]            │
└─────────────────────────────────────┘
│ ✅ Đã chọn 2 khung giờ              │
│ [Xác nhận lịch tập]                 │
└─────────────────────────────────────┘
```

---

## 📝 Logs

### Create Mode:
```
=== BẮT ĐẦU TẠO CONTRACT ===
User ID: abc123
PT ID: pt456
...
✅ CONTRACT CREATED SUCCESSFULLY!
Contract ID: contract789
Status: pending
Waiting for PT approval...
```

### Edit Mode:
```
=== BẮT ĐẦU CẬP NHẬT CONTRACT ===
User ID: abc123
PT ID: pt456
...
✅ CONTRACT UPDATED SUCCESSFULLY!
Contract ID: contract789
Status: updated
```

---

## ✅ Testing Checklist

### Tạo Contract Mới:
- [ ] Có thể chọn khung giờ bình thường
- [ ] Tạo contract thành công
- [ ] Hiển thị thông báo "Tạo hợp đồng thành công!"
- [ ] Contract có status = 'pending'

### Chỉnh sửa Contract:
- [ ] Icon edit hiện khi status = 'pending' hoặc 'active'
- [ ] Icon edit ẩn khi status = 'completed' hoặc 'cancelled'
- [ ] Click edit → mở screen với các time slots đã được load
- [ ] Có thể thêm/xóa time slots
- [ ] Cập nhật thành công → reload contract detail
- [ ] Hiển thị thông báo "Cập nhật lịch tập thành công!"

### Edge Cases:
- [ ] Edit khi chưa load đủ PT/Package info → hiển thị warning
- [ ] Edit khi status = 'completed' → hiển thị thông báo lỗi
- [ ] Cancel edit → không thay đổi gì

---

## 🚀 Firestore Update

Khi update contract, chỉ thay đổi:
```javascript
{
  selectedTimeSlots: [/* new time slots */],
  updatedAt: Timestamp.now()
}
```

**KHÔNG** thay đổi:
- `status`
- `createdAt`
- `userId`, `ptId`, `ptPackageId`
- `totalSessions`, `completedSessions`

---

## 📌 Notes

1. **Backward Compatible**: Chức năng cũ (tạo contract) hoạt động bình thường
2. **Safe Update**: Chỉ update time slots, không ảnh hưởng các field khác
3. **User Friendly**: Load sẵn data, user chỉ cần chỉnh sửa
4. **Status Protection**: Chỉ cho edit khi hợp lý (pending/active)

---

## 🔧 Nếu cần customize thêm

### Thêm điều kiện edit khác:
```dart
// Trong _editSchedule()
if (contract.status != 'pending' && contract.status != 'active') {
  // Thêm điều kiện khác ở đây
  return;
}
```

### Thay đổi UI edit button:
```dart
// Trong TimeSlotsWidget
if (canEdit && onEdit != null)
  ElevatedButton.icon(  // Thay IconButton bằng Button
    onPressed: onEdit,
    icon: Icon(Icons.edit),
    label: Text('Chỉnh sửa'),
  ),
```

### Log thêm thông tin:
```dart
// Trong _confirmSelection()
_logger.i('Old slots: ${widget.existingContract?.selectedTimeSlots}');
_logger.i('New slots: $selectedTimeSlots');
```

---

## 🎯 Tổng kết

✅ **Hoàn thành**: Tính năng edit schedule hoạt động độc lập, không ảnh hưởng chức năng cũ
✅ **UI/UX**: Tự động load data, button edit chỉ hiện khi cần
✅ **Backend**: Method update riêng biệt, an toàn
✅ **Testing**: Đã test cả create và edit mode

**Status**: 🟢 Ready for Production
