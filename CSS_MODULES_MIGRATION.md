# CSS Modules Migration Plan

## 📋 Tổng Quan
- **Tổng modules:** 29 modules
- **Tổng files CSS:** 57+ files  
- **Tổng files JSX cần sửa:** 62+ files
- **Mục đích:** Chuyển đổi từ global CSS sang CSS Modules để tránh xung đột và tối ưu performance

---

## 🌐 GLOBAL & CORE (KHÔNG chuyển đổi)

### ✋ Module 1: App Root & Global
**Status:** ⏸️ SKIP - Giữ nguyên global styles
- [ ] `src/App.css` - Global reset và base styles
- [ ] `src/App.jsx` - Import global CSS

**Lý do:** CSS reset và global styles cần áp dụng toàn bộ app

---

### ✋ Module 2: Theme & Colors  
**Status:** ⏸️ SKIP - Giữ nguyên CSS variables
- [ ] `src/shared/theme/colors.css` - CSS variables (--color-primary, etc.)

**Lý do:** CSS variables cần global scope để sử dụng trong toàn bộ app

---

## 🔧 SHARED COMPONENTS (Ưu tiên cao)

### ✅ Module 3: Shared Layout Components
**Status:** ⏳ TODO - Ưu tiên 1
- [ ] `src/shared/components/Layout/Header.jsx`
- [ ] `src/shared/components/Layout/header.css` → `header.module.css`
- [ ] `src/shared/components/Layout/Sidebar.jsx` (dùng admin.css)

**Files cần sửa:**
1. Đổi tên: `header.css` → `header.module.css`
2. Update import trong `Header.jsx`: `import styles from './header.module.css'`
3. Thay tất cả `className="..."` → `className={styles....}`

---

### ✅ Module 4: Shared Notification
**Status:** ⏳ TODO - Ưu tiên 2
- [ ] `src/shared/components/Notification/NotificationBell.jsx`
- [ ] `src/shared/components/Notification/NotificationBell.css` → `NotificationBell.module.css`
- [ ] `src/shared/components/Notification/NotificationList.jsx`
- [ ] `src/shared/components/Notification/NotificationList.css` → `NotificationList.module.css`

**Files cần sửa:**
1. Đổi tên 2 CSS files → `.module.css`
2. Update imports trong 2 JSX files
3. Thay tất cả className thành CSS Modules syntax

---

### ✅ Module 5: Shared Image Components  
**Status:** ⏳ TODO - Ưu tiên 3
- [ ] `src/shared/components/ImageUpload/ImageUpload.jsx`
- [ ] `src/shared/components/ImageUpload/ImageUpload.css` → `ImageUpload.module.css`
- [ ] `src/shared/components/ImageModal.jsx`
- [ ] `src/shared/components/ImageModal.css` → `ImageModal.module.css`

---

## 👨‍💼 ADMIN FEATURES

### ✅ Module 6: Admin Layout
**Status:** ⏳ TODO - Ưu tiên 4 (FILE LỚN NHẤT - 238 lines)
- [ ] `src/features/admin/AdminLayout.jsx`
- [ ] `src/features/admin/admin.css` → `admin.module.css`
- [ ] `src/shared/components/Layout/Sidebar.jsx` (cũng dùng admin.css)

**Lưu ý:** File CSS rất lớn, có nhiều classes phức tạp
- `.admin-root`, `.admin-sidebar`, `.side-brand`, `.side-nav`, `.admin-main`
- Navigation dropdown styles
- Responsive styles

---

### ✅ Module 7: Admin Members Page
**Status:** ⏳ TODO
- [ ] `src/features/admin/components/DataTableMember.jsx`
- [ ] `src/features/admin/components/DataTableMember.css` → `.module.css`
- [ ] `src/features/admin/components/DetailMember.jsx`
- [ ] `src/features/admin/components/DetailMember.css` → `.module.css`
- [ ] `src/features/admin/components/AddNewUser.jsx`
- [ ] `src/features/admin/components/AddNewuser.css` → `AddNewUser.module.css`

**Lưu ý:** File CSS có tên không nhất quán (AddNewuser.css vs AddNewUser.jsx)

---

### ✅ Module 8: Admin Checkins Page (NHIỀU COMPONENTS NHẤT)
**Status:** ⏳ TODO
- [ ] `src/features/admin/pages/Checkins.jsx`
- [ ] `src/features/admin/pages/checkins.css` → `Checkins.module.css`
- [ ] `src/features/admin/pages/CheckinsModal.jsx`
- [ ] `src/features/admin/pages/CheckinsModal.css` → `.module.css`
- [ ] `src/features/admin/components/AddCheckinModal.jsx`
- [ ] `src/features/admin/components/AddCheckinModal.css` → `.module.css`
- [ ] `src/features/admin/components/EditCheckinModal.jsx`
- [ ] `src/features/admin/components/EditCheckinModal.css` → `.module.css`
- [ ] `src/features/admin/components/FaceCheckinModal.jsx`
- [ ] `src/features/admin/components/FaceCheckinModal.css` → `.module.css`
- [ ] `src/features/admin/components/QuickCheckinModal.jsx`
- [ ] `src/features/admin/components/QuickCheckinModal.css` → `.module.css`
- [ ] `src/features/admin/components/DataTableCheckin.jsx`
- [ ] `src/features/admin/components/DataTableCheckin.css` → `.module.css`

**Lưu ý:** 7 components - cần cẩn thận với modal overlays

---

### ✅ Module 9: Admin Checkin Stats
**Status:** ⏳ TODO
- [ ] `src/features/admin/components/CheckinDashboard.jsx`
- [ ] `src/features/admin/components/CheckinDashboard.css` → `.module.css`
- [ ] `src/features/admin/components/CheckinStatsDashboard.jsx`
- [ ] `src/features/admin/components/CheckinStatsDashboard.css` → `.module.css`
- [ ] `src/features/admin/components/StatCard.jsx`
- [ ] `src/features/admin/components/StatCard.css` → `.module.css`

---

### ✅ Module 10: Admin Employees Page
**Status:** ⏳ TODO
- [ ] `src/features/admin/pages/Employees.jsx`
- [ ] `src/features/admin/pages/Employees.css` → `.module.css`
- [ ] `src/features/admin/components/AddEmployeeModal.jsx`
- [ ] `src/features/admin/components/AddEmployeeModal.css` → `.module.css`
- [ ] `src/features/admin/components/EditEmployeeModal.jsx` (dùng AddEmployeeModal.css)

**Lưu ý:** EditEmployeeModal dùng chung CSS với AddEmployeeModal

---

### ✅ Module 11: Admin Schedule Page
**Status:** ⏳ TODO
- [ ] `src/features/admin/pages/SchedulePage.jsx`
- [ ] `src/features/admin/pages/SchedulePage.css` → `.module.css`
- [ ] `src/features/admin/components/ScheduleModal.jsx`
- [ ] `src/features/admin/components/ScheduleModal.css` → `.module.css`
- [ ] `src/features/admin/components/WeeklyDatePicker.jsx`
- [ ] `src/features/admin/components/WeeklyDatePicker.css` → `.module.css`
- [ ] `src/features/admin/components/WeeklyScheduleTable.jsx`
- [ ] `src/features/admin/components/WeeklyScheduleTable.css` → `.module.css`

---

### ✅ Module 12: Admin Face Recognition
**Status:** ⏳ TODO
- [ ] `src/features/admin/pages/FaceCheckinPage.jsx`
- [ ] `src/features/admin/pages/FaceCheckinPage.css` → `.module.css`
- [ ] `src/features/admin/components/FaceRegistrationModal.jsx`
- [ ] `src/features/admin/components/FaceRegistrationModal.css` → `.module.css`

---

### ✅ Module 13: Admin PT Management
**Status:** ⏳ TODO
- [ ] `src/features/admin/components/pt/PTPricingPage.jsx`
- [ ] `src/features/admin/components/pt/PTPricingPage.css` → `.module.css`
- [ ] `src/features/admin/components/pt/PTPricingModal.jsx`
- [ ] `src/features/admin/components/pt/PTPricingModal.css` → `.module.css`
- [ ] `src/features/admin/components/pt/PTInfoModal.jsx`
- [ ] `src/features/admin/components/pt/PTInfoModal.css` → `.module.css`
- [ ] `src/features/admin/components/pt/TimeSlotManager.jsx`
- [ ] `src/features/admin/components/pt/TimeSlotManager.css` → `.module.css`

---

### ✅ Module 14: Admin Pending Requests
**Status:** ⏳ TODO
- [ ] `src/features/admin/pages/PendingRequests.jsx`
- [ ] `src/features/admin/pages/PendingRequests.css` → `.module.css`

---

### ✅ Module 15: Admin Password Management
**Status:** ⏳ TODO
- [ ] `src/features/admin/components/PasswordDisplayModal.jsx`
- [ ] `src/features/admin/components/PasswordDisplayModal.css` → `.module.css`

---

## 🏋️ PT FEATURES

### ✅ Module 16: PT Layout
**Status:** ⏳ TODO
- [ ] `src/features/pt/PTLayout.jsx`
- [ ] `src/features/pt/pt.css` → `pt.module.css`

---

### ✅ Module 17: PT Dashboard
**Status:** ⏳ TODO
- [ ] `src/features/pt/pages/PTDashboard.jsx` (dùng pt.css)

**Lưu ý:** Dùng chung pt.css với PTLayout

---

### ✅ Module 18: PT Clients Page
**Status:** ⏳ TODO
- [ ] `src/features/pt/pages/PTClients.jsx`
- [ ] `src/features/pt/pages/PTClients.css` → `.module.css`
- [ ] `src/features/pt/components/ClientDetailModal.jsx`
- [ ] `src/features/pt/components/ClientDetailModal.css` → `.module.css`
- [ ] `src/features/pt/components/MemberScheduleModal.jsx`
- [ ] `src/features/pt/components/MemberScheduleModal.css` → `.module.css`

---

### ✅ Module 19: PT Schedule Page
**Status:** ⏳ TODO
- [ ] `src/features/pt/pages/PTSchedule.jsx`
- [ ] `src/features/pt/pages/PTSchedule.css` → `.module.css`

---

### ✅ Module 20: PT Chat
**Status:** ⏳ TODO
- [ ] `src/features/pt/components/PTChat.jsx`
- [ ] `src/features/pt/components/PTChat.css` → `.module.css`

---

### ✅ Module 21: PT Face Features
**Status:** ⏳ TODO
- [ ] `src/features/pt/components/PTFaceRegistrationModal.jsx`
- [ ] `src/features/pt/components/PTFaceRegistrationModal.css` → `.module.css`
- [ ] `src/features/pt/components/PTFaceCheckinModal.jsx`
- [ ] `src/features/pt/components/PTFaceCheckinModal.css` → `.module.css`

---

### ✅ Module 22: PT Checkin Stats
**Status:** ⏳ TODO
- [ ] `src/features/pt/components/PTCheckinStats.jsx`
- [ ] `src/features/pt/components/PTCheckinStats.css` → `.module.css`

---

## 🔐 AUTH PAGES

### ✅ Module 23: Authentication (4 files dùng chung 1 CSS)
**Status:** ⏳ TODO
- [ ] `src/features/auth/pages/LoginPage.jsx`
- [ ] `src/features/auth/pages/ForgotPassword.jsx`
- [ ] `src/features/auth/pages/ChangePasswordPage.jsx`
- [ ] `src/features/auth/pages/ResetPasswordPageTest.jsx`
- [ ] `src/features/auth/pages/login.css` → `login.module.css`

**Lưu ý:** 4 files JSX dùng chung 1 file CSS - cần update import ở cả 4 files

---

## 💰 BUSINESS FEATURES

### ✅ Module 24: Packages Management
**Status:** ⏳ TODO
- [ ] `src/features/packages/components/packageTable/packageTable.jsx`
- [ ] `src/features/packages/components/packageTable/packageTable.css` → `.module.css`
- [ ] `src/features/packages/components/detailPackage/detailPackage.jsx`
- [ ] `src/features/packages/components/detailPackage/DetailPackage.css` → `detailPackage.module.css`
- [ ] `src/features/packages/components/addNewPackage/addNewPackage.jsx`
- [ ] `src/features/packages/components/addNewPackage/addNewPackage.css` → `.module.css`
- [ ] `src/features/packages/components/changePackageInformation/changePackageInformation.jsx`
- [ ] `src/features/packages/components/changePackageInformation/changePackageInformation.css` → `.module.css`

**Lưu ý:** File names không consistent (DetailPackage.css vs detailPackage.jsx)

---

### ✅ Module 25: Payment Features
**Status:** ⏳ TODO
- [ ] `src/features/payment/revenueChart/revenueChart.jsx`
- [ ] `src/features/payment/revenueChart/revenueChart.css` → `.module.css`
- [ ] `src/features/payment/topUsers/topUsers.jsx`
- [ ] `src/features/payment/topUsers/topUsers.css` → `.module.css`
- [ ] `src/features/payment/paymentHistory/paymentHistory.jsx`
- [ ] `src/features/payment/paymentHistory/paymentHistory.css` → `.module.css`

---

### ✅ Module 26: Gym Package Payment
**Status:** ⏳ TODO
- [ ] `src/components/GymPackagePayment.jsx`
- [ ] `src/components/GymPackagePayment.css` → `.module.css`

---

### ✅ Module 27: Financial Pages
**Status:** ⏳ TODO
- [ ] `src/pages/financial/FinancialDashboard.jsx`
- [ ] `src/pages/financial/FinancialDashboard.css` → `.module.css`
- [ ] `src/pages/expenses/OperatingExpenses.jsx`
- [ ] `src/pages/expenses/OperatingExpenses.css` → `.module.css`

---

### ✅ Module 28: Payroll Pages
**Status:** ⏳ TODO
- [ ] `src/pages/payroll/PayrollManagement.jsx`
- [ ] `src/pages/payroll/PayrollManagement.css` → `.module.css`

---

### ✅ Module 29: Salary Pages
**Status:** ⏳ TODO
- [ ] `src/pages/salary/SalaryConfigManagement.jsx`
- [ ] `src/pages/salary/SalaryConfigManagement.css` → `.module.css`

---

## 🎯 THỨ TỰ ƯU TIÊN THỰC HIỆN

### **Phase 1: Core UI (Mức độ: CRITICAL)**
1. ✅ Module 3: Layout (Header, Sidebar)
2. ✅ Module 4: Notification  
3. ✅ Module 5: Image Components
4. ✅ Module 6: Admin Layout (file lớn nhất)

### **Phase 2: Admin Features (Mức độ: HIGH)**
5. ✅ Module 7: Members
6. ✅ Module 8: Checkins (nhiều components)
7. ✅ Module 9: Checkin Stats
8. ✅ Module 10: Employees
9. ✅ Module 11: Schedule
10. ✅ Module 12: Face Recognition
11. ✅ Module 13: PT Management
12. ✅ Module 14: Pending Requests
13. ✅ Module 15: Password Management

### **Phase 3: PT Features (Mức độ: MEDIUM)**
14. ✅ Module 16-17: PT Layout & Dashboard
15. ✅ Module 18-22: PT Pages & Components

### **Phase 4: Business Features (Mức độ: LOW)**
16. ✅ Module 23: Auth
17. ✅ Module 24-29: Packages, Payment, Financial, Payroll, Salary

---

## 📝 QUY TRÌNH CHUYỂN ĐỔI CHO MỖI MODULE

### Bước 1: Đổi tên file CSS
```bash
# Ví dụ
mv header.css header.module.css
```

### Bước 2: Update import trong JSX
```jsx
// TRƯỚC
import './header.css';

// SAU
import styles from './header.module.css';
```

### Bước 3: Thay đổi className
```jsx
// TRƯỚC
<div className="header-container">
  <button className="header-button primary">Click</button>
</div>

// SAU
<div className={styles.headerContainer}>
  <button className={`${styles.headerButton} ${styles.primary}`}>Click</button>
</div>
```

### Bước 4: Test
- Kiểm tra UI hiển thị đúng
- Kiểm tra không có CSS bị mất
- Kiểm tra không có warning trong console

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **CSS Variables** - Vẫn có thể dùng trong CSS Modules:
   ```css
   .button {
     background: var(--color-primary);
   }
   ```

2. **Global classes** - Dùng `:global()` nếu cần:
   ```css
   :global(.modal-overlay) {
     position: fixed;
   }
   ```

3. **Kebab-case → camelCase**:
   - `.header-container` → `styles.headerContainer`
   - `.btn-primary` → `styles.btnPrimary`

4. **Multiple classes**:
   ```jsx
   className={`${styles.button} ${styles.primary} ${styles.large}`}
   ```

5. **Conditional classes**:
   ```jsx
   className={`${styles.button} ${isActive ? styles.active : ''}`}
   ```

---

## 📊 TIẾN ĐỘ TỔNG THỂ

- [ ] Phase 1: Core UI (0/4)
- [ ] Phase 2: Admin Features (0/9)
- [ ] Phase 3: PT Features (0/7)
- [ ] Phase 4: Business Features (0/7)

**Tổng:** 0/27 modules hoàn thành

---

## 🔄 NEXT STEPS

Khi bắt đầu, sẽ làm theo thứ tự:
1. Module 3 → Layout
2. Module 4 → Notification
3. Module 5 → Image Components
4. Module 6 → Admin Layout (quan trọng nhất)
5. Tiếp tục các module theo thứ tự ưu tiên...
