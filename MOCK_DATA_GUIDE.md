# 🎭 HƯỚNG DẪN SỬ DỤNG MOCK DATA SYSTEM

## 📋 Tổng Quan

Hệ thống Mock Data giúp bạn tạo dữ liệu demo toàn diện cho Gym Management System, bao gồm:
- 👥 **50 Users** (thành viên)
- 💼 **15 Employees** (nhân viên, PT, admin)
- 📦 **5 Packages** (gói tập gym và PT)
- 💰 **100 Payment Orders** (đơn hàng thanh toán)
- 📄 **80 Contracts** (hợp đồng)
- 🏋️ **500 Check-ins** (lượt check-in)
- 💸 **50 Expenses** (chi phí)
- 📂 **7 Expense Categories** (danh mục chi phí)
- ⭐ **60 PT Reviews** (đánh giá PT)
- 📅 **100 Schedules** (lịch tập PT)
- 🔔 **80 Notifications** (thông báo)
- 💳 **10 Spending Users** (tài khoản chưa kích hoạt)

---

## 🚀 CÁCH SỬ DỤNG

### 1️⃣ Tạo Mock Data (Lần Đầu)

```bash
cd backend
node scripts/seed-mock-data.js
```

**Kết quả:**
```
🎭 ===============================================
🎭 MOCK DATA GENERATOR - Gym Management System
🎭 ===============================================

📦 Generating mock data...

💾 Seeding data to Firestore...

📂 [1/11] Seeding expense_categories...
   ✅ Created 7 expense categories

📦 [2/11] Seeding packages...
   ✅ Created 5 packages

👥 [3/11] Seeding employees...
   ✅ Created 15 employees

...

✅ ===============================================
✅ SEEDING COMPLETED SUCCESSFULLY!
✅ ===============================================

📊 Summary:
   👥 Users: 50
   💼 Employees: 15
   📦 Packages: 5
   💰 Payment Orders: 100
   ...

🎉 Your database is now ready for demo!
```

---

### 2️⃣ Xóa Toàn Bộ Mock Data (Reset)

```bash
cd backend
node scripts/cleanup-mock-data.js
```

**Xác nhận:**
```
⚠️  WARNING: This will DELETE ALL DATA from the following collections:
   - users
   - spending_users
   - employees
   - packages
   - payment_orders
   - contracts
   - checkins
   - expenses
   - expense_categories
   - pt_reviews
   - schedules
   - notifications
   - auth_users

Are you absolutely sure? Type "DELETE ALL" to confirm: DELETE ALL
```

**Kết quả:**
```
🔥 Starting cleanup process...

🗑️  [1/13] Deleting users...
   ✅ Deleted 50 documents from users

🗑️  [2/13] Deleting spending_users...
   ✅ Deleted 10 documents from spending_users

...

✅ ===============================================
✅ CLEANUP COMPLETED!
✅ ===============================================

📊 Total documents deleted: 962

💡 You can now run seed-mock-data.js to generate fresh data.
```

---

## 📊 CHI TIẾT DỮ LIỆU MOCK

### 👥 Users (Thành viên)
- **50 users** với tên tiếng Việt thực tế
- Phân bổ đều nam/nữ
- Email, số điện thoại ngẫu nhiên
- Avatar từ DiceBear API
- Ngày sinh từ 1985-2005
- Phân bổ 3 chi nhánh: Hà Nội, TP.HCM, Đà Nẵng
- Trạng thái: active/inactive/expired
- Lịch sử check-in ngẫu nhiên

### 💼 Employees (Nhân viên)
- **15 employees** gồm:
  - Personal Trainers (PT)
  - Admin
  - Manager
  - Staff
- Thông tin đầy đủ: email, phone, địa chỉ
- PT có thêm:
  - Chuyên môn (Gym, Yoga, Boxing, etc.)
  - Chứng chỉ
  - Kinh nghiệm
  - Rating & Reviews
  - Tỷ lệ hoa hồng

### 📦 Packages (Gói tập)
**Gói Gym:**
1. **Gói Cơ Bản 1 Tháng** - 500,000 VNĐ
2. **Gói Tiêu Chuẩn 3 Tháng** - 1,200,000 VNĐ (Giảm 10%)
3. **Gói Premium 6 Tháng** - 2,000,000 VNĐ (Giảm 15%)

**Gói PT:**
4. **Gói PT 10 Buổi** - 3,000,000 VNĐ
5. **Gói PT 20 Buổi** - 5,500,000 VNĐ (Giảm 8%)

### 💰 Payment Orders (Đơn hàng)
- **100 orders** trong 90 ngày qua
- Trạng thái phân bổ:
  - 70% PAID
  - 20% PENDING
  - 10% CANCELLED
- Các phương thức thanh toán: PayOS, Cash, Transfer
- Liên kết với users và packages

### 📄 Contracts (Hợp đồng)
- **80 contracts** đã tạo
- Trạng thái: active/expired/completed dựa vào ngày hết hạn
- Liên kết với payment orders
- **PT Contracts** có thêm:
  - PT được assign (ptId, ptPackageId)
  - Commission info (rate, amount, paid status)
  - Weekly schedule (weeklySchedule map)
    - 7 days với timeSlotId, startTime, endTime
    - Flexible days (3-7 days per week)
  - Review status (isReviewed, reviewId)
  - Payment details (paymentOrderCode, paidAt)
- **Monthly Contracts**:
  - Basic package info
  - Payment status
  - No PT fields

### 🏋️ Check-ins
- **500 check-ins** trong 90 ngày qua
- Phân bổ theo chi nhánh
- Source: 75% QR code, 25% manual
- Search tokens để tìm kiếm

### 💸 Expenses (Chi phí)
- **50 expenses** trong 180 ngày qua
- 7 danh mục:
  - Tiền thuê mặt bằng (fixed)
  - Tiền điện nước (variable)
  - Thiết bị tập luyện (one-time)
  - Lương nhân viên (fixed)
  - Marketing (variable)
  - Bảo trì (variable)
  - Vật tư tiêu hao (variable)
- Trạng thái: paid/pending/overdue
- Phương thức: cash/transfer/card

### ⭐ PT Reviews
- **60 reviews** cho các PT
- Rating từ 3-5 sao
- Comment phù hợp với rating
- Liên kết user và PT

### 📅 Schedules (Lịch PT)
- **100 schedules** từ -30 đến +30 ngày
- Khung giờ từ 6h-21h
- Trạng thái: scheduled/completed/cancelled/no-show
- Phân bổ theo chi nhánh

### 🔔 Notifications
- **80 notifications** trong 60 ngày qua
- Loại: payment, contract, schedule, promotion, system
- 60% đã đọc, 40% chưa đọc

---

## 🎯 SCENARIOS DEMO

### Scenario 1: Demo Quản Lý Thành Viên
```bash
# 1. Seed data
node scripts/seed-mock-data.js

# 2. Vào React Admin
# - Xem danh sách 50 users
# - Filter theo chi nhánh
# - Search theo tên, phone
# - Xem chi tiết profile, lịch sử check-in
```

### Scenario 2: Demo Hệ Thống Thanh Toán
```bash
# 1. Có sẵn 100 payment orders
# 2. Vào trang Payment History
# - Xem orders PAID/PENDING/CANCELLED
# - Filter theo thời gian
# - Xem chi tiết order
# - Xem thống kê doanh thu
```

### Scenario 3: Demo Quản Lý PT
```bash
# 1. Có 15 employees, trong đó có PT
# 2. Vào trang PT Management
# - Xem danh sách PT với rating
# - Xem reviews của mỗi PT
# - Xem lịch tập của PT
# - Assign PT cho user mới
```

### Scenario 4: Demo Quản Lý Tài Chính
```bash
# 1. Có 50 expenses, 7 categories
# 2. Vào Financial Management
# - Xem tổng thu/chi theo tháng
# - Xem breakdown theo danh mục
# - So sánh budget vs actual
# - Xem expenses pending/overdue
```

### Scenario 5: Demo Check-in System
```bash
# 1. Có 500 check-ins
# 2. Vào Check-in History
# - Xem lịch sử check-in
# - Filter theo ngày, chi nhánh
# - Xem biểu đồ check-in theo giờ
# - Export báo cáo
```

---

## 🔄 WORKFLOW HOÀN CHỈNH

### Setup Lần Đầu
```bash
# 1. Clone repo
git clone <repo-url>

# 2. Setup backend
cd backend
npm install

# 3. Tạo mock data
node scripts/seed-mock-data.js

# 4. Start backend
npm start

# 5. Setup frontend
cd ../frontend_react
npm install
npm run dev
```

### Reset & Regenerate
```bash
# 1. Xóa data cũ
cd backend
node scripts/cleanup-mock-data.js
# Type: DELETE ALL

# 2. Tạo data mới
node scripts/seed-mock-data.js

# 3. Refresh frontend
# Reload browser
```

### Update Partial Data
```bash
# Nếu chỉ muốn thêm data, không xóa:
# 1. Edit seed-mock-data.js
# 2. Comment out các collection không cần seed lại
# 3. Run script
node scripts/seed-mock-data.js
```

---

## 📱 DEMO TRÊN CÁC NỀN TẢNG

### 1. React Admin Dashboard
**Features để demo:**
- ✅ User Management (CRUD, search, filter)
- ✅ Package Management
- ✅ Payment History với charts
- ✅ Employee Management với PT ratings
- ✅ Check-in Statistics
- ✅ Financial Reports
- ✅ Notifications

### 2. Flutter Mobile App
**Features để demo:**
- ✅ User Profile với avatar
- ✅ Active packages & expiry
- ✅ Check-in history
- ✅ PT Booking với calendar
- ✅ Payment history
- ✅ Notifications
- ✅ PT Reviews

### 3. Backend API
**Endpoints để demo:**
- `GET /api/users` - List users với pagination
- `GET /api/employees` - List employees
- `GET /api/payment-orders` - Payment history
- `GET /api/checkins/stats` - Check-in statistics
- `POST /api/payos/create-payment-link` - Tạo link thanh toán
- `GET /api/financial/reports` - Financial reports

---

## ⚙️ CUSTOMIZATION

### Thay Đổi Số Lượng Data

Edit `seed-mock-data.js`:

```javascript
// Dòng ~700
const users = MockDataGenerator.generateUsers(50);  // Thay 50 = số lượng bạn muốn
const employees = MockDataGenerator.generateEmployees(15);  // Thay 15
const paymentOrders = MockDataGenerator.generatePaymentOrders(users, packages, 100);  // Thay 100
// ...
```

### Thêm Tên Mới

Edit phần SAMPLE_NAMES:

```javascript
const SAMPLE_NAMES = {
  male: [
    'Nguyễn Văn An',
    'Tên Mới Của Bạn',  // Thêm tên mới
    // ...
  ],
  female: [
    'Nguyễn Thị Lan',
    'Tên Mới Của Bạn',  // Thêm tên mới
    // ...
  ]
};
```

### Thêm Chi Nhánh Mới

```javascript
const GYMS = [
  { id: 'gym_hn_center', name: 'Gym Hà Nội Center', city: 'Hà Nội' },
  { id: 'gym_cantho', name: 'Gym Cần Thơ', city: 'Cần Thơ' },  // Thêm mới
  // ...
];
```

### Thêm Package Mới

Thêm vào hàm `generatePackages()`:

```javascript
{
  PackageId: 'PKG_NEW',
  PackageName: 'Gói Mới',
  PackageType: 'monthly',
  Duration: 30,
  Price: 800000,
  // ...
}
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Firebase Admin not initialized"
```bash
# Kiểm tra file service account
ls backend/gym-managment-aa0a1-firebase-adminsdk-fbsvc-1138eee267.json

# Nếu không có, download từ Firebase Console
```

### Lỗi: "Permission denied"
```bash
# Deploy Firestore rules
cd backend
firebase deploy --only firestore:rules
```

### Lỗi: "Collection already exists"
```bash
# Cleanup trước khi seed
node scripts/cleanup-mock-data.js
# Type: DELETE ALL

# Sau đó seed lại
node scripts/seed-mock-data.js
```

### Script chạy chậm
```bash
# Giảm số lượng documents
# Edit seed-mock-data.js, giảm số lượng:
const users = MockDataGenerator.generateUsers(20);  // Từ 50 -> 20
const checkins = MockDataGenerator.generateCheckins(users, 200);  // Từ 500 -> 200
```

---

## 📈 TỐI ƯU HÓA

### Batch Processing
Script đã sử dụng batch processing để tối ưu:
- Mỗi collection được seed độc lập
- Sử dụng `serverTimestamp()` để giảm kích thước request
- Progress tracking để biết tiến độ

### Firestore Indexes
Với lượng data lớn, có thể cần tạo indexes:

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

### Testing với Subset
Để test nhanh, tạo version nhỏ:

```bash
# Tạo seed-mock-data-small.js
cp scripts/seed-mock-data.js scripts/seed-mock-data-small.js

# Edit và giảm số lượng về 1/10
# Rồi chạy
node scripts/seed-mock-data-small.js
```

---

## 🎓 BEST PRACTICES

### 1. Backup trước khi cleanup
```bash
# Export data trước khi xóa (optional)
# Sử dụng Firebase Console > Firestore > Export
```

### 2. Test trên môi trường dev
```bash
# Đừng chạy cleanup trên production!
# Kiểm tra PROJECT_ID trước
```

### 3. Seed theo thứ tự
```bash
# Đúng thứ tự dependencies:
# 1. expense_categories (không phụ thuộc)
# 2. packages (không phụ thuộc)
# 3. employees (không phụ thuộc)
# 4. users (không phụ thuộc)
# 5. payment_orders (cần users, packages)
# 6. contracts (cần users, packages, employees)
# 7. checkins (cần users)
# ... etc
```

### 4. Validate data sau khi seed
```bash
# Vào Firebase Console > Firestore
# Kiểm tra số lượng documents
# Spot check vài documents xem format đúng không
```

---

## 🎉 KẾT LUẬN

Mock Data System giúp bạn:
- ✅ Demo hệ thống một cách chuyên nghiệp
- ✅ Test các tính năng với dữ liệu thực tế
- ✅ Training cho team
- ✅ Development & QA testing
- ✅ Presentation cho khách hàng

**Lưu ý:** Dữ liệu mock chỉ dùng cho development/testing. Không sử dụng trên production!

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra Firebase Console
2. Xem logs trong terminal
3. Check Firestore rules
4. Verify service account key
5. Check network connection

Chúc bạn demo thành công! 🎊
