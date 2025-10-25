# Hướng Dẫn Debug Thanh Toán PayOS

## 🔍 Các Cải Tiến Đã Thực Hiện

### 1. **Polling Nhanh Hơn**
- ✅ Bắt đầu kiểm tra **ngay lập tức** (trước đây phải đợi 5 giây)
- ✅ Kiểm tra mỗi **2 giây** (trước đây là 3 giây)
- ✅ Giới hạn tối đa **60 lần check** (2 phút) để tránh lãng phí

### 2. **Log Chi Tiết Hơn**
```dart
🔄 Bắt đầu kiểm tra trạng thái thanh toán...
🔍 Đang lấy trạng thái thanh toán: 1729862400
📡 Response status code: 200
📦 Response body: {"success":true,"data":{"status":"PAID",...}}
✅ Response parsed successfully
💳 Payment status: PAID
✅ THANH TOÁN THÀNH CÔNG!
```

### 3. **UI Feedback**
- ✅ Hiển thị trạng thái kiểm tra real-time
- ✅ Đếm số lần check (Lần 5/60)
- ✅ Loading indicator khi đang check
- ✅ Nút "Kiểm tra trạng thái ngay" để test thủ công

### 4. **Xử Lý Nhiều Trạng Thái**
Hỗ trợ các trạng thái PayOS có thể trả về:
- `PAID`, `paid`, `COMPLETED` → ✅ Thành công
- `CANCELLED`, `cancelled` → ⚠️ Đã hủy
- `PENDING`, `PROCESSING` → ⏳ Đang chờ

## 🧪 Cách Test

### Bước 1: Bật Backend
```bash
cd backend
npm start
# hoặc
node src/app.js
```

### Bước 2: Kiểm Tra API
```bash
# Test endpoint get payment status
curl http://192.168.1.71:3000/api/payos/payment/<ORDER_CODE>
```

Response mong đợi:
```json
{
  "success": true,
  "data": {
    "orderCode": 1729862400,
    "status": "PAID",
    "amount": 500000,
    ...
  }
}
```

### Bước 3: Test Trên Flutter
1. Chọn gói tập → Nút "Gia hạn"
2. Dialog QR xuất hiện
3. Quan sát logs:
   ```
   🔄 Bắt đầu kiểm tra trạng thái thanh toán...
   🔍 Kiểm tra trạng thái lần 1/60...
   ```
4. Thanh toán qua QR hoặc link
5. Trong vòng 2 giây, app sẽ:
   - ✅ Phát hiện thanh toán thành công
   - ✅ Đóng dialog
   - ✅ Hiển thị SnackBar "Thanh toán thành công! 🎉"

## 🐛 Các Vấn Đề Thường Gặp

### Vấn Đề 1: Không Có Thông Báo Thành Công
**Nguyên nhân:**
- Backend không chạy
- API endpoint sai
- Response không đúng format
- Status từ PayOS không khớp

**Cách fix:**
1. Check backend logs:
   ```bash
   cd backend
   npm start
   # Xem logs khi call API
   ```

2. Check Flutter logs:
   ```bash
   flutter run
   # Xem logs trong terminal
   ```

3. Test API thủ công:
   ```bash
   curl http://192.168.1.71:3000/api/payos/payment/<ORDER_CODE>
   ```

### Vấn Đề 2: Polling Dừng Quá Sớm
**Nguyên nhân:** Đã check quá 60 lần (2 phút)

**Cách fix:** Tăng `_maxChecks` trong `payment_qr_dialog.dart`:
```dart
final int _maxChecks = 120; // 4 phút thay vì 2 phút
```

### Vấn Đề 3: Status Không Khớp
**Nguyên nhân:** PayOS có thể trả về status khác

**Cách fix:** Kiểm tra log và thêm status mới:
```dart
if (status == 'PAID' || status == 'paid' || status == 'COMPLETED' || status == 'SUCCESS') {
  // Thành công
}
```

## 📊 Kiểm Tra Logs

### Flutter Logs (Màn Hình Payment)
```dart
I/flutter (12345): 🔄 Bắt đầu kiểm tra trạng thái thanh toán...
I/flutter (12345): 🔍 Đang lấy trạng thái thanh toán: 1729862400
I/flutter (12345): 📡 Response status code: 200
I/flutter (12345): 📊 Success: true
I/flutter (12345): 💳 Payment status: PAID
I/flutter (12345): ✅ THANH TOÁN THÀNH CÔNG!
```

### Backend Logs
```bash
✅ Payment link created successfully: {
  orderCode: 1729862400,
  checkoutUrl: 'https://pay.payos.vn/...',
  qrCode: 'https://img.vietqr.io/...'
}

[GET] /api/payos/payment/1729862400
✅ Payment info retrieved: { status: 'PAID', ... }
```

## 🎯 Checklist Debug

- [ ] Backend đang chạy (port 3000)
- [ ] API endpoint đúng trong `api_config.dart`
- [ ] IP address đúng (192.168.1.71)
- [ ] Đã test API bằng curl/Postman
- [ ] Xem logs Flutter khi thanh toán
- [ ] Dialog QR hiển thị đúng
- [ ] Polling đang chạy (xem UI indicator)
- [ ] Response từ API đúng format
- [ ] Status từ PayOS chính xác

## 🚀 Tips Tối Ưu

1. **Giảm interval** nếu muốn nhanh hơn:
   ```dart
   _pollingTimer = Timer.periodic(const Duration(seconds: 1), (timer) { ... });
   ```

2. **Tăng timeout** nếu mạng chậm:
   ```dart
   final response = await http.get(
     Uri.parse('$baseUrl/payment/$orderCode'),
   ).timeout(const Duration(seconds: 10));
   ```

3. **Mock response** để test UI:
   ```dart
   // Test UI thành công
   setState(() => _paymentStatus = 'PAID');
   _checkPaymentStatus();
   ```

## 📞 Liên Hệ
Nếu vẫn gặp vấn đề, kiểm tra:
- PayOS Dashboard: https://my.payos.vn/
- PayOS Docs: https://payos.vn/docs/
- PayOS Support: support@payos.vn
