# Hướng dẫn Thanh toán cho Đặt lịch PT Session

## Tổng quan

Hệ thống đã được tích hợp thanh toán PayOs cho việc đặt lịch tập PT theo buổi. Người dùng phải thanh toán trước thì mới được xác nhận đặt lịch.

## Quy trình Thanh toán

### 1. Chọn Khung giờ và Ngày tập
- Người dùng chọn khung giờ khả dụng
- Chọn ngày cụ thể từ lịch tuần

### 2. Nhấn "Thanh toán & Đặt lịch"
```dart
// Khi người dùng nhấn nút
1. Lấy thông tin user (userId)
2. Tạo payment link qua PayOSService.createGymPayment()
3. Tạo BookedSession tạm với status = 'pending_payment'
4. Hiển thị PaymentQRDialog với mã QR thanh toán
```

### 3. Quét mã QR và Thanh toán
- Dialog hiển thị mã QR PayOs
- Người dùng quét mã bằng app ngân hàng
- Có thể lưu mã QR về máy để thanh toán sau
- Hệ thống tự động polling kiểm tra trạng thái thanh toán (mỗi 2 giây)

### 4. Xác nhận Thanh toán
```dart
// Khi thanh toán thành công (status = PAID)
1. PaymentQRDialog tự động gọi PTPackageModel.confirmPaymentForBooking()
2. Cập nhật BookedSession:
   - status: 'pending_payment' → 'confirmed'
   - paymentStatus: 'PENDING' → 'PAID'
   - paidAt: Timestamp.now()
3. Đóng dialog và hiển thị thông báo thành công
4. Reload danh sách gói tập
```

## Cấu trúc Dữ liệu

### BookedSession Model
```dart
class BookedSession {
  final String timeSlotId;           // ID khung giờ
  final DateTime specificDate;       // Ngày tập cụ thể
  final String userId;                // ID người dùng
  final Timestamp bookedAt;           // Thời gian đặt
  final String status;                // 'pending_payment', 'confirmed', 'cancelled'
  final String? paymentOrderCode;    // Mã đơn hàng PayOs
  final int? paymentAmount;          // Số tiền thanh toán
  final String? paymentStatus;       // 'PENDING', 'PAID', 'CANCELLED'
  final Timestamp? paidAt;           // Thời gian thanh toán thành công
}
```

### Trạng thái Booking
- **pending_payment**: Đã tạo booking, chưa thanh toán
- **confirmed**: Đã thanh toán, xác nhận thành công
- **cancelled**: Đã hủy

### Trạng thái Payment
- **PENDING**: Đang chờ thanh toán
- **PAID**: Đã thanh toán thành công
- **CANCELLED**: Thanh toán bị hủy

## API Methods

### PTPackageModel

#### createPendingBooking()
```dart
static Future<BookedSession> createPendingBooking({
  required String ptPackageId,
  required String timeSlotId,
  required DateTime specificDate,
  required String orderCode,
  required int amount,
  String? userId,
})
```
- Tạo booking tạm với status = 'pending_payment'
- Lưu thông tin orderCode và amount
- Kiểm tra slot còn chỗ trống

#### confirmPaymentForBooking()
```dart
static Future<void> confirmPaymentForBooking({
  required String ptPackageId,
  required String orderCode,
})
```
- Tìm booking theo orderCode
- Cập nhật status = 'confirmed'
- Cập nhật paymentStatus = 'PAID'
- Ghi nhận thời gian paidAt

### PayOSService

#### createGymPayment()
```dart
static Future<Map<String, dynamic>> createGymPayment({
  required String packageId,
  required String packageName,
  required int packagePrice,
  required int packageDuration,
  required String userId,
  required String userName,
})
```
- Tạo payment link với PayOs
- Trả về: orderCode, qrCode, checkoutUrl, amount

#### getPaymentStatus()
```dart
static Future<Map<String, dynamic>> getPaymentStatus(String orderCode)
```
- Kiểm tra trạng thái thanh toán
- Được gọi tự động trong PaymentQRDialog (polling)

#### confirmPayment()
```dart
static Future<Map<String, dynamic>> confirmPayment(String orderCode)
```
- Xác nhận thanh toán thủ công
- Được gọi sau khi phát hiện status = PAID

## UI Components

### PaymentQRDialog
- Hiển thị mã QR thanh toán
- Tự động polling kiểm tra trạng thái (2s/lần, tối đa 60 lần = 2 phút)
- Nút lưu QR về máy
- Hiển thị thông tin đơn hàng (orderCode, amount, description)
- Callback `onPaymentSuccess` khi thanh toán thành công

### Hiển thị Trạng thái trong Dialog
```dart
// Khi xem danh sách người đã đặt
- "Đã thanh toán" (màu xanh) - status = 'confirmed'
- "Chưa thanh toán" (màu vàng) - status = 'pending_payment'
- "Đã hủy" (màu đỏ) - status = 'cancelled'
```

## Lưu ý Quan trọng

### 1. Xử lý Timeout
- Polling chỉ chạy trong 2 phút (60 lần x 2s)
- Nếu quá thời gian, booking vẫn ở trạng thái pending_payment
- Người dùng có thể thanh toán sau và admin xác nhận thủ công

### 2. Kiểm tra Slot Availability
- Khi tạo pending booking, hệ thống đã kiểm tra slot còn chỗ
- Chỉ tính các booking có status != 'cancelled'
- Nếu đã full → throw Exception

### 3. Bảo mật
- userId được lấy từ UserModel.getMemberId()
- Không cho phép người dùng tự nhập userId

### 4. Xử lý Lỗi
```dart
try {
  // Tạo payment
} catch (e) {
  // Hiển thị lỗi cho người dùng
  ScaffoldMessenger.showSnackBar(...)
}
```

## Testing Checklist

- [ ] Tạo payment link thành công
- [ ] Hiển thị QR code đúng
- [ ] Lưu QR về máy hoạt động
- [ ] Polling kiểm tra trạng thái
- [ ] Xác nhận thanh toán thành công
- [ ] Cập nhật trạng thái booking
- [ ] Hiển thị thông báo thành công
- [ ] Reload danh sách sau khi thanh toán
- [ ] Kiểm tra slot availability
- [ ] Xử lý lỗi khi slot đã full
- [ ] Xử lý lỗi network
- [ ] Timeout polling (sau 2 phút)
- [ ] Hiển thị trạng thái trong dialog người đã đặt

## Cải tiến Tương lai

1. **Hủy Booking chưa thanh toán**
   - Tự động hủy sau X phút
   - Cho phép người dùng hủy thủ công

2. **Thông báo**
   - Push notification khi thanh toán thành công
   - Email xác nhận

3. **Lịch sử Thanh toán**
   - Xem lại các booking đã thanh toán
   - Download hóa đơn

4. **Admin Panel**
   - Xem danh sách booking pending
   - Xác nhận thanh toán thủ công
   - Refund

## Support

Nếu có vấn đề:
1. Kiểm tra logs trong Logger
2. Xem response từ PayOSService
3. Kiểm tra Firebase Firestore data
4. Verify payment status từ PayOs dashboard
