# Hướng dẫn đăng nhập PT

## 🎯 Tổng quan

PT (Personal Trainer) có thể đăng nhập vào mobile app để quản lý công việc của mình.

## 📱 Các bước đăng nhập

### 1. Từ Welcome Screen
- Tap vào nút **"Đăng nhập"**
- Màn hình chọn role sẽ hiển thị

### 2. Chọn vai trò
Có 2 lựa chọn:
- **Học viên**: Đăng nhập bằng số điện thoại (OTP)
- **Personal Trainer**: Đăng nhập bằng email & mật khẩu

Chọn **Personal Trainer**

### 3. Đăng nhập PT
Nhập thông tin:
- **Email**: Email của PT (đã được đăng ký trong hệ thống)
- **Mật khẩu**: Mật khẩu Firebase Auth

Tap **"Đăng nhập"**

### 4. Sau khi đăng nhập thành công
- Tự động chuyển đến PT App (`/pt`)
- Hiển thị Bottom Navigation với 3 tabs:
  - Tổng quan (Dashboard)
  - Học viên (Clients)
  - Hồ sơ (Profile)

## 🔐 Yêu cầu tài khoản PT

Để đăng nhập thành công, PT cần:

### 1. Tài khoản Firebase Auth
```javascript
// Tạo tài khoản qua Firebase Console hoặc Admin SDK
{
  email: "pt@example.com",
  password: "******"
}
```

### 2. Document trong Firestore collection `employees`
```javascript
{
  email: "pt@example.com",      // Phải trùng với Firebase Auth
  fullName: "Nguyễn Văn A",
  phone: "0987654321",
  role: "pt",                   // Quan trọng!
  gender: "male",
  ptInfo: {                     // Optional khi tạo mới
    bio: "",
    specialties: [],
    experience: 0,
    certificates: [],
    achievements: [],
    maxClientsPerDay: 8,
    isAcceptingNewClients: true,
    rating: 0
  }
}
```

## 🔧 Tạo tài khoản PT mới

### Cách 1: Qua Firebase Console (Khuyến nghị cho testing)

1. **Tạo user trong Firebase Authentication:**
   - Vào Firebase Console → Authentication → Users
   - Click "Add user"
   - Nhập email & password
   - Click "Add user"

2. **Tạo document trong Firestore:**
   - Vào Firestore Database → employees collection
   - Click "Add document"
   - Nhập data theo template ở trên
   - Click "Save"

### Cách 2: Qua Admin SDK (Cho production)

```javascript
// backend/create_pt_account.js
const admin = require('firebase-admin');

async function createPTAccount(email, password, fullName, phone) {
  try {
    // 1. Tạo Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: fullName,
    });

    // 2. Tạo document trong employees
    await admin.firestore().collection('employees').add({
      email: email,
      fullName: fullName,
      phone: phone,
      role: 'pt',
      gender: 'male',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ptInfo: {
        bio: '',
        specialties: [],
        experience: 0,
        certificates: [],
        achievements: [],
        maxClientsPerDay: 8,
        isAcceptingNewClients: true,
        rating: 0
      }
    });

    console.log('✅ PT account created successfully!');
    console.log('Email:', email);
    console.log('UID:', userRecord.uid);
    
    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error('❌ Error creating PT account:', error);
    return { success: false, error: error.message };
  }
}

// Usage
createPTAccount(
  'pt@example.com',
  'SecurePassword123',
  'Nguyễn Văn A',
  '0987654321'
);
```

### Cách 3: Qua React Admin Panel

Nếu bạn đã có admin panel trong React:
1. Vào trang quản lý nhân viên
2. Thêm nhân viên mới
3. Chọn role là "PT"
4. Điền đầy đủ thông tin
5. Hệ thống tự động tạo Firebase Auth account

## 🧪 Testing

### Tài khoản PT mẫu để test
```
Email: pt.test@repsx.com
Password: Test123456
```

### Test flow
1. Mở app Flutter
2. Từ Welcome → Tap "Đăng nhập"
3. Chọn "Personal Trainer"
4. Nhập email & password ở trên
5. Tap "Đăng nhập"
6. Kiểm tra:
   - ✅ Điều hướng đến `/pt`
   - ✅ Hiển thị Dashboard với stats
   - ✅ Tab Học viên hoạt động
   - ✅ Tab Hồ sơ có thể chỉnh sửa

## ⚠️ Troubleshooting

### Lỗi: "Tài khoản không phải PT hoặc chưa được cấp quyền"
**Nguyên nhân:** Email không tồn tại trong collection `employees`

**Giải pháp:**
1. Kiểm tra Firestore console
2. Tìm document với email tương ứng
3. Nếu không có, tạo document mới
4. Đảm bảo field `role` = `"pt"`

### Lỗi: "Đăng nhập thất bại"
**Nguyên nhân:** 
- Email/password không đúng
- Tài khoản bị disable trong Firebase Auth

**Giải pháp:**
1. Kiểm tra Firebase Console → Authentication
2. Verify email tồn tại và enabled
3. Reset password nếu cần

### Lỗi: Không tải được dữ liệu sau khi login
**Nguyên nhân:** 
- Firestore rules không cho phép đọc
- Employee document thiếu fields

**Giải pháo:**
1. Kiểm tra Firestore Rules:
```javascript
match /employees/{employeeId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```
2. Kiểm tra structure của document
3. Kiểm tra console logs trong app

## 🔄 Logout

PT có thể đăng xuất bằng cách:
1. (Tính năng sẽ được thêm vào Settings)
2. Hoặc force quit app và xóa cache

Hiện tại chưa có nút Logout trong PT app, bạn có thể:
- Uninstall và install lại app
- Hoặc thêm nút Logout trong Profile screen

## 📝 Routes

```dart
'/role-selection'  → RoleSelectionScreen (Chọn User hoặc PT)
'/login'          → LoginScreen (User login - OTP)
'/pt-login'       → PtLoginScreen (PT login - Email/Password)
'/pt'             → PTMainScreen (PT App)
```

## 🎨 UI Flow

```
WelcomeScreen
    ↓ [Đăng nhập]
RoleSelectionScreen
    ↓ [Personal Trainer]
PtLoginScreen
    ↓ [Đăng nhập thành công]
PTMainScreen (PT App)
    ├── PTDashboardScreen (Tab 1)
    ├── PTClientsScreen (Tab 2)
    └── PTProfileScreen (Tab 3)
```

## 🚀 Next Steps

Sau khi đăng nhập thành công, PT có thể:
1. ✅ Xem tổng quan thống kê
2. ✅ Xem danh sách học viên
3. ✅ Chỉnh sửa profile
4. 🔄 Quản lý lịch tập (Coming soon)
5. 🔄 Chat với học viên (Coming soon)
6. 🔄 Quản lý gói tập (Coming soon)

## 📚 Related Files

- `lib/features/auth/screens/role_selection_screen.dart` - Màn hình chọn role
- `lib/feature_pt/auth_pt/screen/pt_login_screen.dart` - Màn hình login PT
- `lib/feature_pt/auth_pt/provider/pt_auth_provider.dart` - Auth logic cho PT
- `lib/features/pt/screens/pt_main_screen.dart` - Main screen của PT app
- `lib/main.dart` - Routes configuration
