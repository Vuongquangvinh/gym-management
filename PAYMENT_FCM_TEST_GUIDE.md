# ✅ HƯỚNG DẪN TEST THANH TOÁN VỚI FCM

## 🎯 Mục đích
Test xem có nhận được thông báo FCM khi thanh toán thành công không.

---

## 📱 Test Case 1: Thanh toán Gym Package (Manual Confirm)

### Bước 1: Tạo đơn hàng từ Flutter App
1. Mở app → **Gói tập** (Package)
2. Chọn một gói gym (ví dụ: Gói 1 tháng)
3. Nhấn **Mua ngay**
4. Hệ thống sẽ tạo payment order

### Bước 2: Admin xác nhận thanh toán
1. Mở React Admin → **Quản lý thanh toán**
2. Tìm order vừa tạo (status: PENDING)
3. Nhấn **Xác nhận thanh toán**

### Bước 3: Kiểm tra thông báo
- ✅ Backend log: `✅ Payment notification sent successfully (Gym - Manual)`
- ✅ Flutter app nhận thông báo: **"💰 Thanh toán thành công!"**
- ✅ Firestore: Order status = PAID

---

## 📱 Test Case 2: Thanh toán PT Package (Manual Confirm)

### Bước 1: Tạo contract PT
1. Mở app → **PT Schedule**
2. Tạo contract PT mới
3. Chọn gói PT và số buổi

### Bước 2: Tạo payment và xác nhận
1. App tự động tạo payment order cho contract
2. Admin vào React → **Quản lý thanh toán PT**
3. Xác nhận thanh toán cho contract

### Bước 3: Kiểm tra thông báo
- ✅ Backend log: `✅ Payment notification sent successfully (PT - Manual)`
- ✅ Flutter app nhận: **"💰 Thanh toán PT thành công!"**
- ✅ Contract status = PAID

---

## 🔔 Test Case 3: Webhook PayOS (Tự động)

### Bước 1: Tạo payment link
1. App tạo gym package payment
2. Nhận payment link từ PayOS
3. Mở link thanh toán

### Bước 2: Thanh toán qua PayOS
1. Quét QR hoặc chuyển khoản
2. PayOS nhận tiền → gửi webhook về backend
3. Backend xử lý webhook

### Bước 3: Kiểm tra thông báo
- ✅ Backend log: `✅ Payment notification sent successfully (Gym)`
- ✅ Flutter app nhận thông báo real-time
- ✅ Package được kích hoạt tự động

---

## 🧪 Quick Test: Gửi thông báo test

### Không cần thanh toán thật, chỉ test FCM:

```bash
cd backend
node test_fcm_to_user.js
```

Kết quả mong đợi:
```
✅ Test notification sent successfully!
✅ Payment notification sent successfully!
```

App sẽ nhận 2 thông báo:
1. 🧪 Test Notification
2. 💰 Thanh toán thành công!

---

## 📊 Checklist Test

### Trước khi test:
- [ ] Backend server đang chạy (port 3000)
- [ ] Flutter app đã login bằng SĐT hoặc email
- [ ] FCM token đã lưu vào Firestore (check Settings → Test FCM)
- [ ] User document có field `phone_number` hoặc `email`

### Trong khi test:
- [ ] Backend log hiển thị: `📲 Sending payment success notification...`
- [ ] Backend log: `✅ Payment notification sent successfully`
- [ ] Flutter app nhận thông báo (foreground/background)
- [ ] Thông báo hiển thị đúng title và body

### Sau khi test:
- [ ] Check Firestore: order status = PAID
- [ ] Check Firestore: user package được update
- [ ] Check Flutter: User có thể vào phòng gym (check-in)

---

## ❌ Troubleshooting

### Không nhận được thông báo:

**1. Check Backend Log:**
```
📲 Sending payment success notification...
📤 [FCM] Sending to user JVpJwI3RyvFNNbaC1C27...
📱 [FCM] Found token for user...
✅ [FCM] Successfully sent message: projects/...
```

Nếu thấy `⚠️ User has no FCM token`:
- Vào app → Settings → Test FCM Token
- Nhấn "Lưu FCM Token"

**2. Check Flutter Log:**
```
I/flutter: 📬 Received foreground message
I/flutter: Title: 💰 Thanh toán thành công!
```

Nếu không thấy log:
- Kiểm tra quyền notification
- Restart app
- Re-init FCM service

**3. Check Firestore:**
- Document `users/<userId>` có field `fcmToken`?
- Field `phone_number` hoặc `email` có đúng?

---

## 🎯 Test Flow đầy đủ (End-to-End)

### Flow 1: User mua gym package
1. Login app (SĐT: +84523294133)
2. Chọn gói 1 tháng → Mua
3. Admin xác nhận payment
4. **💰 Thông báo: "Gói tập đã được kích hoạt!"**
5. User check-in thành công

### Flow 2: User mua PT package
1. Tạo contract PT
2. Chọn gói 10 buổi
3. Admin xác nhận payment
4. **💰 Thông báo: "Gói tập PT đã được kích hoạt!"**
5. User xem lịch tập PT

---

## 📝 Ghi chú

- Thông báo sẽ hiển thị ngay cả khi app đang đóng (background)
- Nhấn vào thông báo sẽ mở app
- Backend gửi thông báo sau khi update database thành công
- Nếu gửi FCM lỗi, payment vẫn được xử lý bình thường (không block)

---

**Chuẩn bị:** Backend chạy + App đã login + FCM token đã lưu  
**Thời gian:** ~5 phút/test case  
**Kết quả:** ✅ Nhận thông báo thanh toán thành công
