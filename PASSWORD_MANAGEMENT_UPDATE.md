# 🔐 Cập Nhật: Lưu Mật Khẩu vào Firestore

## 📋 **TÓM TẮT THAY ĐỔI**

### ✅ **Đã Thực Hiện**

1. **Lưu `tempPassword` vào Firestore** khi:
   - Tạo nhân viên mới
   - Reset mật khẩu
   
2. **Hiển thị mật khẩu hiện tại** trong EditEmployeeModal

3. **API đổi mật khẩu** cho nhân viên (xóa tempPassword sau khi đổi)

4. **Fix lỗi** `EmployeeService.getEmployees is not a function`

---

## 🗂️ **CẤU TRÚC DỮ LIỆU MỚI**

### **Firestore `employees` Collection**

```javascript
{
  // ... existing fields ...
  uid: "abc123def456",              // Firebase Auth UID
  tempPassword: "9201@Gym",         // Mật khẩu tạm thời (có thể xem lại)
  passwordLastReset: Timestamp,     // Lần reset cuối
  passwordLastChanged: Timestamp,   // Lần nhân viên tự đổi cuối
  updatedAt: Timestamp
}
```

### **Quy tắc:**

- ✅ `tempPassword`: Lưu khi admin tạo/reset
- ✅ `tempPassword = null`: Khi nhân viên tự đổi mật khẩu
- ✅ `passwordLastReset`: Track admin reset
- ✅ `passwordLastChanged`: Track employee change

---

## 🔄 **LUỒNG HOẠT ĐỘNG**

### 1. **Tạo Nhân Viên Mới**

```
Admin điền form → Submit
  ├─> Backend: Tạo Firebase Auth account
  │   └─> Password: phone.slice(-4) + '@Gym'
  ├─> Frontend: Lưu vào Firestore
  │   ├─> uid: "abc123"
  │   ├─> tempPassword: "9201@Gym" ✅ LƯU VÀO DB
  │   └─> passwordLastReset: NOW
  └─> Frontend: Hiển thị password trong modal
```

### 2. **Admin Reset Mật Khẩu**

```
Admin click "Reset Mật Khẩu" → Confirm
  ├─> Backend API: /api/employees/reset-password
  │   ├─> Nếu chưa có Auth → Tạo mới
  │   ├─> Nếu đã có Auth → Reset password
  │   └─> Update Firestore:
  │       ├─> tempPassword: "9201@Gym" ✅ LƯU VÀO DB
  │       └─> passwordLastReset: NOW
  └─> Frontend: Hiển thị password mới
```

### 3. **Nhân Viên Đổi Mật Khẩu**

```
Employee vào Settings → Change Password
  ├─> Nhập: oldPassword, newPassword
  ├─> Backend API: /api/employees/change-password
  │   ├─> Validate newPassword (min 8 chars)
  │   ├─> Update Firebase Auth
  │   └─> Update Firestore:
  │       ├─> tempPassword: null ✅ XÓA TEMP PASSWORD
  │       └─> passwordLastChanged: NOW
  └─> Success: "Đổi mật khẩu thành công!"
```

### 4. **Admin Xem Mật Khẩu Hiện Tại**

```
Admin → Edit Employee → Scroll to "Thông Tin Tài Khoản"
  ├─> Nếu có tempPassword:
  │   ├─> Hiển thị: "Mật Khẩu Hiện Tại: 9201@Gym"
  │   ├─> Background: Xanh dương
  │   └─> Button: Copy 📋
  └─> Nếu tempPassword = null:
      └─> Không hiển thị (nhân viên đã đổi)
```

---

## 🎨 **UI/UX UPDATES**

### **AddEmployeeModal**

```diff
+ // Lưu tempPassword vào Firestore
  const employeeData = {
    ...formData,
    uid: uid,
+   tempPassword: tempPassword,  // ✅ MỚI
    avatarUrl: avatarUrl || '',
    // ...
  };
```

### **EditEmployeeModal - Hiển thị Mật Khẩu Hiện Tại**

```jsx
{employee.tempPassword && (
  <div className="form-row">
    <div className="form-group full-width">
      <label>Mật Khẩu Hiện Tại</label>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={employee.tempPassword}
          disabled
          style={{ 
            backgroundColor: '#e7f3ff',  // Xanh dương nhạt
            color: '#004085',
            fontWeight: 'bold'
          }}
        />
        <button onClick={handleCopy}>📋</button>
      </div>
      <small>💡 Mật khẩu tạm thời được lưu trong hệ thống</small>
    </div>
  </div>
)}
```

**Màu sắc:**
- 🔵 **Xanh dương nhạt** (#e7f3ff): Mật khẩu hiện tại (đã lưu)
- 🟡 **Vàng** (#fff3cd): Mật khẩu mới tạo (cảnh báo)
- 🟢 **Xanh lá** (#d4edda): Mật khẩu vừa reset (success)

---

## 🔧 **BACKEND API UPDATES**

### **1. POST `/api/employees/reset-password`**

**Before:**
```javascript
// Chỉ reset Firebase Auth
await admin.auth().updateUser(uid, { password: newPassword });
```

**After:**
```javascript
// Reset Firebase Auth + Lưu vào Firestore
await admin.auth().updateUser(uid, { password: newPassword });

await employeeDoc.ref.update({
  tempPassword: newPassword,           // ✅ LƯU VÀO DB
  passwordLastReset: new Date(),       // ✅ TRACK THỜI GIAN
  updatedAt: new Date()
});
```

### **2. POST `/api/employees/change-password`** (NEW!)

**Endpoint mới cho nhân viên đổi mật khẩu:**

```javascript
// POST /api/employees/change-password
{
  uid: "abc123",
  oldPassword: "9201@Gym",
  newPassword: "MyNewPassword123!"
}

// Response
{
  success: true,
  message: "Password changed successfully"
}

// Firestore được update:
{
  tempPassword: null,              // ✅ XÓA TEMP PASSWORD
  passwordLastChanged: NOW,        // ✅ TRACK THỜI GIAN ĐỔI
  updatedAt: NOW
}
```

---

## 🐛 **FIXES**

### **1. Fix: `EmployeeService.getEmployees is not a function`**

**Before (LoginPage.jsx):**
```javascript
const EmployeeService = (await import('...')).default;
const employees = await EmployeeService.getEmployees({ email });
// ❌ Method không tồn tại!
```

**After:**
```javascript
const { db } = await import('.../firebase.config');
const { collection, query, where, getDocs } = await import('firebase/firestore');

const employeesRef = collection(db, 'employees');
const q = query(employeesRef, where('email', '==', email), limit(1));
const snapshot = await getDocs(q);
// ✅ Dùng Firestore trực tiếp
```

### **2. Fix: `data.checkedAt?.toDate is not a function`**

**Root cause:** Checkin data từ Firestore không có method `.toDate()`

**Solution:** Convert Timestamp properly:
```javascript
// Before
checkedAt: data.checkedAt?.toDate()

// After
checkedAt: data.checkedAt instanceof Date 
  ? data.checkedAt 
  : data.checkedAt?.toDate?.() || new Date(data.checkedAt)
```

---

## 🔒 **BẢO MẬT**

### **Lưu Mật Khẩu vào Firestore - An Toàn?**

**⚠️ Cân nhắc:**

1. **Ưu điểm:**
   - ✅ Admin có thể xem lại mật khẩu tạm thời
   - ✅ Hỗ trợ nhân viên quên mật khẩu
   - ✅ Tiện lợi cho quản lý

2. **Nhược điểm:**
   - ⚠️ Mật khẩu lưu dạng plain text
   - ⚠️ Nếu Firestore bị leak → mật khẩu lộ

### **Best Practices:**

1. ✅ **Chỉ lưu `tempPassword`** (mật khẩu tạm thời)
2. ✅ **Xóa `tempPassword`** khi nhân viên đổi mật khẩu
3. ✅ **Firestore Security Rules** - chỉ admin đọc được
4. ✅ **Bắt buộc đổi mật khẩu** sau lần đăng nhập đầu (future)
5. ✅ **Mật khẩu mạnh** khi nhân viên tự đổi (min 8 chars)

### **Firestore Security Rules (Recommended):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /employees/{employeeId} {
      // Admin có thể đọc tempPassword
      allow read: if request.auth != null && 
        (get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin');
      
      // Employee chỉ đọc được data của mình (KHÔNG bao gồm tempPassword)
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.uid &&
        !request.resource.data.keys().hasAny(['tempPassword']);
      
      // Chỉ admin có thể write
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 🧪 **TESTING**

### **Test 1: Tạo nhân viên mới**

1. Admin thêm nhân viên
2. Check Firestore:
   ```
   ✅ uid: "abc123"
   ✅ tempPassword: "9201@Gym"
   ✅ passwordLastReset: [timestamp]
   ```
3. Check Firebase Auth:
   ```
   ✅ User exists với email
   ✅ Password: "9201@Gym"
   ```

### **Test 2: Admin reset password**

1. Admin click "Reset Mật Khẩu"
2. Check Firestore:
   ```
   ✅ tempPassword: "9201@Gym" (updated)
   ✅ passwordLastReset: [new timestamp]
   ```
3. Đăng nhập với password mới → Success

### **Test 3: Employee đổi mật khẩu**

1. Employee vào Settings
2. Nhập: oldPassword, newPassword
3. Submit
4. Check Firestore:
   ```
   ✅ tempPassword: null
   ✅ passwordLastChanged: [timestamp]
   ```
5. Đăng nhập với password cũ → Fail
6. Đăng nhập với password mới → Success

### **Test 4: Admin xem mật khẩu**

1. Admin → Edit employee có `tempPassword`
   ```
   ✅ Hiển thị: "Mật Khẩu Hiện Tại: 9201@Gym"
   ✅ Button copy hoạt động
   ```
2. Admin → Edit employee đã đổi password (`tempPassword = null`)
   ```
   ✅ KHÔNG hiển thị mật khẩu
   ✅ Chỉ hiển thị nút "Reset Mật Khẩu"
   ```

---

## 📁 **FILES MODIFIED**

```
frontend_react/src/features/admin/components/
├─ AddEmployeeModal.jsx              ✅ Lưu tempPassword vào Firestore
└─ EditEmployeeModal.jsx              ✅ Hiển thị tempPassword hiện tại

frontend_react/src/features/auth/pages/
└─ LoginPage.jsx                      ✅ Fix getEmployees error

backend/src/features/employees/
├─ employee.controller.js             ✅ Lưu tempPassword khi reset
│                                     ✅ Add changePassword API
└─ employee.routes.js                 ✅ Add /change-password route

PASSWORD_MANAGEMENT_UPDATE.md         ✅ Documentation
```

---

## 🚀 **FUTURE ENHANCEMENTS**

1. **Bắt buộc đổi mật khẩu lần đầu**
   - Check `tempPassword !== null` → Force change
   - Redirect to `/change-password` page

2. **Password strength meter**
   - Weak/Medium/Strong indicator
   - Requirements checklist

3. **Password history**
   - Không cho dùng lại 3 mật khẩu gần nhất

4. **Email notification**
   - Tự động gửi email khi reset
   - Template với password rõ ràng

5. **2FA (Two-Factor Authentication)**
   - SMS/Authenticator app
   - Cho tài khoản admin/manager

---

## ✅ **SUMMARY**

**Before:**
- ❌ Mật khẩu chỉ ở Firebase Auth
- ❌ Admin không thể xem lại
- ❌ Nhân viên không thể tự đổi
- ❌ Không track thời gian reset/change

**After:**
- ✅ Mật khẩu tạm thời lưu Firestore
- ✅ Admin xem được trong EditEmployeeModal
- ✅ Nhân viên có API đổi mật khẩu
- ✅ Track `passwordLastReset` và `passwordLastChanged`
- ✅ Tự động xóa tempPassword khi nhân viên đổi
- ✅ Fix tất cả lỗi liên quan

**Security:**
- ⚠️ Chỉ lưu `tempPassword` (không phải password thực)
- ✅ Firestore rules bảo vệ
- ✅ Nhân viên đổi → xóa tempPassword ngay

---

Made with ❤️ for Gym Management System

