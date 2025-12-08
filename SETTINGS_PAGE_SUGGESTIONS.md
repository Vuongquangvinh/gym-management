# 🔧 Đề xuất Trang Cài đặt Hệ thống (Admin Settings)

## 📍 Vị trí hiện tại
`frontend_react/src/features/admin/pages/Settings.jsx`

## ⚠️ Lưu ý
**Đây là trang cài đặt dành cho ADMIN quản lý hệ thống**, không phải cài đặt cho người dùng thông thường. Chỉ admin có quyền truy cập và thay đổi các cài đặt này.

## 🎯 Các tính năng nên thêm vào trang Admin Settings

### 1. **Cài đặt Phòng Gym**
- 📝 Thông tin cơ bản:
  - Tên phòng gym
  - Địa chỉ
  - Số điện thoại
  - Email liên hệ
  - Giờ mở cửa/đóng cửa
  - Logo phòng gym
  
### 2. **Cài đặt Tài chính**
- 💰 Thuế TNCN mặc định (%)
- 🏥 Bảo hiểm mặc định (%)
- 💵 Đơn vị tiền tệ
- 🧾 Mẫu hóa đơn

### 3. **Cài đặt Lương & Hoa hồng**
- 📊 Tỷ lệ hoa hồng PT mặc định:
  - Hoa hồng gói tập (%)
  - Hoa hồng PT package (%)
  - Ngày tính hoa hồng (đầu tháng/cuối tháng)
- 💼 Chế độ tính lương:
  - Số ngày công chuẩn/tháng
  - Hệ số tăng ca
  - Ngày chốt lương

### 4. **Cài đặt Thông báo**
- 🔔 Email thông báo:
  - Gửi thông báo khi gói tập sắp hết hạn
  - Gửi thông báo sinh nhật thành viên
  - Gửi thông báo thanh toán
- 📱 Push notification:
  - Bật/tắt thông báo đẩy
  - Cấu hình FCM

### 5. **Cài đặt Gói tập**
- 📦 Thời gian gia hạn tự động
- ⏰ Cảnh báo hết hạn (trước bao nhiêu ngày)
- 🔄 Cho phép đóng băng gói tập
- 📅 Số ngày đóng băng tối đa

### 6. **Cài đặt Check-in**
- 👤 Cho phép check-in bằng khuôn mặt
- 🎫 Cho phép check-in bằng QR code
- ⏱️ Thời gian check-in hợp lệ (trong vòng bao nhiêu giờ)

### 7. **Cài đặt Nhân viên**
- 👔 Vị trí (Role) mặc định
- 📋 Quyền hạn mặc định theo role
- 🔐 Chính sách mật khẩu
- 📊 Quản lý ca làm việc

### 8. **Cài đặt Báo cáo**
- 📈 Chu kỳ báo cáo tự động:
  - Hàng ngày/tuần/tháng
  - Email nhận báo cáo
- 📊 Loại báo cáo mặc định
- 🗓️ Kỳ báo cáo (tháng dương lịch/theo ngày chốt)

### 9. **Cài đặt Bảo mật**
- 🔒 Phiên đăng nhập:
  - Thời gian timeout session
  - Cho phép đăng nhập nhiều thiết bị
- 🛡️ Bảo mật 2 lớp (2FA)
- 📝 Log hoạt động quản trị

### 10. **Cài đặt Sao lưu & Phục hồi**
- 💾 Tự động backup database:
  - Tần suất backup (hàng ngày/tuần)
  - Số lượng bản backup lưu giữ
- ☁️ Cloud storage cho backup
- 🔄 Điểm phục hồi

### 11. **Cài đặt Giao diện**
- 🎨 Theme (sáng/tối)
- 🌍 Ngôn ngữ (Tiếng Việt/English)
- 🖼️ Banner trang chủ
- 📱 Responsive settings

### 12. **Cài đặt Tích hợp**
- 💳 Cổng thanh toán (PayOS, VNPay, Momo)
- 📧 Email service (SMTP config)
- 📱 SMS gateway
- 🔗 API keys cho dịch vụ bên ngoài

## 📐 Cấu trúc đề xuất

```
Admin Settings (Tabs Layout)
├── 🏢 General Settings (Cài đặt chung phòng gym)
├── 💰 Financial Settings (Cài đặt tài chính & lương)
├── 🔔 Notification Settings (Cài đặt thông báo)
├── 🔒 Security Settings (Cài đặt bảo mật hệ thống)
├── 🔗 Integration Settings (Tích hợp bên ngoài)
└── ⚙️ Advanced Settings (Cài đặt nâng cao)
```

## 🔐 Phân quyền

- **Super Admin**: Toàn quyền truy cập tất cả cài đặt
- **Admin**: Truy cập General, Financial, Notification
- **Manager**: Chỉ xem (read-only) một số cài đặt cơ bản
- **Staff/PT**: Không có quyền truy cập

## 🗄️ Database Model đề xuất

```javascript
SettingsModel {
  id: string,
  category: 'GENERAL' | 'FINANCIAL' | 'NOTIFICATION' | 'SECURITY' | 'INTEGRATION',
  key: string,
  value: any,
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON',
  description: string,
  updatedAt: Timestamp,
  updatedBy: string
}
```

## 🎯 Priority Implementation

### Phase 1 (Quan trọng nhất)
1. ✅ Cài đặt thông tin phòng gym
2. ✅ Cài đặt tài chính cơ bản
3. ✅ Cài đặt lương & hoa hồng

### Phase 2 (Quan trọng)
4. ✅ Cài đặt thông báo
5. ✅ Cài đặt gói tập
6. ✅ Cài đặt bảo mật

### Phase 3 (Nâng cao)
7. ✅ Cài đặt báo cáo
8. ✅ Cài đặt sao lưu
9. ✅ Cài đặt tích hợp

## 📝 Notes
- ⚠️ **Chỉ admin mới có quyền thay đổi cài đặt hệ thống**
- 📋 Tất cả các thay đổi cài đặt phải có log audit trail (ai thay đổi, khi nào, thay đổi gì)
- ⚡ Một số cài đặt quan trọng cần xác nhận (confirm dialog) trước khi lưu
- 💾 Nên có tính năng import/export settings để backup/restore
- ✅ Cài đặt nên có validation chặt chẽ
- 🔄 Hỗ trợ reset về mặc định cho từng nhóm cài đặt
- 🔔 Thông báo cho tất cả admin khi có thay đổi cài đặt quan trọng
- 🛡️ Một số cài đặt nhạy cảm cần yêu cầu nhập lại mật khẩu admin
