# 🎬 DEMO SCENARIOS - Gym Management System

Hướng dẫn chi tiết các kịch bản demo để showcase hệ thống một cách ấn tượng nhất.

---

## 🚀 SETUP NHANH (5 phút)

```bash
# 1. Tạo mock data
cd backend
npm run seed

# 2. Start backend
npm start

# 3. Start frontend React (Terminal mới)
cd frontend_react
npm run dev

# 4. Start Flutter app (Terminal mới) - Optional
cd frontend_flutter
flutter run
```

**Kết quả:** 
- Backend: `http://localhost:3000`
- React: `http://localhost:5173`
- Flutter: Running on device/emulator

---

## 🎯 SCENARIO 1: DEMO QUẢN LÝ THÀNH VIÊN (5 phút)

### Mục tiêu
Showcase khả năng quản lý danh sách thành viên, tìm kiếm, filter, và xem chi tiết.

### Steps

1. **Vào trang User Management**
   ```
   http://localhost:5173/admin/users
   ```

2. **Show danh sách 50 users**
   - Scroll qua danh sách
   - Point out: Avatar, tên, phone, chi nhánh, trạng thái

3. **Demo Search**
   - Search theo tên: "Nguyễn"
   - Search theo phone: "032"
   - Search theo email

4. **Demo Filter**
   - Filter theo chi nhánh: "Gym Hà Nội Center"
   - Filter theo trạng thái: "active"
   - Filter theo gender: "male"

5. **Xem chi tiết User**
   - Click vào 1 user bất kỳ
   - Show profile details
   - Show active package
   - Show check-in history
   - Show payment history

6. **Demo Edit User**
   - Click Edit
   - Thay đổi phone number
   - Save
   - Verify changes

### Key Points
- ✅ 50 users với data thực tế
- ✅ Search real-time
- ✅ Multiple filters
- ✅ Complete profile information
- ✅ History tracking

### Expected Outcome
"Hệ thống có thể quản lý hàng trăm members một cách dễ dàng với tìm kiếm và filter mạnh mẽ."

---

## 💰 SCENARIO 2: DEMO HỆ THỐNG THANH TOÁN (7 phút)

### Mục tiêu
Showcase quy trình thanh toán từ đầu đến cuối và quản lý payment orders.

### Steps

1. **Xem Payment History**
   ```
   http://localhost:5173/admin/payments
   ```
   - Show 100 payment orders có sẵn
   - Point out các trạng thái: PAID, PENDING, CANCELLED

2. **Demo Filter Payments**
   - Filter by status: "PAID"
   - Filter by date range: Last 30 days
   - Filter by package

3. **Xem Payment Details**
   - Click vào 1 order PAID
   - Show: User info, package, amount, payment method
   - Show payment timestamp

4. **Tạo Payment Link Mới**
   ```
   http://localhost:5173/demo-payment
   ```
   - Select user: Chọn từ dropdown
   - Select package: "Gói Premium 6 Tháng"
   - Click "Tạo Link Thanh Toán"
   - Show QR code & link PayOS

5. **Demo Payment Flow**
   - Click "Mở trang PayOS"
   - Show trang thanh toán
   - (Optional) Test thanh toán với card test

6. **Verify Payment in Admin**
   - Back to payment history
   - Refresh
   - Show new order với status PENDING/PAID

7. **Demo Revenue Statistics**
   ```
   http://localhost:5173/admin/financial/reports
   ```
   - Show tổng doanh thu
   - Show revenue by month
   - Show revenue by package
   - Show charts & graphs

### Key Points
- ✅ 100 payment orders với various statuses
- ✅ Complete payment flow
- ✅ PayOS integration
- ✅ Real-time tracking
- ✅ Revenue analytics

### Expected Outcome
"Hệ thống thanh toán tự động, tích hợp PayOS, track được toàn bộ giao dịch và doanh thu."

---

## 🏋️ SCENARIO 3: DEMO QUẢN LÝ PT (8 phút)

### Mục tiêu
Showcase quản lý Personal Trainers, booking, reviews, và schedules.

### Steps

1. **Xem danh sách PT**
   ```
   http://localhost:5173/admin/employees?role=pt
   ```
   - Show ~5-7 PTs trong 15 employees
   - Point out: Rating, reviews count, specialization

2. **Xem PT Profile**
   - Click vào PT có rating cao
   - Show:
     - Bio & experience
     - Certifications
     - Specialization
     - Rating & review count
     - Total clients
     - Commission rate

3. **Xem PT Reviews**
   - Scroll to reviews section
   - Show 60 reviews với ratings 3-5 sao
   - Point out: User feedback, timestamps

4. **Xem PT Schedule**
   ```
   http://localhost:5173/admin/schedules?ptId={ptId}
   ```
   - Show calendar view
   - Point out: 100 schedules trong tháng
   - Show past sessions (completed/cancelled)
   - Show upcoming sessions

5. **Book PT Session (Mobile - Flutter)**
   - Mở Flutter app
   - Login as user
   - Navigate to "Book PT"
   - Select PT
   - Select date & time slot
   - Confirm booking

6. **Verify Booking (Admin)**
   - Back to admin
   - Refresh schedules
   - Show new booking

7. **PT Commission Tracking**
   ```
   http://localhost:5173/admin/financial/pt-commissions
   ```
   - Show PT earnings
   - Show commission by PT
   - Show sessions completed
   - Calculate total commissions

### Key Points
- ✅ Multiple PTs với real ratings
- ✅ 60 reviews
- ✅ 100 PT schedules
- ✅ Calendar booking system
- ✅ Commission tracking

### Expected Outcome
"Hệ thống quản lý PT chuyên nghiệp với booking calendar, reviews, và tracking commission tự động."

---

## 🏢 SCENARIO 4: DEMO QUẢN LÝ TÀI CHÍNH (10 phút)

### Mục tiêu
Showcase hệ thống financial management đầy đủ với thu/chi, budget, reports.

### Steps

1. **Overview Dashboard**
   ```
   http://localhost:5173/admin/financial
   ```
   - Show KPI cards:
     - Total Revenue (từ 100 payment orders)
     - Total Expenses (từ 50 expenses)
     - Net Profit
     - Monthly trend

2. **Revenue Analysis**
   - Click "Revenue Details"
   - Show breakdown by:
     - Package type (Gym vs PT)
     - Time period (Daily/Weekly/Monthly)
     - Branch
   - Show charts

3. **Expenses Management**
   ```
   http://localhost:5173/admin/financial/expenses
   ```
   - Show 50 expenses
   - Show 7 categories:
     - Tiền thuê: 🏢
     - Điện nước: 💡
     - Thiết bị: 🏋️
     - Lương: 💰
     - Marketing: 📱
     - Bảo trì: 🔧
     - Vật tư: 🧴

4. **Add New Expense**
   - Click "Add Expense"
   - Fill in:
     - Category: "Tiền điện nước"
     - Amount: 5,000,000 VNĐ
     - Date: Today
     - Description: "Tiền điện tháng 12"
   - Save
   - Verify in list

5. **Budget Tracking**
   ```
   http://localhost:5173/admin/financial/budgets
   ```
   - Show budget per category
   - Show actual vs planned
   - Point out: Over budget categories (red)
   - Point out: Under budget categories (green)

6. **Financial Reports**
   ```
   http://localhost:5173/admin/financial/reports
   ```
   - Select period: "This Month"
   - Show:
     - Income statement
     - Expense breakdown
     - Profit margin
     - Trends & forecasts
   - Export PDF/Excel (optional)

7. **Expense vs Revenue Comparison**
   - Show chart comparing monthly revenue vs expenses
   - Point out profitable months
   - Point out months with high expenses

### Key Points
- ✅ 100 revenue records
- ✅ 50 expense records
- ✅ 7 expense categories
- ✅ Budget tracking
- ✅ Comprehensive reports
- ✅ Charts & visualizations

### Expected Outcome
"Hệ thống tài chính chuyên nghiệp tracking đầy đủ thu/chi, budget, và tạo reports tự động."

---

## 📊 SCENARIO 5: DEMO CHECK-IN SYSTEM (6 phút)

### Mục tiêu
Showcase hệ thống check-in với QR code, history, và statistics.

### Steps

1. **Check-in History**
   ```
   http://localhost:5173/admin/checkins
   ```
   - Show 500 check-ins
   - Point out: Member name, time, location, source (QR/manual)

2. **Filter Check-ins**
   - Filter by date: "Today"
   - Filter by branch: "Gym Hà Nội Center"
   - Filter by member

3. **Check-in Statistics**
   - Show total check-ins by:
     - Day of week (chart)
     - Hour of day (peak hours)
     - Branch
     - Month

4. **Demo QR Check-in (Mobile - Flutter)**
   - Mở Flutter app
   - Login as user
   - Navigate to "Check-in"
   - Show QR code
   - (Admin scans QR or manual check-in)

5. **Manual Check-in (Admin)**
   ```
   http://localhost:5173/admin/checkins/new
   ```
   - Search member: "Nguyễn Văn An"
   - Select member
   - Click "Check-in"
   - Verify success

6. **Member Check-in History**
   - Go to user profile
   - Show check-in history
   - Show statistics:
     - Total check-ins
     - Frequency
     - Last check-in
     - Favorite time slots

7. **Export Report**
   - Select date range: "Last month"
   - Click "Export"
   - Download Excel with 500 check-ins

### Key Points
- ✅ 500 check-ins
- ✅ QR code support
- ✅ Manual check-in
- ✅ Statistics & charts
- ✅ Export functionality

### Expected Outcome
"Hệ thống check-in linh hoạt với QR code, tracking chi tiết, và statistics để phân tích behavior."

---

## 📱 SCENARIO 6: DEMO NOTIFICATION SYSTEM (5 phút)

### Mục tiêu
Showcase hệ thống thông báo real-time cho users.

### Steps

1. **Admin View Notifications**
   ```
   http://localhost:5173/admin/notifications
   ```
   - Show 80 notifications
   - Show types:
     - 💰 Payment
     - 📄 Contract
     - 📅 Schedule
     - 🎉 Promotion
     - 🔔 System

2. **Send Test Notification**
   - Click "Create Notification"
   - Fill in:
     - Type: "Promotion"
     - Title: "Giảm giá 20% gói Premium"
     - Message: "Khuyến mãi đặc biệt tháng 12!"
     - Target: "All active users"
   - Send

3. **User View (Mobile - Flutter)**
   - Mở Flutter app
   - Show notification badge
   - Click notifications
   - Show list of notifications
   - Mark as read

4. **Filter Notifications (Admin)**
   - Filter by type: "Payment"
   - Filter by read/unread
   - Filter by user

5. **Notification Analytics**
   - Show sent count
   - Show read rate
   - Show click-through rate
   - Show by type breakdown

### Key Points
- ✅ 80 notifications across 5 types
- ✅ Real-time delivery
- ✅ Read/unread tracking
- ✅ Multiple targeting options
- ✅ Analytics

### Expected Outcome
"Hệ thống notification giúp engage users với promotions, reminders, và updates."

---

## 🎓 SCENARIO 7: DEMO PACKAGE MANAGEMENT (5 phút)

### Mục tiêu
Showcase quản lý các gói tập với giá, giảm giá, điều kiện.

### Steps

1. **View All Packages**
   ```
   http://localhost:5173/admin/packages
   ```
   - Show 5 packages:
     - 🥉 Gói Basic 1M: 500K
     - 🥈 Gói Standard 3M: 1.2M (Giảm 10%)
     - 🥇 Gói Premium 6M: 2M (Giảm 15%)
     - 💪 Gói PT 10 buổi: 3M
     - ⭐ Gói PT 20 buổi: 5.5M (Giảm 8%)

2. **View Package Details**
   - Click vào "Gói Premium"
   - Show:
     - Description & features
     - Price & discount
     - Duration
     - Conditions
     - Active users count
     - Revenue generated

3. **Create New Package**
   - Click "Add Package"
   - Fill in:
     - Name: "Gói Năm VIP"
     - Type: "monthly"
     - Duration: 365 days
     - Price: 10,000,000
     - Discount: 20%
     - Features: [list]
   - Save

4. **Edit Package Discount**
   - Select "Gói Standard"
   - Edit discount: 10% → 15%
   - Set discount period: 1-31 Dec
   - Save
   - Show updated price

5. **Package Analytics**
   - Show:
     - Most popular package
     - Revenue by package
     - Active subscriptions
     - Conversion rate

### Key Points
- ✅ 5 diverse packages
- ✅ Flexible pricing
- ✅ Time-based discounts
- ✅ Package analytics
- ✅ Easy management

### Expected Outcome
"Hệ thống package linh hoạt với nhiều options, discounts, và analytics để optimize pricing."

---

## 📋 CHECKLIST TRƯỚC KHI DEMO

### ✅ Technical Setup
- [ ] Backend đã start (`npm start`)
- [ ] React app đã start (`npm run dev`)
- [ ] Flutter app đã build (optional)
- [ ] Mock data đã seed (`npm run seed`)
- [ ] Internet connection stable (cho PayOS)

### ✅ Data Verification
- [ ] Login admin works
- [ ] 50 users visible
- [ ] 100 payment orders visible
- [ ] 500 check-ins visible
- [ ] All charts loading

### ✅ Demo Environment
- [ ] Browser tabs prepared
- [ ] Test accounts ready
- [ ] Demo script in hand
- [ ] Backup plan (nếu lỗi)

### ✅ Presentation
- [ ] Projector/screen setup
- [ ] Audio working (optional)
- [ ] Demo flow rehearsed
- [ ] Questions prepared

---

## 🎬 FULL DEMO SCRIPT (30 phút)

### Phút 1-5: Introduction & Setup
- Giới thiệu hệ thống
- Show architecture diagram
- Explain tech stack
- Show mock data stats

### Phút 6-10: User Management (Scenario 1)
- Show 50 users
- Demo search & filter
- View user details
- Show history tracking

### Phút 11-17: Payment System (Scenario 2)
- Show payment history
- Create new payment link
- Demo PayOS integration
- Show revenue statistics

### Phút 18-23: PT Management (Scenario 3)
- Show PT list with ratings
- View PT profile & reviews
- Demo booking system
- Show commission tracking

### Phút 24-28: Financial System (Scenario 4)
- Show dashboard overview
- Demo expenses management
- Show budget tracking
- Generate financial report

### Phút 29-30: Q&A
- Answer questions
- Show any requested features
- Discuss customization options

---

## 💡 PRO TIPS

### Timing
- Practice trước để nằm lòng flow
- Có backup plan nếu API chậm
- Prepare screenshots nếu demo fail

### Engagement
- Ask questions để involve audience
- Highlight unique features
- Compare với competitors (nếu có)
- Show real-world use cases

### Technical
- Clear browser cache trước demo
- Disable browser extensions
- Use incognito mode
- Have backup device ready

### Presentation
- Use laser pointer để highlight
- Zoom in khi cần
- Explain while clicking (don't rush)
- Recap key points

---

## 🚨 TROUBLESHOOTING DURING DEMO

### Nếu backend crash:
1. Restart nhanh: `npm start`
2. Trong lúc đó, show frontend static pages
3. Explain architecture

### Nếu frontend lỗi:
1. Refresh page
2. Clear cache & retry
3. Use mobile app as backup

### Nếu PayOS lỗi:
1. Show previous payment records
2. Explain integration
3. Show PayOS documentation

### Nếu data lỗi:
1. Có screenshots backup
2. Explain expected behavior
3. Note to fix after demo

---

## 📈 POST-DEMO ACTIONS

### Follow-up
- [ ] Send demo video/screenshots
- [ ] Share documentation
- [ ] Schedule follow-up meeting
- [ ] Collect feedback

### Improvements
- [ ] Note down issues encountered
- [ ] Update demo script
- [ ] Improve problematic features
- [ ] Add more mock data if needed

### Documentation
- [ ] Update README with demo notes
- [ ] Record demo video
- [ ] Create FAQ based on questions
- [ ] Share with team

---

## 🎉 SUCCESS METRICS

Demo thành công khi:
- ✅ All features working smoothly
- ✅ Audience engaged & asking questions
- ✅ Key differentiators highlighted
- ✅ Next steps clearly defined
- ✅ Positive feedback received

Good luck với demo! 🚀
