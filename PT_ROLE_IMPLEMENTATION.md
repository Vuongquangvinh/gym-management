# PT Role Implementation - Complete Guide

## Tổng quan

Dự án đã được mở rộng để tách PT (Personal Trainer) thành một role riêng biệt với giao diện và quyền truy cập độc lập.

## 🎯 Mục tiêu đã hoàn thành

✅ **PTLayout với sidebar và navigation riêng cho PT**  
✅ **Routes và ProtectedRoute cho PT role**  
✅ **PT Dashboard với thống kê cá nhân**  
✅ **Trang quản lý thông tin PT** (bio, certificates, specialties)  
✅ **Trang quản lý gói tập của PT** (tạo, sửa, xóa)  
✅ **Trang xem danh sách học viên đang train**  
✅ **Trang xem lịch làm việc**  
✅ **Cập nhật auth redirect** dựa vào role  
✅ **Backend middleware** kiểm tra role PT  
✅ **Firestore rules** để PT chỉ truy cập data của mình  

---

## 📁 Cấu trúc thư mục mới

```
frontend_react/src/features/pt/
├── PTLayout.jsx                # Layout chính cho PT portal
├── pt.css                      # Styles cho PT portal
├── components/
│   ├── PTSidebar.jsx          # Sidebar navigation cho PT
│   └── PTHeader.jsx           # Header với logout button
└── pages/
    ├── PTDashboard.jsx        # Dashboard với thống kê
    ├── PTProfile.jsx          # Quản lý thông tin cá nhân
    ├── PTPackages.jsx         # Quản lý gói tập
    ├── PTClients.jsx          # Danh sách học viên
    ├── PTSchedule.jsx         # Lịch làm việc
    └── PTSettings.jsx         # Cài đặt tài khoản
```

---

## 🔐 Phân quyền

### Role Definitions

| Role | Giao diện | Quyền truy cập |
|------|-----------|----------------|
| **admin** | `/admin/*` | Toàn bộ hệ thống, quản lý tất cả |
| **pt** | `/pt/*` | Thông tin cá nhân, gói tập, học viên của mình |
| **staff** | `/staff/*` | Check-in, xem lịch làm (chưa implement) |

### Login Flow

```javascript
// frontend_react/src/features/auth/pages/LoginPage.jsx

1. User đăng nhập bằng email/password
2. Hệ thống verify với Firebase Auth
3. Lấy thông tin employee từ Firestore
4. Check role/position:
   - role === 'pt' hoặc position === 'PT' → redirect to /pt
   - role === 'admin' hoặc position === 'Manager' → redirect to /admin
   - Khác → redirect to /admin (default)
```

---

## 🎨 PT Portal Features

### 1. Dashboard (`/pt`)
- Thống kê tổng học viên
- Số gói đang bán
- Doanh thu tháng này
- Đánh giá trung bình
- Quick actions: Cập nhật thông tin, Tạo gói tập

### 2. Thông tin của tôi (`/pt/profile`)
- **Giới thiệu bản thân** (bio)
- **Số năm kinh nghiệm**
- **Chuyên môn** (specialties): Tăng cơ, Giảm cân, Yoga, etc.
- **Chứng chỉ** (certificates): ACE, NASM, etc.
- **Thành tích** (achievements)
- **Mạng xã hội**: Facebook, Instagram, TikTok, YouTube
- **Cài đặt**: Số học viên tối đa/ngày, Nhận học viên mới

### 3. Gói tập của tôi (`/pt/packages`)
- **Grid view** các gói đã tạo
- **Tạo gói mới**:
  - Tên gói
  - Loại: Online/Offline, 1 người/2 người
  - Giá
  - Loại tính phí: Theo buổi / Theo tháng
  - Số buổi hoặc Số tháng
  - Mô tả
  - Lợi ích (benefits)
  - Gói phổ biến, Kích hoạt
- **Chỉnh sửa/Xóa** gói (với SweetAlert2)
- Hiển thị trạng thái: Đang hoạt động / Tạm dừng

### 4. Học viên của tôi (`/pt/clients`)
- Danh sách học viên đã đăng ký gói
- Thông tin: Tên, Gói tập, Buổi còn lại, Trạng thái
- (TODO: Tích hợp với `package_users` collection)

### 5. Lịch làm việc (`/pt/schedule`)
- Xem lịch làm việc
- Xem lịch tập với học viên
- (TODO: Tích hợp với `employee_shifts` collection)

### 6. Cài đặt (`/pt/settings`)
- Thông tin tài khoản
- Đổi mật khẩu
- Đăng xuất

---

## 🔧 Backend Middleware

File: `backend/src/shared/middleware/auth.js`

### Middleware Functions

#### 1. `verifyToken`
Verify Firebase Auth token từ request header.

```javascript
const { verifyToken } = require('../shared/middleware/auth');

router.get('/protected-route', verifyToken, (req, res) => {
  // req.user chứa decoded token
});
```

#### 2. `requireRole(allowedRoles)`
Check xem user có role được phép không.

```javascript
const { verifyToken, requireRole } = require('../shared/middleware/auth');

// Admin only
router.get('/admin/employees', 
  verifyToken, 
  requireRole(['admin']), 
  getEmployees
);

// Admin hoặc PT
router.get('/pt-packages', 
  verifyToken, 
  requireRole(['admin', 'pt']), 
  getPTPackages
);
```

#### 3. `requireOwnData(ptIdField)`
Check xem PT có đang truy cập data của chính mình không.

```javascript
const { verifyToken, requireRole, requireOwnData } = require('../shared/middleware/auth');

// PT chỉ có thể update profile của chính mình
router.put('/pt/:ptId/profile', 
  verifyToken, 
  requireRole(['pt']), 
  requireOwnData('ptId'),  // Check ptId param
  updatePTProfile
);
```

### Cách sử dụng

```javascript
// routes/pt.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireOwnData } = require('../shared/middleware/auth');
const PTController = require('../controllers/pt.controller');

// Get PT's own packages
router.get('/:ptId/packages', 
  verifyToken, 
  requireRole(['admin', 'pt']), 
  requireOwnData('ptId'),
  PTController.getPackages
);

// Create new package
router.post('/:ptId/packages', 
  verifyToken, 
  requireRole(['pt']), 
  requireOwnData('ptId'),
  PTController.createPackage
);

// Update PT profile
router.put('/:ptId/profile', 
  verifyToken, 
  requireRole(['pt']), 
  requireOwnData('ptId'),
  PTController.updateProfile
);

module.exports = router;
```

---

## 🔒 Firestore Security Rules

Xem chi tiết trong: `backend/FIRESTORE_PT_RULES.md`

### Nguyên tắc

1. **Admin**: Full access mọi collection
2. **PT**: 
   - Chỉ đọc/ghi `pt_packages` của chính mình
   - Chỉ cập nhật `ptInfo` trong `employees`
   - Không được thay đổi: `role`, `salary`, `position`, `status`
   - Chỉ đọc `employee_shifts` của chính mình
3. **Users**: Chỉ đọc packages active và data của chính mình

### Cách áp dụng

1. Mở Firebase Console → Firestore Database → Rules
2. Copy rules từ `backend/FIRESTORE_PT_RULES.md`
3. Publish
4. Test với Firebase Rules Playground

---

## 📊 Database Schema

### Collection: `employees`

```javascript
{
  _id: "ajED6ILMa6X46WNwhwaL",
  email: "pt@gym.com",
  fullName: "Thịnh Ok",
  role: "pt",           // 'admin' | 'pt' | 'staff'
  position: "PT",       // 'Manager' | 'PT' | 'Receptionist' | 'Trainer'
  avatarUrl: "/uploads/employees/avatars/...",
  phone: "0707319201",
  
  // PT-specific info
  ptInfo: {
    bio: "Huấn luyện viên chuyên về giảm cân...",
    specialties: ["Giảm cân", "Tăng cơ", "Yoga"],
    experience: 5,
    certificates: ["ACE Personal Trainer", "NASM-CPT"],
    achievements: ["Huấn luyện viên xuất sắc 2023"],
    languages: ["vi", "en"],
    socialMedia: {
      facebook: "https://facebook.com/...",
      instagram: "https://instagram.com/...",
      tiktok: "",
      youtube: ""
    },
    maxClientsPerDay: 8,
    isAcceptingNewClients: true,
    rating: 4.8,
    totalRatings: 25
  },
  
  // Common fields
  salary: 10000000,
  commissionRate: 15,
  shift: "fulltime",
  status: "active",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `pt_packages`

```javascript
{
  _id: "package_id",
  ptId: "ajED6ILMa6X46WNwhwaL",
  ptName: "Thịnh Ok",
  ptAvatarUrl: "/uploads/employees/avatars/...",
  
  name: "Gói giảm cân 1 tháng",
  type: "offline_single",  // 'online_single' | 'online_group' | 'offline_single' | 'offline_group'
  price: 500000,
  
  billingType: "session",  // 'session' | 'monthly'
  sessions: 8,             // Nếu billingType = 'session'
  months: 1,               // Nếu billingType = 'monthly'
  duration: 60,            // minutes per session
  
  description: "Gói tập giảm cân hiệu quả...",
  benefits: [
    "Tư vấn dinh dưỡng miễn phí",
    "Đo lường cơ thể định kỳ",
    "Hỗ trợ 24/7"
  ],
  
  isPopular: false,
  isActive: true,
  maxParticipants: 1,
  discountPercent: 0,
  validityDays: 90,
  
  availableTimeSlots: [
    {
      day: "monday",
      startTime: "08:00",
      endTime: "10:00",
      duration: 120,
      isChoosen: false
    }
  ],
  
  advanceBookingDays: 1,
  allowSameDayBooking: true,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `package_users` (TODO)

```javascript
{
  _id: "package_user_id",
  userId: "user_id",
  userName: "Nguyễn Văn A",
  userEmail: "user@gmail.com",
  userPhone: "0901234567",
  
  packageId: "package_id",
  packageName: "Gói giảm cân 1 tháng",
  ptId: "ajED6ILMa6X46WNwhwaL",
  ptName: "Thịnh Ok",
  
  status: "active",        // 'active' | 'paused' | 'completed' | 'expired'
  sessionsTotal: 8,
  sessionsUsed: 2,
  sessionsRemaining: 6,
  
  startDate: Timestamp,
  endDate: Timestamp,
  
  bookings: [
    {
      bookingId: "booking_id",
      date: Timestamp,
      timeSlot: "08:00-10:00",
      status: "completed"  // 'scheduled' | 'completed' | 'cancelled'
    }
  ],
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🧪 Testing

### Test Flow

1. **Tạo PT account**:
   ```javascript
   // Trong admin panel
   - Vào /admin/employees
   - Thêm nhân viên mới
   - Position: "PT"
   - Role: "pt"
   - Email: pt@gym.com
   - Password: (set via Firebase Auth)
   ```

2. **Login as PT**:
   ```
   - Đăng xuất khỏi admin
   - Login với pt@gym.com
   - Hệ thống sẽ redirect đến /pt
   ```

3. **Test các tính năng**:
   ```
   ✅ Dashboard hiển thị thống kê
   ✅ Cập nhật thông tin PT
   ✅ Tạo gói tập mới
   ✅ Chỉnh sửa gói tập
   ✅ Xóa gói tập
   ✅ View danh sách học viên (sau khi có data)
   ✅ Logout và redirect về login
   ```

4. **Test phân quyền**:
   ```javascript
   // PT không được access admin routes
   - Thử truy cập /admin → Should be blocked
   
   // PT không được access data của PT khác
   - Thử truy cập /pt/other_pt_id/packages → Should fail
   
   // PT không được thay đổi salary
   - Thử update salary trong Firestore → Should fail with rules
   ```

---

## 🚀 Deployment Checklist

### Frontend
- [ ] Build production: `npm run build`
- [ ] Test trên staging environment
- [ ] Check responsive trên mobile
- [ ] Verify all routes work

### Backend
- [ ] Deploy middleware to production
- [ ] Add PT routes to API
- [ ] Test with Postman/Thunder Client

### Firebase
- [ ] Apply Firestore security rules
- [ ] Test rules với Firebase Rules Playground
- [ ] Verify PT can only access own data
- [ ] Verify admin has full access

### Documentation
- [ ] Update API documentation
- [ ] Create user guide for PT
- [ ] Train team on new role system

---

## 🔮 Future Enhancements

### Phase 2 (Recommended)
1. **Package Users Integration**
   - PT xem danh sách học viên thực tế
   - Tracking buổi tập đã hoàn thành
   - Rating & Reviews từ học viên

2. **Schedule Management**
   - PT tự quản lý lịch làm việc
   - Booking system cho học viên
   - Calendar view với drag-and-drop

3. **Revenue Dashboard**
   - Thống kê doanh thu chi tiết
   - Commission tracking
   - Export reports

4. **Communication**
   - Chat với học viên
   - Push notifications
   - Email reminders

### Phase 3 (Advanced)
1. **Mobile App**
   - Flutter app cho PT
   - Checkin bằng QR code
   - Workout tracking

2. **Analytics**
   - Client progress tracking
   - Workout history
   - Body measurements

3. **Multi-gym Support**
   - Franchise management
   - Cross-gym PT services

---

## 📞 Support

Nếu có vấn đề hoặc câu hỏi:
1. Check `PT_ROLE_IMPLEMENTATION.md` (file này)
2. Check `backend/FIRESTORE_PT_RULES.md` cho security rules
3. Review code examples trong các component
4. Contact team lead

---

## 📝 Change Log

### Version 1.0.0 (2025-01-XX)
- ✅ Initial PT role implementation
- ✅ PT Layout và navigation
- ✅ PT Dashboard với basic stats
- ✅ PT Profile management
- ✅ PT Package management (CRUD)
- ✅ Login redirect based on role
- ✅ Backend middleware for role checking
- ✅ Firestore security rules documentation

---

**Tác giả**: Development Team  
**Ngày tạo**: 2025-01-XX  
**Version**: 1.0.0

