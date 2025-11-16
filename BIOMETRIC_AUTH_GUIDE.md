# Hướng dẫn sử dụng Sinh trắc học (Vân tay/Face ID)

## Tổng quan
Tính năng sinh trắc học đã được thêm vào ứng dụng để cho phép người dùng đăng nhập nhanh chóng bằng vân tay hoặc Face ID thay vì phải nhập OTP mỗi lần.

## Các file đã thêm/chỉnh sửa

### 1. **Package mới**
- `local_auth: ^2.3.0` - Package hỗ trợ xác thực sinh trắc học trên Flutter

### 2. **File mới tạo**
- `lib/features/auth/services/biometric_auth_service.dart` - Service xử lý tất cả logic liên quan đến sinh trắc học

### 3. **File đã cập nhật**
- `lib/features/auth/providers/auth_provider.dart` - Thêm các phương thức xử lý đăng nhập sinh trắc học
- `lib/features/auth/screens/login_screen.dart` - Thêm UI và logic để hiển thị nút sinh trắc học
- `android/app/src/main/AndroidManifest.xml` - Thêm permissions cho Android
- `ios/Runner/Info.plist` - Thêm description cho Face ID trên iOS

## Cách hoạt động

### Lần đăng nhập đầu tiên (OTP)
1. Người dùng nhập số điện thoại và xác thực OTP như bình thường
2. Sau khi đăng nhập thành công, **một dialog tự động hiển thị** hỏi người dùng có muốn kích hoạt sinh trắc học không
3. Nếu người dùng chọn "Kích hoạt":
   - Hệ thống yêu cầu xác thực sinh trắc học một lần để xác nhận
   - Lưu số điện thoại vào SharedPreferences
   - Đánh dấu sinh trắc học đã được kích hoạt

### Các lần đăng nhập sau
1. Khi mở màn hình đăng nhập, nếu sinh trắc học đã được kích hoạt, một **nút đăng nhập sinh trắc học** sẽ hiển thị ở trên cùng
2. Người dùng chỉ cần nhấn nút và xác thực vân tay/Face ID
3. Hệ thống tự động đăng nhập mà không cần nhập OTP

## Các tính năng chính

### BiometricAuthService

#### Các phương thức quan trọng:

1. **`isBiometricAvailable()`**
   - Kiểm tra thiết bị có hỗ trợ sinh trắc học không
   - Trả về `true` nếu hỗ trợ

2. **`authenticate()`**
   - Hiển thị dialog xác thực sinh trắc học
   - Hỗ trợ cả vân tay và Face ID
   - Tùy chọn `biometricOnly: true` để chỉ cho phép sinh trắc học (không PIN/Password)

3. **`saveBiometricCredentials()`**
   - Lưu thông tin đăng nhập để sử dụng cho lần sau
   - Lưu số điện thoại và trạng thái kích hoạt

4. **`getBiometricTypeName()`**
   - Trả về tên phương thức sinh trắc học: "Vân tay", "Face ID", "Mống mắt", v.v.

### AuthProvider

#### Các phương thức mới:

1. **`loginWithBiometric()`**
   - Xử lý đăng nhập bằng sinh trắc học
   - Kiểm tra xem sinh trắc học đã được kích hoạt chưa
   - Lấy số điện thoại đã lưu và xác thực
   - Đăng nhập tự động nếu thành công

2. **`toggleBiometric(phoneNumber, enable)`**
   - Kích hoạt hoặc tắt sinh trắc học
   - Yêu cầu xác thực trước khi kích hoạt

3. **`isBiometricAvailable()`** & **`isBiometricEnabled()`**
   - Kiểm tra trạng thái sinh trắc học

### LoginScreen

#### Cập nhật UI:

1. **Nút đăng nhập sinh trắc học**
   - Hiển thị ở đầu form nếu sinh trắc học đã được kích hoạt
   - Icon vân tay với gradient đẹp mắt
   - Divider "hoặc" để phân tách với form OTP

2. **Dialog kích hoạt sinh trắc học**
   - Tự động hiển thị sau lần đăng nhập OTP thành công đầu tiên
   - Giao diện thân thiện với icon và mô tả rõ ràng
   - 2 nút: "Bỏ qua" và "Kích hoạt"

## Cấu hình Platform

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC"/>
<uses-permission android:name="android.permission.USE_FINGERPRINT"/>
```

### iOS (Info.plist)
```xml
<key>NSFaceIDUsageDescription</key>
<string>Cần quyền Face ID để đăng nhập nhanh vào ứng dụng</string>
```

## Bảo mật

### Các điểm bảo mật:
1. **Không lưu mật khẩu** - Chỉ lưu số điện thoại, không lưu OTP hay mật khẩu
2. **Yêu cầu xác thực thiết bị** - Người dùng phải xác thực sinh trắc học mỗi lần đăng nhập
3. **Kiểm tra user trong Firestore** - Mỗi lần đăng nhập vẫn phải xác minh user tồn tại trong database
4. **Xóa dữ liệu khi cần** - Nếu user không tồn tại, tự động xóa thông tin sinh trắc học đã lưu

### Lưu ý:
- **Không xóa thông tin sinh trắc học khi logout** - Người dùng có thể đăng nhập lại nhanh chóng
- Người dùng có thể tắt sinh trắc học trong phần settings (nếu có)

## Test trên thiết bị

### Android:
1. Đảm bảo thiết bị đã đăng ký vân tay trong Settings > Security
2. Build app: `flutter run`
3. Đăng nhập lần đầu bằng OTP
4. Chấp nhận kích hoạt sinh trắc học
5. Logout và đăng nhập lại bằng vân tay

### iOS:
1. Đảm bảo thiết bị đã đăng ký Face ID/Touch ID
2. Build app: `flutter run`
3. Tương tự như Android

### Simulator/Emulator:
- **Android Emulator**: Settings > Security > Fingerprint > Add fingerprint
- **iOS Simulator**: Features > Face ID/Touch ID > Enrolled

## Flow hoàn chỉnh

```
Lần đăng nhập đầu tiên:
┌─────────────────────┐
│  Nhập số điện thoại │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Nhận & nhập OTP  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Dialog: Kích hoạt   │
│  sinh trắc học?     │
└──────────┬──────────┘
           │
      ┌────┴────┐
      │         │
   Có │         │ Không
      │         │
      ▼         ▼
┌──────────┐  ┌──────────┐
│ Xác thực │  │   Bỏ qua │
│ sinh học │  └──────────┘
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Lưu thông tin    │
│ & Đăng nhập      │
└──────────────────┘

Các lần sau:
┌─────────────────────┐
│ Màn hình đăng nhập  │
│ ┌─────────────────┐ │
│ │ Nút sinh trắc   │ │
│ │  học hiển thị   │ │
│ └────────┬────────┘ │
│          │          │
│          ▼          │
│ ┌─────────────────┐ │
│ │  Xác thực & OK  │ │
│ └─────────────────┘ │
└─────────────────────┘
```

## Troubleshooting

### Sinh trắc học không hoạt động?
1. **Kiểm tra thiết bị có hỗ trợ không**: Chạy `isBiometricAvailable()`
2. **Kiểm tra permissions**: Xem lại AndroidManifest.xml và Info.plist
3. **Kiểm tra đăng ký**: Đảm bảo đã đăng ký vân tay/Face ID trong Settings

### Dialog không hiển thị sau đăng nhập?
1. Kiểm tra xem sinh trắc học đã được kích hoạt trước đó chưa
2. Kiểm tra thiết bị có hỗ trợ không

### Lỗi xác thực?
1. Xem log để biết chi tiết lỗi
2. Kiểm tra permissions
3. Thử đăng ký lại vân tay/Face ID trong Settings

## Tương lai

Có thể thêm các tính năng:
1. **Settings** để người dùng tắt/bật sinh trắc học
2. **Xóa thiết bị tin cậy** khi người dùng đổi số điện thoại
3. **Thống kê** số lần đăng nhập bằng sinh trắc học
4. **Timeout** yêu cầu OTP lại sau một thời gian không sử dụng

## Kết luận

Tính năng sinh trắc học giúp người dùng đăng nhập nhanh hơn, tiện lợi hơn mà vẫn đảm bảo an toàn. Người dùng chỉ cần xác thực OTP một lần, sau đó có thể dùng vân tay/Face ID cho các lần đăng nhập tiếp theo.
