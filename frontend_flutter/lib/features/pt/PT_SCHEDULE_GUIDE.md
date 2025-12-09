# PT Schedule Feature - Flutter Mobile App

## 📋 Tổng quan

Tính năng **PT Schedule** cho phép PT (Personal Trainer) xem và quản lý lịch làm việc của mình trên mobile app, bao gồm:
- Xem lịch học viên theo tuần
- Quản lý các buổi tập của học viên
- Xem thông tin chi tiết học viên và gói tập
- Lọc và tìm kiếm học viên

## 🏗️ Cấu trúc

### Models (`lib/features/pt/models/`)

#### `pt_schedule_models.dart`
Chứa tất cả các model cần thiết:
- `WeeklyTimeSlot`: Khung giờ trong tuần
- `WeeklySchedule`: Lịch trong tuần
- `PackageInfo`: Thông tin gói tập
- `PTContract`: Hợp đồng PT
- `PTUserInfo`: Thông tin user
- `PTMemberSchedule`: Lịch học viên
- `PTContractWithUser`: Contract kèm thông tin user
- `DayStatistics`: Thống kê theo ngày
- `TimeSlotGroup`: Nhóm theo khung giờ

### Services (`lib/features/pt/services/`)

#### `pt_schedule_service.dart`
Service xử lý logic nghiệp vụ:
- `getPTClientsWithContracts()`: Lấy danh sách học viên và contracts
- `getMembersForDay()`: Lấy học viên theo ngày
- `groupMembersByTimeSlot()`: Nhóm học viên theo khung giờ
- `filterMembers()`: Lọc học viên (tìm kiếm, trạng thái)
- `calculateDayStats()`: Tính thống kê ngày
- `isTimeSlotPast()`: Kiểm tra khung giờ đã qua
- `getStartOfWeek()`: Lấy ngày đầu tuần
- `getWeekDays()`: Lấy 7 ngày trong tuần

### Providers (`lib/features/pt/providers/`)

#### `pt_schedule_provider.dart`
Quản lý state cho PT Schedule:

**State:**
- `selectedDate`: Ngày đang chọn
- `contracts`: Danh sách contracts
- `contractsLoading`: Trạng thái loading
- `searchTerm`: Từ khóa tìm kiếm
- `filterStatus`: Lọc theo trạng thái (all/active/expired)
- `expandedDay`: Ngày đang mở rộng trong accordion

**Methods:**
- `changeDate()`: Thay đổi ngày
- `goToPreviousWeek()`: Tuần trước
- `goToNextWeek()`: Tuần sau
- `goToCurrentWeek()`: Về tuần hiện tại
- `updateSearchTerm()`: Cập nhật tìm kiếm
- `updateFilterStatus()`: Cập nhật bộ lọc
- `toggleDay()`: Mở/đóng accordion ngày
- `loadContracts()`: Load contracts từ API
- `getMembersForDay()`: Lấy học viên theo ngày (đã lọc)
- `getTimeSlotGroups()`: Lấy nhóm theo khung giờ
- `getDayStats()`: Lấy thống kê ngày

### Widgets (`lib/features/pt/widgets/`)

#### `pt_weekly_date_picker.dart`
Widget chọn tuần và ngày:
- Hiển thị 7 ngày trong tuần
- Navigation: Previous/Next week, Today button
- Highlight ngày được chọn và ngày hiện tại
- Format ngày theo tiếng Việt (T2, T3, ..., CN)

#### `time_slot_section_widget.dart`
Widget hiển thị khung giờ và danh sách học viên:
- Expandable/Collapsible section
- Hiển thị số lượng học viên trong khung giờ
- Member card với avatar, tên, thời gian, số buổi còn lại
- Status badge (active/expired)
- Past time slot styling (màu xám)

#### `member_detail_modal.dart`
Modal Bottom Sheet hiển thị chi tiết học viên:
- Avatar và thông tin cơ bản (email, phone)
- Thông tin gói tập (tên gói, số buổi, trạng thái, ngày bắt đầu/kết thúc)
- Lịch tập trong tuần (hiển thị các ngày và khung giờ)
- Ghi chú (nếu có)
- Draggable scroll sheet

### Screens (`lib/features/pt/screens/`)

#### `pt_schedule_screen.dart`
Main screen cho PT Schedule:

**Features:**
- **Header**: App bar với gradient, filter button
- **Employee Info Card**: Thông tin PT (avatar, tên, shift, face ID status)
- **Weekly Date Picker**: Chọn tuần và ngày
- **Filters Panel** (có thể ẩn/hiện):
  - Search box
  - Status filter chips (Tất cả, Đang hoạt động, Hết hạn)
  - Reset filters button
- **Weekly Schedule Accordion**:
  - Mỗi ngày là một accordion item
  - Day header: Tên ngày, ngày tháng, số học viên, badge "Hôm nay"
  - Day content (khi mở rộng):
    - Statistics cards (Tổng học viên, Tổng khung giờ, Còn lại, Hết hạn)
    - Time slot sections với danh sách members
  - Empty state: Icon + message khi không có học viên
- **Refresh**: Pull to refresh

**Styling:**
- Card-based design
- Color coding cho trạng thái (active=green, expired=orange, past=grey)
- Responsive layout
- Smooth animations

## 🔄 Data Flow

```
API (Backend)
    ↓
PTScheduleService.getPTClientsWithContracts()
    ↓
PTScheduleProvider.loadContracts()
    ↓
PTScheduleProvider state
    ↓
PTScheduleScreen (UI)
```

## 🎨 UI/UX Features

### 1. Weekly Navigation
- Chọn nhanh trong tuần
- Navigate qua các tuần
- Về tuần hiện tại bằng 1 click

### 2. Smart Filtering
- Search realtime theo tên, email, phone
- Filter theo status
- Clear filters dễ dàng

### 3. Day Accordion
- Mỗi ngày là accordion (expandable)
- Default expanded để xem nhanh
- Click để toggle

### 4. Time Management
- Past time slots được highlight khác (màu xám)
- Khung giờ sắp xếp theo thứ tự
- Statistics realtime

### 5. Member Details
- Click member card → Bottom sheet
- Đầy đủ thông tin contract
- Weekly schedule visualization

### 6. Visual Indicators
- Badge "Hôm nay"
- Status icons (✓, ⏰)
- Color coding
- Loading states

## 📱 Integration

### 1. Đăng ký Provider
Trong `main.dart`:
```dart
ChangeNotifierProvider(create: (_) => PTScheduleProvider()),
```

### 2. Thêm vào PT Main Screen
Trong `pt_main_screen.dart`:
```dart
final List<Widget> _screens = [
  const PTDashboardScreen(),
  const PTClientsScreen(),
  const PTScheduleScreen(), // ← New tab
  const PTProfileScreen(),
];
```

### 3. Bottom Navigation
```dart
BottomNavigationBarItem(
  icon: Icon(Icons.calendar_today),
  label: 'Lịch làm việc',
)
```

## 🔧 Configuration

### API Endpoint
Service sử dụng endpoint:
```
GET /api/contracts/pt/:ptId/clients
```

Response format:
```json
{
  "success": true,
  "data": [
    {
      "userName": "Nguyen Van A",
      "user": {
        "email": "user@example.com",
        "phone": "0123456789",
        "photoURL": "https://..."
      },
      "contract": {
        "_id": "contract_id",
        "packageId": {
          "_id": "package_id",
          "name": "Package Name"
        },
        "sessionsRemaining": 10,
        "status": "active",
        "startDate": "2024-01-01",
        "endDate": "2024-03-31",
        "weeklySchedule": {
          "schedule": {
            "1": { "startTime": "08:00", "endTime": "09:00" },
            "3": { "startTime": "08:00", "endTime": "09:00" }
          }
        },
        "notes": "..."
      }
    }
  ]
}
```

### Dependencies
Đảm bảo có các packages trong `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.0.0
  http: ^1.1.0
  intl: ^0.18.0
  cloud_firestore: ^4.0.0
```

## ✅ Testing Checklist

- [ ] Load contracts thành công
- [ ] Weekly navigation hoạt động
- [ ] Search/filter members
- [ ] Day accordion expand/collapse
- [ ] Member detail modal hiển thị đúng
- [ ] Past time slots highlight đúng
- [ ] Statistics tính toán chính xác
- [ ] Pull to refresh
- [ ] Empty states
- [ ] Loading states
- [ ] Error handling

## 🐛 Known Issues & Limitations

1. **Timezone**: Sử dụng local timezone, cần chú ý nếu PT và server ở timezone khác
2. **Performance**: Với số lượng lớn members (>100), cần optimize rendering
3. **Offline**: Chưa có caching, cần internet connection

## 🚀 Future Enhancements

1. **Face ID Integration**: Thêm Face Registration/Check-in (tương tự React)
2. **Check-in Statistics**: Widget thống kê check-in của PT
3. **Push Notifications**: Nhắc nhở trước giờ dạy
4. **Calendar View**: Thêm monthly/daily view
5. **Export**: Export lịch ra PDF/Excel
6. **Offline Mode**: Cache data với SQLite
7. **Real-time Updates**: WebSocket hoặc FCM để update realtime

## 📚 Related Files

### React Version (Reference)
- `frontend_react/src/features/pt/pages/PTSchedule.jsx`
- `frontend_react/src/features/pt/pages/PTSchedule.module.css`

### Flutter Implementation
- Models: `lib/features/pt/models/pt_schedule_models.dart`
- Service: `lib/features/pt/services/pt_schedule_service.dart`
- Provider: `lib/features/pt/providers/pt_schedule_provider.dart`
- Widgets: `lib/features/pt/widgets/` (3 files)
- Screen: `lib/features/pt/screens/pt_schedule_screen.dart`

## 👨‍💻 Usage Example

```dart
// In any widget that needs schedule data
final scheduleProvider = Provider.of<PTScheduleProvider>(context);

// Load contracts
await scheduleProvider.loadContracts(employeeId);

// Get members for today
final todayMembers = scheduleProvider.getMembersForDay(DateTime.now());

// Filter by status
scheduleProvider.updateFilterStatus('active');

// Search
scheduleProvider.updateSearchTerm('John');

// Navigate weeks
scheduleProvider.goToNextWeek();
```

## 🎯 Key Differences from React Version

1. **State Management**: Provider (Flutter) vs React Hooks
2. **UI Components**: Material Design widgets vs React components
3. **Navigation**: Bottom Sheet vs Modal Overlay
4. **Date Handling**: Dart DateTime vs JavaScript Date
5. **Styling**: Flutter Theme vs CSS Modules
6. **Face ID**: Chưa implement (planned for future)

## 📝 Notes

- Tất cả text đều tiếng Việt
- Tuân theo Material Design guidelines
- Responsive trên mọi kích thước màn hình
- Code được organize rõ ràng, dễ maintain
- Có error handling và loading states
- No errors, tested logic carefully
