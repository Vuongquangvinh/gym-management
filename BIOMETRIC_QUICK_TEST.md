# Demo nhanh - Sinh trắc học

## Cài đặt và chạy

```bash
cd f:\Doan4\frontend_flutter
flutter pub get
flutter run
```

## Test trên thiết bị thật

### Android (với vân tay)

1. **Đăng ký vân tay trên thiết bị**:
   - Settings → Security → Fingerprint → Add fingerprint
   
2. **Lần đầu đăng nhập**:
   - Mở app
   - Nhập số điện thoại (ví dụ: 0123456789)
   - Nhập mã OTP
   - Dialog sẽ hiện lên: "Bạn có muốn kích hoạt đăng nhập bằng Vân tay?"
   - Nhấn "Kích hoạt"
   - Đặt ngón tay lên cảm biến vân tay
   - ✅ Kích hoạt thành công!

3. **Logout và đăng nhập lại**:
   - Logout khỏi app
   - Quay lại màn hình login
   - 🎉 Nút "Đăng nhập bằng Vân tay" hiện lên ở đầu
   - Nhấn nút
   - Đặt ngón tay lên cảm biến
   - ✅ Đăng nhập thành công ngay lập tức!

### iOS (với Face ID)

1. **Đăng ký Face ID**:
   - Settings → Face ID & Passcode → Set Up Face ID
   
2. **Test tương tự như Android**

## Test trên Emulator/Simulator

### Android Emulator

1. **Đăng ký vân tay ảo**:
   - Settings → Security → Fingerprint
   - Nhấn "Add fingerprint"
   - Trong terminal Android Studio, dùng lệnh:
     ```
     adb -e emu finger touch 1
     ```
   - Lặp lại nhiều lần cho đến khi đăng ký xong

2. **Test đăng nhập sinh trắc học**:
   - Khi app yêu cầu vân tay, chạy lệnh:
     ```
     adb -e emu finger touch 1
     ```

### iOS Simulator

1. **Kích hoạt Face ID/Touch ID**:
   - Features → Face ID → Enrolled
   
2. **Test đăng nhập**:
   - Khi app yêu cầu, chọn:
   - Features → Face ID → Matching Face

## Kết quả mong đợi

✅ **Lần đầu**: Đăng nhập OTP + Dialog hỏi kích hoạt sinh trắc  
✅ **Lần sau**: Nút sinh trắc hiện lên → Click → Xác thực → Vào app ngay

## Screenshot flow

```
┌────────────────────────────────┐
│   CHÀO MỪNG TRỞ LẠI!          │
│   Đăng nhập để tiếp tục       │
│                                │
│  ┌──────────────────────────┐ │
│  │  👆 Đăng nhập bằng       │ │  <- Nút này chỉ hiện
│  │     Vân tay              │ │     khi đã kích hoạt
│  └──────────────────────────┘ │
│                                │
│         ---- hoặc ----         │
│                                │
│  📱 Số điện thoại             │
│  ┌──────────────────────────┐ │
│  │ +84 |________________    │ │
│  └──────────────────────────┘ │
│                                │
│  ┌──────────────────────────┐ │
│  │    📨 Gửi mã OTP         │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘
```

## Code quan trọng

### Kiểm tra sinh trắc học trong AuthProvider:
```dart
final isAvailable = await authProvider.isBiometricAvailable();
final isEnabled = await authProvider.isBiometricEnabled();
```

### Đăng nhập bằng sinh trắc học:
```dart
final errorMsg = await authProvider.loginWithBiometric();
if (errorMsg == null) {
  // Đăng nhập thành công!
}
```

### Kích hoạt/tắt sinh trắc học:
```dart
final error = await authProvider.toggleBiometric(phoneNumber, true);
```

## Lưu ý quan trọng

1. **Không test trên device cũ quá**: Cần Android 6.0+ hoặc iOS 11+
2. **Phải đăng ký vân tay/Face ID trước**: Trong Settings của thiết bị
3. **Emulator phải có Hardware support**: Không phải emulator nào cũng hỗ trợ

## Câu hỏi thường gặp

**Q: Tại sao nút sinh trắc không hiện ra?**  
A: Kiểm tra:
- Thiết bị có đăng ký vân tay/Face ID chưa?
- Đã kích hoạt sinh trắc trong lần đăng nhập OTP đầu tiên chưa?
- Log xem `_biometricAvailable` và `_biometricEnabled` có `true` không?

**Q: Logout có xóa sinh trắc không?**  
A: KHÔNG! Mục đích là để người dùng đăng nhập lại nhanh chóng.

**Q: Có an toàn không?**  
A: CÓ! Mỗi lần đăng nhập vẫn phải:
1. Xác thực sinh trắc học với thiết bị
2. Kiểm tra user tồn tại trong Firestore
3. Nếu user không tồn tại, tự động xóa thông tin sinh trắc

**Q: Có thể tắt sinh trắc học không?**  
A: Hiện tại chưa có UI, nhưng có thể thêm trong Settings. Hoặc tạm thời có thể:
- Logout
- Clear app data
- Đăng nhập lại và chọn "Bỏ qua" khi dialog hiện ra
