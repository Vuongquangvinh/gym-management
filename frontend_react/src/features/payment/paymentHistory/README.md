# 📊 Payment History Page

Trang lịch sử thanh toán cho hệ thống Gym Management.

## ✨ Tính năng

### 🎯 Cho User (Khách hàng)
- ✅ Xem lịch sử thanh toán của mình
- ✅ Thống kê tổng quan (tổng đơn, đã thanh toán, đang chờ, đã hủy)
- ✅ Tìm kiếm theo mã đơn hàng, tên gói
- ✅ Lọc theo trạng thái
- ✅ Xem chi tiết đơn hàng
- ✅ Làm mới dữ liệu

### 👨‍💼 Cho Admin/Manager
- ✅ Xem tất cả đơn hàng của hệ thống
- ✅ Thống kê chi tiết (tổng doanh thu, số lượng xác nhận thủ công...)
- ✅ Tìm kiếm theo tên khách hàng, email, mã đơn
- ✅ Lọc theo trạng thái thanh toán
- ✅ Lọc theo loại xác thực (PayOS/Manual)
- ✅ Xem thông tin khách hàng trong bảng
- ✅ Xem chi tiết đầy đủ

## 📸 Giao diện

### Statistics Cards
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Tổng đơn    │ Đã TT       │ Đang chờ    │ Đã hủy      │
│    150      │    120      │     20      │      8      │
│             │ 1.200.000₫  │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Filters
```
┌──────────────────────────────────────────────────────────┐
│ [🔍 Tìm kiếm...]  [Trạng thái ▼]  [Xác thực ▼]  [50 đơn] │
└──────────────────────────────────────────────────────────┘
```

### Table
```
┌─────────────┬──────────────┬─────────┬──────────┬──────────┬──────────┬──────────┬────────┐
│ Mã đơn hàng │ Khách hàng   │ Gói tập │ Số tiền  │ Trạng thái│ Xác thực │ Ngày tạo │ Action │
├─────────────┼──────────────┼─────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│ #176163...  │ Vương Q.V.   │ gói     │ 4.950₫   │ ✅ Đã TT │ 👤 Manual│ 28/10/25 │   👁   │
│             │ vqvinh@...   │ tháng   │          │          │          │          │        │
└─────────────┴──────────────┴─────────┴──────────┴──────────┴──────────┴──────────┴────────┘
```

## 🚀 Cách sử dụng

### 1️⃣ Import vào Router

```javascript
// App.jsx hoặc Router.jsx
import PaymentHistory from '@/features/payment/paymentHistory';

// Trong routes
<Route path="/payment-history" element={<PaymentHistory />} />
```

### 2️⃣ Add vào Navigation Menu

```javascript
// Sidebar.jsx hoặc Navigation.jsx
{
  path: '/payment-history',
  name: 'Lịch sử thanh toán',
  icon: <ReceiptLongIcon />,
  role: ['user', 'admin', 'manager'] // Ai cũng có thể truy cập
}
```

### 3️⃣ Truy cập trang

```
http://localhost:3000/payment-history
```

## 🎨 Customization

### Thay đổi màu sắc

Chỉnh trong `paymentHistory.css`:

```css
.stat-card-total {
  border-left: 4px solid var(--color-primary, #0d47a1);
}

.stat-card-paid {
  border-left: 4px solid var(--color-success, #2e7d32);
}

/* ... */
```

### Thay đổi số lượng đơn hiển thị

Trong `paymentHistory.jsx`:

```javascript
// Admin
const result = await PaymentOrderService.getAllOrders({
  limit: 500, // Thay đổi số này
  orderByField: "createdAt",
  orderDirection: "desc",
});

// User
fetchedOrders = await PaymentOrderService.getUserOrders(currentUser.uid, {
  limit: 100, // Thay đổi số này
  orderByField: "createdAt",
  orderDirection: "desc",
});
```

## 📊 Statistics Display

### Cho User
```javascript
{
  total: 15,              // Tổng đơn của user
  paid: 12,               // Đã thanh toán
  pending: 2,             // Đang chờ
  cancelled: 1,           // Đã hủy
  totalAmount: 150000,    // Tổng tiền
  paidAmount: 120000,     // Đã thanh toán
  manualConfirmations: 2, // Xác nhận thủ công
  payosVerified: 10       // PayOS verified
}
```

### Cho Admin
```javascript
{
  total: 150,             // Tổng tất cả đơn
  paid: 120,              
  pending: 20,            
  cancelled: 8,           
  failed: 2,              
  expired: 0,             
  totalAmount: 1500000,   
  paidAmount: 1200000,    
  manualConfirmations: 15,
  payosVerified: 105      
}
```

## 🔍 Search & Filter

### Search
Tìm kiếm theo:
- ✅ Tên khách hàng
- ✅ Email
- ✅ Mã đơn hàng
- ✅ Tên gói tập

### Status Filter
- ✅ Tất cả
- ✅ Đang chờ (PENDING)
- ✅ Đã thanh toán (PAID)
- ✅ Đã hủy (CANCELLED)
- ✅ Thất bại (FAILED)
- ✅ Hết hạn (EXPIRED)

### Verification Filter
- ✅ Tất cả
- ✅ PayOS Verified
- ✅ Manual Confirmation

## 📱 Responsive Design

### Desktop (>960px)
- Hiển thị đầy đủ 4 stat cards ngang
- Table hiển thị tất cả cột
- Filters nằm ngang

### Tablet (600-960px)
- Stat cards 2x2
- Table thu gọn một số cột
- Filters stack vertical

### Mobile (<600px)
- Stat cards stack vertical
- Table ẩn cột email (admin view)
- Filters stack vertical
- Touch-friendly buttons

## 🎯 Status Colors

```javascript
const statusColors = {
  PAID: 'success',      // Green
  PENDING: 'warning',   // Orange
  CANCELLED: 'error',   // Red
  FAILED: 'error',      // Red
  EXPIRED: 'default',   // Gray
};
```

## 🔐 Permissions

### User
```javascript
// Chỉ xem được đơn của mình
if (currentUser?.uid) {
  fetchedOrders = await PaymentOrderService.getUserOrders(currentUser.uid);
}
```

### Admin/Manager
```javascript
// Xem tất cả đơn
if (isAdmin) {
  const result = await PaymentOrderService.getAllOrders();
  fetchedOrders = result.orders;
}
```

## 🔔 Features Roadmap

### Phase 1 (Current) ✅
- [x] Display payment history
- [x] Search & filter
- [x] Statistics cards
- [x] View details
- [x] Responsive design

### Phase 2 (Future) 🚧
- [ ] Export to Excel/PDF
- [ ] Print receipt
- [ ] Email receipt to customer
- [ ] Refund functionality (admin)
- [ ] Payment reminders
- [ ] Advanced analytics

### Phase 3 (Advanced) 💡
- [ ] Real-time updates (WebSocket)
- [ ] Payment trends chart
- [ ] Revenue forecasting
- [ ] Customer payment behavior analysis
- [ ] Automated reports

## 🐛 Common Issues

### Issue: "Không thể tải lịch sử thanh toán"

**Nguyên nhân:**
- Firestore rules chặn truy cập
- User chưa đăng nhập
- Network error

**Giải pháp:**
```javascript
// Check Firestore rules
match /payment_orders/{orderCode} {
  allow read: if request.auth != null;
}

// Check authentication
if (!currentUser) {
  return <Navigate to="/login" />;
}
```

### Issue: "Statistics không hiển thị"

**Nguyên nhân:**
- Không có đơn hàng nào
- Error khi fetch statistics

**Giải pháp:**
```javascript
// Add error handling
try {
  const statistics = await PaymentOrderService.getOrderStatistics();
  setStats(statistics);
} catch (err) {
  console.error("Stats error:", err);
  // Show default stats or hide section
}
```

### Issue: "Filters không hoạt động"

**Nguyên nhân:**
- Case-sensitive search
- Wrong field comparison

**Giải pháp:**
```javascript
// Always use toLowerCase for search
const matchSearch = 
  order.userName.toLowerCase().includes(searchTerm.toLowerCase());
```

## 💻 Development

### Run dev server
```bash
cd frontend_react
npm run dev
```

### Test with mock data
```javascript
// Create mock orders in Firestore
const mockOrders = [
  {
    orderCode: 1234567890,
    userId: "test-user-id",
    userName: "Test User",
    // ... other fields
  }
];
```

### Debug
```javascript
// Add console logs
console.log("Filtered orders:", filteredOrders);
console.log("Search term:", searchTerm);
console.log("Status filter:", statusFilter);
```

## 📚 Dependencies

```json
{
  "@mui/material": "^5.x",
  "@mui/icons-material": "^5.x",
  "firebase": "^10.x",
  "react": "^18.x"
}
```

## 🎓 Code Examples

### Add custom filter
```javascript
const [customFilter, setCustomFilter] = useState("");

const filteredOrders = orders.filter((order) => {
  // Your custom filter logic
  return order.amount > customFilter;
});
```

### Export to Excel
```javascript
import * as XLSX from 'xlsx';

const exportToExcel = () => {
  const ws = XLSX.utils.json_to_sheet(filteredOrders.map(o => ({
    'Mã đơn': o.orderCode,
    'Khách hàng': o.userName,
    'Số tiền': o.amount,
    // ... other fields
  })));
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payment History");
  XLSX.writeFile(wb, "payment-history.xlsx");
};
```

### Real-time updates
```javascript
import { onSnapshot } from 'firebase/firestore';

useEffect(() => {
  const q = query(
    collection(db, "payment_orders"),
    where("userId", "==", currentUser.uid)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => 
      PaymentOrderModel.fromFirestore(doc)
    );
    setOrders(orders);
  });
  
  return () => unsubscribe();
}, [currentUser]);
```

---

**Created:** 2025-10-29  
**Author:** GitHub Copilot  
**Version:** 1.0.0
