# Hướng dẫn Debug Sinh trắc học

## Đã thêm log vào các file sau:

### 1. BiometricAuthService (`lib/features/auth/services/biometric_auth_service.dart`)
- `[BIOMETRIC]` - Tất cả log từ service
- Kiểm tra: availability, enabled status, authentication

### 2. AuthProvider (`lib/features/auth/providers/auth_provider.dart`)
- `[AUTH_PROVIDER]` - Log từ provider
- Kiểm tra: toggle biometric, check status

### 3. LoginScreen (`lib/features/auth/screens/login_screen.dart`)
- `[LOGIN]` - Log từ login screen
- `[LOGIN_UI]` - Log khi build UI
- Kiểm tra: check availability, show dialog, OTP flow

## Cách xem log

### 1. Chạy app với Flutter DevTools
```bash
cd f:\Doan4\frontend_flutter
flutter run
```

### 2. Xem log trong console hoặc trong VS Code Debug Console

### 3. Filter log theo tag:
- Tìm `[BIOMETRIC]` để xem log sinh trắc học
- Tìm `[LOGIN]` để xem log login flow
- Tìm `[AUTH_PROVIDER]` để xem log provider

## Các bước kiểm tra

### Bước 1: Mở app lần đầu
**Expected logs:**
```
[LOGIN] ===== Checking Biometric Availability =====
[AUTH_PROVIDER] Checking biometric availability...
[BIOMETRIC] Checking biometric availability...
[BIOMETRIC] canCheckBiometrics: true/false
[BIOMETRIC] isDeviceSupported: true/false
[BIOMETRIC] Final availability: true/false
[AUTH_PROVIDER] Biometric available: true/false

[AUTH_PROVIDER] Checking if biometric enabled...
[BIOMETRIC] Checking if biometric is enabled...
[BIOMETRIC] Enabled: false, Phone: null
[AUTH_PROVIDER] Biometric enabled: false

[LOGIN] State updated - available: true/false, enabled: false, name: Vân tay
[LOGIN] ===== End Biometric Check =====

[LOGIN_UI] Building login screen - biometricAvailable: true/false, biometricEnabled: false
```

**Nếu `biometricAvailable = false`:**
- Kiểm tra thiết bị có vân tay/Face ID không
- Kiểm tra đã đăng ký vân tay trong Settings chưa
- Kiểm tra permissions trong AndroidManifest.xml hoặc Info.plist

### Bước 2: Đăng nhập OTP lần đầu
**Expected logs:**
```
[LOGIN] ===== Starting OTP Verification =====
[LOGIN] Phone: +84..., OTP: 123456
... (OTP verification)
[LOGIN] Login successful! Scheduling notifications...
[LOGIN] Showing biometric setup dialog...

[LOGIN] ===== Showing Biometric Setup Dialog =====
[LOGIN] Phone number: +84...
[AUTH_PROVIDER] Checking if biometric enabled...
[BIOMETRIC] Checking if biometric is enabled...
[BIOMETRIC] Enabled: false, Phone: null
[LOGIN] Already enabled: false

[AUTH_PROVIDER] Checking biometric availability...
[BIOMETRIC] Checking biometric availability...
[BIOMETRIC] Final availability: true
[LOGIN] Biometric available: true
[LOGIN] Biometric name: Vân tay
[LOGIN] Showing dialog...
```

**Nếu không thấy dialog:**
- Tìm log `[LOGIN] Already enabled: true` → Đã kích hoạt rồi
- Tìm log `[LOGIN] Biometric not available` → Thiết bị không hỗ trợ
- Tìm log `[LOGIN] Widget not mounted` → UI đã unmount

### Bước 3: Click "Kích hoạt" trong dialog
**Expected logs:**
```
[LOGIN] User clicked "Kích hoạt" button
[LOGIN] Calling toggleBiometric with phone: +84...

[AUTH_PROVIDER] ===== Toggle Biometric =====
[AUTH_PROVIDER] Phone: +84..., Enable: true
[BIOMETRIC] Checking biometric availability...
[BIOMETRIC] Final availability: true
[AUTH_PROVIDER] Biometric available: true
[BIOMETRIC] Getting available biometrics...
[BIOMETRIC] Available biometrics: [BiometricType.fingerprint]
[AUTH_PROVIDER] Biometric name: Vân tay
[AUTH_PROVIDER] Requesting authentication...
... (User authenticates with fingerprint)
[AUTH_PROVIDER] Authentication result: true

[AUTH_PROVIDER] Saving credentials...
[BIOMETRIC] Saving credentials - phone: +84..., enabled: true
[BIOMETRIC] Credentials saved successfully
[BIOMETRIC] Verified saved data - enabled: true, phone: +84...
[AUTH_PROVIDER] Credentials saved successfully
[AUTH_PROVIDER] ===== Toggle Complete =====

[LOGIN] toggleBiometric result - error: null
[LOGIN] Biometric enabled successfully!
```

**Nếu authentication result = false:**
- Người dùng hủy xác thực
- Vân tay không khớp
- Timeout

### Bước 4: Logout và đăng nhập lại
**Expected logs:**
```
[LOGIN] ===== Checking Biometric Availability =====
...
[BIOMETRIC] Enabled: true, Phone: +84...
[AUTH_PROVIDER] Biometric enabled: true
[LOGIN] State updated - available: true, enabled: true, name: Vân tay

[LOGIN_UI] Building login screen - biometricAvailable: true, biometricEnabled: true
```

**Nút sinh trắc học phải hiển thị!**

Nếu không hiển thị:
- Kiểm tra `_biometricAvailable` và `_biometricEnabled` trong log
- Kiểm tra condition `if (_biometricAvailable && _biometricEnabled)` trong code

## Troubleshooting theo log

### Log: `canCheckBiometrics: false`
**Nguyên nhân:** Thiết bị không hỗ trợ sinh trắc học
**Giải pháp:**
- Test trên thiết bị thật có vân tay
- Hoặc dùng emulator và đăng ký vân tay ảo

### Log: `isDeviceSupported: false`
**Nguyên nhân:** Package `local_auth` không hỗ trợ platform này
**Giải pháp:**
- Cập nhật package: `flutter pub upgrade local_auth`
- Kiểm tra platform support

### Log: `Enabled: false, Phone: null` (sau khi đã kích hoạt)
**Nguyên nhân:** SharedPreferences không lưu được
**Giải pháp:**
- Clear app data và thử lại
- Kiểm tra log `Verified saved data` để xem có lưu thành công không

### Log: `Authentication result: false`
**Nguyên nhân:** Người dùng hủy hoặc vân tay không khớp
**Giải pháp:**
- Thử lại với vân tay đúng
- Kiểm tra vân tay đã được đăng ký trong Settings

### Không thấy log `[LOGIN] Showing dialog...`
**Nguyên nhân:** 
1. `isEnabled = true` (đã kích hoạt)
2. `isAvailable = false` (không hỗ trợ)
3. `mounted = false` (UI đã unmount)

**Giải pháp:**
- Kiểm tra các log trước đó
- Clear app data nếu `isEnabled = true`

## Commands hữu ích

### Clear app data (Android)
```bash
adb shell pm clear com.example.frontend_flutter
```

### Xem SharedPreferences (Android)
```bash
adb shell
run-as com.example.frontend_flutter
cat /data/data/com.example.frontend_flutter/shared_prefs/FlutterSharedPreferences.xml
```

### Test vân tay trên emulator (Android)
```bash
# Đăng ký vân tay
adb -e emu finger touch 1

# Xác thực vân tay
adb -e emu finger touch 1
```

## Checklist

- [ ] Log `[BIOMETRIC] Final availability: true`
- [ ] Log `[LOGIN] Biometric available: true`
- [ ] Log `[LOGIN] Showing dialog...` (lần đầu đăng nhập)
- [ ] Log `[AUTH_PROVIDER] Authentication result: true` (khi click Kích hoạt)
- [ ] Log `[BIOMETRIC] Verified saved data - enabled: true, phone: +84...`
- [ ] Log `[LOGIN_UI] Building login screen - biometricAvailable: true, biometricEnabled: true` (lần đăng nhập sau)
- [ ] Nút sinh trắc học hiển thị trong UI

Nếu tất cả checklist đều OK → Tính năng hoạt động!
