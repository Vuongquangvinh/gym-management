# 🔧 Hướng Dẫn Fix Thanh Toán Thay Đổi Gói Tập

## ❌ Vấn Đề Trước Đây

Khi thanh toán từ chức năng **Thay Đổi Gói Tập** (DetailMember):
- ✅ Thanh toán thành công trên PayOS
- ❌ Dữ liệu gói tập người dùng **KHÔNG được cập nhật**
- ❌ Frontend redirect về `/admin` mà không xác nhận thanh toán

## ✅ Giải Pháp Đã Triển Khai

### 1. Tạo Trang Payment Success (`/payment/success`)

**File**: `frontend_react/src/features/payment/PaymentSuccess.jsx`

Trang này sẽ:
- Nhận `orderCode` từ URL params khi PayOS redirect về
- Gọi API `/api/payos/confirm-payment` để cập nhật package cho user
- Hiển thị trạng thái xử lý (processing → success/error)
- Tự động redirect về `/admin` sau 2-3 giây

### 2. Cập Nhật Return URL

**File**: `frontend_react/src/features/admin/components/DetailMember.jsx`

Thay đổi:
```javascript
// ❌ CŨ
returnUrl: `${window.location.origin}/admin`,
cancelUrl: `${window.location.origin}/admin`,

// ✅ MỚI
returnUrl: `${window.location.origin}/payment/success`,
cancelUrl: `${window.location.origin}/payment/success`,
```

### 3. Thêm Route Mới

**File**: `frontend_react/src/routes/index.jsx`

```jsx
import PaymentSuccess from '../features/payment/PaymentSuccess.jsx';

// ...
<Route path="/payment/success" element={<PaymentSuccess />} />
```

## 📋 Luồng Hoạt Động Mới

```
1. Admin chọn thay đổi gói tập cho user
   ↓
2. Gọi API /api/payos/create-gym-payment
   ↓
3. Lưu order info vào Firestore (collection: payment_orders)
   ↓
4. Redirect đến PayOS checkout page
   ↓
5. User thanh toán thành công trên PayOS
   ↓
6. PayOS redirect về /payment/success?orderCode=123456
   ↓
7. PaymentSuccess component:
   - Gọi API /api/payos/confirm-payment với orderCode
   - Backend:
     * Lấy order info từ Firestore
     * Kiểm tra payment status với PayOS
     * CẬP NHẬT USER PACKAGE (current_package_id, package_end_date, etc.)
     * Update order status thành PAID
   ↓
8. Hiển thị "Thanh toán thành công!"
   ↓
9. Auto redirect về /admin sau 2 giây
```

## 🔍 Webhook Backup

Ngoài manual confirm, hệ thống vẫn có **webhook** từ PayOS:

- **Endpoint**: `/api/payos/webhook`
- **Khi nào**: PayOS tự động gọi khi payment thành công
- **Làm gì**: Cập nhật user package (tương tự confirm-payment)

**Lưu ý**: Webhook chỉ hoạt động khi:
- Backend có public URL (ngrok, deploy production)
- Webhook URL đã được config trong PayOS dashboard

## 🧪 Cách Test

### Test Trên Local

1. Start backend:
```bash
cd backend
npm run dev
```

2. Start frontend:
```bash
cd frontend_react
npm run dev
```

3. Vào trang Admin → Members → Click vào member → Thay đổi gói tập

4. Chọn gói tập mới → Click "Thanh toán"

5. Trên trang PayOS:
   - Có thể thanh toán thật
   - Hoặc cancel để test cancel flow

6. Sau khi thanh toán:
   - Sẽ redirect về `/payment/success`
   - Xem console log để debug
   - Check Firestore xem user có được update không

### Kiểm Tra Firestore

**Collection**: `users`
**Fields cần kiểm tra**:
```javascript
{
  current_package_id: "PK3",           // ✅ Đã update
  package_start_date: Timestamp,       // ✅ Ngày bắt đầu
  package_end_date: Timestamp,         // ✅ Ngày kết thúc (gia hạn)
  membership_status: "Active",         // ✅ Active
  remaining_sessions: 10,              // ✅ Số buổi tập còn lại
  updatedAt: Timestamp                 // ✅ Đã update
}
```

**Collection**: `payment_orders`
**Document ID**: `{orderCode}` (e.g., `1730106789123`)
```javascript
{
  orderCode: 1730106789123,
  userId: "user123",
  packageId: "PK3",
  packageName: "Gói 3 tháng",
  packageDuration: 90,
  amount: 500000,
  status: "PAID",                      // ✅ Đã update từ PENDING
  paymentTime: "2025-10-28T10:30:00",
  transactionId: "FT12345",
  confirmedManually: true,             // ✅ Confirmed qua manual API
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🐛 Debug

### Console Logs

**Frontend** (`PaymentSuccess.jsx`):
```
🔔 Confirming payment for order: 1730106789123
```

**Backend** (`payos.controller.js` - `confirmPaymentManual`):
```
🔔 Manual payment confirmation requested
Order code: 1730106789123
📦 Order info: {...}
🔍 Searching for package with PackageId field: PK3
📦 Package details: {...}
🔍 Searching for user with ID: user123
📋 Current user data BEFORE update: {...}
📅 Calculation: {...}
📝 Setting current_package_id to: PK3
📝 Update data: {...}
✅ User package updated successfully
📋 User data AFTER update: {...}
✅ Order status updated to PAID
🎉 Manual confirmation completed!
```

### Các Lỗi Thường Gặp

#### 1. "Order not found in database"
**Nguyên nhân**: Firebase Admin SDK không lưu được order khi create payment
**Giải pháp**: Kiểm tra Firebase credentials và permissions

#### 2. "User not found in database"
**Nguyên nhân**: userId không khớp với Firestore
**Giải pháp**: Code đã fix - tìm theo cả Document ID và field `_id`

#### 3. "Package not found"
**Nguyên nhân**: PackageId không tồn tại trong collection `packages`
**Giải pháp**: Kiểm tra field `PackageId` trong Firestore

## 📝 Files Đã Thay Đổi

1. ✅ `frontend_react/src/features/payment/PaymentSuccess.jsx` - **TẠO MỚI**
2. ✅ `frontend_react/src/routes/index.jsx` - Thêm route `/payment/success`
3. ✅ `frontend_react/src/features/admin/components/DetailMember.jsx` - Đổi returnUrl

## 🚀 Deploy Production

Khi deploy production, đảm bảo:

1. ✅ Config webhook URL trong PayOS dashboard:
   ```
   https://yourdomain.com/api/payos/webhook
   ```

2. ✅ Set environment variables:
   ```
   PAYOS_CLIENT_ID=xxx
   PAYOS_API_KEY=xxx
   PAYOS_CHECKSUM_KEY=xxx
   FRONTEND_URL=https://yourdomain.com
   ```

3. ✅ Test cả 2 flows:
   - Manual confirm (qua `/payment/success`)
   - Webhook (tự động từ PayOS)

## ✅ Kết Quả

- ✅ Thanh toán thành công → User package được cập nhật ngay lập tức
- ✅ Hiển thị thông báo trực quan cho user
- ✅ Tự động redirect về trang admin
- ✅ Có backup webhook nếu manual confirm fail
- ✅ Xử lý cả trường hợp cancel payment

---

**Ngày cập nhật**: 28/10/2025
**Người fix**: GitHub Copilot
