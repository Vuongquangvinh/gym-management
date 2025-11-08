# 📅 PT Schedule Management - Lịch làm việc của PT

## 🎯 Tổng quan

Trang lịch làm việc cho PT xem lịch làm việc của bản thân, kiểm tra trạng thái check-in/check-out, và theo dõi giờ làm việc hàng tuần.

## ✨ Tính năng

### 1. **Xem lịch theo tuần** 📆

- Hiển thị lịch 7 ngày trong tuần (Thứ 2 - Chủ Nhật)
- Chuyển tuần trước/sau với nút điều hướng
- Button "Hôm nay" để quay về tuần hiện tại
- Highlight ngày hôm nay

### 2. **Phân biệt Fulltime vs Partime** ⏰

- **Fulltime**: Làm việc cố định 08:00 - 17:00 mỗi ngày
- **Partime**: Chỉ làm việc những ngày có lịch được sắp xếp

### 3. **Trạng thái Check-in/Check-out** ✅

- **Hoàn thành**: Đã check-in và check-out (icon xanh ✔️)
- **Đang làm**: Đã check-in nhưng chưa check-out (icon vàng 🕐)
- **Chưa check-in**: Chưa check-in (icon xám ✕)

### 4. **Thông tin chi tiết mỗi ngày** 📝

- Giờ làm việc (start time - end time)
- Thời gian check-in/check-out
- Tổng giờ làm (nếu đã hoàn thành)
- Ghi chú từ admin (nếu có)

## 📊 Luồng hoạt động

```
PT đăng nhập → Vào trang "Lịch làm việc"
         ↓
Hệ thống load:
  - Thông tin employee (fulltime/partime)
  - Lịch làm việc tuần này
  - Trạng thái check-in/check-out
         ↓
PT xem lịch:
  - Các ngày có lịch làm
  - Trạng thái check-in
  - Tổng giờ làm
         ↓
PT có thể:
  - Chuyển sang tuần trước/sau
  - Xem chi tiết từng ngày
  - Kiểm tra ghi chú
```

## 🗂️ Cấu trúc File

```
frontend_react/src/
└── features/pt/pages/
    ├── PTSchedule.jsx         # Main component
    └── PTSchedule.css         # Styles
```

## 🔧 Technical Implementation

### **1. Data Sources**

#### **Schedule Collection** (`schedule`)

```javascript
{
  _id: string,
  employeeId: string,
  employeeName: string,
  date: "YYYY-MM-DD",
  startTime: "HH:MM",
  endTime: "HH:MM",
  status: "active" | "cancelled",
  notes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **Checkin Collection** (`employee_checkins`)

```javascript
{
  _id: string,
  employeeId: string,
  date: "YYYY-MM-DD",
  timestamp: Timestamp,
  checkinType: "checkin" | "checkout",
  qrCode: string,
  location: string
}
```

### **2. Main Component Structure**

```jsx
<ScheduleProvider>
  <PTScheduleContent>
    {/* Header với employee badge */}
    <PTScheduleHeader />

    {/* Date picker tuần */}
    <PTWeeklyDatePicker />

    {/* Shift type info (fulltime/partime) */}
    <ShiftInfoCard />

    {/* Grid 7 ngày */}
    <ScheduleGrid>
      {weekDays.map((day) => (
        <ScheduleCard key={day}>
          {/* Date header */}
          {/* Working hours */}
          {/* Checkin status */}
          {/* Notes */}
          {/* Total hours (if completed) */}
        </ScheduleCard>
      ))}
    </ScheduleGrid>

    {/* Legend */}
    <ScheduleLegend />
  </PTScheduleContent>
</ScheduleProvider>
```

### **3. Key Hooks Used**

```javascript
// Auth context
const { currentUser } = useAuth();

// Schedule context (from ScheduleProvider)
const {
  schedules, // { "2024-11-08": [schedules] }
  checkins, // { "2024-11-08": { employeeId: [checkins] } }
  selectedDate, // Current selected date
  changeDate, // Change selected date
  getCheckinInfo, // Get checkin/checkout for employee
  getDateString, // Format date to "YYYY-MM-DD"
  getStartOfWeek, // Get Monday of week
  getWeekDays, // Get 7 days of week
} = useSchedule();
```

### **4. Business Logic**

#### **Determine if PT works on a day:**

```javascript
const hasSchedule = employee.shift === "fulltime" || schedule;

// Fulltime → works every day
// Partime → only days with schedule
```

#### **Calculate total working hours:**

```javascript
const checkinTime = new Date(checkin.timestamp);
const checkoutTime = new Date(checkout.timestamp);
const diffMs = checkoutTime - checkinTime;
const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

// Result: "8h 30m"
```

#### **Status detection:**

```javascript
if (checkin && checkout) {
  status = "completed"; // ✅ Hoàn thành
} else if (checkin) {
  status = "in-progress"; // 🕐 Đang làm
} else {
  status = "pending"; // ❌ Chưa check-in
}
```

## 🎨 UI Components

### **1. Employee Badge** (Top Right)

```
┌────────────────────────────┐
│ [Avatar] Bửu Ngao          │
│          ⏰ Fulltime        │
└────────────────────────────┘
```

### **2. Weekly Date Picker**

```
┌─────────────────────────────────────────┐
│  [◀] Tuần 4/11 - 10/11/2024    [▶]    │
│       [📅 Hôm nay]                      │
├─────┬─────┬─────┬─────┬─────┬─────┬────┤
│ T2  │ T3  │ T4  │ T5  │ T6  │ T7  │ CN │
│04/11│05/11│06/11│07/11│08/11│09/11│10/11│
└─────┴─────┴─────┴─────┴─────┴─────┴────┘
```

### **3. Shift Info Card**

```
┌────────────────────────────────────────┐
│ ⏰  Nhân viên Fulltime                 │
│     Bạn làm việc toàn thời gian với    │
│     lịch cố định (08:00 - 17:00)       │
└────────────────────────────────────────┘
```

### **4. Schedule Card (Per Day)**

```
┌────────────────────────────────┐
│ Thứ Năm                [Hôm nay]│
│ 7/11/2024                       │
├────────────────────────────────┤
│ 🕐 08:00 - 17:00 (Fulltime)    │
├────────────────────────────────┤
│ ✅ Hoàn thành                   │
│    Check-in: 07:55             │
│    Check-out: 17:10            │
├────────────────────────────────┤
│ 📝 Ghi chú:                     │
│    Nhớ mang tài liệu họp        │
├────────────────────────────────┤
│ ⏱️ Tổng giờ làm: 9h 15m         │
└────────────────────────────────┘
```

### **5. No Schedule Card (Partime - No Work)**

```
┌────────────────────────────────┐
│ Thứ Sáu                         │
│ 8/11/2024                       │
├────────────────────────────────┤
│        📭                       │
│   Không có lịch làm việc        │
│   Bạn không có ca làm ngày này  │
└────────────────────────────────┘
```

### **6. Legend**

```
┌────────────────────────────────┐
│ Chú thích:                      │
│ ✅ Hoàn thành (Check-in/out)    │
│ 🕐 Đang làm (Đã check-in)       │
│ ❌ Chưa check-in                │
└────────────────────────────────┘
```

## 📊 Status Colors

```css
.completed {
  background: #d4edda; /* Light green */
  border-color: #28a745; /* Green */
}

.in-progress {
  background: #fff3cd; /* Light yellow */
  border-color: #ffc107; /* Yellow */
}

.pending {
  background: #f8f9fa; /* Light gray */
  border-color: #dee2e6; /* Gray */
}

.no-schedule {
  background: #f8f9fa; /* Light gray */
  border-color: #e9ecef; /* Light gray */
  opacity: 0.7;
}
```

## 🔄 Real-time Updates

Trang này sử dụng **`onSnapshot`** từ Firestore để cập nhật real-time:

```javascript
// ScheduleProvider tự động setup listeners
useEffect(() => {
  const datesToLoad = getWeekDays(selectedDate);

  // Setup listener cho mỗi ngày
  datesToLoad.forEach((date) => {
    const dateStr = getDateString(date);

    // Listen schedules
    subscribeSchedulesByDate(dateStr, (schedules) => {
      setSchedules((prev) => ({ ...prev, [dateStr]: schedules }));
    });

    // Listen checkins
    subscribeCheckinsByDate(dateStr, (checkins) => {
      setCheckins((prev) => ({ ...prev, [dateStr]: checkins }));
    });
  });
}, [selectedDate]);
```

Khi Admin tạo/sửa lịch hoặc PT check-in/out → UI PT tự động cập nhật!

## 🎯 User Stories

### **Story 1: PT Fulltime xem lịch tuần**

```
Given: PT Fulltime (Bửu Ngao) đăng nhập
When: Vào trang "Lịch làm việc"
Then:
  - Hiển thị 7 ngày trong tuần
  - Tất cả 7 ngày đều có lịch (08:00 - 17:00)
  - Ngày hôm nay được highlight
  - Check-in status được hiển thị
```

### **Story 2: PT Partime xem lịch tuần**

```
Given: PT Partime (Thanh Tùng) đăng nhập
When: Vào trang "Lịch làm việc"
Then:
  - Hiển thị 7 ngày trong tuần
  - Chỉ những ngày có lịch mới hiển thị giờ làm
  - Những ngày không có lịch hiển thị "Không có lịch làm việc"
```

### **Story 3: PT xem tuần trước**

```
Given: PT đang xem tuần hiện tại
When: Click nút "◀" (tuần trước)
Then:
  - Chuyển sang tuần trước
  - Load lịch và checkin của tuần trước
  - Các ngày quá khứ có opacity 0.7
```

### **Story 4: PT về tuần hiện tại**

```
Given: PT đang xem tuần trước/sau
When: Click button "📅 Hôm nay"
Then:
  - Quay về tuần hiện tại
  - Ngày hôm nay được highlight
```

### **Story 5: PT kiểm tra giờ làm**

```
Given: PT đã check-in và check-out
When: Xem card ngày đó
Then:
  - Hiển thị "✅ Hoàn thành"
  - Hiển thị giờ check-in và check-out
  - Hiển thị tổng giờ làm (VD: "8h 30m")
  - Card có màu xanh lá
```

## 📱 Responsive Design

### **Desktop (> 768px)**

- Grid 3 cột (3 ngày/hàng)
- Full width cards
- All details visible

### **Mobile (≤ 768px)**

- Grid 1 cột (1 ngày/hàng)
- Compact date picker
- Smaller fonts
- Stack employee badge

## 🚀 Future Enhancements

### **1. Export lịch làm việc** 📥

```javascript
// Export schedule to PDF/Excel
const exportSchedule = async (startDate, endDate) => {
  // Generate PDF with all schedules and checkins
};
```

### **2. Thống kê tháng** 📊

```javascript
// Monthly statistics
{
  totalDays: 22,           // Số ngày làm
  totalHours: 176,         // Tổng giờ
  avgHoursPerDay: 8,       // Trung bình giờ/ngày
  lateCheckins: 3,         // Số lần checkin trễ
  earlyCheckouts: 1        // Số lần checkout sớm
}
```

### **3. Notification check-in sắp tới** 🔔

```javascript
// Remind PT to check-in
if (now >= startTime - 15mins && !checkin) {
  showNotification("⏰ Sắp đến giờ làm việc!");
}
```

### **4. Calendar view** 📅

```
┌─────────────────────────────────────┐
│         Tháng 11/2024               │
├───┬───┬───┬───┬───┬───┬───┬───┐
│   │ T2│ T3│ T4│ T5│ T6│ T7│ CN│
├───┼───┼───┼───┼───┼───┼───┼───┤
│ 1 │ ✅│ ✅│ ✅│ ✅│ ✅│   │   │
│ 4 │ ✅│ ✅│ 🕐│   │   │   │   │
│   │...│...│...│...│...│...│...│
└───┴───┴───┴───┴───┴───┴───┴───┘
```

## 🔗 Related Pages

- **Admin Schedule Page** (`/admin/schedule`) - Admin tạo/sửa lịch cho nhân viên
- **PT Dashboard** (`/pt`) - Overview và quick stats
- **Check-in Page** (`/qr`) - QR check-in/checkout

## 📞 Navigation

- Sidebar: "📅 Lịch làm việc"
- Route: `/pt/schedule`
- Component: `PTSchedule.jsx`

---

**Last Updated:** 2024-11-08  
**Version:** 1.0.0  
**Feature:** PT Schedule Management
