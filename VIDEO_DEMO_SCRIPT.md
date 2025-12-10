# 🎥 VIDEO DEMO SCRIPT

Script chi tiết để record video demo Gym Management System (10-15 phút)

---

## 🎬 PRE-PRODUCTION

### Setup trước khi record
```bash
# 1. Generate fresh mock data
cd backend
npm run cleanup
npm run seed

# 2. Start services
npm start           # Terminal 1 - Backend

cd ../frontend_react
npm run dev         # Terminal 2 - Frontend

# 3. Clear browser data
# - Clear cache
# - Clear local storage
# - Use incognito mode (optional)
```

### Recording Settings
- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 30fps minimum
- **Audio:** Clear voice, no background noise
- **Screen:** Close unnecessary apps
- **Browser:** Zoom to 100% or 110%

---

## 🎤 INTRO (0:00 - 0:30)

### Visual
- Show landing page hoặc dashboard
- Smooth transition animations

### Script
```
Xin chào! Hôm nay tôi sẽ giới thiệu Gym Management System - 
một hệ thống quản lý phòng gym toàn diện với React Admin Dashboard, 
Flutter Mobile App, và Node.js Backend tích hợp Firebase.

Hệ thống demo này có hơn 1000 mock data records để showcase 
các tính năng hoàn chỉnh.

Bắt đầu thôi!
```

---

## 👥 PART 1: USER MANAGEMENT (0:30 - 2:30)

### Visual
Navigate to: `http://localhost:5173/admin/users`

### Script & Actions
```
📍 0:30 - 1:00
"Đây là trang quản lý thành viên với 50 users trong database."

[Action: Scroll through user list]
- Point out: Avatar, Name, Phone, Branch, Status
- Show active/inactive badges
```

```
📍 1:00 - 1:30
"Tính năng tìm kiếm real-time rất mạnh."

[Action: Demo search]
1. Type "Nguyễn" in search box
2. Results filter immediately
3. Clear search
4. Type phone number "032"
5. Show filtered results
```

```
📍 1:30 - 2:00
"Chúng ta có nhiều filter options."

[Action: Demo filters]
1. Click filter icon
2. Select branch: "Gym Hà Nội Center"
3. Select status: "active"
4. Apply filters
5. Show filtered list
```

```
📍 2:00 - 2:30
"Xem chi tiết profile của thành viên."

[Action: View user detail]
1. Click on a user
2. Show profile tab
3. Show packages tab
4. Show check-in history tab
5. Show payment history tab

"Tất cả thông tin được track đầy đủ."
```

---

## 💰 PART 2: PAYMENT SYSTEM (2:30 - 5:00)

### Visual
Navigate to: `http://localhost:5173/admin/payments`

### Script & Actions
```
📍 2:30 - 3:00
"Chúng ta có 100 payment orders để demo."

[Action: Show payment list]
- Scroll through orders
- Point out: PAID (green), PENDING (yellow), CANCELLED (red)
- Show amounts & dates
```

```
📍 3:00 - 3:30
"Filter theo status để xem các loại orders."

[Action: Filter payments]
1. Filter by PAID
2. Show paid orders
3. Filter by PENDING
4. Show pending orders
```

```
📍 3:30 - 4:00
"Tạo payment link mới với PayOS integration."

[Action: Create payment]
Navigate to: http://localhost:5173/demo-payment

1. Select user from dropdown
2. Select package "Gói Premium"
3. Click "Tạo Link Thanh Toán"
4. Wait for response
5. Show QR code
6. Show checkout URL

"PayOS sẽ generate QR code và link thanh toán tự động."
```

```
📍 4:00 - 4:30
"Xem chi tiết một order."

[Action: View order detail]
1. Click vào 1 PAID order
2. Show:
   - User information
   - Package details
   - Payment method
   - Transaction ID
   - Timestamp
3. Show metadata
```

```
📍 4:30 - 5:00
"Và đây là revenue analytics."

[Action: Show analytics]
Navigate to: http://localhost:5173/admin/financial/reports

- Show total revenue card
- Show revenue by month chart
- Show revenue by package pie chart

"Tất cả được tính tự động từ payment data."
```

---

## 🏋️ PART 3: PT MANAGEMENT (5:00 - 7:30)

### Visual
Navigate to: `http://localhost:5173/admin/employees?role=pt`

### Script & Actions
```
📍 5:00 - 5:30
"Đây là danh sách Personal Trainers."

[Action: Show PT list]
- Point out: Rating stars
- Total reviews count
- Specialization tags
- Experience years

"Mỗi PT có profile hoàn chỉnh với ratings và reviews."
```

```
📍 5:30 - 6:00
"Xem chi tiết profile của PT."

[Action: View PT profile]
1. Click vào PT có rating cao
2. Show personal info
3. Show certifications
4. Show specialization
5. Show statistics:
   - Total clients
   - Total sessions
   - Commission rate
   - Average rating
```

```
📍 6:00 - 6:30
"PT có 60 reviews từ users."

[Action: Scroll to reviews section]
1. Show review list
2. Point out: Rating stars, comments, timestamps
3. Filter by rating
4. Show rating distribution

"Review system giúp users chọn PT phù hợp."
```

```
📍 6:30 - 7:00
"Lịch tập của PT được quản lý qua calendar."

[Action: View PT schedule]
Navigate to: http://localhost:5173/admin/schedules

1. Select PT from dropdown
2. Show calendar view
3. Point out:
   - Scheduled sessions (blue)
   - Completed sessions (green)
   - Cancelled sessions (red)
4. Click vào session để xem detail
```

```
📍 7:00 - 7:30
"PT commission được tính tự động."

[Action: Show commission tracking]
Navigate to: http://localhost:5173/admin/financial/pt-commissions

- Show total earnings per PT
- Show sessions completed
- Show commission rate
- Show monthly breakdown

"Hệ thống tự động tính commission dựa vào sessions hoàn thành."
```

---

## 💸 PART 4: FINANCIAL MANAGEMENT (7:30 - 10:00)

### Visual
Navigate to: `http://localhost:5173/admin/financial`

### Script & Actions
```
📍 7:30 - 8:00
"Dashboard tài chính tổng quan."

[Action: Show overview]
- Point out KPI cards:
  - Total Revenue
  - Total Expenses
  - Net Profit
  - Profit Margin
- Show trend arrows (up/down)
```

```
📍 8:00 - 8:30
"Quản lý chi phí với 7 danh mục."

[Action: Navigate to expenses]
http://localhost:5173/admin/financial/expenses

1. Show expense list (50 items)
2. Show categories với icons:
   - 🏢 Tiền thuê
   - 💡 Điện nước
   - 🏋️ Thiết bị
   - 💰 Lương
   - 📱 Marketing
   - 🔧 Bảo trì
   - 🧴 Vật tư
```

```
📍 8:30 - 9:00
"Thêm expense mới rất đơn giản."

[Action: Create new expense]
1. Click "Add Expense"
2. Fill form:
   - Category: "Tiền điện nước"
   - Amount: "5,000,000"
   - Date: Select date
   - Description: "Tiền điện tháng 12"
3. Click Save
4. Show success message
5. Verify in list
```

```
📍 9:00 - 9:30
"Budget tracking giúp kiểm soát chi tiêu."

[Action: Show budget]
Navigate to: http://localhost:5173/admin/financial/budgets

1. Show budget per category
2. Point out:
   - Budget limit
   - Actual spent
   - Remaining
   - Progress bar
3. Highlight over-budget categories (red)
4. Highlight under-budget (green)
```

```
📍 9:30 - 10:00
"Financial reports tổng hợp."

[Action: Generate report]
Navigate to: http://localhost:5173/admin/financial/reports

1. Select period: "This Month"
2. Click "Generate Report"
3. Show:
   - Income statement
   - Expense breakdown chart
   - Revenue vs Expense comparison
   - Profit trend
4. Click "Export PDF" (optional)

"Reports có thể export để báo cáo lên cấp quản lý."
```

---

## 🏋️ PART 5: CHECK-IN SYSTEM (10:00 - 11:30)

### Visual
Navigate to: `http://localhost:5173/admin/checkins`

### Script & Actions
```
📍 10:00 - 10:30
"Check-in history với 500 records."

[Action: Show check-in list]
- Scroll through list
- Point out:
  - Member name
  - Check-in time
  - Location
  - Source (QR/manual)
```

```
📍 10:30 - 11:00
"Statistics phân tích behavior."

[Action: Show statistics]
1. Show total check-ins by day chart
2. Show peak hours chart
3. Show check-ins by branch
4. Show top active members
```

```
📍 11:00 - 11:30
"Manual check-in cho reception."

[Action: Demo manual check-in]
Navigate to: http://localhost:5173/admin/checkins/new

1. Search member: Type "Nguyễn Văn"
2. Select member from dropdown
3. Click "Check-in Now"
4. Show success notification
5. Verify in check-in list

"Reception có thể check-in thủ công khi cần."
```

---

## 📦 PART 6: PACKAGE MANAGEMENT (11:30 - 12:30)

### Visual
Navigate to: `http://localhost:5173/admin/packages`

### Script & Actions
```
📍 11:30 - 12:00
"Hệ thống có 5 packages đa dạng."

[Action: Show package list]
1. Show package cards
2. Point out:
   - 🥉 Gói Basic: 500K
   - 🥈 Gói Standard: 1.2M (Giảm 10%)
   - 🥇 Gói Premium: 2M (Giảm 15%)
   - 💪 PT 10 buổi: 3M
   - ⭐ PT 20 buổi: 5.5M (Giảm 8%)
```

```
📍 12:00 - 12:30
"Package details và analytics."

[Action: View package detail]
1. Click "Gói Premium"
2. Show:
   - Features list
   - Price & discount
   - Active subscriptions
   - Revenue generated
3. Show discount period

"Discounts có thể set theo thời gian để tạo promotions."
```

---

## 🔔 PART 7: NOTIFICATION SYSTEM (12:30 - 13:30)

### Visual
Navigate to: `http://localhost:5173/admin/notifications`

### Script & Actions
```
📍 12:30 - 13:00
"80 notifications trong hệ thống."

[Action: Show notification list]
- Show notification types:
  - 💰 Payment
  - 📄 Contract
  - 📅 Schedule
  - 🎉 Promotion
  - 🔔 System
- Point out read/unread status
```

```
📍 13:00 - 13:30
"Gửi notification mới."

[Action: Create notification]
1. Click "Create Notification"
2. Fill form:
   - Type: "Promotion"
   - Title: "Giảm giá 20%"
   - Message: "Khuyến mãi đặc biệt tháng 12"
   - Target: "All active users"
3. Click Send
4. Show success message

"Notification giúp engage users với promotions và reminders."
```

---

## 🎉 CONCLUSION (13:30 - 15:00)

### Visual
- Back to dashboard
- Show some charts animating

### Script
```
📍 13:30 - 14:00
"Vậy là chúng ta đã xem qua các tính năng chính:"

[Show bullet points on screen]
✅ User Management - 50 users
✅ Payment System - PayOS integration
✅ PT Management - Ratings & Reviews
✅ Financial System - Complete tracking
✅ Check-in System - QR + Manual
✅ Package Management - Flexible pricing
✅ Notification System - Real-time alerts
```

```
📍 14:00 - 14:30
"Hệ thống được build với tech stack hiện đại:"

[Show tech logos]
- React 18 + Vite
- Node.js + Express
- Firebase + Firestore
- Flutter Mobile
- PayOS Payment
```

```
📍 14:30 - 15:00
"Mock data system giúp demo dễ dàng."

"Với hơn 1000 mock records, bạn có thể:"
- Demo đầy đủ tính năng
- Test performance
- Training team
- Present cho clients

"Cảm ơn đã xem! Hãy check documentation để biết thêm chi tiết."

[Show on screen]
📚 MOCK_DATA_GUIDE.md
🎬 DEMO_SCENARIOS.md
📖 README.md

[Fade out with logo/outro]
```

---

## 🎨 POST-PRODUCTION

### Editing Checklist
- [ ] Add intro animation (0-5 sec)
- [ ] Add background music (subtle)
- [ ] Add text overlays for key points
- [ ] Add transitions between sections
- [ ] Add zoom effects for important details
- [ ] Speed up slow parts (loading, etc.)
- [ ] Add outro with links
- [ ] Color correction
- [ ] Audio normalization
- [ ] Remove mistakes/stutters

### Export Settings
- **Format:** MP4 (H.264)
- **Resolution:** 1920x1080
- **Frame Rate:** 30fps
- **Bitrate:** 8-10 Mbps
- **Audio:** AAC 128kbps

### Upload
- **YouTube:** Public/Unlisted
- **Title:** "Gym Management System - Full Demo"
- **Description:** Include:
  - Features list
  - Tech stack
  - GitHub link
  - Documentation links
  - Timestamps for each section
- **Tags:** gym management, react, firebase, nodejs, flutter
- **Thumbnail:** Professional design with logo

---

## 📝 VIDEO DESCRIPTION TEMPLATE

```markdown
# Gym Management System - Complete Demo

Full demonstration of a comprehensive Gym Management System built with modern tech stack.

⏱️ TIMESTAMPS:
0:00 - Introduction
0:30 - User Management
2:30 - Payment System & PayOS Integration
5:00 - PT Management & Reviews
7:30 - Financial Management
10:00 - Check-in System
11:30 - Package Management
12:30 - Notification System
13:30 - Conclusion

🚀 FEATURES:
✅ User Management with Search & Filter
✅ Payment System with PayOS Integration
✅ PT Management with Rating & Reviews
✅ Complete Financial Tracking
✅ QR Check-in System
✅ Flexible Package Management
✅ Real-time Notifications

💻 TECH STACK:
- Frontend: React 18 + Vite
- Backend: Node.js + Express
- Database: Firebase Firestore
- Mobile: Flutter
- Payment: PayOS
- Auth: Firebase Auth

📊 MOCK DATA:
- 50 Users
- 15 Employees
- 100 Payment Orders
- 500 Check-ins
- 60 PT Reviews
- And more...

📚 DOCUMENTATION:
- GitHub: [Your Repo Link]
- Setup Guide: MOCK_DATA_GUIDE.md
- Demo Scenarios: DEMO_SCENARIOS.md

🔗 LINKS:
- [GitHub Repository]
- [Live Demo]
- [Documentation]

#GymManagement #React #Firebase #NodeJS #Flutter #FullStackDevelopment
```

---

## 🎯 SUCCESS CRITERIA

Video demo thành công khi:
- ✅ Clear, easy to follow
- ✅ All features showcased
- ✅ No technical glitches shown
- ✅ Professional presentation
- ✅ Good audio quality
- ✅ Appropriate length (10-15 min)
- ✅ Includes timestamps
- ✅ Call to action at end

---

Good luck với video demo! 🎬🚀
