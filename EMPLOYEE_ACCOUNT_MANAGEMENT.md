# 🔐 Hướng Dẫn Quản Lý Tài Khoản Nhân Viên

## 📋 Tổng Quan

Tính năng quản lý tài khoản nhân viên giúp admin dễ dàng:
- ✅ Xem thông tin tài khoản đăng nhập ngay trong modal
- ✅ Nhận mật khẩu tạm thời khi tạo nhân viên mới
- ✅ Reset mật khẩu cho nhân viên đã có
- ✅ Copy mật khẩu nhanh chóng
- ✅ Hiển thị/ẩn mật khẩu để bảo mật

---

## 🆕 1. THÊM NHÂN VIÊN MỚI

### Giao Diện

Trong **AddEmployeeModal**, có thêm section **"Thông Tin Tài Khoản"**:

```
┌─────────────────────────────────────┐
│ 💡 Thông Tin Tài Khoản             │
├─────────────────────────────────────┤
│ Tài Khoản Đăng Nhập                │
│ ┌─────────────────────────────────┐ │
│ │ user@example.com (disabled)     │ │
│ └─────────────────────────────────┘ │
│ 💡 Tài khoản đăng nhập sẽ tự động  │
│    tạo bằng email                   │
│                                     │
│ Mật Khẩu Tạm Thời (sau khi tạo)    │
│ ┌──────────────┬─────┬─────┐       │
│ │ ••••••••••   │ 👁️ │ 📋  │       │
│ └──────────────┴─────┴─────┘       │
│ ⚠️ Lưu ý: Mật khẩu này sẽ được gửi │
│    cho nhân viên để đăng nhập lần đầu│
└─────────────────────────────────────┘
```

### Tính Năng

1. **Tài khoản đăng nhập**: 
   - Tự động dùng email đã nhập
   - Disabled để user biết không cần nhập
   
2. **Mật khẩu tạm thời**:
   - Chỉ hiển thị SAU KHI tạo thành công
   - Format: `[4 số cuối SĐT]@Gym` (VD: `9201@Gym`)
   - Có 3 nút:
     - **👁️**: Hiển thị/ẩn mật khẩu
     - **📋**: Copy mật khẩu
     - **Input**: Hiển thị mật khẩu (disabled, màu vàng)

### Luồng Hoạt Động

```
1. Admin nhập thông tin nhân viên
   └─> Email sẽ tự động hiển thị ở section "Thông Tin Tài Khoản"

2. Admin bấm "Thêm Nhân Viên"
   ├─> Backend tạo Firebase Auth account
   │   └─> Tạo mật khẩu: phone.slice(-4) + '@Gym'
   ├─> Lưu nhân viên vào Firestore (có uid)
   └─> Hiển thị mật khẩu trong modal

3. Admin copy mật khẩu
   └─> Gửi cho nhân viên qua Zalo/Email/...

4. Nhân viên đăng nhập lần đầu
   ├─> Email: user@example.com
   └─> Password: 9201@Gym
```

---

## ✏️ 2. CHỈNH SỬA NHÂN VIÊN

### Giao Diện

Trong **EditEmployeeModal**, section **"Thông Tin Tài Khoản"**:

```
┌─────────────────────────────────────┐
│ 🔐 Thông Tin Tài Khoản             │
├─────────────────────────────────────┤
│ Tài Khoản Đăng Nhập                │
│ ┌─────────────────────────────────┐ │
│ │ user@example.com (disabled)     │ │
│ └─────────────────────────────────┘ │
│ ✅ Đã có tài khoản Firebase Auth   │
│    (UID: abc123...)                 │
│                                     │
│ Quản Lý Mật Khẩu                   │
│ ┌─────────────────────────────────┐ │
│ │   🔄 Reset Mật Khẩu             │ │
│ └─────────────────────────────────┘ │
│ ⚠️ Mật khẩu mới sẽ được tạo tự động│
│    và hiển thị để bạn gửi cho NV   │
│                                     │
│ Mật Khẩu Mới (Vừa Reset)           │
│ ┌──────────────┬─────┬─────┐       │
│ │ ••••••••••   │ 👁️ │ 📋  │       │
│ └──────────────┴─────┴─────┘       │
│ ✅ Hãy gửi mật khẩu này cho NV ngay!│
└─────────────────────────────────────┘
```

### Tính Năng

1. **Tài khoản đăng nhập**:
   - Hiển thị email hiện tại
   - Hiển thị trạng thái Firebase Auth (nếu có UID)
   
2. **Nút Reset Mật Khẩu**:
   - Click → Confirm dialog
   - Nếu OK → Gọi API reset
   - Mật khẩu mới hiển thị ngay bên dưới

3. **Mật khẩu mới** (sau reset):
   - Chỉ hiển thị sau khi reset thành công
   - Format: `[4 số cuối SĐT]@Gym`
   - Có 3 nút tương tự Add modal
   - Background màu xanh lá (đã thành công)

### Luồng Reset Mật Khẩu

```
1. Admin mở Edit modal cho nhân viên
   └─> Hiển thị thông tin tài khoản hiện tại

2. Admin bấm "🔄 Reset Mật Khẩu"
   └─> Confirm dialog hiện lên

3. Admin confirm
   ├─> POST /api/employees/reset-password
   │   └─> Body: { email: employee.email }
   ├─> Backend:
   │   ├─> Lấy user từ Firebase Auth
   │   ├─> Lấy employee từ Firestore (để lấy phone)
   │   ├─> Tạo mật khẩu mới: phone.slice(-4) + '@Gym'
   │   └─> Update Firebase Auth password
   └─> Frontend nhận mật khẩu mới

4. Hiển thị mật khẩu mới
   └─> Admin copy và gửi cho nhân viên
```

---

## 🔧 3. BACKEND API

### **POST** `/api/employees/reset-password`

Reset mật khẩu bằng email (không cần UID).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "tempPassword": "9201@Gym",
  "message": "Password reset successfully",
  "email": "user@example.com"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Employee not found in database",
  "details": "..."
}
```

### Các API Khác

1. **POST** `/api/employees/create-account` - Tạo tài khoản mới
2. **POST** `/api/employees/:uid/reset-password` - Reset bằng UID
3. **DELETE** `/api/employees/:uid/account` - Xóa tài khoản
4. **GET** `/api/employees/by-email/:email` - Lấy info theo email

---

## 🎨 4. UI/UX HIGHLIGHTS

### Color Coding

| Trạng thái | Màu | Ý nghĩa |
|-----------|-----|---------|
| Mật khẩu tạm thời (Add) | Vàng `#fff3cd` | Cảnh báo - cần lưu lại |
| Mật khẩu mới (Reset) | Xanh lá `#d4edda` | Thành công - mật khẩu đã reset |
| Tài khoản disabled | Xám `#f8f9fa` | Read-only |
| Nút Reset | Vàng `#ffc107` | Cảnh báo - thao tác quan trọng |

### Icon Meanings

- 👁️ / 🙈 : Hiển thị/ẩn mật khẩu
- 📋 : Copy to clipboard
- 🔄 : Reset mật khẩu
- ⏳ : Đang xử lý
- ✅ : Thành công
- ⚠️ : Cảnh báo
- 💡 : Thông tin hữu ích

---

## 🧪 5. TESTING CHECKLIST

### Test Add Employee

- [ ] Email hiển thị đúng trong "Tài Khoản Đăng Nhập"
- [ ] Mật khẩu KHÔNG hiển thị trước khi submit
- [ ] Sau submit, mật khẩu hiển thị ngay
- [ ] Click 👁️ → mật khẩu hiển thị/ẩn
- [ ] Click 📋 → mật khẩu được copy
- [ ] Format mật khẩu đúng: `[4 số cuối]@Gym`
- [ ] Đóng modal → mật khẩu reset về rỗng

### Test Edit Employee

- [ ] Email và UID hiển thị đúng
- [ ] Nút Reset disable khi không có email
- [ ] Click Reset → hiện confirm dialog
- [ ] Sau reset, mật khẩu mới hiển thị
- [ ] Click 👁️ và 📋 hoạt động bình thường
- [ ] Đóng modal → mật khẩu reset về rỗng
- [ ] Mở lại modal → mật khẩu mới KHÔNG còn

### Test Backend

- [ ] POST `/api/employees/reset-password` với email hợp lệ
- [ ] Response trả về `tempPassword` đúng
- [ ] Firebase Auth password đã được update
- [ ] Test với email không tồn tại → trả về error
- [ ] Test với employee không có phone → trả về error

---

## 📱 6. SỬ DỤNG THỰC TẾ

### Kịch bản 1: Onboarding Nhân Viên Mới

```
Admin:
1. Điền form thêm nhân viên
2. Submit
3. Copy mật khẩu từ modal
4. Gửi cho nhân viên qua Zalo:
   "Chào em, tài khoản đăng nhập:
    Email: thinh@gym.com
    Mật khẩu: 9201@Gym
    Nhớ đổi mật khẩu sau khi đăng nhập nhé!"

Nhân viên:
5. Đăng nhập lần đầu
6. Đổi mật khẩu (future feature)
```

### Kịch bản 2: Nhân Viên Quên Mật Khẩu

```
Nhân viên: "Anh ơi, em quên mật khẩu rồi!"

Admin:
1. Mở trang Employees
2. Tìm nhân viên
3. Click "Chỉnh sửa"
4. Scroll xuống "Thông Tin Tài Khoản"
5. Click "🔄 Reset Mật Khẩu"
6. Confirm
7. Copy mật khẩu mới
8. Gửi cho nhân viên
```

---

## 🔒 7. BẢO MẬT

### Mật Khẩu Tạm Thời

- **Format**: `[4 số cuối SĐT]@Gym`
- **Ví dụ**: Phone `0707319201` → Password `9201@Gym`
- **Lý do**: 
  - Dễ nhớ cho nhân viên
  - Có thể verify qua SĐT
  - Admin có thể tạo lại nếu cần

### Best Practices

1. ✅ Admin nên gửi mật khẩu qua kênh riêng tư (Zalo, SMS)
2. ✅ Khuyến khích nhân viên đổi mật khẩu sau lần đăng nhập đầu
3. ✅ Không lưu mật khẩu tạm thời vào database
4. ✅ Mật khẩu chỉ hiển thị 1 lần, sau đó phải reset
5. ⚠️ Admin không thể xem mật khẩu cũ, chỉ có thể reset

---

## 🚀 8. FUTURE ENHANCEMENTS

### Đã Có
- ✅ Tạo tài khoản tự động khi thêm nhân viên
- ✅ Hiển thị mật khẩu tạm thời trong modal
- ✅ Reset mật khẩu cho nhân viên
- ✅ Copy mật khẩu nhanh

### Kế Hoạch
- 🔲 Gửi email tự động khi tạo tài khoản
- 🔲 Bắt buộc đổi mật khẩu sau lần đăng nhập đầu
- 🔲 Lịch sử reset mật khẩu
- 🔲 Hạn chế số lần reset mỗi ngày
- 🔲 Mật khẩu mạnh hơn (có ký tự đặc biệt, chữ hoa)
- 🔲 2FA cho nhân viên quan trọng

---

## 📞 9. TROUBLESHOOTING

### Lỗi: "User not found"
- **Nguyên nhân**: Email không tồn tại trong Firebase Auth
- **Giải pháp**: Kiểm tra email, hoặc tạo tài khoản mới

### Lỗi: "Employee not found in database"
- **Nguyên nhân**: Nhân viên có Auth nhưng không có trong Firestore
- **Giải pháp**: Kiểm tra Firestore, hoặc xóa Auth và tạo lại

### Lỗi: "Employee phone number not found"
- **Nguyên nhân**: Employee document không có field `phone`
- **Giải pháp**: Thêm phone number cho nhân viên

### Mật khẩu không hiển thị sau khi tạo
- **Nguyên nhân**: Backend API failed hoặc network error
- **Giải pháp**: 
  1. Check console log
  2. Verify backend đang chạy
  3. Check Network tab trong DevTools

---

## ✅ SUMMARY

**Trước:**
- ❌ Admin không biết mật khẩu nhân viên
- ❌ Phải thủ công tạo account riêng
- ❌ Khó quản lý khi nhân viên quên mật khẩu

**Sau:**
- ✅ Mật khẩu hiển thị ngay trong modal
- ✅ Tự động tạo account khi thêm nhân viên
- ✅ Reset mật khẩu dễ dàng trong 3 click
- ✅ Copy password nhanh chóng
- ✅ UI/UX trực quan, dễ sử dụng

**Công nghệ:**
- Frontend: React, SweetAlert2 (future)
- Backend: Node.js, Express
- Authentication: Firebase Auth
- Database: Firestore

---

Made with ❤️ for Gym Management System

