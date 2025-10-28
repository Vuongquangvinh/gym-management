# 💳 Payment Order Module

Module quản lý đơn hàng thanh toán (Payment Orders) cho hệ thống Gym Management.

## 📁 Cấu trúc

```
payment/
├── payment-order.model.js      # Model chính
├── payment-order.service.js    # Service layer
└── index.js                     # Export module
```

## 🔑 Các trường dữ liệu (Fields)

```javascript
{
  orderCode: number,              // Mã đơn hàng (unique)
  userId: string,                 // ID người dùng
  userName: string,               // Tên người dùng
  userEmail: string,              // Email người dùng
  packageId: string,              // ID gói tập
  packageName: string,            // Tên gói tập
  packageDuration: number,        // Thời hạn gói (ngày)
  amount: number,                 // Số tiền (VNĐ)
  status: string,                 // Trạng thái: PENDING/PAID/CANCELLED/FAILED/EXPIRED
  transactionId: string,          // Mã giao dịch
  paymentTime: string,            // Thời gian thanh toán (ISO string)
  confirmedManually: boolean,     // Xác nhận thủ công (admin)
  verifiedWithPayOS: boolean,     // Xác thực từ PayOS webhook
  createdAt: Timestamp,           // Thời gian tạo
  updatedAt: Timestamp,           // Thời gian cập nhật
}
```

## 📖 Cách sử dụng

### 1️⃣ Import Module

```javascript
import { 
  PaymentOrderModel, 
  PaymentOrderService, 
  PaymentStatus 
} from '@/firebase/lib/features/payment';
```

### 2️⃣ Tạo đơn hàng mới

```javascript
// Cách 1: Sử dụng Service
const order = await PaymentOrderService.createOrder({
  orderCode: 1761634275047,
  userId: "zNuGqqCYqwm6PNJCiu7Y",
  userName: "Vương Quang Vinh",
  userEmail: "vqvinhhttt2211029@student.ctuet.edu.vn",
  packageId: "PK6",
  packageName: "gói tháng",
  packageDuration: 30,
  amount: 4950,
  status: "PENDING",
});

// Cách 2: Sử dụng Model trực tiếp
const order = new PaymentOrderModel({
  orderCode: 1761634275047,
  userId: "zNuGqqCYqwm6PNJCiu7Y",
  // ... các field khác
});
await order.save();
```

### 3️⃣ Lấy thông tin đơn hàng

```javascript
// Lấy theo orderCode
const order = await PaymentOrderService.getOrder(1761634275047);

// Lấy theo userId
const userOrders = await PaymentOrderService.getUserOrders("userId123");

// Lấy tất cả đơn pending
const pendingOrders = await PaymentOrderService.getPendingOrders();

// Lấy tất cả đơn đã thanh toán
const paidOrders = await PaymentOrderService.getPaidOrders();

// Lấy tất cả với phân trang
const { orders, lastDoc, hasMore } = await PaymentOrderService.getAllOrders({
  limit: 50,
  orderByField: "createdAt",
  orderDirection: "desc"
});
```

### 4️⃣ Xác nhận thanh toán thủ công (Admin)

```javascript
// Xác nhận thanh toán thủ công
const order = await PaymentOrderService.confirmPaymentManually(
  1761634275047,        // orderCode
  "MANUAL_12345"        // transactionId (optional)
);

// Kết quả:
// - status: "PAID"
// - confirmedManually: true
// - verifiedWithPayOS: false
// - transactionId: "MANUAL_1761634275047" (nếu không truyền)
```

### 5️⃣ Cập nhật trạng thái

```javascript
// Cập nhật trạng thái
await PaymentOrderService.updateOrderStatus(
  1761634275047,
  PaymentStatus.PAID,
  { verifiedWithPayOS: true }
);

// Hủy đơn hàng
await PaymentOrderService.cancelOrder(1761634275047, "User cancelled");
```

### 6️⃣ Kiểm tra trạng thái

```javascript
const order = await PaymentOrderService.getOrder(1761634275047);

// Kiểm tra trạng thái
if (order.isPaid()) {
  console.log("✅ Đã thanh toán");
}

if (order.isPending()) {
  console.log("⏳ Đang chờ thanh toán");
}

if (order.isManuallyConfirmed()) {
  console.log("👤 Được xác nhận thủ công");
}

if (order.isVerifiedWithPayOS()) {
  console.log("🔐 Được xác thực bởi PayOS");
}
```

### 7️⃣ Format dữ liệu để hiển thị

```javascript
const order = await PaymentOrderService.getOrder(1761634275047);

// Format số tiền
console.log(order.getFormattedAmount());
// Output: "4.950 ₫"

// Format ngày tạo
console.log(order.getFormattedDate("createdAt"));
// Output: "28/10/2025, 13:52"

// Format thời gian thanh toán
console.log(order.getFormattedPaymentTime());
// Output: "28/10/2025, 13:51"

// Get status label
console.log(order.getStatusLabel());
// Output: "Đã thanh toán"

// Get status color (for UI)
console.log(order.getStatusColor());
// Output: "success" | "warning" | "error" | "default"

// Get verification badge
console.log(order.getVerificationBadge());
// Output: "PayOS Verified" | "Manual Confirmation" | ""
```

### 8️⃣ Thống kê đơn hàng

```javascript
// Thống kê tất cả đơn hàng
const stats = await PaymentOrderService.getOrderStatistics();

// Thống kê của 1 user
const userStats = await PaymentOrderService.getOrderStatistics("userId123");

console.log(stats);
// Output:
// {
//   total: 150,
//   pending: 20,
//   paid: 120,
//   cancelled: 8,
//   failed: 2,
//   expired: 0,
//   totalAmount: 1500000,
//   paidAmount: 1200000,
//   manualConfirmations: 15,
//   payosVerified: 105
// }
```

### 9️⃣ Tìm kiếm đơn hàng

```javascript
// Tìm theo tên, email hoặc orderCode
const results = await PaymentOrderService.searchOrders("Vương Quang");
// hoặc
const results = await PaymentOrderService.searchOrders("vqvinh");
// hoặc
const results = await PaymentOrderService.searchOrders("1761634275047");
```

### 🔟 Xóa đơn hàng

```javascript
await PaymentOrderService.deleteOrder(1761634275047);
```

## 🎨 Payment Status Constants

```javascript
import { PaymentStatus } from '@/firebase/lib/features/payment';

PaymentStatus.PENDING    // "PENDING"
PaymentStatus.PAID       // "PAID"
PaymentStatus.CANCELLED  // "CANCELLED"
PaymentStatus.FAILED     // "FAILED"
PaymentStatus.EXPIRED    // "EXPIRED"
```

## 🔐 Security Rules (Firestore)

Thêm vào `firestore.rules`:

```javascript
match /payment_orders/{orderCode} {
  // User có thể đọc đơn hàng của mình
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  
  // Chỉ admin mới được tạo/sửa/xóa
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.Role == "admin";
}
```

## 📊 Firestore Indexes

Nếu cần query phức tạp, tạo indexes:

```json
{
  "indexes": [
    {
      "collectionGroup": "payment_orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "payment_orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## 🎯 Example: Payment Flow với Webhook

```javascript
// 1. Backend nhận webhook từ PayOS
// Backend: payos.controller.js
app.post('/api/payos/webhook', async (req, res) => {
  const webhookData = req.body;
  
  // Verify signature
  const verified = verifyWebhookData(webhookData);
  if (!verified) {
    return res.status(400).json({ error: "Invalid signature" });
  }
  
  // Update Firestore
  await updateOrderStatus(webhookData.data.orderCode, {
    status: "PAID",
    transactionId: webhookData.data.transactionId,
    paymentTime: webhookData.data.paymentTime,
    verifiedWithPayOS: true,
  });
  
  res.json({ success: true });
});

// 2. Frontend realtime listener (React)
import { onSnapshot } from "firebase/firestore";
import { PaymentOrderModel } from '@/firebase/lib/features/payment';

useEffect(() => {
  const orderRef = PaymentOrderModel.docRef(orderCode);
  
  const unsubscribe = onSnapshot(orderRef, (doc) => {
    const order = PaymentOrderModel.fromFirestore(doc);
    
    if (order && order.isPaid()) {
      // Hiển thị thông báo thành công
      toast.success("✅ Thanh toán thành công!");
      
      // Redirect hoặc update UI
      navigate('/success');
    }
  });
  
  return () => unsubscribe();
}, [orderCode]);
```

## ✨ Tips

1. **Sử dụng Service thay vì Model trực tiếp** để code gọn hơn
2. **Luôn validate dữ liệu** trước khi save (model tự động validate)
3. **Sử dụng realtime listeners** để theo dõi thay đổi trạng thái
4. **Xử lý errors** đúng cách với try-catch
5. **Format dữ liệu** trước khi hiển thị UI

## 🐛 Troubleshooting

### Lỗi: "Validation error"
```javascript
// Kiểm tra xem tất cả required fields đã có chưa
const requiredFields = ['orderCode', 'userId', 'userName', 'packageId', 
                        'packageName', 'packageDuration', 'amount'];
```

### Lỗi: "Order not found"
```javascript
// Kiểm tra orderCode có đúng không
const order = await PaymentOrderService.getOrder(orderCode);
if (!order) {
  console.error("Order không tồn tại:", orderCode);
}
```

### Lỗi: "Permission denied"
```javascript
// Kiểm tra Firestore rules
// User phải được authenticate và có quyền truy cập
```

---

**Created:** 2025-10-28  
**Author:** GitHub Copilot  
**Version:** 1.0.0
