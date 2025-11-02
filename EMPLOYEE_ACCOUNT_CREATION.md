# Employee Account Creation - Implementation Guide

## Tổng quan

Hệ thống đã được nâng cấp để **tự động tạo tài khoản Firebase Authentication** khi admin thêm nhân viên mới (bao gồm PT). Nhân viên có thể đăng nhập ngay sau khi được tạo.

---

## 🎯 Tính năng mới

### 1. **Tự động tạo tài khoản đăng nhập**
- Khi admin thêm nhân viên → Hệ thống tự động tạo Firebase Auth account
- PT/Nhân viên có thể login ngay với email & password tạm thời
- Không cần cấu hình thêm từ admin

### 2. **Password tạm thời thông minh**
- **Công thức:** `4 số cuối SĐT + @Gym`
- **Ví dụ:** SĐT `0707319201` → Password: `9201@Gym`
- Dễ nhớ, dễ truyền đạt cho nhân viên

### 3. **Modal hiển thị thông tin**
- Sau khi tạo nhân viên thành công
- Modal popup hiển thị:
  - ✅ Email
  - ✅ Password tạm thời
  - ✅ Nút copy thông tin
  - ⚠️ Cảnh báo đổi password

---

## 🏗️ Kiến trúc

### Backend API

**File:** `backend/src/features/employees/employee.controller.js`

#### 1. **Create Account API**
```javascript
POST /api/employees/create-account

Request:
{
  "email": "pt@gym.com",
  "displayName": "Nguyễn Văn A",
  "phone": "0707319201"
}

Response:
{
  "success": true,
  "uid": "firebase_uid_here",
  "tempPassword": "9201@Gym",
  "message": "Account created successfully",
  "isExisting": false
}
```

**Logic:**
1. Validate input (email, phone format)
2. Generate temp password: `phone.slice(-4) + '@Gym'`
3. Check if user exists
4. Create Firebase Auth user
5. Return uid & tempPassword

#### 2. **Delete Account API**
```javascript
DELETE /api/employees/:uid/account

Response:
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Usage:** Khi admin xóa nhân viên, cũng xóa Firebase Auth account

#### 3. **Reset Password API**
```javascript
POST /api/employees/:uid/reset-password

Request:
{
  "phone": "0707319201"
}

Response:
{
  "success": true,
  "tempPassword": "9201@Gym",
  "message": "Password reset successfully"
}
```

**Usage:** Admin có thể reset password cho nhân viên quên mật khẩu

---

### Frontend Components

#### 1. **AddEmployeeModal.jsx**

**Updated Flow:**

```javascript
handleSubmit() {
  // 1. Upload avatar (if any)
  uploadAvatar();
  
  // 2. Call backend to create Firebase Auth account
  const authResult = await fetch('/api/employees/create-account', {
    method: 'POST',
    body: JSON.stringify({
      email, displayName, phone
    })
  });
  
  // 3. Get uid & tempPassword
  const { uid, tempPassword } = await authResult.json();
  
  // 4. Create employee record in Firestore
  const employeeData = {
    ...formData,
    uid: uid  // Link to Firebase Auth
  };
  await addEmployee(employeeData);
  
  // 5. Show password modal
  setAccountInfo({ email, tempPassword, fullName });
  setPasswordModalOpen(true);
}
```

**Key Changes:**
- Added `uid` field to employee data
- Call backend API before creating Firestore record
- Show PasswordDisplayModal after success

#### 2. **PasswordDisplayModal.jsx**

**Features:**
- 🎨 Beautiful UI with gradient & animations
- 📋 Copy button for quick sharing
- ⚠️ Warning box with important notes
- ✅ Success icon with scale animation

**Props:**
```javascript
<PasswordDisplayModal
  isOpen={boolean}
  onClose={function}
  accountInfo={{
    email: string,
    tempPassword: string,
    fullName: string
  }}
/>
```

---

## 📊 Database Schema Updates

### Collection: `employees`

**New field:**
```javascript
{
  _id: "employee_id",
  email: "pt@gym.com",
  fullName: "Nguyễn Văn A",
  uid: "firebase_auth_uid",  // ⭐ NEW - Link to Firebase Auth
  role: "pt",
  position: "PT",
  // ... other fields
}
```

**Purpose:** 
- Link Firestore employee record với Firebase Auth user
- Dùng để verify & authorize
- Có thể dùng để delete auth account khi xóa employee

---

## 🚀 Cách sử dụng

### Bước 1: Start Backend
```bash
cd backend
npm install
npm start
# Server chạy trên http://localhost:3000
```

### Bước 2: Start Frontend
```bash
cd frontend_react
npm install
npm run dev
# App chạy trên http://localhost:5173
```

### Bước 3: Test Flow

1. **Login as Admin**
   - Vào http://localhost:5173/login
   - Login với admin account

2. **Thêm nhân viên PT**
   - Vào `/admin/employees`
   - Click "Thêm nhân viên"
   - Điền form:
     ```
     Họ tên: Nguyễn Văn A
     Email: pt@gym.com
     SĐT: 0707319201
     Position: PT
     Role: pt
     ```
   - Click "Thêm nhân viên"

3. **Xem thông tin tài khoản**
   - Modal popup hiển thị:
     ```
     ✅ Tài khoản đã được tạo!
     
     Email: pt@gym.com
     Mật khẩu tạm thời: 9201@Gym
     
     ⚠️ Vui lòng gửi thông tin này cho nhân viên
     ```
   - Click "Copy thông tin"
   - Gửi cho nhân viên

4. **Test login PT**
   - Logout khỏi admin
   - Login với:
     ```
     Email: pt@gym.com
     Password: 9201@Gym
     ```
   - Hệ thống redirect đến `/pt/dashboard` ✅

---

## 🔒 Security

### Password Requirements

**Format:** `[4 digits]@Gym`

**Examples:**
- `0707319201` → `9201@Gym`
- `0901234567` → `4567@Gym`

**Firebase Auth Requirements Met:**
- ✅ Minimum 6 characters
- ✅ Contains uppercase
- ✅ Contains lowercase (implicit in `@Gym`)
- ✅ Contains special character (`@`)

### Best Practices

1. **Đổi password sau lần đăng nhập đầu tiên**
   - Admin nên nhắc nhân viên
   - Có thể implement force change password (future)

2. **Không lưu password trong Firestore**
   - Chỉ Firebase Auth lưu password (hashed)
   - Firestore chỉ lưu uid (reference)

3. **Validate email unique**
   - Backend check email exists trước khi tạo
   - Firestore check email duplicate

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] **POST /api/employees/create-account**
  ```bash
  curl -X POST http://localhost:3000/api/employees/create-account \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@gym.com",
      "displayName": "Test User",
      "phone": "0901234567"
    }'
  ```
  - ✅ Should return uid & tempPassword
  - ✅ Should create Firebase Auth user
  - ❌ Should fail with invalid email
  - ❌ Should fail with duplicate email

- [ ] **DELETE /api/employees/:uid/account**
  ```bash
  curl -X DELETE http://localhost:3000/api/employees/{uid}/account
  ```
  - ✅ Should delete Firebase Auth user
  - ❌ Should fail with invalid uid

- [ ] **POST /api/employees/:uid/reset-password**
  ```bash
  curl -X POST http://localhost:3000/api/employees/{uid}/reset-password \
    -H "Content-Type: application/json" \
    -d '{"phone": "0901234567"}'
  ```
  - ✅ Should return new tempPassword
  - ✅ Should update password in Firebase Auth

### Frontend Tests

- [ ] **Add Employee Flow**
  - ✅ Fill form and submit
  - ✅ Should show loading state
  - ✅ Should call backend API
  - ✅ Should create Firestore record with uid
  - ✅ Should show PasswordDisplayModal
  - ❌ Should show error if API fails

- [ ] **PasswordDisplayModal**
  - ✅ Should display email & password
  - ✅ Copy button should work
  - ✅ Should show warning message
  - ✅ Should close on button click
  - ✅ Should close on overlay click

- [ ] **Login Flow**
  - ✅ PT login with temp password
  - ✅ Should redirect to `/pt/dashboard`
  - ✅ Admin login should redirect to `/admin`
  - ❌ Invalid password should show error

### Integration Tests

- [ ] **End-to-End**
  1. Admin creates PT employee
  2. Check Firebase Auth Console → User exists
  3. Check Firestore → Employee has uid
  4. PT logs in with temp password
  5. PT sees dashboard
  6. PT changes password in settings
  7. PT logs out and logs in with new password

---

## 🐛 Troubleshooting

### Error: "Failed to create employee account"

**Possible causes:**
1. Backend not running
2. Firebase Admin SDK not configured
3. Invalid email format
4. Email already exists

**Solution:**
```bash
# Check backend logs
cd backend
npm start

# Check Firebase Admin SDK
# Ensure service account JSON is in config/
```

### Error: "Cannot read property 'uid' of undefined"

**Cause:** Backend API call failed

**Solution:**
```javascript
// AddEmployeeModal.jsx
// Check if authResult.success before using uid
if (!authResult.success) {
  throw new Error(authResult.error);
}
```

### Password modal không hiển thị

**Cause:** Modal state not updating

**Solution:**
```javascript
// AddEmployeeModal.jsx
// Use setTimeout to delay modal open
setTimeout(() => {
  setPasswordModalOpen(true);
}, 300);
```

### PT không login được

**Possible causes:**
1. Password nhập sai (phân biệt hoa thường)
2. Email chưa verified (không ảnh hưởng với custom auth)
3. Account bị disabled

**Solution:**
```javascript
// Check Firebase Auth Console
// User → Status → Enabled

// Check password format
// Must be exactly: [4 digits]@Gym
```

---

## 📝 Future Enhancements

### Phase 2
- [ ] **Force change password on first login**
- [ ] **Email verification** (send email with temp password)
- [ ] **Password complexity rules** (custom requirements)
- [ ] **Account expiry** (temp account for interns)
- [ ] **Multi-factor authentication** (for admin)

### Phase 3
- [ ] **Self-service password reset** (PT can reset via email)
- [ ] **Password history** (prevent reuse)
- [ ] **Login attempts tracking** (security)
- [ ] **Session management** (limit concurrent logins)

---

## 🎓 Learning Resources

### Firebase Admin SDK
- [Create Users](https://firebase.google.com/docs/auth/admin/manage-users#create_a_user)
- [Delete Users](https://firebase.google.com/docs/auth/admin/manage-users#delete_a_user)
- [Update Users](https://firebase.google.com/docs/auth/admin/manage-users#update_a_user)

### Best Practices
- [Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

## 📞 Support

Nếu gặp vấn đề:
1. Check logs: Backend console & Browser console
2. Verify Firebase Admin SDK config
3. Test API with Postman/Thunder Client
4. Check this document for troubleshooting

**Contact:** Development Team

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Author:** Development Team

