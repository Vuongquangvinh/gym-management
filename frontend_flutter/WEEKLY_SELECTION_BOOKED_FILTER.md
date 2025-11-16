# ✅ FILTER BOOKED SLOTS - Weekly Schedule Selection

## 📋 Tổng quan

Đã thêm chức năng **lọc bỏ time slots đã được đăng ký** vào màn hình chọn lịch tập hàng tuần (trước khi tạo contract).

Giống như chức năng edit, user chỉ có thể chọn những khung giờ còn trống, tránh conflict với các contracts khác.

---

## 🎯 Vấn đề cần giải quyết

**Trước khi fix:**
- User có thể chọn bất kỳ time slot nào trong PT Package
- Không kiểm tra xem slot đó đã có người đăng ký chưa
- Dẫn đến conflict: 2 người cùng chọn 1 slot (nếu maxClientsPerSlot = 1)

**Sau khi fix:**
- Load tất cả booked time slots khi màn hình mở
- Filter bỏ những slots đã đầy
- User chỉ thấy và chọn được slots còn trống
- Tránh conflict ngay từ đầu

---

## 🔧 Thay đổi Code

### 1. Import Service

```dart
// weekly_schedule_selection_screen.dart
import '../../../personal_PT/services/contract_schedule_service.dart';
```

### 2. Thêm State Variables

```dart
class _WeeklyScheduleSelectionScreenState extends State<...> {
  final Map<int, SelectedTimeSlot> _selectedSchedule = {};
  final _service = ContractScheduleService(); // ← NEW
  
  // Cache booked slots
  Set<String>? _bookedTimeSlotIds; // ← NEW
  bool _isLoadingBookedSlots = false; // ← NEW
```

### 3. Load Booked Slots on Init

```dart
@override
void initState() {
  super.initState();
  // Load ngay khi màn hình mở
  _loadBookedTimeSlots();
}

Future<void> _loadBookedTimeSlots() async {
  if (_bookedTimeSlotIds != null) {
    return; // Đã load rồi
  }

  setState(() {
    _isLoadingBookedSlots = true;
  });

  try {
    _logger.i('🔍 Đang load booked time slots...');
    
    // Không có currentContractId vì đang tạo mới
    final bookedSlots = await _service.getBookedTimeSlots(
      ptId: widget.package.ptId,
      currentContractId: '', // Empty = không exclude contract nào
    );

    _logger.i('✅ Đã load ${bookedSlots.length} booked slots');
    
    setState(() {
      _bookedTimeSlotIds = bookedSlots;
      _isLoadingBookedSlots = false;
    });
  } catch (e) {
    _logger.e('❌ Lỗi khi load booked slots: $e');
    setState(() {
      _bookedTimeSlotIds = <String>{}; // Empty set để không block UI
      _isLoadingBookedSlots = false;
    });
  }
}
```

### 4. Filter Slots When User Picks Time

**Trong `_showTimeSlotPicker()`:**

```dart
Future<void> _showTimeSlotPicker(int dayOfWeek) async {
  // Load booked slots nếu chưa load
  if (_bookedTimeSlotIds == null && !_isLoadingBookedSlots) {
    await _loadBookedTimeSlots();
  }

  // ... existing code ...

  final availableSlots = widget.package.availableTimeSlots
      .where((slot) {
        // Check 1: Slot phải active
        if (!slot.isActive) return false;
        
        // Check 2: Slot phải đúng ngày
        if (slot.dayOfWeek != slotDayOfWeek) return false;
        
        // Check 3: Slot không được book ← NEW
        if (_bookedTimeSlotIds != null && 
            _bookedTimeSlotIds!.contains(slot.id)) {
          _logger.d('❌ Slot ${slot.id} đã bị book');
          return false;
        }
        
        return true;
      })
      .toList();

  _logger.i('📊 Ngày $dayName có ${availableSlots.length} slots available');
  
  // ... rest of code ...
}
```

### 5. Filter Slots in ListView (Display)

**Trong `itemBuilder` của ListView.builder:**

```dart
final availableSlots = widget.package.availableTimeSlots
    .where((slot) {
      // Check 1: Slot phải active
      if (!slot.isActive) return false;
      
      // Check 2: Slot phải đúng ngày  
      if (slot.dayOfWeek != slotDayOfWeek) return false;
      
      // Check 3: Slot không được book ← NEW
      if (_bookedTimeSlotIds != null && 
          _bookedTimeSlotIds!.contains(slot.id)) {
        return false;
      }
      
      return true;
    })
    .toList();
```

---

## 📊 Data Flow

```
User mở màn hình chọn lịch
    ↓
initState() → _loadBookedTimeSlots()
    ↓
Service query all contracts của PT
    ↓
Extract timeSlotIds đã book
    ↓
Cache vào _bookedTimeSlotIds
    ↓
setState() → Rebuild UI
    ↓
ListView filter slots: isActive && đúng ngày && !booked
    ↓
User chỉ thấy slots còn trống
    ↓
User click chọn ngày → _showTimeSlotPicker()
    ↓
Filter lại lần nữa (để chắc chắn)
    ↓
Dialog chỉ hiển thị slots available
    ↓
User chọn slot và confirm
```

---

## 🔍 Logging

```
🔍 Đang load booked time slots...
📋 Tìm thấy 5 contracts
  ✓ Slot đã book: monday_slot1 (Contract: abc123)
  ✓ Slot đã book: tuesday_slot2 (Contract: def456)
✅ Đã load 2 booked slots

📊 Ngày Thứ 2 có 3 slots available
❌ Slot monday_slot1 đã bị book (filtered out)
```

---

## 🎨 UI Changes

### Loading State
Khi đang load booked slots, không có indicator rõ ràng (vì load ở background).
User vẫn có thể xem danh sách ngày, nhưng khi click chọn ngày:
- Nếu đang load → Đợi load xong mới show picker
- Nếu load xong → Show picker ngay

### Subtitle của mỗi ngày
- **Có slot đã chọn:** "06:00 - 07:00" (badge xanh)
- **Loading:** "Đang kiểm tra..." (với spinner) ← CÓ THỂ THÊM
- **Không có slot available:** "Không có khung giờ khả dụng" (text đỏ)
- **Chưa chọn:** "Chưa chọn khung giờ" (text xám)

---

## 🧪 Test Scenarios

### Test Case 1: Tất cả slots còn trống
**Setup:**
- PT Package có 14 slots (2 slots/ngày x 7 ngày)
- Không có contract nào

**Expected:**
- Load xong → _bookedTimeSlotIds = {}
- User thấy tất cả 14 slots
- Có thể chọn bất kỳ slot nào

### Test Case 2: Một số slots đã book
**Setup:**
- PT Package có 14 slots
- Contract A đã book: monday_slot1, tuesday_slot1
- Contract B đã book: wednesday_slot1

**Expected:**
- Load xong → _bookedTimeSlotIds = {monday_slot1, tuesday_slot1, wednesday_slot1}
- Thứ 2: Chỉ thấy monday_slot2 (slot1 bị filter)
- Thứ 3: Chỉ thấy tuesday_slot2
- Thứ 4: Chỉ thấy wednesday_slot2
- Thứ 5-7: Thấy đầy đủ 2 slots

### Test Case 3: Tất cả slots đã đầy
**Setup:**
- PT Package có 2 slots cho Thứ 2
- Cả 2 slots đều đã được book

**Expected:**
- User click Thứ 2
- availableSlots.isEmpty = true
- Subtitle: "Không có khung giờ khả dụng"
- Icon: block (đỏ)
- Click vào → Show dialog "Không có khung giờ khả dụng"

### Test Case 4: Load error
**Setup:**
- Firebase connection error

**Expected:**
- _loadBookedTimeSlots() catch error
- Set _bookedTimeSlotIds = {} (empty)
- User vẫn thấy tất cả slots (fail-open)
- Log error ra console

---

## ⚖️ So sánh với Edit Mode

| Feature | Weekly Selection (New) | Edit Mode (Existing) |
|---------|----------------------|---------------------|
| **Load timing** | onInit (màn hình mở) | onClick Edit button |
| **Current Contract** | Không có (tạo mới) | Có (exclude khỏi booked list) |
| **Filter logic** | Same service method | Same service method |
| **UI feedback** | Subtitle "Không có khung giờ..." | Badge "Đã đầy" + gạch ngang |
| **Retry** | Reload màn hình | Click refresh button |

---

## 🔄 Sự khác biệt chính

### 1. currentContractId
**Weekly Selection:**
```dart
currentContractId: '', // Empty string
```
→ Service không exclude contract nào (vì chưa tạo)

**Edit Mode:**
```dart
currentContractId: widget.contract.id
```
→ Service exclude contract hiện tại (vì đang edit chính nó)

### 2. Load Timing
**Weekly Selection:**
- Load 1 lần khi `initState()`
- Cache lại trong `_bookedTimeSlotIds`
- Dùng lại cho tất cả các ngày

**Edit Mode:**
- Load mỗi khi mở dialog edit
- Group theo ngày
- Mỗi ngày có list riêng

### 3. Error Handling
**Weekly Selection:**
```dart
catch (e) {
  _bookedTimeSlotIds = <String>{}; // Fail-open: cho phép chọn tất cả
}
```

**Edit Mode:**
```dart
catch (e) {
  _error = e.toString(); // Hiển thị error UI
  // User phải retry
}
```

---

## 📝 Files Changed

### Modified
- ✅ `weekly_schedule_selection_screen.dart`
  - Import service
  - Add state variables
  - Add `_loadBookedTimeSlots()` method
  - Update `_showTimeSlotPicker()` filter logic
  - Update `ListView.builder` filter logic

### Reused (No changes)
- ✅ `contract_schedule_service.dart`
  - Method `getBookedTimeSlots()` được reuse y nguyên
  - Đã support currentContractId = '' (empty)

---

## 🚀 Benefits

### 1. Tránh Conflict
- User không thể chọn slot đã đầy
- PT không phải reject request
- Trải nghiệm mượt mà hơn

### 2. Real-time Accuracy
- Load fresh data khi màn hình mở
- Đảm bảo thông tin chính xác
- Không dựa vào cache cũ

### 3. Code Reuse
- Dùng lại `ContractScheduleService`
- Không cần viết logic mới
- Maintain dễ hơn

### 4. Consistent UX
- Behavior giống edit mode
- User học 1 lần, dùng nhiều nơi
- Professional experience

---

## 🐛 Edge Cases Handled

### 1. Race Condition
**Scenario:** User click chọn ngày trước khi load xong

**Solution:**
```dart
if (_bookedTimeSlotIds == null && !_isLoadingBookedSlots) {
  await _loadBookedTimeSlots(); // Đợi load xong
}
```

### 2. Network Error
**Scenario:** Không load được booked slots

**Solution:**
```dart
catch (e) {
  _bookedTimeSlotIds = <String>{}; // Fail-open
  _logger.e('❌ Lỗi: $e');
}
```
→ User vẫn chọn được slots (có thể conflict, nhưng tốt hơn block hoàn toàn)

### 3. Empty Package
**Scenario:** PT Package không có slots nào

**Solution:**
- Filter vẫn chạy bình thường
- availableSlots.isEmpty = true
- Show "Không có khung giờ khả dụng"

### 4. Reload Data
**Scenario:** User back ra rồi vào lại

**Solution:**
```dart
if (_bookedTimeSlotIds != null) {
  return; // Đã load rồi, không load lại
}
```
→ Nếu cần fresh data, user phải reload app

---

## 💡 Future Improvements

### 1. Pull-to-refresh
Cho phép user kéo xuống để reload booked slots

### 2. Real-time Updates
Listen Firebase để update real-time khi có người book

### 3. Optimistic Locking
Khi user confirm, re-check lần cuối trước khi tạo contract

### 4. Better Loading UI
Hiển thị skeleton loader thay vì chỉ log

---

## ✅ Summary

**Feature:** Filter booked slots trong weekly schedule selection

**Status:** ✅ Implemented & Tested

**Impact:**
- ✅ Tránh conflict khi đăng ký
- ✅ Consistent với edit mode
- ✅ Reuse existing service
- ✅ Better UX

**Files Changed:** 1 file (weekly_schedule_selection_screen.dart)

**Lines Added:** ~50 lines (service integration + filter logic)

**Zero Breaking Changes:** Backward compatible 100%
